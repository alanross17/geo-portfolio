import { useEffect, useState } from "react"
import Header from "./components/Header.jsx"
import PhotoCard from "./components/PhotoCard.jsx"
import GuessPanel from "./components/GuessPanel.jsx"
import ResultOverlay from "./components/ResultOverlay.jsx"
import Footer from "./components/Footer.jsx"
import { fetchImages, submitGuess } from "./api.js"

export default function App() {
  const [images, setImages] = useState([])
  const [idx, setIdx] = useState(0)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [sessionScore, setSessionScore] = useState(0)

  useEffect(() => {
    (async () => {
      const list = await fetchImages()
      // keep it fun: randomize order each session
      setImages(list.sort(()=>Math.random() - 0.5))
      setLoading(false)
    })()
  }, [])

  const current = images[idx]

  const onGuess = async (latlng) => {
    const res = await submitGuess(current.id, latlng.lat, latlng.lng)
    setResult(res)
    setSessionScore(prev => prev + res.score)
  }

  const onNext = () => {
    setResult(null)
    setIdx(prev => (prev + 1) % images.length)
  }

  if (loading) {
    return <div className="h-full flex items-center justify-center text-gray-400">Loading…</div>
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {current && <PhotoCard image={current} />}
      <Header imageUrl={current?.url} />
      <div className="fixed top-4 left-1/2 -translate-x-1/2 text-sm mix-blend-difference">
        Photo {idx+1} / {images.length} — Session Score: {sessionScore}
      </div>
      <GuessPanel onGuess={onGuess} />
      <ResultOverlay result={result} onNext={onNext} />
      <Footer />
    </div>
  )
}
