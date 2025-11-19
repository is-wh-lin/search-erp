import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const iconSizes = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 180, name: 'apple-touch-icon.png' },
]

const svgPath = join(__dirname, '../public/icons/icon.svg')
const outputDir = join(__dirname, '../public/icons')

async function generateIcons() {
  console.log('Generating PWA icons...')

  for (const { size, name } of iconSizes) {
    try {
      await sharp(svgPath).resize(size, size).png().toFile(join(outputDir, name))
      console.log(`✓ Generated ${name} (${size}x${size})`)
    } catch (error) {
      console.error(`✗ Failed to generate ${name}:`, error.message)
    }
  }

  console.log('Icon generation complete!')
}

generateIcons().catch(console.error)
