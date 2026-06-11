// Flat, minimal canvas — the page background colour does the work. A single
// very soft top wash keeps it from feeling sterile without adding noise.
export default function GlassBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10"
      style={{ background: 'radial-gradient(900px 420px at 50% -8%, rgba(47,111,237,0.05), transparent 70%)' }}
    />
  )
}
