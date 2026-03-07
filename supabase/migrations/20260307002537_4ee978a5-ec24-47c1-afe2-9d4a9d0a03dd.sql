INSERT INTO section_settings (section, is_visible)
VALUES 
  ('about', true),
  ('contact_title', true),
  ('contact_body', true),
  ('contact_email', true)
ON CONFLICT DO NOTHING;