import sharp from 'sharp'

interface ProcessedImage {
  fullBuffer: Buffer
  thumbBuffer: Buffer
}

export async function processImage(
  buffer: Buffer,
  type: 'product' | 'avatar' | 'cover' | 'logo'
): Promise<ProcessedImage> {
  const sizes = {
    product: { full: 1200, thumb: 200 },
    avatar:  { full: 400,  thumb: 80  },
    cover:   { full: 1200, thumb: 400 },
    logo:    { full: 400,  thumb: 80  },
  }
  const { full, thumb } = sizes[type]
  const [fullBuffer, thumbBuffer] = await Promise.all([
    sharp(buffer).resize(full, null, { withoutEnlargement: true }).webp({ quality: 85 }).toBuffer(),
    sharp(buffer).resize(thumb, thumb, { fit: 'cover' }).webp({ quality: 75 }).toBuffer(),
  ])
  return { fullBuffer, thumbBuffer }
}
