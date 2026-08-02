import { useEffect, useRef, useState } from "react"
import { buildSrcSet, getFallbackUrl, getImageIdentity } from "./responsiveImage.js"

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

// The photograph fills the viewport at every breakpoint, so 100vw describes its
// rendered width rather than merely defaulting to the viewport width.
export const GAME_IMAGE_SIZES = "100vw"

function GameImage({ image, onToneChange }) {
  const [loadStatus, setLoadStatus] = useState("loading")
  const imgRef = useRef(null)

  const identity = getImageIdentity(image)
  const webpSrcSet = buildSrcSet(image?.sources?.webp)
  const jpegSrcSet = buildSrcSet(image?.sources?.jpeg)
  const fallbackUrl = getFallbackUrl(image)

  const isLoaded = loadStatus === "loaded"
  const hasError = loadStatus === "error"

  useEffect(() => {
    if (!isLoaded || !imgRef.current) return

    const tones = determineToneFromImage(imgRef.current)
    if (onToneChange) {
      onToneChange(tones || DEFAULT_TONE)
    }
  }, [isLoaded, identity, onToneChange])

  useEffect(() => {
    setLoadStatus("loading")

    const img = imgRef.current

    // Handles images that were already loaded from browser cache before
    // React's onLoad callback was attached.
    if (img?.complete) {
      if (img.naturalWidth > 0) {
        setLoadStatus("loaded")
      } else {
        setLoadStatus("error")
      }
    }
  }, [identity])

  const handleLoad = (event) => {
    if (event.currentTarget === imgRef.current) {
      setLoadStatus("loaded")
    }
  }

  const handleError = (event) => {
    if (event.currentTarget === imgRef.current) {
      setLoadStatus("error")
    }
  }

  return (
    <div
      className={[
        "game-photo absolute inset-0 bg-gray-900",
        isLoaded ? "game-photo--loaded" : "",
        hasError ? "game-photo--error" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div 
        className="game-photo__loading-layer"
        aria-hidden={isLoaded || hasError}
      >
        {image?.placeholder && (
          <img 
            src={image.placeholder}
            alt=""
            aria-hidden="true"
            className="game-photo__placeholder"
          />
        )}

        <div
          className="game-photo__loading-text"
          role="status"
          aria-live="polite"
        >
          Loading photo…
        </div>
      </div>

      <picture>
        {webpSrcSet && <source type="image/webp" srcSet={webpSrcSet} sizes={GAME_IMAGE_SIZES} />}
        {jpegSrcSet && <source type="image/jpeg" srcSet={jpegSrcSet} sizes={GAME_IMAGE_SIZES} />}
        <img
          src={fallbackUrl}
          sizes={webpSrcSet || jpegSrcSet ? GAME_IMAGE_SIZES : undefined}
          crossOrigin="anonymous"
          alt="Location to identify"
          ref={imgRef}
          className="game-photo__image"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
        />
      </picture>

      {hasError && (
        <div
          className="game-photo__error"
          role="alert"
        >
          <p>Unable to load this photo.</p>
          <p className="text-sm opacity-75">Please try again or continue to another image.</p>
        </div>
      )}

    </div>
  )
}

export default function PhotoCard({ image, onToneChange }) {
  return <GameImage key={getImageIdentity(image)} image={image} onToneChange={onToneChange} />
}
