CREATE TABLE IF NOT EXISTS instruktur (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(140) NOT NULL,
  photo_url VARCHAR(255) NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY instruktur_active_sort_idx (is_active, sort_order, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO instruktur (name, photo_url, sort_order) VALUES
  ('Agus Mustofa', '/assets/asesor/Agus Mustofa.jpg', 20),
  ('Anne Mariane', '/assets/asesor/anne mariane.jpg', 19),
  ('B. Andreas Mada WK', '/assets/asesor/B. Andreas Mada WK.jpg', 18),
  ('B. Rusdiharsono', '/assets/asesor/b.rusdiharsono.jpg', 17),
  ('Fadjar Eko Novanto', '/assets/asesor/fadjar eko novanto.jpg', 16),
  ('Fitri Firmansyah', '/assets/asesor/Fitri firmansyah.png', 15),
  ('Iwan Setiawan', '/assets/asesor/Iwan Setiawan.jpg', 14),
  ('Margono Sugeng', '/assets/asesor/margono sugeng.jpg', 13),
  ('Marthen Christian David Sipahuta', '/assets/asesor/marthen christian david sipahuta.jpeg', 12),
  ('Masdaryanto', '/assets/asesor/masdaryanto.jpeg', 11),
  ('Nelly Triyas Dayanti', '/assets/asesor/nelly triyas dayanti.png', 10),
  ('Nur Dewi Afifah', '/assets/asesor/nur dewi afifah.jpg', 9),
  ('Rachmat Astiana', '/assets/asesor/rachmat astiana.jpg', 8),
  ('Rahayu Wibowo', '/assets/asesor/rahayu wibowo.png', 7),
  ('Roberto Pardede', '/assets/asesor/roberto pardede.jpeg', 6),
  ('Sri Prahyoto', '/assets/asesor/sri prahyoto.jpg', 5),
  ('Sumiyanto', '/assets/asesor/sumiyanto.jpg', 4),
  ('Totok Suharto', '/assets/asesor/totok suharto.png', 3),
  ('Tri Iman Surya', '/assets/asesor/tri iman surya.jpg', 2),
  ('Yulia Rosdiati', '/assets/asesor/yulia rosdiati.jpg', 1);
