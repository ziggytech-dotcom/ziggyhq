CREATE TABLE IF NOT EXISTS crm_smart_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  filters_json JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_smart_lists_org ON crm_smart_lists(org_id);

-- Seed a few default smart lists for the demo org
INSERT INTO crm_smart_lists (org_id, name, filters_json) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Hot Leads', '{"lead_score_min": 70}'),
  ('00000000-0000-0000-0000-000000000001', 'No Contact 7 Days', '{"no_contact_days": 7}'),
  ('00000000-0000-0000-0000-000000000001', 'New This Week', '{"created_within_days": 7}')
ON CONFLICT DO NOTHING;
