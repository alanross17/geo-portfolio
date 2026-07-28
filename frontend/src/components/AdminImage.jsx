import { useState } from "react"
import { adminImageSources } from "./adminImageSources.js"

export default function AdminImage({ image, variant = "thumb", alt, className = "", loading = "lazy" }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const { webp, jpeg, placeholder } = adminImageSources(image, variant)
  const fallback = jpeg?.url || webp?.url

  if (failed || !fallback) {
    return <div className={`grid place-items-center bg-neutral-200 text-sm text-neutral-500 ${className}`} role="img" aria-label={`${alt} unavailable`}>Image unavailable</div>
  }

  return <div className={`relative overflow-hidden bg-neutral-200 ${className}`}>
    {placeholder && !loaded && <img aria-hidden="true" src={placeholder} alt="" className="absolute inset-0 h-full w-full scale-105 object-cover blur-lg" />}
    <picture>
      {webp && <source type="image/webp" srcSet={webp.url} />}
      {jpeg && <source type="image/jpeg" srcSet={jpeg.url} />}
      <img
        src={fallback}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </picture>
  </div>
}