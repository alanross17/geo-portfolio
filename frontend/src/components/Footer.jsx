export default function Footer({ tone = "dark" }) {
  const textColorClass = tone === "light" ? "text-black" : "text-white"

  return (
    <footer className={`fixed bottom-4 left-4 text-xs ${textColorClass}`}>
      © {new Date().getFullYear()} Alan Ross — All photos ©. <a href="https://github.com/alanross17/geo-portfolio" className="underline underline-offset-2 hover:opacity-80 text-current">Explore this project on my GitHub.</a>
    </footer>
  )
}
