CREATE TABLE IF NOT EXISTS crm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES crm_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- new_lead | lead_assigned | plan_step_due | document_signed | follow_up_due
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_notifications_user ON crm_notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_notifications_org ON crm_notifications(org_id, created_at DESC);
