-- lead_score already exists on crm_leads; add score_breakdown_json for tooltip detail
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score_breakdown_json JSONB DEFAULT '{}';

-- Index for sorting by score
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON crm_leads(org_id, lead_score DESC);
