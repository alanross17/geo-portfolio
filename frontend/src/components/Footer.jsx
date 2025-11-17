export default function Footer() {
  return (
    <footer className="fixed bottom-4 left-4 text-xs text-white mix-blend-difference">
      © {new Date().getFullYear()} Alan Ross — All photos ©. <a href="#" className="hover:underline">Exlpore this project on my GitHub.</a>
    </footer>
  )
}
