-- Add pipeline_stage column to crm_leads (stage already exists, add stage_entered_at for days-in-stage tracking)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS stage_entered_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows
UPDATE crm_leads SET stage_entered_at = created_at WHERE stage_entered_at IS NULL;

-- Index for pipeline queries
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(stage);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org_stage ON crm_leads(org_id, stage);
