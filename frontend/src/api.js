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

export async function fetchAdminAuthStatus() {
  const { data } = await axios.get("/api/admin/auth/status")
  return data
}

export async function adminLogin(password) {
  const { data } = await axios.post("/api/admin/auth/login", { password })
  return data
}

export async function adminLogout() {
  const { data } = await axios.post("/api/admin/auth/logout")
  return data
}

export async function fetchAdminImages() {
  const { data } = await axios.get("/api/admin/images")
  return data
}

export async function createAdminImage({ file, location, title, subtitle, igLink }) {
  const form = new FormData()
  form.append("image", file)
  form.append("lat", location.lat)
  form.append("lng", location.lng)
  form.append("title", title)
  form.append("subtitle", subtitle)
  form.append("igLink", igLink)
  const { data } = await axios.post("/api/admin/images", form)
  return data
}

export async function updateAdminImage(id, fields) {
  const { data } = await axios.patch(`/api/admin/images/${id}`, fields)
  return data
}