CREATE TABLE IF NOT EXISTS crm_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL DEFAULT 'manual', -- manual | new_lead | no_contact_3d | no_contact_7d
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id) ON DELETE CASCADE,
  step_order INT NOT NULL DEFAULT 0,
  delay_hours INT NOT NULL DEFAULT 24,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES crm_sequences(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- active | paused | completed | unsubscribed
  current_step INT NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(sequence_id, lead_id)
);

CREATE TABLE IF NOT EXISTS crm_sequence_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES crm_sequence_enrollments(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES crm_sequence_steps(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  resend_id TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_crm_sequences_org ON crm_sequences(org_id);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_steps_seq ON crm_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_lead ON crm_sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_sequence_enrollments_next ON crm_sequence_enrollments(next_send_at) WHERE status = 'active';
