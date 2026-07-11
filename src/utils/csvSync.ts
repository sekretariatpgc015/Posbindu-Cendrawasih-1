import { Warga, Kunjungan } from '../types';

/**
 * Standard self-contained CSV parser that correctly handles quoted values,
 * escaped quotes, and newlines.
 */
export function parseCSV(text: string): string[][] {
  const lines: string[][] = [];
  let row: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current.trim());
      current = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(current.trim());
      current = '';
      if (row.length > 0 && row.some(cell => cell !== '')) {
        lines.push(row);
      }
      row = [];
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
    } else {
      current += char;
    }
  }
  
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some(cell => cell !== '')) {
      lines.push(row);
    }
  }
  
  return lines;
}

/**
 * Normalizes birthdate string from DD/MM/YYYY to YYYY-MM-DD
 */
export function parseDateToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

/**
 * Fetches and parses citizen data from Google Sheets CSV URL
 */
export async function fetchGoogleSheetWarga(url: string): Promise<Warga[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const csvText = await response.text();
  const rows = parseCSV(csvText);
  
  if (rows.length < 2) {
    throw new Error('CSV is empty or lacks headers.');
  }
  
  const header = rows[0].map(h => h.toUpperCase().trim());
  const idxNoKK = header.indexOf('NO KK');
  const idxNama = header.indexOf('NAMA');
  const idxJK = header.indexOf('JENIS KELAMIN');
  const idxNik = header.indexOf('NIK');
  const idxTglLahir = header.indexOf('TGL. LAHIR');
  const idxAlamat = header.indexOf('ALAMAT');
  const idxRt = header.indexOf('RT');
  
  if (idxNama === -1 || idxNik === -1) {
    throw new Error('Format CSV tidak sesuai. Kolom NAMA atau NIK tidak ditemukan.');
  }
  
  const parsedWargaList: Warga[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    // Safeguard row length
    if (row.length < Math.max(idxNama, idxNik) + 1) continue;
    
    const rawRt = idxRt !== -1 ? (row[idxRt] || '') : '01';
    let rtNum = parseInt(rawRt, 10);
    if (isNaN(rtNum)) rtNum = 1;
    const rtFormatted = rtNum.toString().padStart(2, '0');
    
    const rawJk = idxJK !== -1 ? (row[idxJK] || '').toUpperCase() : '';
    const jenisKelamin: 'Laki-laki' | 'Perempuan' = rawJk.includes('PEREMPUAN') || rawJk === 'P' || rawJk === 'PEREMPUAN' ? 'Perempuan' : 'Laki-laki';
    
    // Normalize NIK and No KK (strip non-digits for consistency)
    const rawNik = idxNik !== -1 ? (row[idxNik] || '').trim().replace(/\D/g, '') : '';
    const rawNoKK = idxNoKK !== -1 ? (row[idxNoKK] || '').trim().replace(/\D/g, '') : '';
    const rawNama = idxNama !== -1 ? (row[idxNama] || '').trim() : '';
    const rawAlamat = idxAlamat !== -1 ? (row[idxAlamat] || '').trim() : '';
    const rawTglLahir = idxTglLahir !== -1 ? (row[idxTglLahir] || '').trim() : '';
    
    const birthDate = parseDateToYYYYMMDD(rawTglLahir);
    
    parsedWargaList.push({
      id: rawNik ? `w-${rawNik}` : `w-csv-${i}`,
      noKK: rawNoKK || '3171000000000000',
      nama: rawNama || 'Tanpa Nama',
      jenisKelamin,
      nik: rawNik || `317100000000000${i}`,
      tanggalLahir: birthDate || '1980-01-01',
      alamat: rawAlamat || 'Alamat tidak diketahui',
      rt: rtFormatted
    });
  }
  
  return parsedWargaList;
}

/**
 * Fetches and parses visit (kunjungan) data from Google Sheets CSV URL
 */
export async function fetchGoogleSheetKunjungan(url: string): Promise<Kunjungan[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const csvText = await response.text();
  const rows = parseCSV(csvText);
  
  if (rows.length < 2) {
    throw new Error('CSV is empty or lacks headers.');
  }
  
  const header = rows[0].map(h => h.toUpperCase().trim());
  const idxNo = header.indexOf('NO');
  const idxTanggal = header.indexOf('TANGGAL');
  const idxNama = header.indexOf('NAMA');
  const idxJK = header.indexOf('JENIS KELAMIN');
  const idxNik = header.indexOf('NIK');
  const idxTglLahir = header.indexOf('TGL. LAHIR');
  const idxUsia = header.indexOf('USIA');
  const idxAlamat = header.indexOf('ALAMAT');
  const idxRt = header.indexOf('RT');
  const idxTd = header.indexOf('TD');
  const idxTb = header.indexOf('TB');
  const idxBb = header.indexOf('BB');
  const idxLp = header.indexOf('LP');
  const idxGds = header.indexOf('GDS');
  const idxChol = header.indexOf('CHOL');
  const idxAu = header.indexOf('AU');
  const idxHb = header.indexOf('HB');
  
  if (idxTanggal === -1 || idxNama === -1 || idxNik === -1) {
    throw new Error('Format CSV tidak sesuai. Kolom TANGGAL, NAMA, atau NIK tidak ditemukan.');
  }
  
  const parsedKunjunganList: Kunjungan[] = [];
  
  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/"/g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length < Math.max(idxTanggal, idxNama, idxNik) + 1) continue;
    
    const rawNo = idxNo !== -1 ? parseInt(row[idxNo] || '', 10) || i : i;
    const rawTanggal = idxTanggal !== -1 ? (row[idxTanggal] || '').trim() : '';
    const rawNama = idxNama !== -1 ? (row[idxNama] || '').trim() : '';
    const rawJk = idxJK !== -1 ? (row[idxJK] || '').toUpperCase() : '';
    const jenisKelamin: 'Laki-laki' | 'Perempuan' = rawJk.includes('PEREMPUAN') || rawJk === 'P' || rawJk === 'PEREMPUAN' ? 'Perempuan' : 'Laki-laki';
    const rawNik = idxNik !== -1 ? (row[idxNik] || '').trim().replace(/\D/g, '') : '';
    const rawTglLahir = idxTglLahir !== -1 ? (row[idxTglLahir] || '').trim() : '';
    const rawUsia = idxUsia !== -1 ? parseInt(row[idxUsia] || '', 10) || 0 : 0;
    const rawAlamat = idxAlamat !== -1 ? (row[idxAlamat] || '').trim() : '';
    
    const rawRt = idxRt !== -1 ? (row[idxRt] || '') : '01';
    let rtNum = parseInt(rawRt, 10);
    if (isNaN(rtNum)) rtNum = 1;
    const rtFormatted = rtNum.toString().padStart(3, '0'); // pad to 3 chars for standard "001" representation in this project

    const rawTd = idxTd !== -1 ? (row[idxTd] || '').trim() : '';
    const tdParts = rawTd.split('/');
    const tdSistolik = parseInt(tdParts[0], 10) || 0;
    const tdDiastolik = parseInt(tdParts[1], 10) || 0;

    const tb = idxTb !== -1 ? parseNumber(row[idxTb]) : 0;
    const bb = idxBb !== -1 ? parseNumber(row[idxBb]) : 0;
    const lp = idxLp !== -1 ? parseNumber(row[idxLp]) : 0;
    const gds = idxGds !== -1 ? parseNumber(row[idxGds]) : 0;
    const chol = idxChol !== -1 ? parseNumber(row[idxChol]) : 0;
    const au = idxAu !== -1 ? parseNumber(row[idxAu]) : 0;
    const hb = idxHb !== -1 ? parseNumber(row[idxHb]) : 0;

    const visitDate = parseDateToYYYYMMDD(rawTanggal);
    const birthDate = parseDateToYYYYMMDD(rawTglLahir);

    parsedKunjunganList.push({
      id: `g_sheet_visit_${i}`,
      no: rawNo,
      tanggal: visitDate,
      nama: rawNama,
      jenisKelamin,
      nik: rawNik,
      tanggalLahir: birthDate,
      usia: rawUsia,
      alamat: rawAlamat,
      rt: rtFormatted,
      tdSistolik,
      tdDiastolik,
      tb,
      bb,
      lp,
      gds,
      chol,
      au,
      hb
    });
  }
  
  return parsedKunjunganList;
}
