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

export const initialWarga: Warga[] = [];

export const initialKunjungan: Kunjungan[] = [];

export const initialKeuangan: KeuanganRecord[] = [];
