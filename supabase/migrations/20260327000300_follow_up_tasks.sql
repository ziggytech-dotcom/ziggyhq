-- Follow-up tasks table
CREATE TABLE IF NOT EXISTS crm_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES crm_users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES crm_users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  type TEXT NOT NULL DEFAULT 'follow_up',  -- 'follow_up' | 'call' | 'email' | 'custom'
  auto_created BOOLEAN NOT NULL DEFAULT FALSE,  -- true if created by follow-up reminder rule
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_org ON crm_tasks(org_id, completed_at, due_at);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_lead ON crm_tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_assigned ON crm_tasks(assigned_to, completed_at);

-- Follow-up reminder rules (auto-create tasks when leads are untouched)
CREATE TABLE IF NOT EXISTS crm_followup_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES crm_organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  no_contact_days INTEGER NOT NULL DEFAULT 7,  -- trigger after X days of no contact
  task_title TEXT NOT NULL DEFAULT 'Follow up with {{first_name}}',
  assign_to TEXT NOT NULL DEFAULT 'lead_owner',  -- 'lead_owner' | specific user id
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crm_followup_rules_org ON crm_followup_rules(org_id, is_active);

-- Sequences: add reply_stops_sequence flag and smart list trigger
ALTER TABLE crm_sequences ADD COLUMN IF NOT EXISTS reply_stops_sequence BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE crm_sequences ADD COLUMN IF NOT EXISTS smart_list_id UUID REFERENCES crm_smart_lists(id) ON DELETE SET NULL;

-- Sequence steps: add conditional logic
ALTER TABLE crm_sequence_steps ADD COLUMN IF NOT EXISTS condition_type TEXT;  -- 'opened' | 'clicked' | 'not_opened' | null (always send)
ALTER TABLE crm_sequence_steps ADD COLUMN IF NOT EXISTS step_type TEXT NOT NULL DEFAULT 'email';  -- 'email' (future: 'sms', 'task')

-- Enrollments: track reply detection
ALTER TABLE crm_sequence_enrollments ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;
