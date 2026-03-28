-- Sprint 2: workspace-admin-defined custom field definitions per org
CREATE TABLE IF NOT EXISTS crm_custom_field_defs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,          -- snake_case key used in custom_fields_json
  label TEXT NOT NULL,         -- human-readable label
  field_type TEXT NOT NULL DEFAULT 'text',  -- text | number | date | dropdown | checkbox
  options JSONB,               -- array of strings for dropdown type
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, name)
);

CREATE INDEX IF NOT EXISTS idx_crm_custom_field_defs_org ON crm_custom_field_defs(org_id);
