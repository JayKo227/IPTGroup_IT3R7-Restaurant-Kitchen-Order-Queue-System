import { useEffect, useState } from "react"
import React from "react"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api"

export default function ActivatePage({
  uid,
  token,
  onDone,
}: {
  uid: string
  token: string
  onDone: () => void
}) {
  const [status, setStatus]   = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    if (!uid || !token) { setStatus("error"); setMessage("Invalid activation link."); return }
    fetch(`${API_BASE}/auth/activate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, token }),
    })
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (ok) {
          setStatus("success")
          setMessage(data.detail || "Account activated!")
          setTimeout(() => onDone(), 3000)
        } else {
          setStatus("error")
          setMessage(data.uid?.[0] || data.token?.[0] || data.detail || "Activation failed.")
        }
      })
      .catch(() => { setStatus("error"); setMessage("Network error. Please try again.") })
  }, [uid, token])

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 3C9.5 3 7.5 4.6 7 6.8C5.8 7.2 5 8.3 5 9.5C5 11 6 12.3 7.5 12.8V17H16.5V12.8C18 12.3 19 11 19 9.5C19 8.3 18.2 7.2 17 6.8C16.5 4.6 14.5 3 12 3Z" fill="white"/>
              <rect x="7.5" y="17" width="9" height="2" rx="1" fill="white"/>
            </svg>
          </div>
          <span style={s.logoText}>KITCHENOQ</span>
        </div>

        {status === "loading" && (
          <>
            <div style={s.spinner} />
            <h2 style={s.title}>Activating your account…</h2>
            <p style={s.sub}>Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ ...s.icon, background: "#DCFCE7", color: "#16A34A" }}>✓</div>
            <h2 style={s.title}>Account Activated!</h2>
            <p style={s.sub}>{message}</p>
            <p style={{ ...s.sub, fontSize: 13, color: "#888", marginTop: 4 }}>Redirecting to Sign In in 3 seconds…</p>
            <button onClick={onDone} style={s.btn}>Sign In Now</button>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ ...s.icon, background: "#FEE2E2", color: "#DC2626" }}>✕</div>
            <h2 style={s.title}>Activation Failed</h2>
            <p style={s.sub}>{message}</p>
            <button onClick={onDone} style={s.btn}>Back to Sign In</button>
          </>
        )}
      </div>
    </div>
  )
}

const s: Record<string, React.CSSProperties> = {
  page:     { minHeight: "100vh", background: "#F0F4F0", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" },
  card:     { background: "#fff", borderRadius: 16, padding: "48px 36px", maxWidth: 440, width: "100%", boxShadow: "0 2px 16px rgba(0,0,0,0.08)", textAlign: "center" },
  logoWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 32, justifyContent: "center" },
  logoIcon: { width: 36, height: 36, background: "#1B6B3A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" },
  logoText: { fontSize: 16, fontWeight: 700, color: "#1B6B3A", letterSpacing: 1 },
  title:    { fontSize: 22, fontWeight: 600, color: "#111", marginBottom: 8 },
  sub:      { fontSize: 14, color: "#555", lineHeight: 1.6 },
  icon:     { width: 64, height: 64, borderRadius: "50%", fontSize: 28, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" },
  spinner:  { width: 48, height: 48, border: "4px solid #D1FAE5", borderTop: "4px solid #1B6B3A", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" },
  btn:      { display: "inline-block", marginTop: 24, padding: "11px 32px", background: "#1B6B3A", color: "#fff", borderRadius: 8, fontSize: 14, fontWeight: 600, border: "none", cursor: "pointer" },
}