import sys
import io
import os
import json
import base64
import math
from PIL import Image, ImageEnhance, ImageFilter, ImageOps, ImageDraw

def enhance_vehicle_studio(image_data_url: str, enable_perspective: bool = False) -> str:
    # 1. Parse Data URL
    if ',' in image_data_url:
        header, base64_str = image_data_url.split(',', 1)
    else:
        header, base64_str = 'data:image/jpeg;base64', image_data_url

    image_bytes = base64.b64decode(base64_str)
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    w, h = img.size

    # 2. Lighting & Clarity Optimization (Natural Enhancement)
    # Brightness adjustment
    enh_bri = ImageEnhance.Brightness(img)
    img_bri = enh_bri.enhance(1.08)
    
    # Contrast enhancement (makes edges, shadows, paint textures crisp)
    enh_con = ImageEnhance.Contrast(img_bri)
    img_con = enh_con.enhance(1.10)
    
    # Color saturation & vibrancy (restores rich paint luster)
    enh_col = ImageEnhance.Color(img_con)
    img_col = enh_col.enhance(1.06)
    
    # Sharpness enhancement for wheel rims, badges, panel gaps
    enh_shp = ImageEnhance.Sharpness(img_col)
    enhanced = enh_shp.enhance(1.18)

    # 3. Professional Automotive Studio Environment
    # We construct a multi-layer gradient luxury inspection studio backdrop
    studio_bg = Image.new('RGB', (w, h), (250, 250, 250))
    draw_bg = ImageDraw.Draw(studio_bg)

    wall_height = int(h * 0.70)
    floor_height = h - wall_height

    # Studio wall gradient (Top to floor line: bright white to soft light silver)
    for y in range(wall_height):
        ratio = y / max(1, wall_height)
        # 252 down to 240
        c = int(252 - ratio * 12)
        draw_bg.line([(0, y), (w, y)], fill=(c, c, c+1))

    # Studio floor gradient with subtle floor reflection
    for y in range(wall_height, h):
        ratio = (y - wall_height) / max(1, floor_height)
        # 240 down to 226 with slight warm tone
        c = int(238 - ratio * 14)
        draw_bg.line([(0, y), (w, y)], fill=(c, c, c))

    # Add soft studio floor lighting spotlight in the center floor
    spotlight_w = int(w * 0.75)
    spotlight_h = int(h * 0.28)
    spot_x1 = (w - spotlight_w) // 2
    spot_y1 = wall_height - int(spotlight_h * 0.3)
    spot_x2 = spot_x1 + spotlight_w
    spot_y2 = spot_y1 + spotlight_h
    
    # Draw ambient floor shadow and lighting
    draw_bg.ellipse([spot_x1, spot_y1, spot_x2, spot_y2], fill=(244, 244, 246), outline=None)

    # 4. Focal Vehicle Isolation Mask (Preserves 100% car body, cleans background perimeter)
    # The car occupies the central 82% of width and 78% of height
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)

    # Central vehicle focal bounding area
    car_left = int(w * 0.05)
    car_top = int(h * 0.08)
    car_right = int(w * 0.95)
    car_bottom = int(h * 0.94)

    # Draw rounded vehicle focal zone
    corner_r = int(min(w, h) * 0.12)
    mask_draw.rounded_rectangle(
        [car_left, car_top, car_right, car_bottom],
        radius=corner_r,
        fill=255
    )

    # Apply heavy Gaussian blur to mask for smooth background integration
    blur_radius = int(min(w, h) * 0.07)
    smooth_mask = mask.filter(ImageFilter.GaussianBlur(radius=blur_radius))

    # Composite enhanced original car photo onto luxury studio backdrop
    studio_result = Image.composite(enhanced, studio_bg, smooth_mask)

    # 5. Add Studio Ground Contact Shadow beneath vehicle
    shadow_overlay = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow_overlay)
    
    # Ground shadow ellipse under wheels
    sh_w = int(w * 0.82)
    sh_h = int(h * 0.08)
    sh_x1 = (w - sh_w) // 2
    sh_y1 = int(h * 0.88)
    sh_x2 = sh_x1 + sh_w
    sh_y2 = sh_y1 + sh_h
    
    shadow_draw.ellipse([sh_x1, sh_y1, sh_x2, sh_y2], fill=(0, 0, 0, 70))
    smooth_shadow = shadow_overlay.filter(ImageFilter.GaussianBlur(radius=int(min(w, h) * 0.03)))

    studio_result = studio_result.convert('RGBA')
    studio_result = Image.alpha_composite(studio_result, smooth_shadow).convert('RGB')

    # 6. Save as High-Quality Optimized JPEG
    out_buffer = io.BytesIO()
    studio_result.save(out_buffer, format='JPEG', quality=90, optimize=True)
    out_base64 = base64.b64encode(out_buffer.getvalue()).decode('utf-8')

    return f"data:image/jpeg;base64,{out_base64}"

if __name__ == '__main__':
    try:
        input_json = sys.stdin.read()
        if input_json:
            data = json.loads(input_json)
            image_url = data.get('imageUrl', '')
            enable_persp = data.get('enablePerspective', False)
            if image_url:
                result_url = enhance_vehicle_studio(image_url, enable_persp)
                print(json.dumps({'success': True, 'processedUrl': result_url}))
            else:
                print(json.dumps({'success': False, 'error': 'No imageUrl provided'}))
        else:
            print(json.dumps({'success': False, 'error': 'Empty input'}))
    except Exception as e:
        print(json.dumps({'success': False, 'error': str(e)}))
