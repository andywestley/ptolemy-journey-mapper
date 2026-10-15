"""
Generate all favicon, app icon, and Open Graph social preview assets using Pillow.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'public')
IMAGES_DIR = os.path.join(OUTPUT_DIR, 'images')
os.makedirs(IMAGES_DIR, exist_ok=True)

def create_app_icon(size):
    """Draw a high-res Ptolemy journey icon at specified dimension."""
    # Render at 4x for super sampling if size is small
    scale = 4 if size <= 256 else 1
    w = size * scale
    h = size * scale

    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    corner_radius = int(w * 0.22)
    
    # Gradient simulation from #6366f1 to #3730a3
    for y in range(h):
        ratio = y / float(h)
        # Indigo gradient: (99, 102, 241) -> (79, 70, 229) -> (55, 48, 163)
        r = int(99 * (1 - ratio) + 55 * ratio)
        g = int(102 * (1 - ratio) + 48 * ratio)
        b = int(241 * (1 - ratio) + 163 * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Mask with rounded rectangle
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([(0, 0), (w - 1, h - 1)], radius=corner_radius, fill=255)
    img.putalpha(mask)

    draw = ImageDraw.Draw(img)

    # Grid guide lines
    line_y1 = int(h * 0.35)
    line_y2 = int(h * 0.65)
    for x in range(int(w * 0.15), int(w * 0.85), int(w * 0.04)):
        draw.line([(x, line_y1), (x + int(w * 0.02), line_y1)], fill=(255, 255, 255, 45), width=int(w * 0.008))
        draw.line([(x, line_y2), (x + int(w * 0.02), line_y2)], fill=(255, 255, 255, 45), width=int(w * 0.008))

    # Points for journey curve
    p1 = (int(w * 0.24), int(h * 0.68))
    p2 = (int(w * 0.50), int(h * 0.34))
    p3 = (int(w * 0.78), int(h * 0.52))

    # Draw smooth connecting bezier curve
    curve_points = []
    steps = 100
    for i in range(steps + 1):
        t = i / float(steps)
        # Quadratic/cubic composite
        if t <= 0.5:
            local_t = t * 2.0
            x = (1 - local_t)**2 * p1[0] + 2 * (1 - local_t) * local_t * (p1[0] + (p2[0]-p1[0])*0.5) + local_t**2 * p2[0]
            y = (1 - local_t)**2 * p1[1] + 2 * (1 - local_t) * local_t * p1[1] + local_t**2 * p2[1]
        else:
            local_t = (t - 0.5) * 2.0
            x = (1 - local_t)**2 * p2[0] + 2 * (1 - local_t) * local_t * (p2[0] + (p3[0]-p2[0])*0.5) + local_t**2 * p3[0]
            y = (1 - local_t)**2 * p2[1] + 2 * (1 - local_t) * local_t * (p2[1] + (p3[1]-p2[1])*0.3) + local_t**2 * p3[1]
        curve_points.append((x, y))

    stroke_width = max(int(w * 0.05), 2)
    for i in range(len(curve_points) - 1):
        draw.line([curve_points[i], curve_points[i+1]], fill=(255, 255, 255, 240), width=stroke_width)

    # Draw nodes
    r1 = int(w * 0.068)
    r2 = int(w * 0.078)
    r3 = int(w * 0.068)
    border_w = max(int(w * 0.024), 2)

    # Node 1: Cyan
    draw.ellipse([p1[0] - r1, p1[1] - r1, p1[0] + r1, p1[1] + r1], fill=(56, 189, 248, 255), outline=(255, 255, 255, 255), width=border_w)

    # Node 2: Gold (Moment of Truth)
    draw.ellipse([p2[0] - r2, p2[1] - r2, p2[0] + r2, p2[1] + r2], fill=(245, 158, 11, 255), outline=(255, 255, 255, 255), width=border_w)
    inner_r = int(r2 * 0.38)
    draw.ellipse([p2[0] - inner_r, p2[1] - inner_r, p2[0] + inner_r, p2[1] + inner_r], fill=(255, 255, 255, 255))

    # Node 3: Emerald
    draw.ellipse([p3[0] - r3, p3[1] - r3, p3[0] + r3, p3[1] + r3], fill=(16, 185, 129, 255), outline=(255, 255, 255, 255), width=border_w)

    if scale > 1:
        img = img.resize((size, size), Image.Resampling.LANCZOS)
    return img

def create_og_image():
    """Create a 1200x630 Open Graph / Twitter Card social card."""
    w, h = 1200, 630
    img = Image.new('RGB', (w, h), (15, 23, 42)) # Deep slate background #0f172a
    draw = ImageDraw.Draw(img)

    # Gradient subtle glow behind logo
    for r in range(280, 0, -2):
        alpha = int(35 * (1 - r / 280.0))
        glow_box = [150 - r, 315 - r, 150 + r, 315 + r]
        draw.ellipse(glow_box, fill=(79, 70, 229))

    # Paste the high-res 240x240 icon on left
    icon = create_app_icon(220)
    img.paste(icon, (90, 205), icon)

    # Try to load a nice font, fallback to default
    try:
        title_font = ImageFont.truetype("arialbd.ttf", 64)
        subtitle_font = ImageFont.truetype("arial.ttf", 32)
        badge_font = ImageFont.truetype("arialbd.ttf", 22)
        meta_font = ImageFont.truetype("arial.ttf", 24)
    except IOError:
        try:
            title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 64)
            subtitle_font = ImageFont.truetype("DejaVuSans.ttf", 32)
            badge_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 22)
            meta_font = ImageFont.truetype("DejaVuSans.ttf", 24)
        except IOError:
            title_font = ImageFont.load_default()
            subtitle_font = ImageFont.load_default()
            badge_font = ImageFont.load_default()
            meta_font = ImageFont.load_default()

    # Brand Title: Ptolemy
    draw.text((360, 215), "Ptolemy", font=title_font, fill=(248, 250, 252))

    # Tagline
    draw.text((360, 295), "the OpenJourney Editor", font=subtitle_font, fill=(129, 140, 248))

    # Description
    desc_text = "Collaborative, human-centered journey mapping powered\nby the open .ojf standard. Free & open-source."
    draw.text((360, 360), desc_text, font=meta_font, fill=(148, 163, 184), spacing=10)

    # Badges at bottom
    badges = [
        ("OPEN STANDARD (.ojf)", (79, 70, 229), (224, 231, 255)),
        ("UX BLUEPRINTS", (16, 185, 129), (209, 250, 229)),
        ("NO VENDOR LOCK-IN", (245, 158, 11), (254, 243, 199))
    ]
    bx = 360
    by = 465
    for text, bg, fg in badges:
        bbox = draw.textbbox((0, 0), text, font=badge_font)
        bw = (bbox[2] - bbox[0]) + 28
        bh = 40
        draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=8, fill=(30, 41, 59), outline=bg, width=2)
        draw.text((bx + 14, by + 9), text, font=badge_font, fill=fg)
        bx += bw + 16

    # Top right domain badge
    domain = "ptolemy.andrewwestley.co.uk"
    draw.text((900, 60), domain, font=meta_font, fill=(100, 116, 139))

    return img

print("Generating favicon-16x16.png...")
create_app_icon(16).save(os.path.join(OUTPUT_DIR, 'favicon-16x16.png'))

print("Generating favicon-32x32.png...")
ico32 = create_app_icon(32)
ico32.save(os.path.join(OUTPUT_DIR, 'favicon-32x32.png'))

print("Generating apple-touch-icon.png (180x180)...")
create_app_icon(180).save(os.path.join(OUTPUT_DIR, 'apple-touch-icon.png'))

print("Generating android-chrome-192x192.png...")
create_app_icon(192).save(os.path.join(OUTPUT_DIR, 'android-chrome-192x192.png'))

print("Generating android-chrome-512x512.png...")
ico512 = create_app_icon(512)
ico512.save(os.path.join(OUTPUT_DIR, 'android-chrome-512x512.png'))

print("Generating favicon.ico (multi-size)...")
# Save 16, 32, 48 into .ico
ico16 = create_app_icon(16)
ico48 = create_app_icon(48)
ico16.save(
    os.path.join(OUTPUT_DIR, 'favicon.ico'),
    format='ICO',
    sizes=[(16, 16), (32, 32), (48, 48)],
    append_images=[ico32, ico48]
)

print("Generating og-image.png (1200x630)...")
og_img = create_og_image()
og_img.save(os.path.join(IMAGES_DIR, 'og-image.png'), format='PNG', optimize=True)

print("All visual assets successfully generated!")
