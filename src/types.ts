export interface Warga {
  id: string;
  noKK: string;
  nama: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  nik: string;
  tanggalLahir: string;
  alamat: string;
  rt: string;
}

export interface Kunjungan {
  id: string;
  no: number; // Running number
  tanggal: string;
  nama: string;
  jenisKelamin: 'Laki-laki' | 'Perempuan';
  nik: string;
  tanggalLahir: string;
  usia: number;
  alamat: string;
  rt: string;
  tdSistolik: number; // e.g. 120
  tdDiastolik: number; // e.g. 80
  tb: number; // cm
  bb: number; // kg
  lp: number; // cm (Lingkar Perut)
  gds: number; // mg/dL
  chol: number; // mg/dL
  au: number; // mg/dL (Asam Urat)
  hb: number; // g/dL (Hemoglobin)
}

export interface KeuanganRecord {
  id: string;
  tanggal: string;
  keterangan: string;
  kategori: 'Pemasukan' | 'Pengeluaran';
  jenisKas: 'Kas Posbindu' | 'Kas Cek Darah';
  jumlah: number;
  pj: string; // Penanggung Jawab
}
