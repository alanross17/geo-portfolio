import { useEffect, useMemo, useState } from "react"
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
    <div className="min-h-full flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">Photo {idx+1} / {images.length}</div>
            <div className="text-sm text-gray-900 font-medium">Session Score: {sessionScore}</div>
          </div>

          {current && <PhotoCard image={current} />}

          <GuessPanel onGuess={onGuess} />
        </div>
      </main>
      <Footer />
      <ResultOverlay result={result} onNext={onNext} />
    </div>
  )
}
