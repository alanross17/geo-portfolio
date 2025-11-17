import { useEffect, useMemo, useState } from "react"
import Header from "./components/Header.jsx"
import PhotoCard from "./components/PhotoCard.jsx"
import GuessPanel from "./components/GuessPanel.jsx"
import ResultOverlay from "./components/ResultOverlay.jsx"
import Footer from "./components/Footer.jsx"
import ScoreSummary from "./components/ScoreSummary.jsx"
import LeaderboardModal from "./components/LeaderboardModal.jsx"
import { addLeaderboardEntry, fetchLeaderboard, startSession, submitSessionGuess } from "./api.js"

const BONUS_POINTS = 500

export default function App() {
  const [session, setSession] = useState(null)
  const [currentImage, setCurrentImage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState(null)
  const [rounds, setRounds] = useState([])
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [hasSubmittedScore, setHasSubmittedScore] = useState(false)

  const hydrateSession = (payload) => {
    setSession({
      id: payload.session_id,
      roundLimit: payload.round_limit,
      roundsPlayed: payload.rounds_played,
      totalScore: payload.total_score,
      bonusTotal: payload.bonus_total,
      finished: payload.finished,
    })
    setCurrentImage(payload.next_image)
  }

  const bootstrap = async () => {
    const payload = await startSession()
    hydrateSession(payload)
    setRounds([])
    setResult(null)
    setSummaryOpen(false)
    setHasSubmittedScore(false)
    setMenuOpen(false)
    setLoading(false)
  }

  useEffect(() => {
    bootstrap()
  }, [])

  const refreshLeaderboard = async () => {
    const data = await fetchLeaderboard()
    setLeaderboard(data)
  }

  useEffect(() => {
    refreshLeaderboard()
  }, [])

  const onGuess = async (latlng) => {
    if (!session) return
    const res = await submitSessionGuess(session.id, latlng.lat, latlng.lng)
    const totals = res.totals
    hydrateSession({
      session_id: session.id,
      round_limit: totals.round_limit,
      rounds_played: totals.rounds_played,
      total_score: totals.total_score,
      bonus_total: totals.bonus_total,
      finished: totals.finished,
      next_image: res.next_image,
    })
    setResult(res.round)
    setRounds((prev) => [...prev, res.round])
    if (totals.finished) {
      setSummaryOpen(true)
      refreshLeaderboard()
    }
  }

  const onNext = () => {
    setResult(null)
    setMenuOpen(false)
    if (session?.finished) {
      setSummaryOpen(true)
      return
    }
  }

  const resetGame = () => {
    bootstrap()
  }

  const addToLeaderboard = async (name) => {
    if (!name || !session?.id) return
    const data = await addLeaderboardEntry(session.id, name)
    setLeaderboard(data)
    setHasSubmittedScore(true)
  }

  const openLeaderboard = () => {
    refreshLeaderboard()
    setLeaderboardOpen(true)
    setMenuOpen(false)
  }

  const closeLeaderboard = () => setLeaderboardOpen(false)

  const totalScore = session?.totalScore || 0
  const bonusTotal = session?.bonusTotal || 0
  const baseScoreTotal = totalScore - bonusTotal
  const bonusRounds = useMemo(
    () => rounds.filter((entry) => (entry?.roundBonus || 0) > 0).length,
    [rounds]
  )
  const placement = useMemo(
    () => leaderboard.filter((row) => row.score > totalScore).length + 1,
    [leaderboard, totalScore]
  )

  if (loading || !session || !currentImage) {
    return <div className="h-full flex items-center justify-center text-gray-400">Loading…</div>
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {currentImage && <PhotoCard image={currentImage} />}
      <Header
        menuOpen={menuOpen}
        onToggleMenu={(next) =>
          setMenuOpen((prev) => (typeof next === "boolean" ? next : !prev))
        }
        onReset={resetGame}
        onOpenLeaderboard={openLeaderboard}
        currentScore={totalScore}
        roundsPlayed={session?.roundsPlayed || 0}
        bonusTotal={bonusTotal}
      />
      <div className="fixed top-4 left-1/2 -translate-x-1/2 text-sm mix-blend-difference">
        Photo {Math.min(session.roundsPlayed + 1, session.roundLimit)} / {session.roundLimit} — Session Score: {totalScore}
      </div>
      <GuessPanel onGuess={onGuess} result={result} />
      <ResultOverlay
        result={result}
        onNext={onNext}
        bonusPoints={BONUS_POINTS}
        bonusRadius={25}
        isFinalRound={session.roundsPlayed >= session.roundLimit}
      />
      <ScoreSummary
        open={summaryOpen}
        totalScore={totalScore}
        baseScore={baseScoreTotal}
        bonusTotal={bonusTotal}
        bonusRounds={bonusRounds}
        roundLimit={session.roundLimit}
        placement={placement}
        onPlayAgain={resetGame}
        onOpenLeaderboard={openLeaderboard}
        onAddToLeaderboard={addToLeaderboard}
        hasSubmitted={hasSubmittedScore}
      />
      <LeaderboardModal
        open={leaderboardOpen}
        onClose={closeLeaderboard}
        placement={placement}
        leaderboard={leaderboard}
        currentScore={totalScore}
      />
      <Footer />
    </div>
  )
}
