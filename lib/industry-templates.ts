// Industry template definitions -- each template provides pipeline stages,
// default lead sources, custom fields, and terminology for the vertical.

export interface CustomField {
  key: string
  label: string
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'currency'
  options?: string[]  // for 'select' type
  placeholder?: string
}

export interface IndustryTemplate {
  id: string
  label: string
  description: string
  icon: string
  pipeline_stages: string[]
  lead_sources: string[]
  custom_fields: CustomField[]
  terminology: {
    lead: string     // e.g. "lead", "client", "borrower"
    leads: string
    deal: string
    deals: string
    pipeline: string
    won: string
    lost: string
  }
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  real_estate: {
    id: 'real_estate',
    label: 'Real Estate',
    description: 'Residential & commercial real estate agents and teams',
    icon: '🏠',
    pipeline_stages: ['New', 'Contacted', 'Showing', 'Offer', 'Under Contract', 'Closed'],
    lead_sources: ['Zillow', 'Realtor.com', 'Referral', 'Website', 'Google', 'Facebook', 'Open House', 'Cold Call', 'IDX Broker', 'Door Knock'],
    custom_fields: [
      { key: 'property_type', label: 'Property Type', type: 'select', options: ['Single Family', 'Condo/Townhouse', 'Multi-Family', 'Land', 'Commercial', 'Mobile/Manufactured', 'Other'] },
      { key: 'pre_approved', label: 'Pre-Approved', type: 'boolean' },
      { key: 'budget_min', label: 'Budget Min', type: 'currency', placeholder: '$400,000' },
      { key: 'budget_max', label: 'Budget Max', type: 'currency', placeholder: '$700,000' },
      { key: 'bedrooms', label: 'Bedrooms', type: 'number', placeholder: '3' },
      { key: 'areas_of_interest', label: 'Areas of Interest', type: 'text', placeholder: 'Henderson, Summerlin' },
      { key: 'timeline', label: 'Timeline', type: 'text', placeholder: '3–6 months' },
    ],
    terminology: { lead: 'lead', leads: 'leads', deal: 'deal', deals: 'deals', pipeline: 'pipeline', won: 'Closed', lost: 'Dead' },
  },

  mortgage: {
    id: 'mortgage',
    label: 'Mortgage / MLO',
    description: 'Mortgage loan originators and lending teams',
    icon: '🏦',
    pipeline_stages: ['Inquiry', 'Pre-Qual', 'App Submitted', 'Processing', 'Approved', 'Closed'],
    lead_sources: ['Referral', 'Realtor Partner', 'Website', 'Zillow', 'LendingTree', 'BankRate', 'Direct Mail', 'Social Media', 'Purchase Lead'],
    custom_fields: [
      { key: 'loan_type', label: 'Loan Type', type: 'select', options: ['Conventional', 'FHA', 'VA', 'USDA', 'Jumbo', 'Non-QM', 'Refinance', 'HELOC', 'Other'] },
      { key: 'budget_max', label: 'Purchase Price', type: 'currency', placeholder: '$450,000' },
      { key: 'loan_amount', label: 'Loan Amount', type: 'currency', placeholder: '$360,000' },
      { key: 'pre_approved', label: 'Rate Locked', type: 'boolean' },
      { key: 'timeline', label: 'Closing Date', type: 'text', placeholder: 'e.g. April 15, 2026' },
      { key: 'property_type', label: 'Property Type', type: 'select', options: ['Primary Residence', 'Investment Property', 'Second Home', 'Refinance'] },
    ],
    terminology: { lead: 'borrower', leads: 'borrowers', deal: 'loan', deals: 'loans', pipeline: 'pipeline', won: 'Closed', lost: 'Withdrawn' },
  },

  contractor: {
    id: 'contractor',
    label: 'Contractor',
    description: 'General contractors, home services, and construction',
    icon: '🔨',
    pipeline_stages: ['Lead', 'Estimate Sent', 'Approved', 'Scheduled', 'In Progress', 'Complete'],
    lead_sources: ['Referral', 'Google', 'Yelp', 'Angi/HomeAdvisor', 'Website', 'Nextdoor', 'Door Knock', 'Repeat Customer', 'Social Media'],
    custom_fields: [
      { key: 'property_type', label: 'Job Type', type: 'select', options: ['Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Kitchen Remodel', 'Bathroom Remodel', 'Addition', 'Landscaping', 'Painting', 'Flooring', 'Windows/Doors', 'General Construction', 'Other'] },
      { key: 'timeline', label: 'Job Address', type: 'text', placeholder: '123 Main St, Las Vegas NV' },
      { key: 'budget_max', label: 'Estimate Value', type: 'currency', placeholder: '$12,500' },
      { key: 'pre_approved', label: 'Permit Required', type: 'boolean' },
    ],
    terminology: { lead: 'lead', leads: 'leads', deal: 'job', deals: 'jobs', pipeline: 'pipeline', won: 'Complete', lost: 'Lost' },
  },

  agency: {
    id: 'agency',
    label: 'Agency',
    description: 'Marketing, creative, and digital agencies',
    icon: '🎯',
    pipeline_stages: ['Prospect', 'Proposal', 'Negotiation', 'Active', 'Retainer', 'Churned'],
    lead_sources: ['Referral', 'LinkedIn', 'Website', 'Cold Outreach', 'Conference', 'Podcast', 'Content Marketing', 'Partnership'],
    custom_fields: [
      { key: 'property_type', label: 'Service Type', type: 'select', options: ['SEO/Content', 'Paid Ads', 'Social Media', 'Web Design', 'Branding', 'Email Marketing', 'Full-Service', 'PR', 'Video', 'Other'] },
      { key: 'budget_max', label: 'Monthly Value', type: 'currency', placeholder: '$5,000' },
      { key: 'timeline', label: 'Contract End Date', type: 'text', placeholder: 'Dec 2026' },
      { key: 'pre_approved', label: 'Contract Signed', type: 'boolean' },
    ],
    terminology: { lead: 'prospect', leads: 'prospects', deal: 'account', deals: 'accounts', pipeline: 'pipeline', won: 'Active', lost: 'Lost' },
  },

  consulting: {
    id: 'consulting',
    label: 'Consulting',
    description: 'Business, strategy, and professional consulting firms',
    icon: '💼',
    pipeline_stages: ['Inquiry', 'Discovery', 'Proposal', 'Engaged', 'Complete', 'Renewed'],
    lead_sources: ['Referral', 'LinkedIn', 'Conference', 'Website', 'Alumni Network', 'Cold Outreach', 'Speaking Engagement', 'Publishing'],
    custom_fields: [
      { key: 'property_type', label: 'Project Type', type: 'select', options: ['Strategy', 'Operations', 'Finance', 'HR/Org Design', 'Technology', 'Marketing', 'M&A', 'Compliance', 'Training', 'Other'] },
      { key: 'budget_max', label: 'Project Value', type: 'currency', placeholder: '$25,000' },
      { key: 'budget_min', label: 'Hourly Rate', type: 'currency', placeholder: '$250' },
      { key: 'timeline', label: 'Project Duration', type: 'text', placeholder: '3 months' },
      { key: 'pre_approved', label: 'NDA Signed', type: 'boolean' },
    ],
    terminology: { lead: 'prospect', leads: 'prospects', deal: 'engagement', deals: 'engagements', pipeline: 'pipeline', won: 'Engaged', lost: 'Lost' },
  },

  health_wellness: {
    id: 'health_wellness',
    label: 'Health & Wellness',
    description: 'Coaches, therapists, clinics, and wellness practitioners',
    icon: '🩺',
    pipeline_stages: ['Inquiry', 'Consultation', 'Active Client', 'Maintenance', 'Re-engage'],
    lead_sources: ['Referral', 'Google', 'Instagram', 'Website', 'Psychology Today', 'Zocdoc', 'Yelp', 'Word of Mouth', 'Events'],
    custom_fields: [
      { key: 'property_type', label: 'Service', type: 'select', options: ['Personal Training', 'Nutrition Coaching', 'Mental Health Therapy', 'Physical Therapy', 'Massage', 'Yoga/Pilates', 'Chiropractic', 'Life Coaching', 'Weight Loss', 'Other'] },
      { key: 'timeline', label: 'Intake Date', type: 'text', placeholder: 'April 1, 2026' },
      { key: 'budget_max', label: 'Session Rate', type: 'currency', placeholder: '$150' },
      { key: 'pre_approved', label: 'Insurance Verified', type: 'boolean' },
    ],
    terminology: { lead: 'prospect', leads: 'prospects', deal: 'appointment', deals: 'appointments', pipeline: 'pipeline', won: 'Active Client', lost: 'Declined' },
  },

  insurance: {
    id: 'insurance',
    label: 'Insurance',
    description: 'Insurance agents and brokers across all lines',
    icon: '🛡️',
    pipeline_stages: ['Lead', 'Quoted', 'Application', 'Underwriting', 'Bound', 'Renewed'],
    lead_sources: ['Referral', 'Website', 'Facebook', 'Google', 'Cold Call', 'Direct Mail', 'LinkedIn', 'Association', 'EverQuote', 'NetQuote'],
    custom_fields: [
      { key: 'property_type', label: 'Policy Type', type: 'select', options: ['Auto', 'Home', 'Life', 'Health', 'Commercial', 'Renters', 'Umbrella', 'Business', 'Workers Comp', 'Other'] },
      { key: 'budget_max', label: 'Coverage Amount', type: 'currency', placeholder: '$500,000' },
      { key: 'budget_min', label: 'Annual Premium', type: 'currency', placeholder: '$1,800' },
      { key: 'timeline', label: 'Renewal Date', type: 'text', placeholder: 'June 1, 2026' },
      { key: 'pre_approved', label: 'Application Complete', type: 'boolean' },
    ],
    terminology: { lead: 'lead', leads: 'leads', deal: 'policy', deals: 'policies', pipeline: 'pipeline', won: 'Bound', lost: 'Declined' },
  },

  financial_advisor: {
    id: 'financial_advisor',
    label: 'Financial Advisor',
    description: 'RIAs, financial planners, and wealth management',
    icon: '📈',
    pipeline_stages: ['Inquiry', 'Discovery', 'Proposal', 'Onboarding', 'Client', 'Annual Review'],
    lead_sources: ['Referral', 'LinkedIn', 'Website', 'Seminar', 'Cold Call', 'COI Network', 'Social Media', 'Direct Mail', 'SmartAsset'],
    custom_fields: [
      { key: 'budget_max', label: 'AUM', type: 'currency', placeholder: '$500,000' },
      { key: 'property_type', label: 'Investment Goals', type: 'select', options: ['Retirement', 'College Savings', 'Wealth Building', 'Estate Planning', 'Tax Optimization', 'Business Exit', 'Other'] },
      { key: 'timeline', label: 'Risk Tolerance', type: 'select', options: ['Conservative', 'Moderate', 'Aggressive'] },
      { key: 'budget_min', label: 'Annual Review Date', type: 'text', placeholder: 'October 2026' },
      { key: 'pre_approved', label: 'Suitability Complete', type: 'boolean' },
    ],
    terminology: { lead: 'prospect', leads: 'prospects', deal: 'account', deals: 'accounts', pipeline: 'pipeline', won: 'Client', lost: 'Lost' },
  },

  general: {
    id: 'general',
    label: 'General / Other',
    description: 'Fully customizable -- build your own stages and fields',
    icon: '⚙️',
    pipeline_stages: ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won'],
    lead_sources: ['Website', 'Referral', 'Google', 'Facebook', 'Cold Outreach', 'Email Campaign', 'Event', 'Partner', 'Other'],
    custom_fields: [
      { key: 'property_type', label: 'Category', type: 'text', placeholder: 'e.g. Enterprise, SMB' },
      { key: 'budget_max', label: 'Deal Value', type: 'currency', placeholder: '$10,000' },
      { key: 'timeline', label: 'Expected Close', type: 'text', placeholder: 'Q2 2026' },
      { key: 'pre_approved', label: 'Qualified', type: 'boolean' },
    ],
    terminology: { lead: 'lead', leads: 'leads', deal: 'deal', deals: 'deals', pipeline: 'pipeline', won: 'Won', lost: 'Lost' },
  },
}

export function getTemplate(id: string): IndustryTemplate {
  return INDUSTRY_TEMPLATES[id] ?? INDUSTRY_TEMPLATES.general
}

export const TEMPLATE_LIST = Object.values(INDUSTRY_TEMPLATES)
