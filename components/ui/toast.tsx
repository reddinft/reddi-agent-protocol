export type ToastType = "success" | "error" | "info"

export function showToast(msg: string, type: ToastType = "info") {
  if (typeof document === "undefined") return

  const colors = {
    success: "#059669",
    error: "#dc2626",
    info: "#4f46e5",
  } as const

  const t = document.createElement("div")
  t.className = "toast"
  t.style.background = colors[type]
  t.style.color = "white"
  t.textContent = msg
  document.body.appendChild(t)
  window.setTimeout(() => t.remove(), 3200)
}
