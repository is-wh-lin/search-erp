# PWA Icons Setup Guide

## Current Status

✅ Icon source file created: `icon.svg`
✅ PNG icons generated:

- `icon-192.png` (192x192px)
- `icon-512.png` (512x512px)
- `apple-touch-icon.png` (180x180px)

## Regenerating Icons

If you need to regenerate the icons (e.g., after updating `icon.svg`):

### Option 1: Using npm script (Recommended)

```bash
npm run generate-icons
```

### Option 2: Using the shell script

```bash
cd public/icons
./create-icons.sh
```

This requires ImageMagick to be installed:

- macOS: `brew install imagemagick`
- Ubuntu: `sudo apt-get install imagemagick`

### Option 3: Manual generation with sharp

```bash
node scripts/generate-icons.js
```

## Icon Specifications

### Android (Chrome, Edge, Samsung Internet)

- **icon-192.png**: 192x192px, PNG format
- **icon-512.png**: 512x512px, PNG format
- Purpose: `any maskable` (works for both regular and adaptive icons)

### iOS (Safari)

- **apple-touch-icon.png**: 180x180px, PNG format
- Automatically detected by iOS devices
- No transparency (uses white background)

### Desktop (Windows, macOS, Linux)

- Uses the same icons as Android
- Displayed in app launcher, taskbar, etc.

## Customizing the Icon

To create your own icon:

1. Edit `icon.svg` with your design
2. Ensure the design works well at small sizes (192x192)
3. Use a square aspect ratio (1:1)
4. Consider using a solid background color
5. Run `npm run generate-icons` to regenerate PNG files

## Design Guidelines

### Colors

- Primary: `#3b82f6` (Blue 500)
- Background: `#ffffff` (White)
- Use high contrast for visibility

### Safe Area

- Keep important content within the center 80% of the icon
- Avoid placing critical elements near edges
- Consider rounded corners (some platforms apply them automatically)

### Testing

Test your icon on multiple platforms:

- Android Chrome (adaptive icon)
- iOS Safari (rounded square)
- Windows (square with rounded corners)
- macOS (rounded square)

## Troubleshooting

### Icons not updating

1. Clear browser cache
2. Unregister service worker (DevTools → Application → Service Workers)
3. Hard reload (Cmd/Ctrl + Shift + R)

### Icons appear blurry

- Ensure PNG files are at the correct resolution
- Don't upscale smaller images
- Use vector graphics (SVG) as source when possible

### Icons not showing on iOS

- Verify `apple-touch-icon.png` exists in `public/icons/`
- Check that the link tag is in `index.html`
- iOS caches aggressively - try clearing Safari cache

## Resources

- [Web App Manifest Icons](https://web.dev/add-manifest/#icons)
- [Adaptive Icons](https://web.dev/maskable-icon/)
- [Apple Touch Icons](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
