import { Warga, Kunjungan, KeuanganRecord } from '../types';

// Helper to calculate age dynamically based on current date (2026-07-04)
export const calculateAge = (birthDateString: string): number => {
  const birthDate = new Date(birthDateString);
  const today = new Date('2026-07-04'); // Static anchor date to keep things consistent with metadata
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const initialWarga: Warga[] = [
  // KK 1
  { id: 'w1', noKK: '3171011212050001', nama: 'Budi Santoso', jenisKelamin: 'Laki-laki', nik: '3171011504780001', tanggalLahir: '1978-04-15', alamat: 'Jl. Merdeka No. 12', rt: '01' },
  { id: 'w2', noKK: '3171011212050001', nama: 'Siti Rahma', jenisKelamin: 'Perempuan', nik: '3171015210810002', tanggalLahir: '1981-10-12', alamat: 'Jl. Merdeka No. 12', rt: '01' },
  { id: 'w3', noKK: '3171011212050001', nama: 'Ahmad Fauzi', jenisKelamin: 'Laki-laki', nik: '3171010305050003', tanggalLahir: '2005-05-03', alamat: 'Jl. Merdeka No. 12', rt: '01' },
  { id: 'w_b1', noKK: '3171011212050001', nama: 'Cahyo Santoso', jenisKelamin: 'Laki-laki', nik: '3171010503240001', tanggalLahir: '2024-03-05', alamat: 'Jl. Merdeka No. 12', rt: '01' },
  { id: 'w_r1', noKK: '3171011212050001', nama: 'Dina Santoso', jenisKelamin: 'Perempuan', nik: '3171015010130002', tanggalLahir: '2013-10-10', alamat: 'Jl. Merdeka No. 12', rt: '01' },
  
  // KK 2 (Elderly)
  { id: 'w4', noKK: '3171011212050002', nama: 'Suhartono', jenisKelamin: 'Laki-laki', nik: '3171011005510001', tanggalLahir: '1951-05-10', alamat: 'Jl. Kenanga No. 5', rt: '01' },
  { id: 'w5', noKK: '3171011212050002', nama: 'Kartini', jenisKelamin: 'Perempuan', nik: '3171014806540002', tanggalLahir: '1954-06-18', alamat: 'Jl. Kenanga No. 5', rt: '01' },
  
  // KK 3
  { id: 'w6', noKK: '3171011212050003', nama: 'Hendra Wijaya', jenisKelamin: 'Laki-laki', nik: '3171012108850004', tanggalLahir: '1985-08-21', alamat: 'Jl. Melati No. 8', rt: '02' },
  { id: 'w7', noKK: '3171011212050003', nama: 'Dewi Lestari', jenisKelamin: 'Perempuan', nik: '3171016509880005', tanggalLahir: '1988-09-25', alamat: 'Jl. Melati No. 8', rt: '02' },
  { id: 'w_b2', noKK: '3171011212050003', nama: 'Gibran Wijaya', jenisKelamin: 'Laki-laki', nik: '3171011501220001', tanggalLahir: '2022-01-15', alamat: 'Jl. Melati No. 8', rt: '02' },
  { id: 'w_b3', noKK: '3171011212050003', nama: 'Hafiz Wijaya', jenisKelamin: 'Laki-laki', nik: '3171012008250002', tanggalLahir: '2025-08-20', alamat: 'Jl. Melati No. 8', rt: '02' },
  
  // KK 4
  { id: 'w8', noKK: '3171011212050004', nama: 'Rudi Hermawan', jenisKelamin: 'Laki-laki', nik: '3171011403600001', tanggalLahir: '1960-03-14', alamat: 'Jl. Mawar No. 15', rt: '02' },
  { id: 'w9', noKK: '3171011212050004', nama: 'Sri Wahyuni', jenisKelamin: 'Perempuan', nik: '3171014407630002', tanggalLahir: '1963-07-04', alamat: 'Jl. Mawar No. 15', rt: '02' },
  
  // KK 5 (Elderly RT 02)
  { id: 'w10', noKK: '3171011212050005', nama: 'Abdul Manaf', jenisKelamin: 'Laki-laki', nik: '3171010107450001', tanggalLahir: '1945-07-01', alamat: 'Jl. Melati No. 22', rt: '02' },
  
  // KK 6
  { id: 'w11', noKK: '3171011212050006', nama: 'Bambang Tri', jenisKelamin: 'Laki-laki', nik: '3171011902800003', tanggalLahir: '1980-02-19', alamat: 'Jl. Flamboyan No. 3', rt: '03' },
  { id: 'w12', noKK: '3171011212050006', nama: 'Endang Kusuma', jenisKelamin: 'Perempuan', nik: '3171015112830001', tanggalLahir: '1983-12-11', alamat: 'Jl. Flamboyan No. 3', rt: '03' },
  { id: 'w_r2', noKK: '3171011212050006', nama: 'Fitri Lestari', jenisKelamin: 'Perempuan', nik: '3171015505110001', tanggalLahir: '2011-05-15', alamat: 'Jl. Flamboyan No. 3', rt: '03' },
  { id: 'w_r3', noKK: '3171011212050006', nama: 'Gilang Permana', jenisKelamin: 'Laki-laki', nik: '3171011204160002', tanggalLahir: '2016-04-12', alamat: 'Jl. Flamboyan No. 3', rt: '03' },
  
  // KK 7
  { id: 'w13', noKK: '3171011212050007', nama: 'Subarjo', jenisKelamin: 'Laki-laki', nik: '3171011211550001', tanggalLahir: '1955-11-12', alamat: 'Jl. Flamboyan No. 9', rt: '03' },
  { id: 'w14', noKK: '3171011212050007', nama: 'Aminah', jenisKelamin: 'Perempuan', nik: '3171014205580001', tanggalLahir: '1958-05-02', alamat: 'Jl. Flamboyan No. 9', rt: '03' },

  // KK 8
  { id: 'w15', noKK: '3171011212050008', nama: 'Agus Salim', jenisKelamin: 'Laki-laki', nik: '3171012508920002', tanggalLahir: '1992-08-25', alamat: 'Jl. Dahlia No. 4', rt: '04' },
  { id: 'w16', noKK: '3171011212050008', nama: 'Rina Mutia', jenisKelamin: 'Perempuan', nik: '3171016801940001', tanggalLahir: '1994-01-28', alamat: 'Jl. Dahlia No. 4', rt: '04' },
  { id: 'w_b4', noKK: '3171011212050008', nama: 'Karin Dahlia', jenisKelamin: 'Perempuan', nik: '3171014512210001', tanggalLahir: '2021-12-05', alamat: 'Jl. Dahlia No. 4', rt: '04' },

  // KK 9
  { id: 'w17', noKK: '3171011212050009', nama: 'Joko Widodo', jenisKelamin: 'Laki-laki', nik: '3171011206500001', tanggalLahir: '1950-06-12', alamat: 'Jl. Teratai No. 17', rt: '04' },
  { id: 'w18', noKK: '3171011212050009', nama: 'Iriana', jenisKelamin: 'Perempuan', nik: '3171015112520001', tanggalLahir: '1952-12-11', alamat: 'Jl. Teratai No. 17', rt: '04' },

  // KK 10
  { id: 'w19', noKK: '3171011212050010', nama: 'Eko Prasetyo', jenisKelamin: 'Laki-laki', nik: '3171012304880003', tanggalLahir: '1988-04-23', alamat: 'Jl. Tulip No. 6', rt: '05' },
  { id: 'w20', noKK: '3171011212050010', nama: 'Dian Sastro', jenisKelamin: 'Perempuan', nik: '3171016403900004', tanggalLahir: '1990-03-24', alamat: 'Jl. Tulip No. 6', rt: '05' },
  { id: 'w_b5', noKK: '3171011212050010', nama: 'Rara Safitri', jenisKelamin: 'Perempuan', nik: '3171015507230001', tanggalLahir: '2023-07-15', alamat: 'Jl. Tulip No. 6', rt: '05' },
  { id: 'w_r4', noKK: '3171011212050010', nama: 'Bimo Prasetyo', jenisKelamin: 'Laki-laki', nik: '3171011402180002', tanggalLahir: '2018-02-14', alamat: 'Jl. Tulip No. 6', rt: '05' },

  // KK 11
  { id: 'w21', noKK: '3171011212050011', nama: 'Maryono', jenisKelamin: 'Laki-laki', nik: '3171010508490002', tanggalLahir: '1949-08-05', alamat: 'Jl. Tulip No. 12', rt: '05' },
  { id: 'w22', noKK: '3171011212050011', nama: 'Sumarni', jenisKelamin: 'Perempuan', nik: '3171014510520003', tanggalLahir: '1952-10-15', alamat: 'Jl. Tulip No. 12', rt: '05' }
];

export const initialKunjungan: Kunjungan[] = [
  // 2024 Visits
  {
    id: 'k1',
    no: 1,
    tanggal: '2024-03-12',
    nama: 'Budi Santoso',
    jenisKelamin: 'Laki-laki',
    nik: '3171011504780001',
    tanggalLahir: '1978-04-15',
    usia: 46,
    alamat: 'Jl. Merdeka No. 12',
    rt: '01',
    tdSistolik: 125,
    tdDiastolik: 82,
    tb: 172,
    bb: 74,
    lp: 88,
    gds: 110,
    chol: 195,
    au: 6.2,
    hb: 14.5
  },
  {
    id: 'k2',
    no: 2,
    tanggal: '2024-03-12',
    nama: 'Suhartono',
    jenisKelamin: 'Laki-laki',
    nik: '3171011005510001',
    tanggalLahir: '1951-05-10',
    usia: 73,
    alamat: 'Jl. Kenanga No. 5',
    rt: '01',
    tdSistolik: 145, // Hypertension (>= 139/89)
    tdDiastolik: 92,
    tb: 165,
    bb: 68,
    lp: 94,
    gds: 156,
    chol: 240,
    au: 7.8,
    hb: 12.8
  },
  {
    id: 'k3',
    no: 3,
    tanggal: '2024-06-15',
    nama: 'Siti Rahma',
    jenisKelamin: 'Perempuan',
    nik: '3171015210810002',
    tanggalLahir: '1981-10-12',
    usia: 42,
    alamat: 'Jl. Merdeka No. 12',
    rt: '01',
    tdSistolik: 118,
    tdDiastolik: 75,
    tb: 158,
    bb: 54,
    lp: 78,
    gds: 95,
    chol: 175,
    au: 4.8,
    hb: 12.1
  },
  {
    id: 'k4',
    no: 4,
    tanggal: '2024-06-15',
    nama: 'Kartini',
    jenisKelamin: 'Perempuan',
    nik: '3171014806540002',
    tanggalLahir: '1954-06-18',
    usia: 70,
    alamat: 'Jl. Kenanga No. 5',
    rt: '01',
    tdSistolik: 140, // Hypertension
    tdDiastolik: 85,
    tb: 152,
    bb: 62,
    lp: 89,
    gds: 130,
    chol: 215,
    au: 6.1,
    hb: 11.5
  },
  {
    id: 'k5',
    no: 5,
    tanggal: '2024-09-10',
    nama: 'Hendra Wijaya',
    jenisKelamin: 'Laki-laki',
    nik: '3171012108850004',
    tanggalLahir: '1985-08-21',
    usia: 39,
    alamat: 'Jl. Melati No. 8',
    rt: '02',
    tdSistolik: 120,
    tdDiastolik: 80,
    tb: 175,
    bb: 82,
    lp: 92,
    gds: 105,
    chol: 188,
    au: 5.9,
    hb: 15.0
  },

  // 2025 Visits
  {
    id: 'k6',
    no: 6,
    tanggal: '2025-01-15',
    nama: 'Budi Santoso',
    jenisKelamin: 'Laki-laki',
    nik: '3171011504780001',
    tanggalLahir: '1978-04-15',
    usia: 47,
    alamat: 'Jl. Merdeka No. 12',
    rt: '01',
    tdSistolik: 122,
    tdDiastolik: 80,
    tb: 172,
    bb: 73,
    lp: 87,
    gds: 108,
    chol: 190,
    au: 6.0,
    hb: 14.2
  },
  {
    id: 'k7',
    no: 7,
    tanggal: '2025-02-10',
    nama: 'Subarjo',
    jenisKelamin: 'Laki-laki',
    nik: '3171011211550001',
    tanggalLahir: '1955-11-12',
    usia: 69,
    alamat: 'Jl. Flamboyan No. 9',
    rt: '03',
    tdSistolik: 152, // Hypertension
    tdDiastolik: 95,
    tb: 168,
    bb: 75,
    lp: 96,
    gds: 145,
    chol: 250,
    au: 8.1,
    hb: 13.5
  },
  {
    id: 'k8',
    no: 8,
    tanggal: '2025-04-12',
    nama: 'Aminah',
    jenisKelamin: 'Perempuan',
    nik: '3171014205580001',
    tanggalLahir: '1958-05-02',
    usia: 66,
    alamat: 'Jl. Flamboyan No. 9',
    rt: '03',
    tdSistolik: 135,
    tdDiastolik: 88,
    tb: 155,
    bb: 58,
    lp: 82,
    gds: 122,
    chol: 202,
    au: 5.4,
    hb: 11.9
  },
  {
    id: 'k9',
    no: 9,
    tanggal: '2025-07-20',
    nama: 'Dewi Lestari',
    jenisKelamin: 'Perempuan',
    nik: '3171016509880005',
    tanggalLahir: '1988-09-25',
    usia: 36,
    alamat: 'Jl. Melati No. 8',
    rt: '02',
    tdSistolik: 115,
    tdDiastolik: 75,
    tb: 160,
    bb: 52,
    lp: 74,
    gds: 90,
    chol: 170,
    au: 4.2,
    hb: 12.3
  },
  {
    id: 'k10',
    no: 10,
    tanggal: '2025-10-05',
    nama: 'Abdul Manaf',
    jenisKelamin: 'Laki-laki',
    nik: '3171010107450001',
    tanggalLahir: '1945-07-01',
    usia: 80,
    alamat: 'Jl. Melati No. 22',
    rt: '02',
    tdSistolik: 142, // Hypertension
    tdDiastolik: 90,
    tb: 162,
    bb: 60,
    lp: 85,
    gds: 135,
    chol: 210,
    au: 7.2,
    hb: 12.0
  },

  // 2026 Visits (Up to July 2026)
  {
    id: 'k11',
    no: 11,
    tanggal: '2026-02-15',
    nama: 'Budi Santoso',
    jenisKelamin: 'Laki-laki',
    nik: '3171011504780001',
    tanggalLahir: '1978-04-15',
    usia: 47,
    alamat: 'Jl. Merdeka No. 12',
    rt: '01',
    tdSistolik: 128,
    tdDiastolik: 82,
    tb: 172,
    bb: 75,
    lp: 89,
    gds: 112,
    chol: 198,
    au: 6.4,
    hb: 14.1
  },
  {
    id: 'k12',
    no: 12,
    tanggal: '2026-03-10',
    nama: 'Suhartono',
    jenisKelamin: 'Laki-laki',
    nik: '3171011005510001',
    tanggalLahir: '1951-05-10',
    usia: 74,
    alamat: 'Jl. Kenanga No. 5',
    rt: '01',
    tdSistolik: 148, // Hypertension
    tdDiastolik: 94,
    tb: 165,
    bb: 67,
    lp: 93,
    gds: 148,
    chol: 232,
    au: 7.6,
    hb: 12.5
  },
  {
    id: 'k13',
    no: 13,
    tanggal: '2026-03-12',
    nama: 'Rina Mutia',
    jenisKelamin: 'Perempuan',
    nik: '3171016801940001',
    tanggalLahir: '1994-01-28',
    usia: 32,
    alamat: 'Jl. Dahlia No. 4',
    rt: '04',
    tdSistolik: 112,
    tdDiastolik: 70,
    tb: 162,
    bb: 50,
    lp: 70,
    gds: 88,
    chol: 160,
    au: 3.9,
    hb: 12.8
  },
  {
    id: 'k14',
    no: 14,
    tanggal: '2026-04-18',
    nama: 'Agus Salim',
    jenisKelamin: 'Laki-laki',
    nik: '3171012508920002',
    tanggalLahir: '1992-08-25',
    usia: 33,
    alamat: 'Jl. Dahlia No. 4',
    rt: '04',
    tdSistolik: 122,
    tdDiastolik: 78,
    tb: 178,
    bb: 78,
    lp: 85,
    gds: 100,
    chol: 185,
    au: 5.6,
    hb: 15.2
  },
  {
    id: 'k15',
    no: 15,
    tanggal: '2026-05-10',
    nama: 'Eko Prasetyo',
    jenisKelamin: 'Laki-laki',
    nik: '3171012304880003',
    tanggalLahir: '1988-04-23',
    usia: 38,
    alamat: 'Jl. Tulip No. 6',
    rt: '05',
    tdSistolik: 130,
    tdDiastolik: 85,
    tb: 170,
    bb: 85,
    lp: 94,
    gds: 128,
    chol: 220,
    au: 6.8,
    hb: 13.9
  },
  {
    id: 'k16',
    no: 16,
    tanggal: '2026-05-12',
    nama: 'Maryono',
    jenisKelamin: 'Laki-laki',
    nik: '3171010508490002',
    tanggalLahir: '1949-08-05',
    usia: 76,
    alamat: 'Jl. Tulip No. 12',
    rt: '05',
    tdSistolik: 144, // Hypertension
    tdDiastolik: 88,
    tb: 164,
    bb: 63,
    lp: 88,
    gds: 140,
    chol: 215,
    au: 7.0,
    hb: 12.1
  },
  {
    id: 'k17',
    no: 17,
    tanggal: '2026-06-05',
    nama: 'Sumarni',
    jenisKelamin: 'Perempuan',
    nik: '3171014510520003',
    tanggalLahir: '1952-10-15',
    usia: 73,
    alamat: 'Jl. Tulip No. 12',
    rt: '05',
    tdSistolik: 138,
    tdDiastolik: 92, // Hypertension (diastolic >= 89)
    tb: 150,
    bb: 58,
    lp: 84,
    gds: 132,
    chol: 225,
    au: 6.2,
    hb: 11.2
  }
];

export const initialKeuangan: KeuanganRecord[] = [
  { id: 'f1', tanggal: '2026-01-10', keterangan: 'Saldo Awal Tahun 2026', kategori: 'Pemasukan', jenisKas: 'Kas Posbindu', jumlah: 2500000, pj: 'Siti Rahma' },
  { id: 'f2', tanggal: '2026-02-15', keterangan: 'Dana Stimulan Puskesmas', kategori: 'Pemasukan', jenisKas: 'Kas Posbindu', jumlah: 1500000, pj: 'Sri Wahyuni' },
  { id: 'f3', tanggal: '2026-02-15', keterangan: 'Pembelian Reagen GDS, Chol, Asam Urat', kategori: 'Pengeluaran', jenisKas: 'Kas Cek Darah', jumlah: 850000, pj: 'Siti Rahma' },
  { id: 'f4', tanggal: '2026-03-10', keterangan: 'Konsumsi Kader & Lansia', kategori: 'Pengeluaran', jenisKas: 'Kas Posbindu', jumlah: 350000, pj: 'Kartini' },
  { id: 'f5', tanggal: '2026-04-18', keterangan: 'Pemasukan Swadaya Warga', kategori: 'Pemasukan', jenisKas: 'Kas Posbindu', jumlah: 650000, pj: 'Dewi Lestari' },
  { id: 'f6', tanggal: '2026-05-12', keterangan: 'Transport Petugas Puskesmas', kategori: 'Pengeluaran', jenisKas: 'Kas Posbindu', jumlah: 200000, pj: 'Sri Wahyuni' },
  { id: 'f7', tanggal: '2026-06-05', keterangan: 'Fotokopi Form Pencatatan', kategori: 'Pengeluaran', jenisKas: 'Kas Posbindu', jumlah: 75000, pj: 'Siti Rahma' }
];
