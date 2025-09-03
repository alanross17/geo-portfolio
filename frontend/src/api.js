import axios from "axios"

export async function fetchImages() {
  const { data } = await axios.get("/api/images")
  return data
}

export async function submitGuess(image_id, lat, lng) {
  const { data } = await axios.post("/api/guess", {
    image_id,
    guess: { lat, lng }
  })
  return data
}
