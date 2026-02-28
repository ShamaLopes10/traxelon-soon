import { useState, useEffect } from "react"
import {
  collection, getDocs, orderBy, query,
  deleteDoc, doc, updateDoc
} from "firebase/firestore"
import { db } from "../firebase"
import emailjs from "@emailjs/browser"

// ─────────────────────────────────────────────────────────
// 🔴 CONFIGURE THESE — from emailjs.com
// ─────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID  = "service_zwfuv1o"   // ← your Service ID
const EMAILJS_TEMPLATE_ID = "template_p2j5iib"  // ← your Template ID
const EMAILJS_PUBLIC_KEY  = "h4qAw20hu0qMSU0Qh"

// Admin password
const ADMIN_PASSWORD = "traxelon-admin-2026"

// ── Icons ──────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const RefreshIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)
const SendIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const LoginIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
    <polyline points="10 17 15 12 10 7"/>
    <line x1="15" y1="12" x2="3" y2="12"/>
  </svg>
)
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const Spinner = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ animation: "spinIcon 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
)

// ── Helpers ─────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "—"
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
}

// ══════════════════════════════════════════════════════
// PASSWORD GATE
// ══════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [password, setPassword] = useState("")
  const [error, setError]       = useState(false)

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) { onLogin() }
    else { setError(true) }
  }

  return (
    <>
      <div className="stars" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="admin-auth-page">
        <div className="admin-card">
          <div className="admin-card-top">
            <div className="admin-logo-text">TRAX<span>ELON</span></div>
            <div className="admin-heading">Admin Panel</div>
            <div className="admin-sub">Enter your password to manage the waitlist.</div>
          </div>
          <div className="admin-card-body">
            {error && <div className="admin-error">✕ Incorrect password. Try again.</div>}
            <div className="admin-field">
              <label>Admin Password</label>
              <input
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false) }}
                onKeyDown={e => e.key === "Enter" && handleLogin()}
                autoFocus
              />
            </div>
            <button className="admin-btn" onClick={handleLogin}>
              <LoginIcon /> Access Dashboard
            </button>
            <p style={{ textAlign: "center", marginTop: 20, fontSize: 12,
              color: "rgba(232,244,255,0.2)", cursor: "pointer", letterSpacing: 1 }}
              onClick={() => { window.location.hash = "" }}>
              ← Back to Coming Soon
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════
// NOTIFY MODAL
// ══════════════════════════════════════════════════════
function NotifyModal({ emails, onClose, onSent }) {
  const [sending, setSending]   = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone]         = useState(false)
  const [failed, setFailed]     = useState([])

  const handleSend = async () => {
    setSending(true)
    const fails = []
    for (let i = 0; i < emails.length; i++) {
      const entry = emails[i]
      try {
        await emailjs.send(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          { to_email: entry.email, to_name: entry.email.split("@")[0] },
          EMAILJS_PUBLIC_KEY
        )
        await updateDoc(doc(db, "waitlist", entry.id), {
          notified: true, notifiedAt: new Date(),
        })
      } catch (err) {
        console.error("Failed:", entry.email, err)
        fails.push(entry.email)
      }
      setProgress(i + 1)
    }
    setFailed(fails)
    setSending(false)
    setDone(true)
    onSent()
  }

  return (
    <div className="modal-overlay" onClick={!sending ? onClose : undefined}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>

        <div className="modal-header">
          <div>
            <div className="modal-title">
              {done ? "✓ Emails Sent" : "Confirm Notification"}
            </div>
            <div className="modal-sub">
              {done
                ? `${emails.length - failed.length} sent${failed.length ? `, ${failed.length} failed` : " successfully"}`
                : `Notify ${emails.length} subscriber${emails.length !== 1 ? "s" : ""} via EmailJS`}
            </div>
          </div>
          {!sending && (
            <button className="modal-close" onClick={onClose}>✕</button>
          )}
        </div>

        <div className="modal-body">
          {/* Preview list */}
          {!done && (
            <div className="modal-email-list">
              {emails.slice(0, 6).map(e => (
                <div className="modal-email-row" key={e.id}>
                  <span className="email-dot" />
                  {e.email}
                </div>
              ))}
              {emails.length > 6 && (
                <div className="modal-email-row"
                  style={{ color: "rgba(232,244,255,0.3)", fontSize: 12 }}>
                  + {emails.length - 6} more...
                </div>
              )}
            </div>
          )}

          {/* Progress */}
          {sending && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between",
                fontSize: 12, color: "rgba(232,244,255,0.4)", marginBottom: 8 }}>
                <span>Sending emails...</span>
                <span>{progress} / {emails.length}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill"
                  style={{ width: `${(progress / emails.length) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Failed list */}
          {done && failed.length > 0 && (
            <div className="modal-failed">
              <div style={{ fontSize: 11, color: "#ff5c7a", letterSpacing: 1,
                textTransform: "uppercase", marginBottom: 8 }}>
                Failed to send:
              </div>
              {failed.map(e => (
                <div key={e} style={{ fontSize: 13, color: "rgba(232,244,255,0.5)", padding: "3px 0" }}>
                  {e}
                </div>
              ))}
            </div>
          )}

          {/* All success */}
          {done && failed.length === 0 && (
            <div style={{ textAlign: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>🚀</div>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 20, fontWeight: 700, color: "var(--cyan)",
                letterSpacing: 1, textTransform: "uppercase" }}>
                All emails delivered!
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!done ? (
            <>
              <button className="dash-btn dash-btn-ghost" onClick={onClose} disabled={sending}>
                Cancel
              </button>
              <button className="dash-btn dash-btn-cyan" onClick={handleSend} disabled={sending}>
                {sending ? <><Spinner /> Sending...</> : <><SendIcon /> Send Now</>}
              </button>
            </>
          ) : (
            <button className="dash-btn dash-btn-cyan" onClick={onClose}
              style={{ flex: 1, justifyContent: "center" }}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════
function Dashboard({ onLogout }) {
  const [emails, setEmails]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [search, setSearch]     = useState("")
  const [selected, setSelected] = useState(new Set())
  const [deleting, setDeleting] = useState(null)
  const [filterMode, setFilter] = useState("all")
  const [modal, setModal]       = useState(null)

  useEffect(() => { fetchEmails() }, [])

  const fetchEmails = async () => {
    setLoading(true)
    setSelected(new Set())
    try {
      const q    = query(collection(db, "waitlist"), orderBy("createdAt", "desc"))
      const snap = await getDocs(q)
      setEmails(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    } catch (err) { console.error(err) }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this email from the waitlist?")) return
    setDeleting(id)
    try {
      await deleteDoc(doc(db, "waitlist", id))
      setEmails(prev => prev.filter(e => e.id !== id))
      setSelected(prev => { const s = new Set(prev); s.delete(id); return s })
    } catch (err) { console.error(err) }
    setDeleting(null)
  }

  const handleDeleteSelected = async () => {
    if (!window.confirm(`Delete ${selected.size} emails? This cannot be undone.`)) return
    for (const id of selected) {
      try { await deleteDoc(doc(db, "waitlist", id)) } catch (e) { console.error(e) }
    }
    setEmails(prev => prev.filter(e => !selected.has(e.id)))
    setSelected(new Set())
  }

  // Derived data
  const filtered = emails
    .filter(e => {
      if (filterMode === "notified") return e.notified === true
      if (filterMode === "pending")  return !e.notified
      return true
    })
    .filter(e => e.email?.toLowerCase().includes(search.toLowerCase()))

  const totalNotified = emails.filter(e => e.notified).length
  const totalPending  = emails.filter(e => !e.notified).length

  // Checkbox logic
  const toggleOne = (id) => {
    setSelected(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }
  const toggleAll = () => {
    setSelected(
      selected.size === filtered.length
        ? new Set()
        : new Set(filtered.map(e => e.id))
    )
  }
  const allChecked  = filtered.length > 0 && selected.size === filtered.length
  const someChecked = selected.size > 0 && selected.size < filtered.length

  const emailsToNotify = (type) =>
    type === "selected"
      ? emails.filter(e => selected.has(e.id))
      : emails.filter(e => !e.notified)

  return (
    <div className="admin-dash">

      {/* ── HEADER ── */}
      <div className="admin-dash-header">
        <div className="admin-dash-logo">TRAX<span>ELON</span> · ADMIN</div>
        <div className="admin-dash-actions">
          <button className="dash-btn dash-btn-ghost" onClick={fetchEmails}>
            <RefreshIcon /> Refresh
          </button>
          <button
            className="dash-btn dash-btn-cyan"
            onClick={() => setModal("all")}
            disabled={totalPending === 0}
          >
            <SendIcon /> Notify All ({totalPending})
          </button>
          <button className="dash-btn dash-btn-ghost" onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ── STATS ── */}
      <div className="admin-stats-bar">
        <div className="stat-pill">
          <span className="stat-pill-num">{emails.length}</span>
          <span className="stat-pill-label">Total</span>
        </div>
        <div className="stat-pill notified">
          <span className="stat-pill-num">{totalNotified}</span>
          <span className="stat-pill-label">Notified</span>
        </div>
        <div className="stat-pill pending">
          <span className="stat-pill-num">{totalPending}</span>
          <span className="stat-pill-label">Pending</span>
        </div>
        {selected.size > 0 && (
          <div className="stat-pill sel">
            <span className="stat-pill-num">{selected.size}</span>
            <span className="stat-pill-label">Selected</span>
          </div>
        )}
      </div>

      {/* ── CONTROLS ── */}
      <div className="admin-controls">
        {/* Search */}
        <div className="search-wrap">
          <span className="search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search emails..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")}
              style={{ background: "none", border: "none",
                color: "rgba(232,244,255,0.3)", cursor: "pointer",
                padding: "0 12px", fontSize: 18 }}>×</button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="filter-tabs">
          {["all", "pending", "notified"].map(f => (
            <button
              key={f}
              className={`filter-tab ${filterMode === f ? "active" : ""}`}
              onClick={() => { setFilter(f); setSelected(new Set()) }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="bulk-actions">
            <button className="dash-btn dash-btn-cyan" onClick={() => setModal("selected")}>
              <SendIcon /> Notify {selected.size}
            </button>
            <button className="dash-btn dash-btn-danger" onClick={handleDeleteSelected}>
              <TrashIcon /> Delete {selected.size}
            </button>
          </div>
        )}
      </div>

      {/* ── TABLE ── */}
      <div className="admin-body">
        {loading ? (
          <div className="empty-state">
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#00d4ff"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ animation: "spinIcon 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            </div>
            <div className="empty-title">Loading</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{search ? "🔍" : "📭"}</div>
            <div className="empty-title">
              {search ? "No results" : `No ${filterMode !== "all" ? filterMode : ""} emails yet`}
            </div>
            <div className="empty-sub">
              {search ? `No emails match "${search}"` : "Nothing to show here."}
            </div>
          </div>
        ) : (
          <div className="table-wrap">
            {/* Head */}
            <div className="table-head">
              <div className="th th-check">
                <div
                  className={`custom-cb ${allChecked ? "checked" : someChecked ? "indeterminate" : ""}`}
                  onClick={toggleAll}
                >
                  {allChecked && <CheckIcon />}
                  {someChecked && <span style={{ fontSize: 14, lineHeight: 1 }}>–</span>}
                </div>
              </div>
              <div className="th">#</div>
              <div className="th">Email Address</div>
              <div className="th">Status</div>
              <div className="th th-date">Joined At</div>
              <div className="th"></div>
            </div>

            {/* Rows */}
            {filtered.map((entry, idx) => (
              <div
                className={`table-row ${selected.has(entry.id) ? "row-selected" : ""}`}
                key={entry.id}
              >
                <div className="td td-check">
                  <div
                    className={`custom-cb ${selected.has(entry.id) ? "checked" : ""}`}
                    onClick={() => toggleOne(entry.id)}
                  >
                    {selected.has(entry.id) && <CheckIcon />}
                  </div>
                </div>
                <div className="td td-num">{idx + 1}</div>
                <div className="td td-email">
                  <span className="email-dot" style={{ opacity: entry.notified ? 0.25 : 0.7 }} />
                  <span style={{ opacity: entry.notified ? 0.45 : 1 }}>{entry.email}</span>
                </div>
                <div className="td">
                  {entry.notified
                    ? <span className="badge-notified">✓ Notified</span>
                    : <span className="badge-pending">● Pending</span>}
                </div>
                <div className="td td-date">{formatDate(entry.createdAt)}</div>
                <div className="td td-action">
                  <button
                    className="del-btn"
                    onClick={() => handleDelete(entry.id)}
                    disabled={deleting === entry.id}
                    title="Delete"
                  >
                    {deleting === entry.id ? <Spinner /> : <TrashIcon />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <footer>
        <span>© 2026 TRAXELON ADMIN · INTERNAL USE ONLY</span>
        <span style={{ color: "rgba(232,244,255,0.15)" }}>
          {filtered.length} of {emails.length} shown
        </span>
      </footer>

      {/* ── MODAL ── */}
      {modal && (
        <NotifyModal
          emails={emailsToNotify(modal)}
          onClose={() => setModal(null)}
          onSent={() => { fetchEmails(); setSelected(new Set()) }}
        />
      )}
    </div>
  )
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />
  return <Dashboard onLogout={() => setAuthed(false)} />
}
