-- Industry template: store which vertical an org uses
ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS industry_template TEXT DEFAULT 'general';

-- Onboarding completed flag
ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- Custom fields storage on leads (JSON blob for template-specific fields)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS custom_fields_json JSONB DEFAULT '{}'::jsonb;

-- Index for custom fields queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_custom_fields ON crm_leads USING gin(custom_fields_json);
