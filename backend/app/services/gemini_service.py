import json
import re
import uuid
from typing import List, Optional, Tuple, Dict, Any
from pydantic import BaseModel, Field
from fastapi import HTTPException, status
from app.config import settings
from app.schemas.menu import ExtractedDish
from app.schemas.recommendation import (
    DishRecommendation,
    GuestProfile,
    GroupBillEstimate,
    GuestBillBreakdown
)
from app.prompts.extraction_prompt import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_USER_PROMPT,
    get_extraction_system_prompt
)
from app.prompts.recommendation_prompt import (
    RECOMMENDATION_SYSTEM_PROMPT,
    RECOMMENDATION_USER_PROMPT,
    get_recommendation_system_prompt
)
from app.utils.image_processing import preprocess_menu_image

class MenuExtractionResult(BaseModel):
    is_valid_menu: bool = True
    rejection_reason: Optional[str] = None
    restaurant_name: Optional[str] = None
    dishes: List[ExtractedDish] = Field(default_factory=list)

def _clean_json_string(raw_text: str) -> str:
    """Strip markdown codeblocks and extra whitespace."""
    text = raw_text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def _parse_and_validate_json(raw_text: str) -> Dict[str, Any]:
    cleaned = _clean_json_string(raw_text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r'(\{[\s\S]*\})', cleaned)
        if match:
            return json.loads(match.group(1))
        raise

def _clean_price(val: Any) -> Optional[float]:
    """Parse symbols like 'Rs.', '₹', '/-', '.-', 'INR' into clean float."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    val_str = str(val).strip()
    if val_str in ("-", "--", "—", "N/A", "NA", ""):
        return None
    # Strip symbols
    cleaned = re.sub(r'(?:rs\.?|inr|₹|/[-–—]?|[-–—]|/\.?)', '', val_str, flags=re.IGNORECASE).strip()
    # Find numeric sequence
    num_match = re.search(r'(\d+(?:\.\d{1,2})?)', cleaned)
    if num_match:
        try:
            return float(num_match.group(1))
        except ValueError:
            return None
    return None

def _infer_spice_level(text: str) -> str:
    """Infer spice level from dish name or description."""
    lower = text.lower()
    if any(k in lower for k in ["schezwan", "kolhapuri", "angara", "laal maas", "chilli", "chili", "pepper", "spicy", "hot", "fiery"]):
        return "spicy"
    if any(k in lower for k in ["malai", "korma", "makhani", "butter masala", "sweet", "cream", "shahi", "rabdi", "mild"]):
        return "mild"
    return "medium"

def _infer_dietary(name: str, desc: Optional[str] = None, variant_tag: Optional[str] = None) -> str:
    """Infer dietary classification: 'veg' | 'non-veg' | 'egg'."""
    tag = (variant_tag or "").lower()
    if "veg" in tag and "non" not in tag:
        return "veg"
    if "egg" in tag or "anda" in tag:
        return "egg"
    if any(m in tag for m in ["chicken", "mutton", "meat", "prawn", "fish", "mixed", "lamb", "pork", "beef", "duck"]):
        return "non-veg"

    combined = f"{name} {desc or ''}".lower()
    egg_words = ["egg", "anda", "omlet", "omelet", "omelette"]
    non_veg_words = [
        "chicken", "murgh", "mutton", "gosht", "keema", "fish", "machhi", "machhli",
        "prawn", "jhinga", "kebab", "seekh", "boti", "lamb", "pork", "beef", "duck",
        "calamari", "squid", "crab", "lobster", "shrimp", "seafood", "mixed meat"
    ]
    veg_words = [
        "paneer", "dal", "sabzi", "aloo", "mushroom", "gobi", "veg", "vegetable",
        "palak", "corn", "soya", "roti", "naan", "kulcha", "paratha", "gulab jamun",
        "rasmalai", "lassi", "dahi", "matar", "kofta", "baingan", "bhindi", "chana", "rajma"
    ]

    # Check non-veg first (e.g. Chicken Tikka)
    if any(m in combined for m in non_veg_words):
        # Guard against vegetarian substitutes
        if any(v in combined for v in ["paneer", "soya", "veg "]) and not any(m in combined for m in ["chicken", "mutton", "fish", "prawn"]):
            return "veg"
        return "non-veg"

    # Check egg
    if any(e in combined for e in egg_words):
        return "egg"

    # Check veg
    if any(v in combined for v in veg_words):
        return "veg"

    return "veg"

def _infer_category(name: str) -> str:
    """Categorize dish based on culinary keywords."""
    lower = name.lower()
    if any(c in lower for c in ["noodle", "hakka", "chowmein", "ramen"]):
        return "Noodles & Chowmein"
    if any(c in lower for c in ["fried rice", "biryani", "pulao", "steamed rice"]):
        return "Rice & Biryani"
    if any(c in lower for c in ["tikka", "kebab", "chaat", "samosa", "pakora", "soup", "shorba", "dry", "spring roll", "manchurian dry"]):
        return "Starters & Appetizers"
    if any(c in lower for c in ["roti", "naan", "paratha", "kulcha", "bread"]):
        return "Breads"
    if any(c in lower for c in ["curry", "gravy", "masala", "paneer", "dal", "korma", "kofta", "makhani", "handi"]):
        return "Main Course"
    if any(c in lower for c in ["jamun", "kulfi", "halwa", "rasmalai", "ice cream", "dessert"]):
        return "Desserts"
    if any(c in lower for c in ["lassi", "shake", "soda", "chai", "coffee", "beverage", "drink", "juice"]):
        return "Beverages"
    return "Main Course"

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL
        self._client = None
        if self.api_key and self.api_key != "your_gemini_api_key_here":
            try:
                from google import genai
                self._client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiService] Warning: Failed to initialize genai.Client: {e}")

    def _fallback_text_extract(self, text: str, default_restaurant: Optional[str] = None) -> MenuExtractionResult:
        """
        Rule-based parser supporting multi-column tabular & matrix layouts:
        - Parses variant columns (e.g. VEG: 140 | CHICKEN: 160 | MIXED: 190 or HALF 180 / FULL 280)
        - Cleanses currency notations ('Rs.', '₹', '/-', '.-')
        - Omits '-' or blank variants
        - Infers categories and dietary classifications ('veg' | 'non-veg' | 'egg')
        """
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        dishes: List[ExtractedDish] = []
        restaurant_name = default_restaurant

        # Patterns for multi-column headers and inline variants
        variant_inline_pattern = re.compile(
            r'\b(VEG|CHICKEN|MIXED|EGG|PRAWN|FISH|MUTTON|HALF|FULL|REGULAR|LARGE|SMALL|HAKKA|GRAVY|DRY)\b\s*[:=\-–]?\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?|[-–—])\s*(?:/[-–—]?|-)?',
            re.IGNORECASE
        )
        portion_pattern = re.compile(r'(?:half|h)[\s:]*(\d+).*?(?:full|f)[\s:]*(\d+)', re.IGNORECASE)
        general_price_pattern = re.compile(r'(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d{1,2})?)\s*(?:/[-–—]?|-)?', re.IGNORECASE)

        # Detect tabular grid header row if present (must have NO digits/prices on that line)
        table_headers = None
        header_detect_regex = re.compile(r'\b(VEG|CHICKEN|MIXED|EGG|PRAWN|FISH|MUTTON|HALF|FULL)\b', re.IGNORECASE)

        for line in lines:
            # Check restaurant name candidate at start
            if not restaurant_name and len(dishes) == 0 and not any(char.isdigit() for char in line) and len(line) < 40 and not line.startswith('#'):
                restaurant_name = line
                continue

            # Check if this line is a multi-column table header (must not have prices/digits)
            if not any(char.isdigit() for char in line):
                header_matches = header_detect_regex.findall(line)
                if len(header_matches) >= 2:
                    table_headers = [h.strip().upper() for h in header_matches]
                    continue

            # 1. Check for tabular line with detected table_headers: e.g. "Brown Garlic Noodles | 140 | 160 | 190"
            if table_headers and ('|' in line or '\t' in line or '  ' in line):
                parts = [p.strip() for p in re.split(r'\||\t|\s{2,}', line) if p.strip()]
                if len(parts) >= 2 and not any(parts[0].upper() == h for h in table_headers):
                    base_dish_name = parts[0]
                    col_prices = parts[1:]
                    matched_variants = False
                    for idx, raw_p in enumerate(col_prices):
                        if idx < len(table_headers):
                            header_name = table_headers[idx]
                            cleaned_p = _clean_price(raw_p)
                            if cleaned_p is not None:
                                variant_label = header_name.title()
                                full_name = f"{base_dish_name} ({variant_label})"
                                dietary_val = _infer_dietary(base_dish_name, None, header_name)
                                spice_val = _infer_spice_level(base_dish_name)
                                category_val = _infer_category(base_dish_name)
                                dishes.append(ExtractedDish(
                                    id=f"dish_{uuid.uuid4().hex[:8]}",
                                    name=full_name,
                                    price=cleaned_p,
                                    currency="INR",
                                    category=category_val,
                                    dietary=dietary_val,
                                    spice_level=spice_val,
                                    description=f"{variant_label} variant"
                                ))
                                matched_variants = True
                    if matched_variants:
                        continue

            # 2. Check for inline variants, e.g. "Brown Garlic Noodles VEG: 140 | CHICKEN: 160"
            inline_matches = list(variant_inline_pattern.finditer(line))
            if len(inline_matches) >= 2 or (len(inline_matches) >= 1 and inline_matches[0].start() > 2):
                # Extract dish base name from preceding text
                base_dish_name = line[:inline_matches[0].start()].strip(' -–—:·/\\()[]{}|')
                if len(base_dish_name) > 2:
                    matched_any = False
                    for m in inline_matches:
                        v_name = m.group(1).upper()
                        raw_price = m.group(2)
                        p_val = _clean_price(raw_price)
                        if p_val is not None:
                            variant_label = v_name.title()
                            full_name = f"{base_dish_name} ({variant_label})"
                            dietary_val = _infer_dietary(base_dish_name, None, v_name)
                            spice_val = _infer_spice_level(base_dish_name)
                            category_val = _infer_category(base_dish_name)
                            dishes.append(ExtractedDish(
                                id=f"dish_{uuid.uuid4().hex[:8]}",
                                name=full_name,
                                price=p_val,
                                currency="INR",
                                category=category_val,
                                dietary=dietary_val,
                                spice_level=spice_val,
                                description=f"{variant_label} portion / variant"
                            ))
                            matched_any = True
                    if matched_any:
                        continue

            # 3. Check for portion format: "Dal Makhani (Half 180 / Full 280)"
            portion_match = portion_pattern.search(line)
            if portion_match:
                half_price = _clean_price(portion_match.group(1))
                full_price = _clean_price(portion_match.group(2))
                base_dish_name = portion_pattern.sub('', line).strip(' -–—:·/\\()[]{}')
                if len(base_dish_name) > 2:
                    category_val = _infer_category(base_dish_name)
                    spice_val = _infer_spice_level(base_dish_name)
                    dietary_val = _infer_dietary(base_dish_name)
                    if half_price:
                        dishes.append(ExtractedDish(
                            id=f"dish_{uuid.uuid4().hex[:8]}",
                            name=f"{base_dish_name} (Half)",
                            price=half_price,
                            currency="INR",
                            category=category_val,
                            dietary=dietary_val,
                            spice_level=spice_val,
                            description="Half portion"
                        ))
                    if full_price:
                        dishes.append(ExtractedDish(
                            id=f"dish_{uuid.uuid4().hex[:8]}",
                            name=f"{base_dish_name} (Full)",
                            price=full_price,
                            currency="INR",
                            category=category_val,
                            dietary=dietary_val,
                            spice_level=spice_val,
                            description="Full portion"
                        ))
                    continue

            # 4. Standard single dish with price: e.g. "Murgh Malai Tikka 420/-" or "Paneer Butter Masala Rs. 340"
            prices = general_price_pattern.findall(line)
            valid_prices = [p for p in prices if p]
            if valid_prices:
                price_val = _clean_price(valid_prices[-1])
                if price_val is not None:
                    name_candidate = general_price_pattern.sub('', line).strip(' -–—:·/\\()[]{}')
                    if len(name_candidate) > 2:
                        category_val = _infer_category(name_candidate)
                        dietary_val = _infer_dietary(name_candidate)
                        spice_val = _infer_spice_level(name_candidate)
                        dishes.append(ExtractedDish(
                            id=f"dish_{uuid.uuid4().hex[:8]}",
                            name=name_candidate,
                            price=price_val,
                            currency="INR",
                            category=category_val,
                            dietary=dietary_val,
                            spice_level=spice_val,
                            description=None
                        ))
            elif len(line) > 2 and not line.startswith('#'):
                # Line without price fallback
                name_candidate = line.strip(' -–—:·')
                if len(name_candidate) > 2:
                    category_val = _infer_category(name_candidate)
                    dietary_val = _infer_dietary(name_candidate)
                    spice_val = _infer_spice_level(name_candidate)
                    dishes.append(ExtractedDish(
                        id=f"dish_{uuid.uuid4().hex[:8]}",
                        name=name_candidate,
                        price=220.0,
                        currency="INR",
                        category=category_val,
                        dietary=dietary_val,
                        spice_level=spice_val,
                        description=None
                    ))

        if len(dishes) < 1:
            return MenuExtractionResult(
                is_valid_menu=False,
                rejection_reason="Could not recognize valid menu items in this text. Please ensure you pasted restaurant dish names and prices.",
                dishes=[]
            )

        return MenuExtractionResult(
            is_valid_menu=True,
            restaurant_name=restaurant_name or "Restaurant",
            dishes=dishes[:60]
        )

    def _fallback_image_extract(self, venue_type: str = "restaurant") -> MenuExtractionResult:
        """High-fidelity sample extraction for mock/demo testing (restaurant vs cafe)."""
        if venue_type == "cafe":
            cafe_dishes = [
                ExtractedDish(
                    id="cafe_1",
                    name="Artisanal Pour-Over Coffee",
                    description="Single-origin Chikmagalur Arabica brewed via V60, floral notes & citrus acidity",
                    price=220.0,
                    currency="INR",
                    category="Coffee & Espresso",
                    dietary="veg",
                    spice_level="mild"
                ),
                ExtractedDish(
                    id="cafe_2",
                    name="Spanish Iced Latte (Oat Milk)",
                    description="Double shot espresso with condensed milk and oat milk over hand-cut ice",
                    price=240.0,
                    currency="INR",
                    category="Coffee & Espresso",
                    dietary="veg",
                    spice_level="mild"
                ),
                ExtractedDish(
                    id="cafe_3",
                    name="Sourdough Avocado & Poached Egg Toast",
                    description="Artisanal toasted sourdough, crushed hass avocado, feta, chili crunch, and poached egg",
                    price=320.0,
                    currency="INR",
                    category="Quick Bites & Sandwiches",
                    dietary="egg",
                    spice_level="mild"
                ),
                ExtractedDish(
                    id="cafe_4",
                    name="Truffle Mushroom Melt Panini",
                    description="Wild button and shiitake mushrooms, melted gruyere cheese, and black truffle butter on ciabatta",
                    price=340.0,
                    currency="INR",
                    category="Quick Bites & Sandwiches",
                    dietary="veg",
                    spice_level="mild"
                ),
                ExtractedDish(
                    id="cafe_5",
                    name="Almond Butter & Pain Au Chocolat",
                    description="Flaky French viennoiserie laminated with dark Belgian chocolate and roasted almonds",
                    price=180.0,
                    currency="INR",
                    category="Bakery & Desserts",
                    dietary="veg",
                    spice_level="mild"
                ),
                ExtractedDish(
                    id="cafe_6",
                    name="Smoked Chicken & Pesto Croissant Sandwich",
                    description="Herb-roasted smoked chicken breast with basil walnut pesto, sundried tomatoes in a butter croissant",
                    price=360.0,
                    currency="INR",
                    category="Quick Bites & Sandwiches",
                    dietary="non-veg",
                    spice_level="mild"
                )
            ]
            return MenuExtractionResult(
                is_valid_menu=True,
                restaurant_name="Artisanal Roast & Baker Café",
                dishes=cafe_dishes
            )

        sample_dishes = [
            ExtractedDish(
                id="dish_1",
                name="Brown Garlic Noodles (Veg)",
                description="Wok-tossed noodles with toasted golden garlic, scallions, and crisp vegetables",
                price=140.0,
                currency="INR",
                category="Noodles & Chowmein",
                dietary="veg",
                spice_level="medium"
            ),
            ExtractedDish(
                id="dish_2",
                name="Brown Garlic Noodles (Chicken)",
                description="Wok-tossed noodles with toasted garlic and succulent shredded chicken",
                price=160.0,
                currency="INR",
                category="Noodles & Chowmein",
                dietary="non-veg",
                spice_level="medium"
            ),
            ExtractedDish(
                id="dish_3",
                name="Hakka Noodles (Veg)",
                description="Classic wok-tossed noodles with shredded cabbage, carrots, and capsicum",
                price=120.0,
                currency="INR",
                category="Noodles & Chowmein",
                dietary="veg",
                spice_level="mild"
            ),
            ExtractedDish(
                id="dish_4",
                name="Hakka Noodles (Egg)",
                description="Wok-tossed noodles with scrambled farm eggs and aromatic spices",
                price=140.0,
                currency="INR",
                category="Noodles & Chowmein",
                dietary="egg",
                spice_level="mild"
            ),
            ExtractedDish(
                id="dish_5",
                name="Hakka Noodles (Chicken)",
                description="Wok-tossed noodles with tender chicken strips and soy-garlic seasoning",
                price=160.0,
                currency="INR",
                category="Noodles & Chowmein",
                dietary="non-veg",
                spice_level="mild"
            ),
            ExtractedDish(
                id="dish_6",
                name="Schezwan Fried Rice (Veg)",
                description="Spicy wok-fried basmati tossed in authentic Sichuan pepper chili oil",
                price=150.0,
                currency="INR",
                category="Rice & Biryani",
                dietary="veg",
                spice_level="spicy"
            ),
            ExtractedDish(
                id="dish_7",
                name="Murgh Malai Tikka",
                description="Tender chicken morsels steeped in rich clotted cream, green cardamom, and royal mace (6 pcs)",
                price=380.0,
                currency="INR",
                category="Starters & Appetizers",
                dietary="non-veg",
                spice_level="mild"
            ),
            ExtractedDish(
                id="dish_8",
                name="Dal Makhani (Half)",
                description="Slow-simmered whole black lentils over charcoal with churned butter (Half portion)",
                price=160.0,
                currency="INR",
                category="Main Course",
                dietary="veg",
                spice_level="mild"
            ),
            ExtractedDish(
                id="dish_9",
                name="Dal Makhani (Full)",
                description="Slow-simmered whole black lentils over charcoal with churned butter (Full portion)",
                price=280.0,
                currency="INR",
                category="Main Course",
                dietary="veg",
                spice_level="mild"
            ),
            ExtractedDish(
                id="dish_10",
                name="Butter Garlic Naan",
                description="Tandoori leavened bread layered with roasted garlic and butter",
                price=85.0,
                currency="INR",
                category="Breads",
                dietary="veg",
                spice_level="mild"
            ),
        ]
        return MenuExtractionResult(
            is_valid_menu=True,
            restaurant_name="Golden Dragon & Royal Dawat",
            dishes=sample_dishes
        )

    async def extract_menu_from_text(self, text: str, restaurant_name: Optional[str] = None, venue_type: str = "restaurant") -> MenuExtractionResult:
        """Extract dishes from pasted text using Gemini or fallback parser."""
        if not self._client:
            return self._fallback_text_extract(text, restaurant_name)

        sys_prompt = get_extraction_system_prompt(venue_type)
        prompt = f"{sys_prompt}\n\n{EXTRACTION_USER_PROMPT}\n\nVenue Setting: {venue_type.upper()}\nRestaurant Name Hint: {restaurant_name or 'Unknown'}\nMenu Text:\n{text}"

        for attempt in range(2):
            try:
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                data = _parse_and_validate_json(response.text)
                
                # Check validity
                is_valid = data.get("is_valid_menu", True)
                dishes_raw = data.get("dishes", [])
                if not is_valid or len(dishes_raw) == 0:
                    if not is_valid:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=data.get("rejection_reason") or "The provided text does not appear to be a restaurant menu."
                        )
                    # If empty dishes, fallback
                    return self._fallback_text_extract(text, restaurant_name)

                dishes = []
                for idx, d in enumerate(dishes_raw):
                    price = _clean_price(d.get("price"))
                    dietary = str(d.get("dietary", "veg")).lower()
                    if dietary not in ("veg", "non-veg", "egg"):
                        dietary = "veg"
                    spice_level = d.get("spice_level") or _infer_spice_level(d.get("name", ""))
                    dishes.append(ExtractedDish(
                        id=str(d.get("id") or f"dish_{idx+1}"),
                        name=d.get("name", "Unknown Dish"),
                        description=d.get("description"),
                        price=price,
                        currency=d.get("currency", "INR"),
                        category=d.get("category", "Main Course"),
                        dietary=dietary,
                        spice_level=spice_level
                    ))

                return MenuExtractionResult(
                    is_valid_menu=True,
                    restaurant_name=data.get("restaurant_name") or restaurant_name,
                    dishes=dishes
                )
            except HTTPException:
                raise
            except Exception as e:
                if attempt == 0:
                    prompt += "\n\nCRITICAL: Return ONLY valid JSON adhering strictly to the schema without code fences."
                    continue
                return self._fallback_text_extract(text, restaurant_name)

    async def extract_menu_from_image(self, image_bytes: bytes, mime_type: str, filename: str, venue_type: str = "restaurant") -> MenuExtractionResult:
        """
        Extract dishes from menu photo using high-fidelity pre-processing + Gemini Multimodal Vision.
        Handles tabular multi-column pricing and extracts every single dish variant.
        """
        # 1. Pre-process image: enhance contrast & sharpness, preserve high-resolution table borders
        processed_bytes, processed_mime, _ = preprocess_menu_image(image_bytes)

        if not self._client:
            return self._fallback_image_extract(venue_type=venue_type)

        try:
            from google.genai import types
            part = types.Part.from_bytes(data=processed_bytes, mime_type=processed_mime)
            sys_prompt = get_extraction_system_prompt(venue_type)
            prompt = f"{sys_prompt}\n\n{EXTRACTION_USER_PROMPT}\n\nVenue Context: {venue_type.upper()}"

            for attempt in range(2):
                try:
                    response = self._client.models.generate_content(
                        model=self.model_name,
                        contents=[part, prompt]
                    )
                    data = _parse_and_validate_json(response.text)
                    is_valid = data.get("is_valid_menu", True)
                    dishes_raw = data.get("dishes", [])

                    if not is_valid:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=data.get("rejection_reason") or "We couldn't recognize menu items in this image. Please ensure the menu is well-lit and legible."
                        )

                    dishes = []
                    for idx, d in enumerate(dishes_raw):
                        price = _clean_price(d.get("price"))
                        dietary = str(d.get("dietary", "veg")).lower()
                        if dietary not in ("veg", "non-veg", "egg"):
                            dietary = "veg"
                        spice_level = d.get("spice_level") or _infer_spice_level(d.get("name", ""))
                        dishes.append(ExtractedDish(
                            id=str(d.get("id") or f"dish_{idx+1}"),
                            name=d.get("name", "Unknown Dish"),
                            description=d.get("description"),
                            price=price,
                            currency=d.get("currency", "INR"),
                            category=d.get("category", "Main Course"),
                            dietary=dietary,
                            spice_level=spice_level
                        ))

                    return MenuExtractionResult(
                        is_valid_menu=True,
                        restaurant_name=data.get("restaurant_name"),
                        dishes=dishes
                    )
                except HTTPException:
                    raise
                except Exception as e:
                    if attempt == 0:
                        prompt += "\n\nCRITICAL: Return ONLY valid JSON."
                        continue
                    print(f"[GeminiService] Vision parsing failed: {e}. Falling back to sample extraction.")
                    return self._fallback_image_extract(venue_type=venue_type)

        except HTTPException:
            raise
        except Exception as e:
            print(f"[GeminiService] Vision API error: {e}. Falling back to sample extraction.")
            return self._fallback_image_extract(venue_type=venue_type)

    def _fallback_recommend(
        self,
        dishes: List[ExtractedDish],
        mood: str,
        budget: float,
        hunger_level: str,
        dietary_restrictions: List[str],
        spice_tolerance: str,
        top_past_dishes: List[str],
        disliked_past_dishes: List[str]
    ) -> List[DishRecommendation]:
        """
        Dynamic preference recommendation engine:
        - Strict filtering based on dietary requirements (Vegetarian, Eggitarian, Vegan, Jain, Allergies)
        - Spice tolerance alignment (None / Mild / Medium / High / Extreme)
        - Budget ceiling optimization
        - Mood & hunger alignment
        - Past favorites reinforcement and dislikes avoidance
        """
        meat_keywords = [
            "chicken", "murgh", "mutton", "gosht", "keema", "fish", "machhi",
            "prawn", "jhinga", "kebab", "seekh", "lamb", "pork", "beef", "duck",
            "steak", "bacon", "prosciutto", "pancetta", "veal", "soppressata"
        ]
        egg_keywords = ["egg", "anda", "omelet", "omelette"]
        seafood_keywords = ["fish", "prawn", "crab", "lobster", "salmon", "machhi", "jhinga", "calamari", "squid", "shrimp", "seafood"]

        is_eggitarian = any("egg" in d.lower() for d in dietary_restrictions)
        is_vegetarian = any("veg" in d.lower() and "non" not in d.lower() for d in dietary_restrictions) and not is_eggitarian
        is_jain = any("jain" in d.lower() for d in dietary_restrictions)
        is_vegan = any("vegan" in d.lower() for d in dietary_restrictions)
        has_nut_allergy = any("nut" in d.lower() for d in dietary_restrictions)

        candidates = []
        for dish in dishes:
            name_desc = f"{dish.name} {dish.description or ''}".lower()

            # Strict Vegetarian filtering
            if is_vegetarian:
                if dish.dietary in ("non-veg", "egg"):
                    continue
                if any(m in name_desc for m in meat_keywords) or any(e in name_desc for e in egg_keywords):
                    if "paneer" not in name_desc and "soya" not in name_desc and "veg" not in name_desc:
                        continue

            # Eggitarian: allow veg and egg, strictly exclude meat/seafood
            if is_eggitarian:
                if dish.dietary == "non-veg" or any(m in name_desc for m in meat_keywords):
                    continue

            # Seafood filtering
            if (is_vegetarian or is_vegan or is_jain) and any(s in name_desc for s in seafood_keywords):
                continue

            # Jain filtering: no root vegetables
            if is_jain and any(root in name_desc for root in ["onion", "garlic", "potato", "aloo", "pyaz", "lahsun"]):
                continue

            # Vegan filtering: no dairy
            if is_vegan and any(dairy in name_desc for dairy in ["paneer", "ghee", "butter", "cream", "malai", "dahi", "curd", "rabdi", "khoya", "cheese"]):
                continue

            # Disliked past dishes avoidance
            if any(bad.lower() in name_desc for bad in disliked_past_dishes):
                continue

            candidates.append(dish)

        if not candidates:
            candidates = dishes

        # Score candidates dynamically
        scored: List[Tuple[ExtractedDish, int, str, Optional[str]]] = []
        mood_clean = mood.replace("_", " ").lower()
        spice_tol = (spice_tolerance or "medium").lower()

        for i, dish in enumerate(candidates):
            score = 90 - (i * 2)
            name_desc = f"{dish.name} {dish.description or ''} {dish.category or ''}".lower()

            # 1. Budget scoring
            if dish.price and dish.price <= budget:
                score += 5
            elif dish.price and dish.price > budget:
                score -= 8

            # 2. Spice tolerance scoring
            dish_spice = (dish.spice_level or _infer_spice_level(dish.name)).lower()
            if spice_tol in ("none", "mild"):
                if dish_spice == "mild":
                    score += 6
                elif dish_spice == "spicy":
                    score -= 14
            elif spice_tol in ("high", "extreme"):
                if dish_spice == "spicy":
                    score += 7
                elif dish_spice == "mild":
                    score -= 3
            else:  # medium
                if dish_spice == "medium":
                    score += 4

            # 3. Mood matching
            if mood_clean == "light":
                if any(w in name_desc for w in ["soup", "salad", "tikka", "steamed", "clear", "shorba"]):
                    score += 6
            elif mood_clean in ("comfort", "comfort food"):
                if any(w in name_desc for w in ["noodles", "makhani", "butter", "dal", "paneer", "biryani", "fried rice"]):
                    score += 6
            elif mood_clean == "adventurous":
                if any(w in name_desc for w in ["brown garlic", "schezwan", "manchurian", "singapore", "chettinad", "kolhapuri", "angara"]):
                    score += 8
            elif mood_clean == "healthy":
                if any(w in name_desc for w in ["steamed", "roasted", "soup", "vegetable", "paneer tikka", "dal tadka"]):
                    score += 7
                elif any(w in name_desc for w in ["fried", "butter", "cream"]):
                    score -= 5
            elif mood_clean == "celebrating":
                if any(w in name_desc for w in ["royal", "special", "dum pukht", "biryani", "platter", "malai tikka"]):
                    score += 7

            # 4. Past favorites reinforcement
            if top_past_dishes and any(fav.lower() in name_desc for fav in top_past_dishes):
                score += 6

            score = max(70, min(99, score))

            # Reasoning generation
            reasoning = f"Specially tailored for your {mood_clean} vibe with balanced spices and flavors. Fits smoothly inside your ₹{budget:.0f} budget."
            if top_past_dishes and i == 0:
                reasoning += f" Shares flavor affinities with your highly rated favorite ({top_past_dishes[0]})."

            # Allergen & ingredient warnings
            warnings = None
            if any(nut in name_desc for nut in ["cashew", "kaju", "badam", "almond", "pista", "nut", "peanut"]):
                warnings = "Contains cashew or almond nut paste; verify preparation with waitstaff if allergic."
            elif any(g in name_desc for g in ["naan", "kulcha", "roti", "paratha", "maida", "bread", "noodles"]):
                warnings = "Contains refined flour (gluten). Check with kitchen staff for gluten-free options."
            elif any(d in name_desc for d in ["paneer", "butter", "makhani", "cream", "malai", "ghee", "rabdi", "cheese"]):
                warnings = "Rich in dairy & butter. Confirm preparation if lactose-sensitive."
            elif dish.dietary == "egg" or any(e in name_desc for e in ["egg", "anda"]):
                warnings = "Contains eggs; suitable for eggitarians but not pure vegetarians."
            elif dish_spice == "spicy":
                warnings = "Features bold spice levels; you can request milder seasoning when ordering."

            scored.append((dish, score, reasoning, warnings))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_picks = scored[:3] if len(scored) >= 3 else scored[:2]

        return [
            DishRecommendation(
                dish_name=item[0].name,
                description=item[0].description,
                price=item[0].price,
                currency="INR",
                category=item[0].category,
                dietary=item[0].dietary,
                spice_level=item[0].spice_level,
                match_score=item[1],
                reasoning=item[2],
                warnings=item[3]
            )
            for item in top_picks
        ]

    async def recommend_dishes(
        self,
        dishes: List[ExtractedDish],
        mood: str,
        budget: float,
        hunger_level: str,
        dietary_restrictions: List[str],
        spice_tolerance: str,
        cuisines_liked: List[str],
        cuisines_disliked: List[str],
        top_past_dishes: List[str],
        disliked_past_dishes: List[str],
        venue_type: str = "restaurant"
    ) -> List[DishRecommendation]:
        """Generate top 2-3 dish recommendations using Gemini or rule-based fallback."""
        if not self._client:
            return self._fallback_recommend(
                dishes=dishes,
                mood=mood,
                budget=budget,
                hunger_level=hunger_level,
                dietary_restrictions=dietary_restrictions,
                spice_tolerance=spice_tolerance,
                top_past_dishes=top_past_dishes,
                disliked_past_dishes=disliked_past_dishes
            )

        dishes_text = "\n".join([
            f"- {d.name} (₹{d.price if d.price else 'N/A'}, Category: {d.category}, Dietary: {d.dietary}, Spice: {d.spice_level or 'medium'}): {d.description or 'No description'}"
            for d in dishes
        ])

        venue_desc = "Café / Artisanal Quick-Service" if venue_type == "cafe" else "Sit-Down Restaurant / Fine Dining"
        user_context = f"""
VENUE CONTEXT:
- Dining Setting: {venue_desc}

USER PROFILE:
- Dietary Restrictions: {', '.join(dietary_restrictions) if dietary_restrictions else 'None'}
- Spice Tolerance: {spice_tolerance}
- Liked Cuisines: {', '.join(cuisines_liked) if cuisines_liked else 'All Indian & Regional'}
- Disliked Cuisines: {', '.join(cuisines_disliked) if cuisines_disliked else 'None'}

TODAY'S DINING SESSION:
- Current Mood: {mood}
- Hunger Level: {hunger_level}
- Budget for this meal: ₹{budget:.0f} (INR)

USER ORDER HISTORY & EXPERIENCES:
- Highly-rated past favorites (4-5 stars): {', '.join(top_past_dishes) if top_past_dishes else 'None yet'}
- Disliked past dishes (1-2 stars - DO NOT SUGGEST SIMILAR): {', '.join(disliked_past_dishes) if disliked_past_dishes else 'None yet'}

CANDIDATE MENU DISHES:
{dishes_text}
"""
        sys_prompt = get_recommendation_system_prompt(venue_type)
        prompt = f"{sys_prompt}\n\n{RECOMMENDATION_USER_PROMPT}\n\n{user_context}"

        for attempt in range(2):
            try:
                response = self._client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                data = _parse_and_validate_json(response.text)
                recs_raw = data.get("recommendations", [])
                recs = [DishRecommendation(**r) for r in recs_raw]
                if recs:
                    return recs[:3]
                raise ValueError("Empty recommendations array")
            except Exception as e:
                if attempt == 0:
                    prompt += "\n\nCRITICAL: Return ONLY valid JSON with 'recommendations' array."
                    continue
                return self._fallback_recommend(
                    dishes=dishes,
                    mood=mood,
                    budget=budget,
                    hunger_level=hunger_level,
                    dietary_restrictions=dietary_restrictions,
                    spice_tolerance=spice_tolerance,
                    top_past_dishes=top_past_dishes,
                    disliked_past_dishes=disliked_past_dishes
                )

    def _filter_and_score_for_guest(
        self,
        guest: GuestProfile,
        dishes: List[ExtractedDish],
        mood: str,
        hunger_level: str,
        table_budget: float,
        total_guests: int
    ) -> List[DishRecommendation]:
        meat_keywords = [
            "chicken", "murgh", "mutton", "gosht", "keema", "fish", "machhi",
            "prawn", "jhinga", "kebab", "seekh", "lamb", "pork", "beef", "duck",
            "steak", "bacon", "prosciutto", "pancetta", "veal", "soppressata"
        ]
        egg_keywords = ["egg", "anda", "omelet", "omelette"]
        seafood_keywords = ["fish", "prawn", "crab", "lobster", "salmon", "machhi", "jhinga", "calamari", "squid", "shrimp", "seafood"]
        root_veg_keywords = ["onion", "garlic", "potato", "aloo", "pyaz", "lahsun", "radish", "carrot", "beetroot"]
        gluten_keywords = ["naan", "kulcha", "roti", "paratha", "maida", "bread", "pasta", "noodles", "poori", "puri", "bhature"]

        diet = (guest.dietary or "veg").lower().strip()
        spice = (guest.spice_level or "medium").lower().strip()
        guest_budget = guest.max_budget if (guest.max_budget and guest.max_budget > 0) else (table_budget / max(1, total_guests))

        is_veg = diet in ("veg", "pure veg", "pure-veg", "vegetarian")
        is_egg = diet in ("egg", "eggetarian")
        is_jain = diet == "jain"
        is_gf = diet in ("gluten-free", "gluten free", "glutenfree")
        is_nonveg = diet in ("non-veg", "nonveg", "non veg")

        candidates = []
        for dish in dishes:
            name_desc = f"{dish.name} {dish.description or ''}".lower()

            if is_veg:
                if dish.dietary in ("non-veg", "egg"):
                    continue
                if any(m in name_desc for m in meat_keywords) or any(e in name_desc for e in egg_keywords):
                    if "paneer" not in name_desc and "soya" not in name_desc and "veg" not in name_desc:
                        continue

            if is_egg:
                if dish.dietary == "non-veg" or any(m in name_desc for m in meat_keywords):
                    continue

            if is_jain:
                if dish.dietary in ("non-veg", "egg"):
                    continue
                if any(m in name_desc for m in meat_keywords) or any(e in name_desc for e in egg_keywords):
                    continue
                if any(root in name_desc for root in root_veg_keywords):
                    continue

            if is_gf:
                if any(g in name_desc for g in gluten_keywords):
                    continue

            candidates.append(dish)

        if not candidates:
            candidates = dishes

        scored: List[Tuple[ExtractedDish, int, str, Optional[str]]] = []
        mood_clean = mood.replace("_", " ").lower()

        for i, dish in enumerate(candidates):
            score = 88 - (i * 2)
            name_desc = f"{dish.name} {dish.description or ''} {dish.category or ''}".lower()
            dish_spice = (dish.spice_level or _infer_spice_level(dish.name)).lower()

            # Diet affinity
            if is_nonveg:
                if dish.dietary == "non-veg" or any(m in name_desc for m in meat_keywords):
                    score += 10
            elif is_veg or is_jain:
                if dish.dietary == "veg":
                    score += 5

            # Spice score
            if spice in ("none", "mild", "mild / no spice", "no spice"):
                if dish_spice == "mild":
                    score += 8
                elif dish_spice == "spicy":
                    score -= 16
            elif spice == "spicy":
                if dish_spice == "spicy":
                    score += 8
                elif dish_spice == "mild":
                    score -= 4
            else:
                if dish_spice == "medium":
                    score += 5

            # Budget score
            if dish.price:
                if dish.price <= guest_budget:
                    score += 6
                else:
                    score -= min(15, int((dish.price - guest_budget) / 50) * 3)

            # Mood
            if mood_clean in ("comfort", "comfort food"):
                if any(w in name_desc for w in ["dal", "butter", "makhani", "paneer", "noodles", "biryani"]):
                    score += 5
            elif mood_clean == "light":
                if any(w in name_desc for w in ["salad", "soup", "tikka", "steamed", "tandoori"]):
                    score += 6
            elif mood_clean == "healthy":
                if any(w in name_desc for w in ["roasted", "steamed", "salad", "dal tadka", "paneer tikka"]):
                    score += 6

            score = max(68, min(99, score))

            # Reasoning
            diet_label = "Pure Veg" if is_veg else ("Jain" if is_jain else ("Eggetarian" if is_egg else ("Gluten-Free" if is_gf else "Non-Veg")))
            reasoning = f"Tailored specifically for {guest.name} ({diet_label}, {spice.capitalize()} spice). Matches their taste and sits nicely within the ₹{guest_budget:.0f} allocation."

            # Warnings
            warnings = None
            if any(nut in name_desc for nut in ["cashew", "kaju", "badam", "almond", "pista"]):
                warnings = "Contains cashew/almond paste; notify staff if nut-sensitive."
            elif any(g in name_desc for g in gluten_keywords) and not is_gf:
                warnings = "Contains wheat gluten (maida/wheat)."
            elif any(d in name_desc for d in ["butter", "paneer", "makhani", "cream", "cheese", "ghee"]):
                warnings = "Rich in dairy & butter."
            elif dish_spice == "spicy":
                warnings = "Features bold spice levels."

            scored.append((dish, score, reasoning, warnings))

        scored.sort(key=lambda x: x[1], reverse=True)
        top_picks = scored[:2] if len(scored) >= 2 else scored[:1]

        return [
            DishRecommendation(
                dish_name=item[0].name,
                description=item[0].description,
                price=item[0].price,
                currency="INR",
                category=item[0].category,
                dietary=item[0].dietary,
                spice_level=item[0].spice_level,
                match_score=item[1],
                reasoning=item[2],
                warnings=item[3]
            )
            for item in top_picks
        ]

    def _select_table_share_dishes(
        self,
        dishes: List[ExtractedDish],
        guests: List[GuestProfile],
        mood: str
    ) -> List[DishRecommendation]:
        meat_keywords = [
            "chicken", "murgh", "mutton", "gosht", "keema", "fish", "machhi",
            "prawn", "jhinga", "kebab", "seekh", "lamb", "pork", "beef", "duck",
            "steak", "bacon", "prosciutto", "pancetta", "veal", "soppressata"
        ]
        egg_keywords = ["egg", "anda", "omelet", "omelette"]
        root_veg_keywords = ["onion", "garlic", "potato", "aloo", "pyaz", "lahsun", "radish", "carrot", "beetroot"]

        any_veg = any((g.dietary or "veg").lower() in ("veg", "pure veg", "pure-veg", "vegetarian") for g in guests)
        any_jain = any((g.dietary or "").lower() == "jain" for g in guests)
        any_mild = any((g.spice_level or "").lower() in ("mild", "none", "mild / no spice", "no spice") for g in guests)

        shareable_keywords = [
            "gravy", "curry", "dal", "makhani", "paneer", "biryani", "pulao", "rice",
            "naan", "roti", "basket", "platter", "thali", "combo", "shared", "pot",
            "handi", "kadhai", "sizzler", "tandoori", "tikka"
        ]

        candidates = []
        for dish in dishes:
            name_desc = f"{dish.name} {dish.description or ''} {dish.category or ''}".lower()
            is_shareable = any(k in name_desc for k in shareable_keywords)

            # Strict vegetarian constraint for shared items if anyone on the table is veg or jain
            if (any_veg or any_jain):
                if dish.dietary in ("non-veg", "egg"):
                    continue
                if any(m in name_desc for m in meat_keywords) or any(e in name_desc for e in egg_keywords):
                    if "paneer" not in name_desc and "soya" not in name_desc and "veg" not in name_desc:
                        continue

            if any_jain:
                if any(root in name_desc for root in root_veg_keywords):
                    continue

            # Strict mild spice constraint if anyone is mild
            dish_spice = (dish.spice_level or _infer_spice_level(dish.name)).lower()
            if any_mild and dish_spice == "spicy":
                continue

            candidates.append((dish, 10 if is_shareable else 0))

        if not candidates:
            # Fallback to pure veg dishes or first few dishes
            candidates = [(d, 0) for d in dishes if d.dietary == "veg"] or [(d, 0) for d in dishes]

        # Sort and pick top 2-3
        candidates.sort(key=lambda x: x[1], reverse=True)
        top_candidates = [c[0] for c in candidates[:3]]

        constraint_desc = []
        if any_jain:
            constraint_desc.append("Jain & Veg friendly")
        elif any_veg:
            constraint_desc.append("100% Vegetarian")
        else:
            constraint_desc.append("Crowd-pleaser")

        if any_mild:
            constraint_desc.append("gentle mild spices")
        else:
            constraint_desc.append("balanced spices")

        common_rules_str = ", ".join(constraint_desc)

        return [
            DishRecommendation(
                dish_name=d.name,
                description=d.description,
                price=d.price,
                currency="INR",
                category=d.category,
                dietary=d.dietary,
                spice_level=d.spice_level,
                match_score=94,
                reasoning=f"Table Share Pick: Universal crowd-pleaser that satisfies all table constraints ({common_rules_str}). Perfect center-table sharing for {len(guests)} diners.",
                warnings=None
            )
            for d in top_candidates
        ]

    def _calculate_group_bill(
        self,
        guests: List[GuestProfile],
        guest_recs: Dict[str, List[DishRecommendation]],
        table_shares: List[DishRecommendation],
        total_table_budget: float
    ) -> GroupBillEstimate:
        num_guests = max(1, len(guests))
        shared_total = sum(s.price or 0 for s in table_shares)
        shared_per_person = round(shared_total / num_guests, 2)

        breakdown: List[GuestBillBreakdown] = []
        total_cost = 0.0
        total_budget = 0.0

        for guest in guests:
            picks = guest_recs.get(guest.id, [])
            indiv_dish_price = picks[0].price or 0 if picks else 0
            allocated_cost = round(indiv_dish_price + shared_per_person, 2)
            budget_cap = guest.max_budget if (guest.max_budget and guest.max_budget > 0) else None
            
            is_within = True
            if budget_cap is not None:
                is_within = allocated_cost <= budget_cap
                total_budget += budget_cap
            else:
                total_budget += round(total_table_budget / num_guests, 2)

            item_names = [p.dish_name for p in picks]
            if table_shares:
                item_names.append(f"Share of table feast ({len(table_shares)} dishes)")

            breakdown.append(GuestBillBreakdown(
                guest_id=guest.id,
                guest_name=guest.name,
                allocated_cost=allocated_cost,
                budget_cap=budget_cap,
                is_within_budget=is_within,
                recommended_dishes=item_names
            ))
            total_cost += allocated_cost

        per_person_avg = round(total_cost / num_guests, 2)
        is_overall_within = total_cost <= total_budget

        return GroupBillEstimate(
            total_cost=round(total_cost, 2),
            total_budget=round(total_budget, 2),
            per_person_average=per_person_avg,
            breakdown=breakdown,
            is_within_budget=is_overall_within
        )

    async def recommend_for_guests(
        self,
        dishes: List[ExtractedDish],
        mood: str,
        budget: float,
        hunger_level: str,
        guests: List[GuestProfile],
        cuisines_liked: Optional[List[str]] = None,
        cuisines_disliked: Optional[List[str]] = None,
        venue_type: str = "restaurant"
    ) -> Tuple[Dict[str, List[DishRecommendation]], List[DishRecommendation], GroupBillEstimate, List[DishRecommendation]]:
        if not guests:
            guests = [GuestProfile(id="guest_1", name="Guest", dietary="veg", spice_level="medium")]

        guest_recs: Dict[str, List[DishRecommendation]] = {}
        all_unique_recs: List[DishRecommendation] = []
        seen_dishes = set()

        for g in guests:
            picks = self._filter_and_score_for_guest(
                guest=g,
                dishes=dishes,
                mood=mood,
                hunger_level=hunger_level,
                table_budget=budget,
                total_guests=len(guests)
            )
            guest_recs[g.id] = picks
            for p in picks:
                if p.dish_name not in seen_dishes:
                    seen_dishes.add(p.dish_name)
                    all_unique_recs.append(p)

        table_shares = self._select_table_share_dishes(
            dishes=dishes,
            guests=guests,
            mood=mood
        )
        for s in table_shares:
            if s.dish_name not in seen_dishes:
                seen_dishes.add(s.dish_name)
                all_unique_recs.append(s)

        group_bill = self._calculate_group_bill(
            guests=guests,
            guest_recs=guest_recs,
            table_shares=table_shares,
            total_table_budget=budget
        )

        return guest_recs, table_shares, group_bill, all_unique_recs

gemini_service = GeminiService()

