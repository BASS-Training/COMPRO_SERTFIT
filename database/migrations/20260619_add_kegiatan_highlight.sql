ALTER TABLE kegiatan
  ADD COLUMN is_highlight TINYINT(1) NOT NULL DEFAULT 0 AFTER is_active,
  ADD KEY kegiatan_highlight_idx (is_highlight, created_at);
