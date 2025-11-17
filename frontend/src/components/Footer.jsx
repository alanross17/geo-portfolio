export default function Footer({ tone = "dark" }) {
  const textColorClass = tone === "light" ? "text-black" : "text-white"

  return (
    <footer className={`fixed bottom-4 left-4 text-xs ${textColorClass}`}>
      © {new Date().getFullYear()} Alan Ross — All photos ©. <a href="#" className="underline-offset-2 hover:underline">Explore this project on my GitHub.</a>
    </footer>
  )
}
