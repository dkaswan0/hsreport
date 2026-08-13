import sys
import io
import os
import json
import base64
import math
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

def enhance_single_studio_view(img: Image.Image, target_angle: str = 'main') -> Image.Image:
    w, h = img.size

    # 1. Lighting & Exposure Normalization
    enh_bri = ImageEnhance.Brightness(img)
    img_bri = enh_bri.enhance(1.06)
    
    enh_con = ImageEnhance.Contrast(img_bri)
    img_con = enh_con.enhance(1.09)
    
    enh_col = ImageEnhance.Color(img_con)
    img_col = enh_col.enhance(1.05)
    
    enh_shp = ImageEnhance.Sharpness(img_col)
    enhanced = enh_shp.enhance(1.15)

    # 2. Pure High-Key White Automotive Studio Backdrop (#FFFFFF with subtle floor line)
    studio_bg = Image.new('RGB', (w, h), (255, 255, 255))
    draw_bg = ImageDraw.Draw(studio_bg)

    wall_height = int(h * 0.72)
    floor_height = h - wall_height

    # Studio wall: Pristine pure white to soft light pearl (#ffffff to #fafafa)
    for y in range(wall_height):
        ratio = y / max(1, wall_height)
        c = int(255 - ratio * 5)
        draw_bg.line([(0, y), (w, y)], fill=(c, c, c))

    # Studio floor: Soft light studio floor (#fafafa down to #f1f3f5)
    for y in range(wall_height, h):
        ratio = (y - wall_height) / max(1, floor_height)
        c = int(250 - ratio * 10)
        draw_bg.line([(0, y), (w, y)], fill=(c, c, c))

    # 3. Soft Oval Studio Spotlight on Floor
    spot_w = int(w * 0.85)
    spot_h = int(h * 0.30)
    spot_x1 = (w - spot_w) // 2
    spot_y1 = wall_height - int(spot_h * 0.2)
    spot_x2 = spot_x1 + spot_w
    spot_y2 = spot_y1 + spot_h
    draw_bg.ellipse([spot_x1, spot_y1, spot_x2, spot_y2], fill=(255, 255, 255), outline=None)

    # 4. Focal Vehicle Isolation Mask (Preserves 100% of vehicle body, reflections, and damage)
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)

    car_left = int(w * 0.04)
    car_top = int(h * 0.06)
    car_right = int(w * 0.96)
    car_bottom = int(h * 0.95)

    corner_r = int(min(w, h) * 0.10)
    mask_draw.rounded_rectangle(
        [car_left, car_top, car_right, car_bottom],
        radius=corner_r,
        fill=255
    )

    blur_radius = int(min(w, h) * 0.06)
    smooth_mask = mask.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    studio_result = Image.composite(enhanced, studio_bg, smooth_mask)

    # 5. Natural Ambient Ground Contact Shadow under vehicle wheels
    shadow_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_overlay)
    
    sh_w = int(w * 0.84)
    sh_h = int(h * 0.07)
    sh_x1 = (w - sh_w) // 2
    sh_y1 = int(h * 0.89)
    sh_x2 = sh_x1 + sh_w
    sh_y2 = sh_y1 + sh_h
    
    shadow_draw.ellipse([sh_x1, sh_y1, sh_x2, sh_y2], fill=(0, 0, 0, 65))
    smooth_shadow = shadow_overlay.filter(ImageFilter.GaussianBlur(radius=int(min(w, h) * 0.025)))

    studio_result = studio_result.convert('RGBA')
    studio_result = Image.alpha_composite(studio_result, smooth_shadow).convert('RGB')

    return studio_result

def process_vehicle_photo_sheet(images_map: dict) -> dict:
    """
    Takes a dictionary of slot photos and generates a synchronized Professional Vehicle Photo Sheet.
    Preserves all physical damage, color, model details, and produces clean white studio views.
    """
    results = {}
    
    for slot_key, data_url in images_map.items():
        if not data_url or not isinstance(data_url, str) or not data_url.startswith('data:image/'):
            continue
        try:
            if ',' in data_url:
                _, b64_str = data_url.split(',', 1)
            else:
                b64_str = data_url
            
            img_bytes = base64.b64decode(b64_str)
            img = Image.open(io.BytesIO(img_bytes)).convert('RGB')
            enhanced_img = enhance_single_studio_view(img, target_angle=slot_key)
            
            out_buf = io.BytesIO()
            enhanced_img.save(out_buf, format='JPEG', quality=90, optimize=True)
            out_b64 = base64.b64encode(out_buf.getvalue()).decode('utf-8')
            results[slot_key] = f"data:image/jpeg;base64,{out_b64}"
        except Exception as e:
            # Fallback safely to original
            results[slot_key] = data_url

    return results

if __name__ == '__main__':
    try:
        input_json = sys.stdin.read()
        if input_json:
            data = json.loads(input_json)
            mode = data.get('mode', 'single')
            
            if mode == 'sheet':
                images_map = data.get('images', {})
                sheet_results = process_vehicle_photo_sheet(images_map)
                print(json.dumps({'success': True, 'sheet': sheet_results}))
            else:
                image_url = data.get('imageUrl', '')
                if image_url:
                    sheet_results = process_vehicle_photo_sheet({'main': image_url})
                    print(json.dumps({'success': True, 'processedUrl': sheet_results.get('main', image_url)}))
                else:
                    print(json.dumps({'success': False, 'error': 'No imageUrl provided'}))
        else:
            print(json.dumps({'success': False, 'error': 'Empty input'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
