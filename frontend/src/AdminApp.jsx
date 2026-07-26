import { useEffect, useState } from "react"
import AdminPhotoForm from "./components/AdminPhotoForm.jsx"
import { adminLogin, adminLogout, createAdminImage, fetchAdminAuthStatus, fetchAdminImages, updateAdminImage } from "./api.js"

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [photos, setPhotos] = useState([])
  const [selected, setSelected] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadPhotos = async () => setPhotos(await fetchAdminImages())
  useEffect(() => { fetchAdminAuthStatus().then((data) => setAuthenticated(data.authenticated)).catch(() => setAuthenticated(false)) }, [])
  useEffect(() => { if (authenticated) loadPhotos().catch(() => setError("Unable to load photos.")) }, [authenticated])

  const login = async (event) => {
    event.preventDefault(); setError("")
    try { await adminLogin(password); setPassword(""); setAuthenticated(true) }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to sign in.") }
  }
  const saveCreate = async (values) => { setSaving(true); try { const photo = await createAdminImage(values); setPhotos((items) => [photo, ...items]) } finally { setSaving(false) } }
  const saveEdit = async ({ title, subtitle, igLink }) => { setSaving(true); try { const updated = await updateAdminImage(selected.id, { title, subtitle, igLink }); setPhotos((items) => items.map((item) => item.id === updated.id ? updated : item)); setSelected(updated) } finally { setSaving(false) } }
  const logout = async () => { await adminLogout(); setSelected(null); setAuthenticated(false) }

  if (authenticated === null) return <main className="min-h-screen grid place-items-center text-neutral-500">Loading…</main>
  if (!authenticated) return <main className="min-h-screen grid place-items-center bg-neutral-100 p-4"><form onSubmit={login} className="w-full max-w-sm rounded-lg bg-white p-6 shadow"><h1 className="text-xl font-bold">Admin sign in</h1><p className="mt-1 text-sm text-neutral-600">Enter the administrator password.</p><input className="mt-4 w-full rounded-md border p-2" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button className="mt-4 w-full rounded-md bg-neutral-900 py-2 text-sm font-semibold text-white">Sign in</button></form></main>
  return <main className="min-h-screen bg-neutral-100 p-4 sm:p-8"><div className="mx-auto max-w-6xl"><header className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold">Photo settings</h1><p className="text-sm text-neutral-600">Add photos and update their descriptive details.</p></div><button onClick={logout} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm">Log out</button></header><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]"><section className="rounded-lg bg-white p-5 shadow"><h2 className="mb-4 text-lg font-semibold">{selected ? "Edit photo" : "Add photo"}</h2><AdminPhotoForm key={selected?.id || "new"} mode={selected ? "edit" : "create"} photo={selected} saving={saving} onSubmit={selected ? saveEdit : saveCreate} />{selected && <button className="mt-4 text-sm underline" onClick={() => setSelected(null)}>Add a different photo</button>}</section><aside className="rounded-lg bg-white p-5 shadow"><h2 className="mb-4 text-lg font-semibold">Existing photos</h2><div className="grid grid-cols-2 gap-3 lg:grid-cols-1">{photos.map((photo) => <button key={photo.id} onClick={() => setSelected(photo)} className={`overflow-hidden rounded-md border text-left ${selected?.id === photo.id ? "border-neutral-900" : "border-neutral-200"}`}><img className="h-28 w-full object-cover" src={photo.url} alt={photo.title || "Photo"} /><span className="block truncate p-2 text-sm">{photo.title || "Untitled photo"}</span></button>)}</div></aside></div></div></main>
}