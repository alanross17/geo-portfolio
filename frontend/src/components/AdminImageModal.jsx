import { useEffect, useRef } from "react"
import AdminPhotoForm from "./AdminPhotoForm.jsx"

const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"

export default function AdminImageModal({ mode, photo, saving, onSubmit, onClose, returnFocus }) {
  const dialogRef = useRef(null)
  const savingRef = useRef(saving)

  useEffect(() => { savingRef.current = saving }, [saving])

  useEffect(() => {
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    dialog?.querySelector(focusableSelector)?.focus()

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !savingRef.current) {
        event.preventDefault()
        onClose()
      }
      if (event.key !== "Tab" || !dialog) return
      const focusable = [...dialog.querySelectorAll(focusableSelector)]
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      returnFocus?.focus()
    }
  }, [onClose, returnFocus])

  return <div className="fixed inset-0 z-[1000] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8" aria-hidden="false">
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="admin-image-modal-title" className="my-auto w-full max-w-3xl rounded-xl bg-white shadow-2xl">
      <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-xl border-b bg-white px-5 py-4">
        <h2 id="admin-image-modal-title" className="text-xl font-semibold">{mode === "create" ? "Add Image" : "Edit Image"}</h2>
        <button type="button" disabled={saving} onClick={onClose} aria-label="Close dialog" className="rounded-md p-2 text-2xl leading-none text-neutral-500 hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-900 disabled:opacity-40">×</button>
      </header>
      <div className="p-5 sm:p-6">
        <AdminPhotoForm key={photo?.id || "new"} mode={mode} photo={photo} saving={saving} onSubmit={onSubmit} onCancel={onClose} />
      </div>
    </section>
  </div>
}