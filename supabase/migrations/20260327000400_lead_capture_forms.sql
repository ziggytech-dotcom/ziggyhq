-- Lead Capture Forms: allow building custom embeddable forms that auto-create leads

CREATE TABLE IF NOT EXISTS crm_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  widget_key TEXT NOT NULL,
  submission_count INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_forms_org_id ON crm_forms(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_forms_widget_key ON crm_forms(widget_key);

CREATE TABLE IF NOT EXISTS crm_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE SET NULL,
  data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_form_submissions_form_id ON crm_form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_crm_form_submissions_org_id ON crm_form_submissions(org_id);
