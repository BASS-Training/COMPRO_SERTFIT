UPDATE kegiatan
SET
  category = CASE slug
    WHEN 'pelaksanaan-program-pembelajaran' THEN 'Bidang Instruktur - Klaster'
    WHEN 'penyajian-materi-pembelajaran-daring' THEN 'Bidang Instruktur - Klaster'
    WHEN 'perencanaan-penyajian-materi-pelatihan' THEN 'Bidang Instruktur - Klaster'
    WHEN 'asisten-hingga-instruktur-terampil' THEN 'Bidang Instruktur - Jenjang 3'
    WHEN 'instruktur-dan-fasilitator' THEN 'Bidang Instruktur - Jenjang 4'
    WHEN 'instruktur-muda-dan-senior' THEN 'Bidang Instruktur - Jenjang 5'
    WHEN 'instruktur-madya-dan-master' THEN 'Bidang Instruktur - Jenjang 6'
    WHEN 'operasional-pelatihan' THEN 'Bidang Tenaga Kepelatihan - Jenjang 3'
    WHEN 'koordinator-dan-pengembang' THEN 'Bidang Tenaga Kepelatihan - Jenjang 4'
    WHEN 'manager-pelatihan' THEN 'Bidang Tenaga Kepelatihan - Jenjang 5'
    WHEN 'kepala-lembaga-pelatihan' THEN 'Bidang Tenaga Kepelatihan - Jenjang 6'
    ELSE category
  END,
  description = CASE slug
    WHEN 'asisten-hingga-instruktur-terampil' THEN 'Asisten Instruktur, Mentor, Pelatih, Pelatih di Tempat Kerja, Instruktur Junior, dan Instruktur Terampil.'
    WHEN 'instruktur-dan-fasilitator' THEN 'Instruktur Pertama, Instruktur, Fasilitator, Pengajar Vokasi, dan Instruktur Penyelia.'
    WHEN 'instruktur-muda-dan-senior' THEN 'Instruktur Muda dan Instruktur Senior.'
    WHEN 'instruktur-madya-dan-master' THEN 'Instruktur Madya dan Instruktur Master.'
    WHEN 'operasional-pelatihan' THEN 'Staf Administrasi, Pelaksanaan Kegiatan Pelatihan, Pelatihan Pemasar Program, Pengelola Rekrutmen dan Seleksi, Penyelenggara Pelatihan, Penyedia Bahan Pelatihan, dan Penata Diklat.'
    WHEN 'koordinator-dan-pengembang' THEN 'Koordinator Pemagangan serta Pengembang Kurikulum dan Fasilitas Pelatihan.'
    WHEN 'manager-pelatihan' THEN 'Manager.'
    WHEN 'kepala-lembaga-pelatihan' THEN 'Kepala Lembaga Pelatihan.'
    ELSE description
  END,
  sort_order = CASE slug
    WHEN 'pelaksanaan-program-pembelajaran' THEN 11
    WHEN 'penyajian-materi-pembelajaran-daring' THEN 10
    WHEN 'perencanaan-penyajian-materi-pelatihan' THEN 9
    WHEN 'asisten-hingga-instruktur-terampil' THEN 8
    WHEN 'instruktur-dan-fasilitator' THEN 7
    WHEN 'instruktur-muda-dan-senior' THEN 6
    WHEN 'instruktur-madya-dan-master' THEN 5
    WHEN 'operasional-pelatihan' THEN 4
    WHEN 'koordinator-dan-pengembang' THEN 3
    WHEN 'manager-pelatihan' THEN 2
    WHEN 'kepala-lembaga-pelatihan' THEN 1
    ELSE sort_order
  END
WHERE slug IN (
  'pelaksanaan-program-pembelajaran',
  'penyajian-materi-pembelajaran-daring',
  'perencanaan-penyajian-materi-pelatihan',
  'asisten-hingga-instruktur-terampil',
  'instruktur-dan-fasilitator',
  'instruktur-muda-dan-senior',
  'instruktur-madya-dan-master',
  'operasional-pelatihan',
  'koordinator-dan-pengembang',
  'manager-pelatihan',
  'kepala-lembaga-pelatihan'
);
