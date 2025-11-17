import { useEffect, useRef, useState } from "react"

const SAMPLE_SIZE = 96
const DEFAULT_TONE = { topLeft: "dark", bottomLeft: "dark" }

const calculateAverageLuminance = (data, width, region) => {
  const startX = Math.max(0, Math.floor(region.x))
  const startY = Math.max(0, Math.floor(region.y))
  const sampleWidth = Math.min(width - startX, Math.floor(region.width))
  const sampleHeight = Math.max(0, Math.floor(region.height))

  if (sampleWidth === 0 || sampleHeight === 0) return 0

  let total = 0
  let count = 0

  for (let y = startY; y < startY + sampleHeight; y++) {
    for (let x = startX; x < startX + sampleWidth; x++) {
      const index = (y * width + x) * 4
      const r = data[index]
      const g = data[index + 1]
      const b = data[index + 2]
      total += 0.2126 * r + 0.7152 * g + 0.0722 * b
      count += 1
    }
  }

  return count > 0 ? total / count : 0
}

const determineToneFromImage = (imgElement) => {
  const canvas = document.createElement("canvas")
  canvas.width = SAMPLE_SIZE
  canvas.height = SAMPLE_SIZE

  const context = canvas.getContext("2d")
  if (!context) return null

  try {
    context.drawImage(imgElement, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  } catch (err) {
    return null
  }

  let imageData

  try {
    imageData = context.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE)
  } catch (err) {
    return null
  }

  const { data, width } = imageData

  const regions = {
    topLeft: {
      x: 0,
      y: 0,
      width: SAMPLE_SIZE * 0.45,
      height: SAMPLE_SIZE * 0.3,
    },
    bottomLeft: {
      x: 0,
      y: SAMPLE_SIZE * 0.65,
      width: SAMPLE_SIZE * 0.45,
      height: SAMPLE_SIZE * 0.35,
    },
  }

  const threshold = 150

  return Object.fromEntries(
    Object.entries(regions).map(([key, region]) => {
      const luminance = calculateAverageLuminance(data, width, region)
      return [key, luminance > threshold ? "light" : "dark"]
    })
  )
}

export default function PhotoCard({ image, onToneChange }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const imgRef = useRef(null)

  useEffect(() => {
    if (!isLoaded || !imgRef.current) return

    const tones = determineToneFromImage(imgRef.current)
    if (onToneChange) {
      onToneChange(tones || DEFAULT_TONE)
    }
  }, [isLoaded, image?.url, onToneChange])

  useEffect(() => {
    setIsLoaded(false)
  }, [image?.url])

  return (
    <div className="absolute inset-0">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white text-sm uppercase tracking-wide">
          Loading photo…
        </div>
      )}
      <img
        src={image.url}
        crossOrigin="anonymous"
        alt={image.title || "Photo"}
        ref={imgRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  )
}
