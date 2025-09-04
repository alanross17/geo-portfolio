import { useState, useEffect } from "react"

export default function Header({ imageUrl }) {
  const [color, setColor] = useState("#fff")

  useEffect(() => {
    if (!imageUrl) return

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = imageUrl
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b
      setColor(brightness > 186 ? "#000" : "#fff")
    }
  }, [imageUrl])

  return (
    <>
      <div
        className="fixed top-4 left-4 text-xl font-semibold"
        style={{ color }}
      >
        Alan Ross — Photography
      </div>
      <nav
        className="fixed top-4 right-4 text-sm"
        style={{ color }}
      >
        <a href="#" className="hover:underline">Portfolio Guess</a>
      </nav>
    </>
  )
}
