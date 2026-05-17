#!/bin/bash
# Create placeholder PNG icons using ImageMagick or fallback method

if command -v convert &> /dev/null; then
    echo "Using ImageMagick to generate icons..."
    convert -background none -resize 192x192 icon.svg icon-192.png
    convert -background none -resize 512x512 icon.svg icon-512.png
    convert -background none -resize 180x180 icon.svg apple-touch-icon.png
    echo "Icons generated successfully!"
else
    echo "ImageMagick not found. Please install it or generate icons manually."
    echo "See README.md for instructions."
fi
