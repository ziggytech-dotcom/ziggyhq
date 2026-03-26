// Lead scoring engine — 0–100

interface LeadData {
  source?: string | null
  email?: string | null
  phone?: string | null
  budget_min?: number | null
  budget_max?: number | null
  timeline?: string | null
  pre_approved?: boolean | null
  tags?: string[] | null
  last_contacted_at?: string | null
  created_at?: string
  stage?: string | null
  status?: string | null
  property_type?: string | null
  areas_of_interest?: string[] | null
}

const HIGH_VALUE_SOURCES = ['Zillow', 'Realtor.com', 'Referral', 'Website', 'Google', 'Facebook']
const MED_VALUE_SOURCES  = ['Cold Call', 'Social Media', 'Instagram', 'LinkedIn']

export interface ScoreBreakdown {
  total: number
  items: { label: string; points: number; max: number }[]
}

export function calculateLeadScore(lead: LeadData): ScoreBreakdown {
  const items: { label: string; points: number; max: number }[] = []

  // 1. Source quality (0–20)
  const src = lead.source ?? ''
  const srcPoints = HIGH_VALUE_SOURCES.some((s) => src.toLowerCase().includes(s.toLowerCase()))
    ? 20
    : MED_VALUE_SOURCES.some((s) => src.toLowerCase().includes(s.toLowerCase()))
    ? 10
    : src ? 5 : 0
  items.push({ label: 'Source quality', points: srcPoints, max: 20 })

  // 2. Contact completeness (0–15): phone + email
  const contactPoints = (lead.phone ? 8 : 0) + (lead.email ? 7 : 0)
  items.push({ label: 'Contact info', points: contactPoints, max: 15 })

  // 3. Budget defined (0–15)
  const hasBudget = !!(lead.budget_min || lead.budget_max)
  const budgetPoints = hasBudget ? (lead.budget_max && lead.budget_max >= 300000 ? 15 : 10) : 0
  items.push({ label: 'Budget defined', points: budgetPoints, max: 15 })

  // 4. Pre-approved (0–15)
  const preApprPoints = lead.pre_approved ? 15 : 0
  items.push({ label: 'Pre-approved', points: preApprPoints, max: 15 })

  // 5. Timeline (0–10)
  const tlPoints = lead.timeline ? (lead.timeline.toLowerCase().includes('month') ? 10 : 7) : 0
  items.push({ label: 'Timeline set', points: tlPoints, max: 10 })

  // 6. Recent contact / engagement (0–15)
  let engPoints = 0
  if (lead.last_contacted_at) {
    const daysSince = (Date.now() - new Date(lead.last_contacted_at).getTime()) / 86400000
    engPoints = daysSince < 1 ? 15 : daysSince < 3 ? 12 : daysSince < 7 ? 8 : daysSince < 14 ? 5 : 2
  }
  items.push({ label: 'Recent engagement', points: engPoints, max: 15 })

  // 7. Profile completeness (0–10): tags, areas, property_type
  const profilePoints =
    ((lead.tags?.length ?? 0) > 0 ? 3 : 0) +
    ((lead.areas_of_interest?.length ?? 0) > 0 ? 4 : 0) +
    (lead.property_type ? 3 : 0)
  items.push({ label: 'Profile completeness', points: profilePoints, max: 10 })

  const total = Math.min(100, items.reduce((s, i) => s + i.points, 0))
  return { total, items }
}
