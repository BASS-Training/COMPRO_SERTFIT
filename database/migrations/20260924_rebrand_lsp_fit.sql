DELETE FROM kegiatan;
DELETE FROM anggota;

INSERT INTO site_settings (setting_key, setting_value) VALUES
  ('about_title', 'Tentang LSP FIT'),
  ('about_description', 'LSP FIT adalah Lembaga Sertifikasi Profesi Fasilitator, Instruktur dan Tenaga Kepelatihan berlisensi BNSP yang menjaga mutu dan relevansi sertifikasi kompetensi.'),
  ('vision', 'Menjadi lembaga sertifikasi profesi yang terpercaya, objektif, dan relevan dengan kebutuhan dunia kerja nasional.'),
  ('mission', 'Menyelenggarakan sertifikasi kompetensi sesuai standar BNSP dan SKKNI.\nMenjaga objektivitas, konsistensi, dan mutu proses asesmen.\nMemperluas akses sertifikasi melalui layanan online dan offline.\nMembangun kemitraan dengan pemerintah, industri, lembaga pelatihan, dan perguruan tinggi.\nMendukung pengakuan kompetensi fasilitator, instruktur, dan tenaga kepelatihan.'),
  ('contact_email', 'info.lspfit@gmail.com'),
  ('contact_website', 'www.sertifikasifit.com'),
  ('contact_phone', '0811-1210-1007'),
  ('contact_address', 'Ruko Akasa BSD Blok B Nomor 5, Jl. Raya Lengkong Gudang Timur, Tangerang Selatan 15228'),
  ('home_hero_title', 'LSP FIT untuk kompetensi profesional yang diakui.'),
  ('home_hero_description', 'LSP FIT menyelenggarakan sertifikasi kompetensi bagi fasilitator, instruktur, dan tenaga kepelatihan dengan standar BNSP dan kebutuhan dunia kerja.'),
  ('home_hero_button_text', 'Lihat Skema Sertifikasi'),
  ('home_hero_button_url', '/kegiatan.html'),
  ('home_hero_image', '/assets/lspfit/logofit-nobg.png'),
  ('home_activities_kicker', 'LSP FIT dalam angka'),
  ('home_activities_title', 'Pengalaman dan jangkauan nasional'),
  ('home_activities_description', 'Sertifikasi kompetensi yang dikelola secara profesional, terukur, dan mudah diakses.'),
  ('home_profile_kicker', 'Tentang LSP FIT'),
  ('home_profile_title', 'Lembaga Sertifikasi Profesi berlisensi BNSP'),
  ('home_profile_card_title', 'Berlisensi BNSP'),
  ('home_profile_card_description', 'LSP FIT memiliki lisensi BNSP LSP-444-ID dan melaksanakan sertifikasi mengacu SKKNI No. 333 Tahun 2020.'),
  ('home_members_kicker', 'Struktur LSP FIT'),
  ('home_members_title', 'Tim pengelola sertifikasi profesional'),
  ('home_partners_kicker', 'Mitra & Kerjasama'),
  ('home_partners_title', 'Jaringan kolaborasi LSP FIT'),
  ('home_cta_title', 'Siap mengikuti sertifikasi kompetensi?'),
  ('home_cta_description', 'Hubungi tim LSP FIT untuk mendapatkan informasi skema, persyaratan, jadwal, dan proses pendaftaran.'),
  ('home_cta_button_text', 'Konsultasi Sekarang'),
  ('home_cta_button_url', '/kontak.html'),
  ('home_show_activities', '0'),
  ('home_section_order', 'profile,members,partners,cta')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO anggota (name, role_label, photo_url, sort_order) VALUES
  ('Eva Rosmalia', 'Dewan Komisaris', '/assets/asesor/dewanpengarah.jpeg', 7),
  ('Bambang Satrio Lelono', 'Dewan Komisaris', '/assets/asesor/dewanpengarah.jpeg', 6),
  ('Fitri Firmansyah', 'Direktur', '/assets/asesor/direktur.jpeg', 5),
  ('Arum Handayani', 'Bidang Mutu', '/assets/asesor/bagianmutu.jpeg', 4),
  ('Rahayu Wibowo', 'Bidang Sertifikasi', '/assets/asesor/rahayu wibowo.png', 3),
  ('M. Reza Aditya', 'Finance', 'https://ui-avatars.com/api/?name=M.+Reza+Aditya&size=600&background=E6F4FB&color=0D1B2A', 2),
  ('Annisa Ramadaniah', 'Bidang Administrasi', 'https://ui-avatars.com/api/?name=Annisa+Ramadaniah&size=600&background=E6F4FB&color=0D1B2A', 1);

DELETE FROM partners;
INSERT INTO partners (name, logo_url, website_url, sort_order) VALUES
  ('UDN', '/assets/partners/udn.jpeg', NULL, 22),
  ('STIA LAN', '/assets/partners/stialan.jpeg', NULL, 21),
  ('SLS', '/assets/partners/sls.jpeg', NULL, 20),
  ('PALYJA', '/assets/partners/palyja.jpeg', NULL, 19),
  ('Sanggar', '/assets/partners/sanggar.jpeg', NULL, 18),
  ('Madhani', '/assets/partners/madhani.jpeg', NULL, 17),
  ('Sampoerna', '/assets/partners/sampoerna.jpeg', NULL, 16),
  ('Kesehatan', '/assets/partners/kesehatan.jpg', NULL, 15),
  ('Kemnaker', '/assets/partners/kemnaker.jpeg', NULL, 14),
  ('RAPP', '/assets/partners/rapp.jpeg', NULL, 13),
  ('ITI', '/assets/partners/iti.jpeg', NULL, 12),
  ('Infomedia', '/assets/partners/infomedia.jpeg', NULL, 11),
  ('Citibank', '/assets/partners/citibank.jpeg', NULL, 10),
  ('Borneo', '/assets/partners/borneo.jpeg', NULL, 9),
  ('Bogor', '/assets/partners/bogor.jpeg', NULL, 8),
  ('Berau', '/assets/partners/berau.jpeg', NULL, 7),
  ('AHM', '/assets/partners/ahm.jpeg', NULL, 6),
  ('Perikanan', '/assets/partners/perikanan.jpeg', NULL, 5),
  ('Perhubungan', '/assets/partners/perhubungan.jpeg', NULL, 4),
  ('Petrosea', '/assets/partners/petrosea.jpeg', NULL, 3),
  ('PUPR', '/assets/partners/pupr.jpeg', NULL, 2);

INSERT INTO kegiatan (title, slug, category, summary, description, image_url, is_highlight, sort_order) VALUES
  ('Pelaksanaan Program Pembelajaran', 'pelaksanaan-program-pembelajaran', 'Bidang Instruktur', 'Kompetensi untuk melaksanakan program pembelajaran secara terstruktur dan efektif.', 'Kompetensi untuk melaksanakan program pembelajaran secara terstruktur, efektif, dan sesuai kebutuhan peserta.', '/assets/lspfit/logofit-nobg.png', 1, 11),
  ('Penyajian Materi Pembelajaran Daring', 'penyajian-materi-pembelajaran-daring', 'Bidang Instruktur', 'Kompetensi untuk menyajikan materi pembelajaran melalui metode dan platform daring.', 'Kompetensi untuk menyajikan materi pembelajaran melalui metode dan platform pembelajaran daring.', '/assets/lspfit/logofit-nobg.png', 1, 10),
  ('Perencanaan Penyajian Materi Pelatihan', 'perencanaan-penyajian-materi-pelatihan', 'Bidang Instruktur', 'Kompetensi untuk merancang materi, metode, dan media pelatihan.', 'Kompetensi untuk merancang alur, materi, metode, dan media pelatihan yang relevan.', '/assets/lspfit/logofit-nobg.png', 1, 9),
  ('Asisten hingga Instruktur Terampil', 'asisten-hingga-instruktur-terampil', 'Jenjang KKNI 3', 'Skema bagi asisten, mentor, pelatih, dan instruktur terampil.', 'Asisten Instruktur, Mentor, Pelatih, Pelatih di Tempat Kerja, Instruktur Junior, dan Instruktur Terampil.', '/assets/lspfit/logofit-nobg.png', 0, 8),
  ('Instruktur dan Fasilitator', 'instruktur-dan-fasilitator', 'Jenjang KKNI 4', 'Skema bagi instruktur, fasilitator, dan pengajar vokasi.', 'Instruktur Pertama, Instruktur, Fasilitator, Pengajar Vokasi, dan Instruktur Penyelia.', '/assets/lspfit/logofit-nobg.png', 0, 7),
  ('Instruktur Muda dan Senior', 'instruktur-muda-dan-senior', 'Jenjang KKNI 5', 'Skema untuk instruktur dengan pengalaman pengembangan pembelajaran.', 'Skema untuk instruktur dengan pengalaman dan tanggung jawab pengembangan pembelajaran yang lebih luas.', '/assets/lspfit/logofit-nobg.png', 0, 6),
  ('Instruktur Madya dan Master', 'instruktur-madya-dan-master', 'Jenjang KKNI 6', 'Skema tingkat lanjut untuk pengembangan dan mutu pembelajaran.', 'Skema tingkat lanjut bagi instruktur yang memimpin, mengembangkan, dan memastikan mutu pembelajaran.', '/assets/lspfit/logofit-nobg.png', 0, 5),
  ('Operasional Pelatihan', 'operasional-pelatihan', 'Bidang Tenaga Kepelatihan', 'Skema untuk operasional, administrasi, dan penyelenggaraan pelatihan.', 'Staf Administrasi, Pelaksanaan Kegiatan Pelatihan, Pemasar Program, Pengelola Rekrutmen dan Seleksi, Penyelenggara Pelatihan, Penyedia Bahan Pelatihan, dan Penata Diklat.', '/assets/lspfit/logofit-nobg.png', 0, 4),
  ('Koordinator dan Pengembang', 'koordinator-dan-pengembang', 'Bidang Tenaga Kepelatihan', 'Skema untuk koordinasi dan pengembangan lembaga pelatihan.', 'Koordinator Pemagangan serta Pengembang Kurikulum dan Fasilitas Pelatihan.', '/assets/lspfit/logofit-nobg.png', 0, 3),
  ('Manager', 'manager-pelatihan', 'Bidang Tenaga Kepelatihan', 'Kompetensi untuk mengelola fungsi manajerial pelatihan.', 'Kompetensi untuk mengelola fungsi manajerial dalam penyelenggaraan program pelatihan.', '/assets/lspfit/logofit-nobg.png', 0, 2),
  ('Kepala Lembaga Pelatihan', 'kepala-lembaga-pelatihan', 'Bidang Tenaga Kepelatihan', 'Kompetensi tingkat lanjut untuk memimpin lembaga pelatihan.', 'Kompetensi tingkat lanjut untuk memimpin dan mengembangkan lembaga pelatihan.', '/assets/lspfit/logofit-nobg.png', 0, 1);
