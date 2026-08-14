import sys
import io
import os
import json
import base64
import math
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

def load_image_from_source(src: str) -> Image.Image:
    """Loads a PIL image from Data URL, local file path, or URL"""
    if not src or not isinstance(src, str):
        raise ValueError("Invalid image source")
        
    src = src.strip()
    if src.startswith('data:image/'):
        if ',' in src:
            _, b64_str = src.split(',', 1)
        else:
            b64_str = src
        img_bytes = base64.b64decode(b64_str)
        return Image.open(io.BytesIO(img_bytes)).convert('RGB')
    
    potential_paths = [
        src,
        os.path.join(os.getcwd(), src.lstrip('/\\')),
        os.path.join(os.getcwd(), 'public', src.lstrip('/\\')),
        os.path.join(os.getcwd(), 'client', 'public', src.lstrip('/\\')),
    ]
    for p in potential_paths:
        if os.path.exists(p) and os.path.isfile(p):
            return Image.open(p).convert('RGB')

    try:
        img_bytes = base64.b64decode(src)
        return Image.open(io.BytesIO(img_bytes)).convert('RGB')
    except Exception:
        pass

    raise ValueError(f"Could not load image from source: {src[:50]}...")

def enhance_single_studio_view(img: Image.Image, target_angle: str = 'main') -> Image.Image:
    # Resize if extremely large to maintain sub-second speed
    max_dim = 1600
    w, h = img.size
    if w > max_dim or h > max_dim:
        if w > h:
            new_w = max_dim
            new_h = int(h * max_dim / w)
        else:
            new_h = max_dim
            new_w = int(w * max_dim / h)
        img = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        w, h = img.size

    # 1. Lighting & Exposure Normalization
    enh_bri = ImageEnhance.Brightness(img)
    img_bri = enh_bri.enhance(1.07)
    
    enh_con = ImageEnhance.Contrast(img_bri)
    img_con = enh_con.enhance(1.12)
    
    enh_col = ImageEnhance.Color(img_con)
    img_col = enh_col.enhance(1.06)
    
    enh_shp = ImageEnhance.Sharpness(img_col)
    enhanced = enh_shp.enhance(1.20)

    # 2. Pure High-Key White Automotive Studio Backdrop (#FFFFFF with subtle floor line)
    studio_bg = Image.new('RGB', (w, h), (255, 255, 255))
    draw_bg = ImageDraw.Draw(studio_bg)

    wall_height = int(h * 0.70)
    floor_height = h - wall_height

    # Studio wall: Pristine pure white (#ffffff to #fbfbfb)
    for y in range(wall_height):
        ratio = y / max(1, wall_height)
        c = int(255 - ratio * 4)
        draw_bg.line([(0, y), (w, y)], fill=(c, c, c))

    # Studio floor: Soft light studio floor (#fbfbfb down to #f2f3f5)
    for y in range(wall_height, h):
        ratio = (y - wall_height) / max(1, floor_height)
        c = int(251 - ratio * 9)
        draw_bg.line([(0, y), (w, y)], fill=(c, c, c))

    # Soft Oval Studio Spotlight on Floor
    spot_w = int(w * 0.88)
    spot_h = int(h * 0.32)
    spot_x1 = (w - spot_w) // 2
    spot_y1 = wall_height - int(spot_h * 0.25)
    spot_x2 = spot_x1 + spot_w
    spot_y2 = spot_y1 + spot_h
    draw_bg.ellipse([spot_x1, spot_y1, spot_x2, spot_y2], fill=(255, 255, 255), outline=None)

    # 3. Vehicle Focus Isolation Mask (Replaces noisy top/side background with pure studio white)
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)

    car_left = int(w * 0.08)
    car_top = int(h * 0.12)
    car_right = int(w * 0.92)
    car_bottom = int(h * 0.93)

    corner_r = int(min(w, h) * 0.12)
    mask_draw.rounded_rectangle(
        [car_left, car_top, car_right, car_bottom],
        radius=corner_r,
        fill=255
    )

    blur_radius = int(min(w, h) * 0.07)
    smooth_mask = mask.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    studio_result = Image.composite(enhanced, studio_bg, smooth_mask)

    # 4. Natural Ambient Ground Contact Shadow under vehicle wheels
    shadow_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_overlay)
    
    sh_w = int(w * 0.80)
    sh_h = int(h * 0.08)
    sh_x1 = (w - sh_w) // 2
    sh_y1 = int(h * 0.86)
    sh_x2 = sh_x1 + sh_w
    sh_y2 = sh_y1 + sh_h
    
    shadow_draw.ellipse([sh_x1, sh_y1, sh_x2, sh_y2], fill=(0, 0, 0, 80))
    smooth_shadow = shadow_overlay.filter(ImageFilter.GaussianBlur(radius=int(min(w, h) * 0.03)))

    studio_result = studio_result.convert('RGBA')
    studio_result = Image.alpha_composite(studio_result, smooth_shadow).convert('RGB')

    return studio_result

def process_images_dict(images_map: dict) -> dict:
    results = {}
    for slot_key, src in images_map.items():
        if not src:
            continue
        try:
            img = load_image_from_source(src)
            enhanced = enhance_single_studio_view(img, target_angle=slot_key)
            out_buf = io.BytesIO()
            enhanced.save(out_buf, format='JPEG', quality=88, optimize=True)
            out_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')
            results[slot_key] = f"data:image/jpeg;base64,{out_b64}"
        except Exception as e:
            print(f"Error processing {slot_key}: {e}", file=sys.stderr)
            results[slot_key] = src
    return results

def main():
    if len(sys.argv) >= 3:
        input_file = sys.argv[1]
        output_file = sys.argv[2]
        with open(input_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    else:
        raw_input = sys.stdin.read()
        if not raw_input:
            print(json.dumps({'success': False, 'error': 'No input provided'}))
            return
        data = json.loads(raw_input)
        output_file = None

    mode = data.get('mode', 'single')
    out_data = {'success': True}

    if mode == 'sheet':
        images_map = data.get('images', {})
        out_data['sheet'] = process_images_dict(images_map)
    else:
        image_url = data.get('imageUrl', '')
        if image_url:
            res_dict = process_images_dict({'main': image_url})
            out_data['processedUrl'] = res_dict.get('main', image_url)
        else:
            out_data['success'] = False
            out_data['error'] = 'No imageUrl provided'

    if output_file:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(out_data, f)
        print("OK")
    else:
        print(json.dumps(out_data))

if __name__ == '__main__':
    main()
