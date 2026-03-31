-- Add style_text and vocal_text to working_drafts
ALTER TABLE working_drafts ADD COLUMN style_text TEXT DEFAULT '';
ALTER TABLE working_drafts ADD COLUMN vocal_text TEXT DEFAULT '';