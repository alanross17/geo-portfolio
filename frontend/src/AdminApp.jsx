import { useCallback, useEffect, useRef, useState } from "react"
import AdminImage from "./components/AdminImage.jsx"
import AdminImageModal from "./components/AdminImageModal.jsx"
import { adminLogin, adminLogout, createAdminImage, fetchAdminAuthStatus, fetchAdminImages, updateAdminImage } from "./api.js"

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(null)
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [photos, setPhotos] = useState([])
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const openerRef = useRef(null)
  const savingRef = useRef(false)

  const loadPhotos = async () => setPhotos(await fetchAdminImages())
  useEffect(() => { fetchAdminAuthStatus().then((data) => setAuthenticated(data.authenticated)).catch(() => setAuthenticated(false)) }, [])
  useEffect(() => { if (authenticated) loadPhotos().catch(() => setError("Unable to load photos.")) }, [authenticated])

  const login = async (event) => {
    event.preventDefault(); setError("")
    try { await adminLogin(password); setPassword(""); setAuthenticated(true) }
    catch (requestError) { setError(requestError.response?.data?.error || "Unable to sign in.") }
  }
  const closeModal = useCallback(() => { if (!savingRef.current) setModal(null) }, [])
  const openModal = (nextModal, opener) => { openerRef.current = opener; setModal(nextModal) }
  const saveCreate = async (values) => {
    savingRef.current = true; setSaving(true)
    try { const photo = await createAdminImage(values); setPhotos((items) => [photo, ...items]); setModal(null) }
    finally { savingRef.current = false; setSaving(false) }
  }
  const saveEdit = async ({ title, subtitle, igLink }) => {
    savingRef.current = true; setSaving(true)
    try {
      const updated = await updateAdminImage(modal.photo.id, { title, subtitle, igLink })
      setPhotos((items) => items.map((item) => item.id === updated.id ? updated : item)); setModal(null)
    } finally { savingRef.current = false; setSaving(false) }
  }
  const logout = async () => { await adminLogout(); setModal(null); setAuthenticated(false) }

  if (authenticated === null) return <main className="min-h-screen grid place-items-center text-neutral-500">Loading…</main>
  if (!authenticated) return <main className="min-h-screen grid place-items-center bg-neutral-100 p-4"><form onSubmit={login} className="w-full max-w-sm rounded-lg bg-white p-6 shadow"><h1 className="text-xl font-bold">Admin sign in</h1><p className="mt-1 text-sm text-neutral-600">Enter the administrator password.</p><input className="mt-4 w-full rounded-md border p-2" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />{error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}<button className="mt-4 w-full rounded-md bg-neutral-900 py-2 text-sm font-semibold text-white">Sign in</button></form></main>
  return <main className="min-h-screen bg-neutral-100 p-4 sm:p-8">
    <div className="mx-auto max-w-7xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold">Photo settings</h1><p className="text-sm text-neutral-600">Add photos and update their descriptive details.</p></div>
        <div className="flex gap-3">
          <button onClick={(event) => openModal({ mode: "create", photo: null }, event.currentTarget)} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2">Add New Image</button>
          <button onClick={logout} className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm hover:bg-neutral-50">Log out</button>
        </div>
      </header>
      {error && <p role="alert" className="mb-5 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {photos.length ? <section aria-label="Existing images" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {photos.map((photo) => <button key={photo.id} onClick={(event) => openModal({ mode: "edit", photo }, event.currentTarget)} className="group overflow-hidden rounded-xl border border-neutral-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-400 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-2">
          <AdminImage image={photo} variant="thumb" alt={photo.title || "Untitled photo"} className="aspect-[4/3] w-full" />
          <span className="block p-4"><span className="block truncate font-semibold">{photo.title || "Untitled photo"}</span>{photo.subtitle && <span className="mt-1 block truncate text-sm text-neutral-600">{photo.subtitle}</span>}</span>
        </button>)}
      </section> : <section className="rounded-xl border-2 border-dashed border-neutral-300 bg-white px-6 py-16 text-center"><h2 className="text-lg font-semibold">No images yet</h2><p className="mt-1 text-sm text-neutral-600">Add your first image to start the portfolio.</p></section>}
    </div>
    {modal && <AdminImageModal mode={modal.mode} photo={modal.photo} saving={saving} onSubmit={modal.mode === "create" ? saveCreate : saveEdit} onClose={closeModal} returnFocus={openerRef.current} />}
  </main>
}