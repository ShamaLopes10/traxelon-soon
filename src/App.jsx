import { useState, useEffect } from "react"
import ComingSoonPage from "./pages/ComingSoonPage"
import AdminPage from "./pages/AdminPage"

function App() {
  const [page, setPage] = useState(
    window.location.hash === "#admin" ? "admin" : "coming-soon"
  )

  useEffect(() => {
    const handleHash = () => {
      setPage(window.location.hash === "#admin" ? "admin" : "coming-soon")
    }
    window.addEventListener("hashchange", handleHash)
    return () => window.removeEventListener("hashchange", handleHash)
  }, [])

  return page === "admin" ? <AdminPage /> : <ComingSoonPage />
}

export default App
