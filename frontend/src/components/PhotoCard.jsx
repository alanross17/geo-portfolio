export default function PhotoCard({ image }) {
  return (
    <img
      src={image.url}
      alt={image.title || "Photo"}
      className="absolute inset-0 w-full h-full object-cover"
    />
  )
}
