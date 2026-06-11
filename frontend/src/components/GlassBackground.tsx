// Ambient colour orbs that drift behind the frosted glass surfaces.
export default function GlassBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 -top-40 h-[34rem] w-[34rem] rounded-full bg-accent-blue/25 blur-3xl animate-float" />
      <div
        className="absolute -right-24 top-10 h-[30rem] w-[30rem] rounded-full bg-accent-purple/25 blur-3xl animate-float"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="absolute left-1/3 -bottom-44 h-[32rem] w-[32rem] rounded-full bg-accent-green/20 blur-3xl animate-float"
        style={{ animationDelay: '-9s' }}
      />
    </div>
  )
}
