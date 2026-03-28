-- Sprint 2: add structured call outcome fields to activity log
ALTER TABLE crm_lead_activities
  ADD COLUMN IF NOT EXISTS call_outcome TEXT,   -- connected | no_answer | voicemail
  ADD COLUMN IF NOT EXISTS call_notes TEXT,
  ADD COLUMN IF NOT EXISTS email_subject TEXT,
  ADD COLUMN IF NOT EXISTS email_body TEXT;
