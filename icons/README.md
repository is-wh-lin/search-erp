# PWA Icons

## Generating Icons

To generate PNG icons from the SVG source, you can use one of these methods:

### Method 1: Using ImageMagick (Recommended)

```bash
# Install ImageMagick if not already installed
# macOS: brew install imagemagick
# Ubuntu: sudo apt-get install imagemagick

# Generate icons
convert -background none -resize 192x192 icon.svg icon-192.png
convert -background none -resize 512x512 icon.svg icon-512.png
convert -background none -resize 180x180 icon.svg apple-touch-icon.png
```

### Method 2: Using Online Tools

1. Visit https://realfavicongenerator.net/
2. Upload the icon.svg file
3. Download the generated icons
4. Place them in this directory

### Method 3: Using Node.js (sharp)

```bash
npm install -D sharp sharp-cli
npx sharp -i icon.svg -o icon-192.png resize 192 192
npx sharp -i icon.svg -o icon-512.png resize 512 512
```

## Required Icons

- `icon-192.png` - 192x192px (Android)
- `icon-512.png` - 512x512px (Android)
- `apple-touch-icon.png` - 180x180px (iOS)

## Current Status

The `icon.svg` file is the source icon. PNG files need to be generated using one of the methods above.
