import Link from 'next/link'

interface PricingCardProps {
  name: string
  price: number
  annualPrice?: number
  isAnnual?: boolean
  description: string
  seats: string
  additionalSeat: string
  features: string[]
  cta: string
  ctaHref: string
  highlighted?: boolean
  badge?: string
}

export function PricingCard({
  name,
  price,
  annualPrice,
  isAnnual = false,
  description,
  seats,
  additionalSeat,
  features,
  cta,
  ctaHref,
  highlighted = false,
  badge,
}: PricingCardProps) {
  const displayPrice = isAnnual && annualPrice ? annualPrice : price

  return (
    <div className={`relative rounded-2xl p-8 flex flex-col ${
      highlighted
        ? 'bg-[#0ea5e9]/10 border-2 border-[#0ea5e9]'
        : 'bg-[#1a1a1a] border border-[#2d2d2d]'
    }`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-[#0ea5e9] text-white text-xs font-semibold px-3 py-1 rounded-full">
            {badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-white font-bold text-xl mb-2">{name}</h3>
        <p className="text-[#b3b3b3] text-sm">{description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-end gap-1">
          <span className="text-white font-bold text-5xl">${displayPrice}</span>
          <span className="text-[#b3b3b3] text-sm mb-2">/mo</span>
        </div>
        {isAnnual && annualPrice && (
          <p className="text-[#0ea5e9] text-xs mt-1">Save ${(price - annualPrice) * 12}/yr with annual billing</p>
        )}
        <p className="text-[#b3b3b3] text-sm mt-2">{seats}</p>
        <p className="text-[#b3b3b3] text-xs mt-1">{additionalSeat}</p>
      </div>

      <Link
        href={ctaHref}
        className={`w-full text-center rounded-lg px-6 py-3 font-medium text-sm transition-colors mb-8 ${
          highlighted
            ? 'bg-[#0ea5e9] text-white hover:bg-[#0ea5e9]/90'
            : 'border border-[#2d2d2d] text-white hover:bg-[#2d2d2d]'
        }`}
      >
        {cta}
      </Link>

      <ul className="space-y-3 flex-1">
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-[#b3b3b3]">
            <svg className="w-4 h-4 text-[#0ea5e9] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
