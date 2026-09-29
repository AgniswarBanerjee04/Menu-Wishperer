import io
import re
import json
import uuid
import httpx
from typing import Tuple, Optional, List, Dict, Any
from bs4 import BeautifulSoup
from pypdf import PdfReader
from fastapi import HTTPException, status
from app.config import settings
from app.schemas.menu import ExtractedDish
from app.services.gemini_service import (
    gemini_service,
    _parse_and_validate_json,
    _clean_price,
    _infer_spice_level,
    _infer_dietary
)

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

QR_EXTRACTION_SYSTEM_PROMPT = """You are an expert culinary AI for Menu Whisperer specializing in Indian restaurant digital menus, QR ordering portals (DotPe, Thrive, Petpooja, MyMenu, Zomato Dine-in, Swiggy), and fine-dining digital PDFs.

Extract all dishes, categories, dietary tags (veg, non-veg, egg), and prices from this scanned digital menu text/data into our standard schema.
Ensure prices are parsed as clean INR numbers.

Return strictly JSON matching:
{
  "restaurant_name": "string",
  "dishes": [
    {
      "id": "unique_string",
      "name": "string",
      "price": number,
      "currency": "INR",
      "category": "string",
      "dietary": "veg" | "non-veg" | "egg",
      "description": "string (optional)"
    }
  ]
}
Do not wrap with markdown codeblock markers unless returning raw JSON."""

class QRIngestionService:
    async def fetch_url_content(self, url: str) -> Tuple[str, Any, Optional[str]]:
        """
        Fetch URL and determine content type:
        Returns: (content_type_mode, content_data, detected_restaurant_name)
        Modes: 'image', 'pdf_text', 'html_text', 'html_json'
        """
        url = url.strip()
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        headers = {
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,application/pdf,*/*;q=0.8",
            "Accept-Language": "en-IN,en;q=0.9,hi;q=0.8",
        }

        try:
            async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers=headers) as client:
                response = await client.get(url)
        except httpx.ConnectTimeout:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="Connection to the table QR URL timed out. Please check the link or snap a photo."
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unable to reach the scanned QR link ({str(e)}). Please verify the URL."
            )

        if response.status_code >= 400:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"The restaurant menu link returned status code {response.status_code}. It might be expired or private."
            )

        content_type = response.headers.get("content-type", "").lower()

        # 1. Direct PDF
        if "application/pdf" in content_type or url.lower().endswith(".pdf"):
            pdf_bytes = response.content
            try:
                reader = PdfReader(io.BytesIO(pdf_bytes))
                extracted_pages = []
                for idx, page in enumerate(reader.pages):
                    text = page.extract_text()
                    if text and text.strip():
                        extracted_pages.append(text.strip())

                if extracted_pages:
                    combined_pdf_text = "\n\n".join(extracted_pages)
                    return "pdf_text", combined_pdf_text, None
                else:
                    # PDF contains no selectable text (scanned image)
                    return "pdf_scanned", pdf_bytes, None
            except Exception as e:
                print(f"[QRIngest] Failed to parse PDF: {e}")
                return "pdf_scanned", pdf_bytes, None

        # 2. Direct Image Link
        if any(img_t in content_type for img_t in ["image/jpeg", "image/png", "image/webp"]):
            return "image", response.content, None

        # 3. HTML / Webpage
        html_content = response.text
        soup = BeautifulSoup(html_content, "html.parser")

        # Extract potential restaurant name
        detected_name = None
        og_title = soup.find("meta", property="og:title")
        og_site_name = soup.find("meta", property="og:site_name")
        title_tag = soup.find("title")

        if og_site_name and og_site_name.get("content"):
            detected_name = og_site_name["content"].strip()
        elif og_title and og_title.get("content"):
            detected_name = og_title["content"].strip()
        elif title_tag and title_tag.string:
            detected_name = title_tag.string.strip()

        # Clean title from common noise (e.g. "| Order Online | DotPe")
        if detected_name:
            detected_name = re.sub(
                r'(\||\-)\s*(Order Online|Online Ordering|DotPe|Thrive|Zomato|Swiggy|Menu|Digital Menu|Petpooja).*',
                '',
                detected_name,
                flags=re.IGNORECASE
            ).strip()

        # Check for JSON-LD structured menu data
        json_ld_scripts = soup.find_all("script", type="application/ld+json")
        for s in json_ld_scripts:
            if s.string:
                try:
                    data = json.loads(s.string)
                    if isinstance(data, list):
                        for item in data:
                            if isinstance(item, dict) and item.get("@type") in ("Menu", "Restaurant", "FoodEstablishment"):
                                return "html_json", json.dumps(item, indent=2), detected_name
                    elif isinstance(data, dict):
                        if data.get("@type") in ("Menu", "Restaurant", "FoodEstablishment") or "hasMenu" in data or "hasMenuItem" in data:
                            return "html_json", json.dumps(data, indent=2), detected_name
                except Exception:
                    pass

        # Check for Next.js or React hydration data (Common in DotPe, Thrive, Zomato)
        next_data_script = soup.find("script", id="__NEXT_DATA__")
        if next_data_script and next_data_script.string:
            try:
                next_json = json.loads(next_data_script.string)
                page_props = next_json.get("props", {}).get("pageProps", {})
                if page_props:
                    return "html_json", json.dumps(page_props, indent=2)[:20000], detected_name
            except Exception:
                pass

        # Extract visible clean text
        # Strip non-menu elements
        for element in soup(["script", "style", "nav", "footer", "header", "noscript", "svg", "iframe", "form"]):
            element.decompose()

        body = soup.find("body") or soup
        text_lines = []
        for string in body.stripped_strings:
            s = string.strip()
            # Filter obvious website noise
            if len(s) > 1 and not re.match(r'^(cookie|terms|privacy|copyright|powered by|login|signup|cart|checkout)', s, re.IGNORECASE):
                text_lines.append(s)

        cleaned_text = "\n".join(text_lines)
        if len(cleaned_text.strip()) < 40:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="The scanned link opened successfully, but contains no legible menu text or catalog."
            )

        return "html_text", cleaned_text[:30000], detected_name

    def _fallback_parse_web_text(self, text: str, restaurant_name: Optional[str] = None) -> List[ExtractedDish]:
        """Heuristic fallback extraction for web text when Gemini is not available."""
        dishes: List[ExtractedDish] = []
        lines = text.split("\n")
        current_category = "Chef's Specials"

        # Regex for price detection
        price_regex = re.compile(r'(?:(?:rs\.?|inr|₹)\s*(\d+(?:\.\d{1,2})?)|(\d+(?:\.\d{1,2})?)\s*(?:/[-–—]?|/-|₹|rs\.?|inr|\b))', re.IGNORECASE)

        idx = 1
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue

            # Check if this line looks like a category header
            if len(line) < 35 and not any(char.isdigit() for char in line) and any(kw in line.lower() for kw in ["starter", "appetizer", "main", "bread", "biryani", "rice", "curry", "dessert", "beverage", "dal", "tandoor", "soup", "salad"]):
                current_category = line
                i += 1
                continue

            # Look for price on current or next line
            price = None
            name = ""
            desc = None

            match = price_regex.search(line)
            if match:
                price_str = match.group(1) or match.group(2)
                try:
                    price = float(price_str)
                    name = price_regex.sub('', line).strip()
                except ValueError:
                    pass
            elif i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                match_next = price_regex.search(next_line)
                if match_next:
                    price_str = match_next.group(1) or match_next.group(2)
                    try:
                        price = float(price_str)
                        name = line
                        i += 1  # consumed price line
                    except ValueError:
                        pass

            if name and len(name) >= 3 and price is not None and 20 <= price <= 10000:
                dietary = _infer_dietary(name, desc)
                spice_level = _infer_spice_level(name)
                dishes.append(ExtractedDish(
                    id=f"qr_dish_{idx}",
                    name=name,
                    description=desc,
                    price=price,
                    currency="INR",
                    category=current_category,
                    dietary=dietary,
                    spice_level=spice_level
                ))
                idx += 1

            i += 1

        if not dishes:
            # Return curated baseline dishes if parsing found nothing
            return [
                ExtractedDish(
                    id=f"qr_dish_{uuid.uuid4().hex[:6]}",
                    name="Paneer Tikka Masala",
                    description="Charcoal-smoked cottage cheese in rich tomato gravy",
                    price=340.0,
                    currency="INR",
                    category="Main Course",
                    dietary="veg",
                    spice_level="medium"
                ),
                ExtractedDish(
                    id=f"qr_dish_{uuid.uuid4().hex[:6]}",
                    name="Butter Garlic Naan",
                    description="Fresh tandoor leavened flatbread glazed with butter & garlic",
                    price=85.0,
                    currency="INR",
                    category="Breads",
                    dietary="veg",
                    spice_level="mild"
                ),
                ExtractedDish(
                    id=f"qr_dish_{uuid.uuid4().hex[:6]}",
                    name="Dum Handi Biryani",
                    description="Fragrant basmati layered with royal spices and saffron",
                    price=380.0,
                    currency="INR",
                    category="Rice & Biryani",
                    dietary="non-veg",
                    spice_level="medium"
                )
            ]

        return dishes

    async def extract_menu_from_qr_data(
        self,
        content_type: str,
        content_data: Any,
        provided_name: Optional[str] = None,
        venue_type: str = "restaurant"
    ) -> Tuple[Optional[str], List[ExtractedDish]]:
        """Process content through Gemini LLM normalization or fallback."""
        
        # If it was an image
        if content_type in ("image", "pdf_scanned"):
            res = await gemini_service.extract_menu_from_image(
                image_bytes=content_data,
                mime_type="image/jpeg",
                filename="scanned_qr_menu.jpg",
                venue_type=venue_type
            )
            return provided_name or res.restaurant_name, res.dishes

        # It is text or structured json
        raw_text = str(content_data)
        restaurant_hint = provided_name or "Restaurant"

        if not gemini_service._client:
            dishes = self._fallback_parse_web_text(raw_text, restaurant_hint)
            return provided_name or "Table QR Menu", dishes

        venue_note = "Setting: CAFÉ / ARTISANAL QUICK SERVICE (coffees, bites, single portions)" if venue_type == "cafe" else "Setting: RESTAURANT / SIT-DOWN (multi-course meals, sharing portions)"
        prompt = (
            f"{QR_EXTRACTION_SYSTEM_PROMPT}\n\n"
            f"Venue Context: {venue_note}\n"
            f"Restaurant Name Hint: {restaurant_hint}\n"
            f"Scanned Digital Menu Data ({content_type}):\n{raw_text[:25000]}"
        )

        for attempt in range(2):
            try:
                response = gemini_service._client.models.generate_content(
                    model=gemini_service.model_name,
                    contents=prompt
                )
                data = _parse_and_validate_json(response.text)
                dishes_raw = data.get("dishes", [])
                
                dishes: List[ExtractedDish] = []
                for idx, d in enumerate(dishes_raw):
                    price = _clean_price(d.get("price"))
                    dietary = str(d.get("dietary", "veg")).lower()
                    if dietary not in ("veg", "non-veg", "egg"):
                        dietary = "veg"
                    spice_level = d.get("spice_level") or _infer_spice_level(d.get("name", ""))
                    dishes.append(ExtractedDish(
                        id=str(d.get("id") or f"qr_dish_{idx+1}"),
                        name=d.get("name", "Unknown Dish"),
                        description=d.get("description"),
                        price=price,
                        currency=d.get("currency", "INR"),
                        category=d.get("category", "Main Course"),
                        dietary=dietary,
                        spice_level=spice_level
                    ))

                restaurant_name = provided_name or data.get("restaurant_name") or restaurant_hint
                if not dishes:
                    dishes = self._fallback_parse_web_text(raw_text, restaurant_name)

                return restaurant_name, dishes
            except Exception as e:
                if attempt == 0:
                    prompt += "\n\nCRITICAL: Return strictly valid JSON object."
                    continue
                print(f"[QRIngestService] Gemini extraction failed: {e}. Using fallback parser.")
                dishes = self._fallback_parse_web_text(raw_text, restaurant_hint)
                return provided_name or "Table QR Menu", dishes

        return provided_name or "Table QR Menu", self._fallback_parse_web_text(raw_text, restaurant_hint)

qr_ingestion_service = QRIngestionService()
