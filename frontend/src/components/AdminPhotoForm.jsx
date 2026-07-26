import { useEffect, useState } from "react"
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import { guessIcon, solutionIcon } from "./mapIcons"

function LocationPicker({ editable, location, onLocationChange }) {
  useMapEvents({
    click(event) {
      if (editable) onLocationChange(event.latlng)
    },
  })
  return location ? <Marker position={[location.lat, location.lng]} icon={editable ? guessIcon : solutionIcon} /> : null
}

function Field({ label, children }) {
  return <label className="block text-sm font-medium text-neutral-700"><span className="mb-1 block">{label}</span>{children}</label>
}

const inputClass = "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-neutral-700"

export default function AdminPhotoForm({ mode, photo, onSubmit, saving }) {
  const isCreate = mode === "create"
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [igLink, setIgLink] = useState("")
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [location, setLocation] = useState(null)
  const [error, setError] = useState("")

  useEffect(() => {
    setTitle(photo?.title || "")
    setSubtitle(photo?.subtitle || "")
    setIgLink(photo?.igLink || "")
    setLocation(photo ? { lat: photo.lat, lng: photo.lng } : null)
    setFile(null)
    setPreviewUrl(photo?.url || "")
    setError("")
  }, [photo, mode])

  useEffect(() => () => { if (previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const chooseFile = (event) => {
    const selected = event.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file.")
      event.target.value = ""
      return
    }
    setError("")
    setFile(selected)
    setPreviewUrl(URL.createObjectURL(selected))
  }

  const submit = async (event) => {
    event.preventDefault()
    if (isCreate && !file) return setError("An image file is required.")
    if (isCreate && !location) return setError("Select the photo location on the map.")
    setError("")
    try {
      await onSubmit({ title, subtitle, igLink, file, location })
      if (isCreate) {
        setTitle(""); setSubtitle(""); setIgLink(""); setFile(null); setPreviewUrl(""); setLocation(null)
      }
    } catch (requestError) {
      setError(requestError.response?.data?.error || "Unable to save the photo.")
    }
  }

  return <form onSubmit={submit} className="space-y-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Title (optional)"><input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Subtitle (optional)"><input className={inputClass} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></Field>
    </div>
    <Field label="Instagram link (optional)"><input className={inputClass} type="url" placeholder="https://www.instagram.com/..." value={igLink} onChange={(e) => setIgLink(e.target.value)} /></Field>
    {isCreate && <Field label="Image"><input className="block w-full text-sm" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={chooseFile} /></Field>}
    {previewUrl && <img src={previewUrl} alt="Photo preview" className="max-h-64 w-full rounded-md object-contain bg-neutral-100" />}
    <div>
      <p className="mb-1 text-sm font-medium text-neutral-700">Location {isCreate ? "(required)" : ""}</p>
      <div className="h-64 overflow-hidden rounded-md border border-neutral-300">
        <MapContainer center={location ? [location.lat, location.lng] : [20, 0]} zoom={location ? 8 : 2} className="h-full w-full" worldCopyJump>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocationPicker editable={isCreate} location={location} onLocationChange={setLocation} />
        </MapContainer>
      </div>
      <p className="mt-1 text-xs text-neutral-500">{location ? `${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}` : "Click the map to select the photo location."}{!isCreate && " Location is read-only."}</p>
    </div>
    {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <button disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:bg-neutral-400">{saving ? "Saving…" : isCreate ? "Add photo" : "Save changes"}</button>
  </form>
}