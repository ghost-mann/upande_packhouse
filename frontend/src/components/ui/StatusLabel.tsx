export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'default'

const TONE: Record<Tone, string> = {
  success: 'bg-accent-green/15 text-[#1a8a3a]',
  warning: 'bg-accent-orange/15 text-[#9a5a00]',
  danger: 'bg-accent-red/12 text-accent-red',
  info: 'bg-accent-purple/12 text-accent-purple',
  primary: 'bg-accent-blue/12 text-accent-blue',
  default: 'bg-ink/[0.06] text-ink-soft',
}

export default function StatusLabel({ children, tone = 'default' }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span className={['inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold', TONE[tone]].join(' ')}>
      {children}
    </span>
  )
}
