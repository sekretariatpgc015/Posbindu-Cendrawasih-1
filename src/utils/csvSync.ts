import { Warga, Kunjungan, KeuanganRecord } from '../types';

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

const DIRECT_WARGA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYG3FkCHn7OXTyiLCtqdLwFkFexQQVXVlPtwpxIOlzWt3mpcCZbMyYDp2p4PabbbQnB1GciwkokN20/pub?gid=1055267267&single=true&output=csv';
const DIRECT_KUNJUNGAN_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYG3FkCHn7OXTyiLCtqdLwFkFexQQVXVlPtwpxIOlzWt3mpcCZbMyYDp2p4PabbbQnB1GciwkokN20/pub?gid=0&single=true&output=csv';

/**
 * Fetches and parses citizen data from Google Sheets CSV URL with fallback
 */
export async function fetchGoogleSheetWarga(url: string): Promise<Warga[]> {
  let csvText = '';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    csvText = await response.text();
  } catch (proxyError) {
    console.warn('Failed to fetch via proxy, trying direct Google Sheet request:', proxyError);
    try {
      const directResponse = await fetch(DIRECT_WARGA_URL);
      if (!directResponse.ok) {
        throw new Error(`HTTP error from direct sheets! status: ${directResponse.status}`);
      }
      csvText = await directResponse.text();
    } catch (directError: any) {
      console.error('Both proxy and direct Google Sheet fetch failed:', directError);
      throw new Error(`Gagal memuat data warga: ${directError.message || directError}`);
    }
  }
  
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
 * Fetches and parses visit (kunjungan) data from Google Sheets CSV URL with fallback
 */
export async function fetchGoogleSheetKunjungan(url: string): Promise<Kunjungan[]> {
  let csvText = '';
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    csvText = await response.text();
  } catch (proxyError) {
    console.warn('Failed to fetch via proxy, trying direct Google Sheet request for kunjungan:', proxyError);
    try {
      const directResponse = await fetch(DIRECT_KUNJUNGAN_URL);
      if (!directResponse.ok) {
        throw new Error(`HTTP error from direct sheets! status: ${directResponse.status}`);
      }
      csvText = await directResponse.text();
    } catch (directError: any) {
      console.error('Both proxy and direct Google Sheet fetch failed for kunjungan:', directError);
      throw new Error(`Gagal memuat data kunjungan: ${directError.message || directError}`);
    }
  }
  
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

const DIRECT_KEUANGAN_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4ogCEXTgnL-4hBAv5RRaHptZtZ9mQAolKiXsp6TTDzx-PRuF7W3aSqAwzvOH3LXiTYbH-E4q74eP4/pub?gid=0&single=true&output=csv';
const DIRECT_KEUANGAN_CEK_DARAH_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4ogCEXTgnL-4hBAv5RRaHptZtZ9mQAolKiXsp6TTDzx-PRuF7W3aSqAwzvOH3LXiTYbH-E4q74eP4/pub?gid=878787721&single=true&output=csv';

/**
 * Fetches and parses financial (keuangan) data from Google Sheets CSV URL with fallback
 */
export async function fetchGoogleSheetKeuangan(
  url: string,
  defaultJenisKas: 'Kas Posbindu' | 'Kas Cek Darah' = 'Kas Posbindu'
): Promise<KeuanganRecord[]> {
  let csvText = '';
  const fallbackUrl = defaultJenisKas === 'Kas Cek Darah' ? DIRECT_KEUANGAN_CEK_DARAH_URL : DIRECT_KEUANGAN_URL;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    csvText = await response.text();
  } catch (proxyError) {
    console.warn('Failed to fetch via proxy, trying direct Google Sheet request for keuangan:', proxyError);
    try {
      const directResponse = await fetch(fallbackUrl);
      if (!directResponse.ok) {
        throw new Error(`HTTP error from direct sheets! status: ${directResponse.status}`);
      }
      csvText = await directResponse.text();
    } catch (directError: any) {
      console.error('Both proxy and direct Google Sheet fetch failed for keuangan:', directError);
      throw new Error(`Gagal memuat data keuangan: ${directError.message || directError}`);
    }
  }
  
  if (!csvText || csvText.trim() === '') {
    return [];
  }
  
  const rows = parseCSV(csvText);
  
  if (rows.length < 2) {
    return [];
  }
  
  const header = rows[0].map(h => h.toUpperCase().trim());
  const idxTanggal = header.indexOf('TANGGAL');
  const idxKeterangan = header.indexOf('KETERANGAN');
  const idxKategori = header.indexOf('KATEGORI');
  const idxJenisKas = header.indexOf('JENIS KAS');
  const idxJumlah = header.indexOf('JUMLAH');
  const idxPj = header.indexOf('PJ');
  
  const idxPemasukan = header.indexOf('PEMASUKAN');
  const idxPengeluaran = header.indexOf('PENGELUARAN');
  const idxUraian = header.indexOf('URAIAN') !== -1 ? header.indexOf('URAIAN') : idxKeterangan;
  
  // Check if spreadsheet is in 4-column format [TANGGAL, URAIAN, PEMASUKAN, PENGELUARAN]
  const isFourColumnLayout = idxPemasukan !== -1 || idxPengeluaran !== -1;

  const parsedKeuanganList: KeuanganRecord[] = [];
  
  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/"/g, '').replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, '').trim();
    return parseFloat(cleaned) || 0;
  };

  if (isFourColumnLayout) {
    const actualTanggalIdx = idxTanggal !== -1 ? idxTanggal : 0;
    const actualUraianIdx = idxUraian !== -1 ? idxUraian : 1;
    const actualPemasukanIdx = idxPemasukan !== -1 ? idxPemasukan : 2;
    const actualPengeluaranIdx = idxPengeluaran !== -1 ? idxPengeluaran : 3;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue;
      
      const rawTanggal = row[actualTanggalIdx] || '';
      const rawUraian = row[actualUraianIdx] || '';
      const rawPemasukan = row[actualPemasukanIdx] || '';
      const rawPengeluaran = row[actualPengeluaranIdx] || '';
      
      if (!rawTanggal && !rawUraian) continue;

      const visitDate = parseDateToYYYYMMDD(rawTanggal);
      const valPemasukan = parseNumber(rawPemasukan);
      const valPengeluaran = parseNumber(rawPengeluaran);
      
      // Determine if it is income or expense
      const kategoriValue: 'Pemasukan' | 'Pengeluaran' = valPengeluaran > 0 && valPemasukan === 0 ? 'Pengeluaran' : 'Pemasukan';
      const jumlahValue = valPengeluaran > 0 && valPemasukan === 0 ? valPengeluaran : valPemasukan;

      parsedKeuanganList.push({
        id: `g_sheet_finance_${i}_${Date.now()}`,
        tanggal: visitDate || '2026-07-04',
        keterangan: rawUraian.trim() || 'Transaksi Tanpa Keterangan',
        kategori: kategoriValue,
        jenisKas: defaultJenisKas,
        jumlah: jumlahValue,
        pj: 'Kader'
      });
    }
  } else {
    // Alternative headers
    const idxNominal = idxJumlah !== -1 ? idxJumlah : header.indexOf('NOMINAL');
    const idxPenanggungJawab = idxPj !== -1 ? idxPj : header.indexOf('PENANGGUNG JAWAB');
    
    // Fallbacks or errors
    const actualTanggalIdx = idxTanggal !== -1 ? idxTanggal : 0;
    const actualKeteranganIdx = idxUraian !== -1 ? idxUraian : 1;
    const actualKategoriIdx = idxKategori !== -1 ? idxKategori : 2;
    const actualJenisKasIdx = idxJenisKas !== -1 ? idxJenisKas : 3;
    const actualJumlahIdx = idxNominal !== -1 ? idxNominal : 4;
    const actualPjIdx = idxPenanggungJawab !== -1 ? idxPj : 5;

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length < 2) continue; // Skip empty rows
      
      const rawTanggal = row[actualTanggalIdx] || '';
      const rawKeterangan = row[actualKeteranganIdx] || '';
      const rawKategori = row[actualKategoriIdx] || 'Pemasukan';
      const rawJenisKas = row[actualJenisKasIdx] || '';
      const rawJumlah = row[actualJumlahIdx] || '0';
      const rawPj = row[actualPjIdx] || '';
      
      if (!rawTanggal && !rawKeterangan) continue; // Skip rows that are empty
      
      const visitDate = parseDateToYYYYMMDD(rawTanggal);
      const kategoriValue: 'Pemasukan' | 'Pengeluaran' = rawKategori.trim().toLowerCase().includes('keluar') ? 'Pengeluaran' : 'Pemasukan';
      
      let jenisKasValue: 'Kas Posbindu' | 'Kas Cek Darah' = defaultJenisKas;
      if (idxJenisKas !== -1 && rawJenisKas) {
        jenisKasValue = rawJenisKas.trim().toLowerCase().includes('cek') ? 'Kas Cek Darah' : 'Kas Posbindu';
      }
      
      const jumlahValue = parseNumber(rawJumlah);
      
      parsedKeuanganList.push({
        id: `g_sheet_finance_${i}_${Date.now()}`,
        tanggal: visitDate || '2026-07-04',
        keterangan: rawKeterangan.trim() || 'Transaksi Tanpa Keterangan',
        kategori: kategoriValue,
        jenisKas: jenisKasValue,
        jumlah: jumlahValue,
        pj: rawPj.trim() || 'Kader'
      });
    }
  }
  
  return parsedKeuanganList;
}
