import axios from "axios"

export async function startSession() {
  const { data } = await axios.post("/api/session")
  return data
}

export async function submitSessionGuess(sessionId, lat, lng) {
  const { data } = await axios.post(`/api/session/${sessionId}/guess`, {
    guess: { lat, lng },
  })
  return data
}

export async function fetchLeaderboard() {
  const { data } = await axios.get("/api/leaderboard")
  return data
}

export async function addLeaderboardEntry(sessionId, name) {
  const { data } = await axios.post("/api/leaderboard", { session_id: sessionId, name })
  return data
}