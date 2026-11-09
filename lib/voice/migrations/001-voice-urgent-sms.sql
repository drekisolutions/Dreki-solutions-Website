-- Run once on the Neon voice database before after-hours urgent texts can be deduped.
-- A missing table does not fail message capture; the text is skipped and logged.

CREATE TABLE IF NOT EXISTS voice_urgent_sms (
  call_id text PRIMARY KEY,
  detroit_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS voice_urgent_sms_detroit_date
  ON voice_urgent_sms (detroit_date);
