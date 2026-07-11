-- QA only. Apply after LyricLytic has been closed.
-- This makes the next draft save fail before any working_drafts row is updated.
DROP TRIGGER IF EXISTS lyriclytic_qa_fail_draft_save;
CREATE TRIGGER lyriclytic_qa_fail_draft_save
BEFORE UPDATE ON working_drafts
WHEN NEW.updated_at <> OLD.updated_at
BEGIN
  SELECT RAISE(ABORT, 'QA injected draft save failure');
END;
