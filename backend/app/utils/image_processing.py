import io
import base64
from typing import Tuple
from PIL import Image, ImageEnhance

def preprocess_menu_image(image_bytes: bytes) -> Tuple[bytes, str, str]:
    """
    High-fidelity image pre-processing for restaurant menus:
    - Accepts high-resolution images and converts them to standard RGB JPEG without
      aggressive downscaling that destroys small menu text or table borders.
    - Applies contrast and sharpness enhancement to make faint table lines and
      fine-print text crisp and legible for the vision model.
    - Returns (processed_bytes, mime_type, base64_str).
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            # 1. Standardize color channels
            if img.mode in ("RGBA", "LA", "P"):
                # Composite over white background to avoid transparent black artifacts
                rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                if img.mode == "RGBA":
                    rgb_img.paste(img, mask=img.split()[3])
                else:
                    rgb_img.paste(img.convert("RGB"))
                img = rgb_img
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # 2. Preserve high resolution (do NOT aggressively downscale)
            # Only resize if exceeding 4096px on the longest dimension (Gemini vision safe maximum)
            max_dimension = 4096
            w, h = img.size
            if max(w, h) > max_dimension:
                scale = max_dimension / max(w, h)
                new_size = (int(w * scale), int(h * scale))
                img = img.resize(new_size, Image.Resampling.LANCZOS)

            # 3. Enhance contrast to separate faded text and table borders from menu paper
            contrast_enhancer = ImageEnhance.Contrast(img)
            img = contrast_enhancer.enhance(1.25)

            # 4. Apply subtle sharpening to sharpen fine text details
            sharpness_enhancer = ImageEnhance.Sharpness(img)
            img = sharpness_enhancer.enhance(1.35)

            # 5. Export with high JPEG quality to avoid compression artifacts
            out_buf = io.BytesIO()
            img.save(out_buf, format="JPEG", quality=95, optimize=True)
            processed_bytes = out_buf.getvalue()
            b64_str = base64.b64encode(processed_bytes).decode("utf-8")
            return processed_bytes, "image/jpeg", b64_str

    except Exception as e:
        print(f"[ImagePreprocessing] Preprocessing skipped due to error: {e}. Using raw input.")
        b64_fallback = base64.b64encode(image_bytes).decode("utf-8")
        return image_bytes, "image/jpeg", b64_fallback
