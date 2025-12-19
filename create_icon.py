from PIL import Image, ImageDraw

def create_icon(size):
    img = Image.new('RGB', (size, size), color=(30, 30, 46)) # Dark background
    d = ImageDraw.Draw(img)
    # Draw a "C" or simple shape
    # Just a light blue square/circle for simplicity
    margin = size // 4
    d.rectangle([margin, margin, size-margin, size-margin], fill=(137, 180, 250))
    
    img.save(f'icon{size}.png')

create_icon(128)
