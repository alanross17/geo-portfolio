export default function PhotoCard({ image }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-white">
      <img src={image.url} alt={image.title || "Photo"} className="w-full object-cover max-h-[60vh]" />
      {(image.title || image.subtitle) && (
        <div className="px-5 py-4">
          <div className="text-base font-medium">{image.title}</div>
          <div className="text-sm text-gray-500">{image.subtitle}</div>
        </div>
      )}
    </div>
  )
}
