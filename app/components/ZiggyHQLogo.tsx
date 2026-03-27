export function ZiggyHQLogo({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{
        fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif',
        fontWeight: 700,
        fontSize: '1.5rem',
        letterSpacing: '-0.02em',
        lineHeight: 1,
      }}
    >
      <span style={{ color: '#ff1744' }}>Ziggy</span>
      <span style={{ color: '#0ea5e9' }}>HQ</span>
    </span>
  )
}
