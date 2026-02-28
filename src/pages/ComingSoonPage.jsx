import { useState, useEffect } from "react"
import { collection, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore"
import { db } from "../firebase"

// ── Send icon ──
const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

// ── Countdown unit ──
function CountUnit({ value, label }) {
  return (
    <div className="count-unit">
      <div className="count-box">
        <div className="count-num">{String(value).padStart(2, "0")}</div>
        <div className="count-label">{label}</div>
      </div>
    </div>
  )
}

// ── useCountdown hook ──
function useCountdown(targetDate) {
  const calc = () => {
    const diff = new Date(targetDate) - new Date()
    if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0 }
    return {
      d: Math.floor(diff / 86400000),
      h: Math.floor((diff % 86400000) / 3600000),
      m: Math.floor((diff % 3600000) / 60000),
      s: Math.floor((diff % 60000) / 1000),
    }
  }
  const [time, setTime] = useState(calc)
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(id)
  }, [targetDate])
  return time
}

export default function ComingSoonPage() {
  const [email, setEmail]     = useState("")
  const [status, setStatus]   = useState("idle") // idle | loading | success | error | duplicate
  const [errorMsg, setErrorMsg] = useState("")

  const { d, h, m, s } = useCountdown("2026-06-01T00:00:00")

  const handleSubmit = async () => {
    const trimmed = email.trim().toLowerCase()

    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error")
      setErrorMsg("Please enter a valid email address.")
      return
    }

    setStatus("loading")

    try {
      // Duplicate check
      const q    = query(collection(db, "waitlist"), where("email", "==", trimmed))
      const snap = await getDocs(q)
      if (!snap.empty) {
        setStatus("duplicate")
        return
      }

      // Save
      await addDoc(collection(db, "waitlist"), {
        email:     trimmed,
        createdAt: serverTimestamp(),
        source:    "coming-soon-page",
      })

      setStatus("success")
      setEmail("")
    } catch (err) {
      console.error(err)
      setStatus("error")
      setErrorMsg("Something went wrong. Please try again.")
    }
  }

  const features = [
    { icon: "🔗", label: "Covert Link Tracking" },
    { icon: "📍", label: "Live Geolocation" },
    { icon: "📱", label: "Device Intelligence" },
    { icon: "⚡", label: "Real-Time Logs" },
  ]

  return (
    <>
      {/* Background effects */}
      <div className="stars" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="scan-line" />

      {/* ── NAV ── */}
      <nav>
        <a className="logo" href="#">
          <svg className="logo-icon" viewBox="0 0 32 32" fill="none">
            <path d="M16 2L4 8v8c0 7 5.5 13 12 14 6.5-1 12-7 12-14V8L16 2z"
              stroke="#00d4ff" strokeWidth="1.5" fill="rgba(0,212,255,0.08)"/>
            <path d="M11 16l3 3 7-7" stroke="#00d4ff" strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="logo-text">TRAX<span>ELON</span></span>
        </a>
        {/* <div className="nav-links">
          <a href="#">Home</a>
          <a href="#">About Us</a>
          <a href="#">Contact</a>
        </div> */}
      </nav>

      {/* ── MAIN ── */}
      <main>

        {/* Badge */}
        <div className="badge">
          <span className="badge-dot" />
          Law Enforcement Intelligence Tool
        </div>

        {/* Headline */}
        <h1 className="headline">
          <span className="line1">Track.</span>
          <span className="line2">Capture.</span>
          <span className="line3">Close.</span>
        </h1>

        {/* Subtext */}
        <p className="subtext">
          Something powerful is launching soon. Traxelon gives law enforcement officers
          a covert link-based tracking system — built for precision, built for results.
        </p>

        {/* Countdown */}
        <div className="countdown-label">Launching In</div>
        <div className="countdown">
          <CountUnit value={d} label="Days" />
          <div className="count-sep">:</div>
          <CountUnit value={h} label="Hours" />
          <div className="count-sep">:</div>
          <CountUnit value={m} label="Minutes" />
          <div className="count-sep">:</div>
          <CountUnit value={s} label="Seconds" />
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* ── EMAIL FORM or SUCCESS ── */}
        {status === "success" ? (
          <div className="success-card">
            <div className="success-icon">✓</div>
            <div className="success-title">You're on the list</div>
            <div className="success-sub">We'll notify you the moment Traxelon goes live.</div>
          </div>
        ) : (
          <div className="form-wrap">
            <div className="form-title">Get Early Access</div>
            <div className="form-row">
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setStatus("idle") }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                disabled={status === "loading"}
              />
              <button onClick={handleSubmit} disabled={status === "loading"}>
                <SendIcon />
                {status === "loading" ? "Submitting…" : "Notify Me"}
              </button>
            </div>

            {status === "error" && (
              <div className="status-msg error">✕ {errorMsg}</div>
            )}
            {status === "duplicate" && (
              <div className="status-msg duplicate">
                ⚡ Already on the list! We'll notify you at launch.
              </div>
            )}

            <p className="form-note">🔒 No spam. Early access alerts only.</p>
          </div>
        )}

        {/* Features strip */}
        <div className="features">
          {features.map(f => (
            <div className="feat-item" key={f.label}>
              <span className="feat-icon">{f.icon}</span>
              <div className="feat-label">{f.label}</div>
            </div>
          ))}
        </div>

      </main>

      {/* ── FOOTER ── */}
      <footer>
        <span>© 2026 TRAXELON. ALL RIGHTS RESERVED.</span>
        <button
          className="footer-admin"
          onClick={() => { window.location.hash = "#admin" }}
        >
          Admin
        </button>
      </footer>
    </>
  )
}
