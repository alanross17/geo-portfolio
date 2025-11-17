import { useEffect, useState } from "react"

export default function PhotoCard({ image }) {
  const [isLoaded, setIsLoaded] = useState(false)

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
        alt={image.title || "Photo"}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        onLoad={() => setIsLoaded(true)}
      />
    </div>
  )
}
