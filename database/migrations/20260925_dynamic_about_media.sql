INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES
  ('about_leader_kicker', 'Sambutan Pimpinan'),
  ('about_leader_title', 'Membangun kepercayaan melalui kompetensi'),
  ('about_leader_quote', 'LSP FIT hadir untuk memastikan setiap proses sertifikasi berjalan objektif, profesional, dan memberi nilai nyata bagi peserta, dunia kerja, serta ekosistem pelatihan di Indonesia.'),
  ('about_leader_name', 'Fitri Firmansyah'),
  ('about_leader_role', 'Direktur LSP FIT'),
  ('about_video_kicker', 'Kenali LSP FIT'),
  ('about_video_title', 'Video perkenalan'),
  ('about_video_description', 'Area ini disiapkan untuk menampilkan video profil dan layanan LSP FIT.'),
  ('about_video_url', ''),
  ('about_video_note_label', 'Siap diisi'),
  ('about_video_note_description', 'Gunakan video yang menjelaskan profil lembaga, layanan sertifikasi, skema, dan alur pendaftaran.');

INSERT INTO site_settings (setting_key, setting_value)
VALUES ('content_seed_version', '20260925-dynamic-about-media')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
