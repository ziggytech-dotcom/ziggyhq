-- Add widget_key to crm_organizations for the embeddable lead form widget
ALTER TABLE crm_organizations ADD COLUMN IF NOT EXISTS widget_key TEXT UNIQUE;

-- Generate widget keys for existing orgs
UPDATE crm_organizations
SET widget_key = 'wk_' || replace(gen_random_uuid()::text, '-', '')
WHERE widget_key IS NULL;

-- Create index
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_organizations_widget_key ON crm_organizations(widget_key);
