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
 * Normalizes birthdate string from DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD to YYYY-MM-DD
 */
export function parseDateToYYYYMMDD(dateStr: string): string {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  const separator = clean.includes('/') ? '/' : clean.includes('-') ? '-' : '';
  if (!separator) return dateStr;
  
  const parts = clean.split(separator);
  if (parts.length === 3) {
    let day = '';
    let month = '';
    let year = '';
    
    // Check if parts[0] is year (YYYY-MM-DD)
    if (parts[0].length === 4) {
      year = parts[0];
      month = parts[1].padStart(2, '0');
      day = parts[2].padStart(2, '0');
    } else {
      // Assuming DD-MM-YYYY or DD/MM/YYYY
      day = parts[0].padStart(2, '0');
      month = parts[1].padStart(2, '0');
      year = parts[2];
      
      if (year.length === 2) {
        const yr = parseInt(year, 10);
        year = yr > 50 ? `19${year}` : `20${year}`;
      }
    }
    
    if (day && month && year) {
      return `${year}-${month}-${day}`;
    }
  }
  return dateStr;
}

/**
 * Extracts birth date (YYYY-MM-DD) from Indonesian NIK (16 digits)
 */
export function getBirthdateFromNIK(nik: string): string {
  if (!nik) return '';
  const cleanNik = nik.trim().replace(/\s/g, '');
  if (cleanNik.length !== 16 || !/^\d+$/.test(cleanNik)) return '';
  
  const dayStr = cleanNik.substring(6, 8);
  const monthStr = cleanNik.substring(8, 10);
  const yearStr = cleanNik.substring(10, 12);
  
  let day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return '';
  if (month < 1 || month > 12) return '';
  
  if (day > 40) {
    day -= 40;
  }
  if (day < 1 || day > 31) return '';
  
  const currentYearLastTwo = new Date().getFullYear() % 100;
  const fullYear = year > currentYearLastTwo ? 1900 + year : 2000 + year;
  
  return `${fullYear}-${monthStr.padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

const DIRECT_WARGA_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTYG3FkCHn7OXTyiLCtqdLwFkFexQQVXVlPtwpxIOlzWt3mpcCZbMyYDp2p4PabbbQnB1GciwkokN20/pub?gid=1055267267&single=true&output=csv';
const DIRECT_KUNJUNGAN_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQ4OSVPITouakbSPpjRpmCmotvIp98MGWNdZmPs4isrOiU2KTGfXSRz89UBfTkf5Xc1a4D57mKXcVDU/pub?gid=0&single=true&output=csv';

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
  
  if (rows.length < 1) {
    return [];
  }
  
  // Try to find headers in the first row or any of the top 20 rows
  let headerRowIndex = -1;
  let hasHeaders = false;
  
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const h = rows[i].map(cell => cell.toUpperCase().trim());
    if (h.includes('NAMA') && (h.includes('NIK') || h.includes('RT') || h.includes('ALAMAT'))) {
      headerRowIndex = i;
      hasHeaders = true;
      break;
    }
  }
  
  let idxNoKK = -1;
  let idxNama = -1;
  let idxJK = -1;
  let idxNik = -1;
  let idxTglLahir = -1;
  let idxAlamat = -1;
  let idxRt = -1;
  
  if (hasHeaders && headerRowIndex !== -1) {
    const header = rows[headerRowIndex].map(h => h.toUpperCase().trim());
    idxNoKK = header.indexOf('NO KK');
    if (idxNoKK === -1) idxNoKK = header.indexOf('NO. KK');
    idxNama = header.indexOf('NAMA');
    idxJK = header.indexOf('JENIS KELAMIN');
    idxNik = header.indexOf('NIK');
    idxTglLahir = header.indexOf('TGL. LAHIR');
    if (idxTglLahir === -1) idxTglLahir = header.indexOf('TANGGAL LAHIR');
    idxAlamat = header.indexOf('ALAMAT');
    idxRt = header.indexOf('RT');
  }
  
  const parseScientificToFullString = (val: string): string => {
    if (!val) return '';
    const cleaned = val.trim().replace(',', '.');
    if (cleaned.toUpperCase().includes('E+')) {
      try {
        const num = Number(cleaned);
        if (!isNaN(num)) {
          return num.toLocaleString('fullwide', { useGrouping: false });
        }
      } catch (e) {}
    }
    return val.replace(/\D/g, '');
  };

  const parsedWargaList: Warga[] = [];
  const startRow = hasHeaders ? headerRowIndex + 1 : 0;
  
  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    // Skip empty rows
    if (row.length < 4 || row.filter(cell => cell.trim() !== '').length < 2) {
      continue;
    }
    
    let currentNoKK = '';
    let currentNama = '';
    let currentJk = '';
    let currentNik = '';
    let currentTglLahir = '';
    let currentAlamat = '';
    let currentRt = '001';
    
    if (!hasHeaders || idxNama === -1 || idxNik === -1) {
      // Heuristic detection of core columns
      let s = -1;
      for (let j = 0; j < row.length - 6; j++) {
        const potentialJk = (row[j + 2] || '').toUpperCase();
        const isJk = potentialJk.includes('PEREMPUAN') || potentialJk.includes('LAKI') || potentialJk === 'P' || potentialJk === 'L';
        const birthCell = row[j + 4] || '';
        const isBirthDate = birthCell.includes('/') && birthCell.trim().split('/').length === 3;
        
        if (isJk && isBirthDate) {
          s = j;
          break;
        }
      }
      
      if (s !== -1) {
        currentNoKK = parseScientificToFullString(row[s] || '');
        currentNama = (row[s + 1] || '').trim();
        currentJk = (row[s + 2] || '').trim();
        currentNik = parseScientificToFullString(row[s + 3] || '');
        currentTglLahir = (row[s + 4] || '').trim();
        currentAlamat = (row[s + 5] || '').trim();
        currentRt = (row[s + 6] || '').trim();
      } else {
        // Absolute fallback based on row length
        const offset = row.length >= 7 ? 0 : 0;
        currentNoKK = parseScientificToFullString(row[offset] || '');
        currentNama = (row[offset + 1] || '').trim();
        currentJk = (row[offset + 2] || '').trim();
        currentNik = parseScientificToFullString(row[offset + 3] || '');
        currentTglLahir = (row[offset + 4] || '').trim();
        currentAlamat = (row[offset + 5] || '').trim();
        currentRt = (row[offset + 6] || '').trim();
      }
    } else {
      currentNoKK = idxNoKK !== -1 ? parseScientificToFullString(row[idxNoKK]) : '';
      currentNama = idxNama !== -1 ? (row[idxNama] || '').trim() : '';
      currentJk = idxJK !== -1 ? (row[idxJK] || '').trim() : '';
      currentNik = idxNik !== -1 ? parseScientificToFullString(row[idxNik]) : '';
      currentTglLahir = idxTglLahir !== -1 ? (row[idxTglLahir] || '').trim() : '';
      currentAlamat = idxAlamat !== -1 ? (row[idxAlamat] || '').trim() : '';
      currentRt = idxRt !== -1 ? (row[idxRt] || '') : '001';
    }
    
    let rtNum = parseInt(currentRt, 10);
    if (isNaN(rtNum)) rtNum = 1;
    const rtFormatted = rtNum.toString().padStart(3, '0');
    
    const rawJk = currentJk.toUpperCase();
    const jenisKelamin: 'Laki-laki' | 'Perempuan' = rawJk.includes('PEREMPUAN') || rawJk === 'P' ? 'Perempuan' : 'Laki-laki';
    
    const birthDate = parseDateToYYYYMMDD(currentTglLahir);
    
    parsedWargaList.push({
      id: currentNik ? `w-${currentNik}` : `w-csv-${i}`,
      noKK: currentNoKK || '3171000000000000',
      nama: currentNama || 'Tanpa Nama',
      jenisKelamin,
      nik: currentNik || `317100000000000${i}`,
      tanggalLahir: birthDate || '1980-01-01',
      alamat: currentAlamat || 'Alamat tidak diketahui',
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
  
  if (rows.length < 1) {
    return [];
  }
  
  // Try to find headers in the first row or any of the top 20 rows
  let headerRowIndex = -1;
  let hasHeaders = false;
  
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const h = rows[i].map(cell => cell.toUpperCase().trim());
    if (h.includes('NAMA') && (h.includes('NIK') || h.includes('TANGGAL') || h.includes('TGL. LAHIR'))) {
      headerRowIndex = i;
      hasHeaders = true;
      break;
    }
  }
  
  let idxNo = -1;
  let idxTanggal = -1;
  let idxNama = -1;
  let idxJK = -1;
  let idxNik = -1;
  let idxTglLahir = -1;
  let idxUsia = -1;
  let idxAlamat = -1;
  let idxRt = -1;
  let idxTd = -1;
  let idxTb = -1;
  let idxBb = -1;
  let idxLp = -1;
  let idxGds = -1;
  let idxChol = -1;
  let idxAu = -1;
  let idxHb = -1;
  
  if (hasHeaders && headerRowIndex !== -1) {
    const header = rows[headerRowIndex].map(h => h.toUpperCase().trim());
    idxNo = header.indexOf('NO');
    idxTanggal = header.indexOf('TANGGAL');
    idxNama = header.indexOf('NAMA');
    idxJK = header.indexOf('JENIS KELAMIN');
    idxNik = header.indexOf('NIK');
    idxTglLahir = header.indexOf('TGL. LAHIR');
    if (idxTglLahir === -1) idxTglLahir = header.indexOf('TANGGAL LAHIR');
    idxUsia = header.indexOf('USIA');
    idxAlamat = header.indexOf('ALAMAT');
    idxRt = header.indexOf('RT');
    idxTd = header.indexOf('TD');
    idxTb = header.indexOf('TB');
    idxBb = header.indexOf('BB');
    idxLp = header.indexOf('LP');
    idxGds = header.indexOf('GDS');
    idxChol = header.indexOf('CHOL');
    idxAu = header.indexOf('AU');
    idxHb = header.indexOf('HB');
  }
  
  const parsedKunjunganList: Kunjungan[] = [];
  
  const parseNumber = (val: string): number => {
    if (!val) return 0;
    const cleaned = val.replace(/"/g, '').replace(',', '.').trim();
    return parseFloat(cleaned) || 0;
  };

  const parseScientificToFullString = (val: string): string => {
    if (!val) return '';
    const cleaned = val.trim().replace(',', '.');
    if (cleaned.toUpperCase().includes('E+')) {
      try {
        const num = Number(cleaned);
        if (!isNaN(num)) {
          return num.toLocaleString('fullwide', { useGrouping: false });
        }
      } catch (e) {}
    }
    return val.replace(/\D/g, '');
  };

  const startRow = hasHeaders ? headerRowIndex + 1 : 0;

  for (let i = startRow; i < rows.length; i++) {
    const row = rows[i];
    // Skip empty rows
    if (row.length < 5 || row.filter(cell => cell.trim() !== '').length < 3) {
      continue;
    }
    
    let currentTanggal = '';
    let currentNama = '';
    let currentJk = '';
    let currentNik = '';
    let currentTglLahir = '';
    let currentUsia = 0;
    let currentAlamat = '';
    let currentRt = '001';
    let tdSistolik = 0;
    let tdDiastolik = 0;
    let tb = 0;
    let bb = 0;
    let lp = 0;
    let gds = 0;
    let chol = 0;
    let au = 0;
    let hb = 0;
    let rawNo = i;

    // Fallback detection logic if headers are not found or mapped
    if (!hasHeaders || idxNama === -1 || idxNik === -1 || idxTanggal === -1) {
      // Find starting index S of the core info sequence: Date, Nama, JK, NIK, TglLahir, Usia, Alamat, RT
      let s = -1;
      for (let j = 0; j < row.length - 7; j++) {
        const cell = row[j] || '';
        const isDate = cell.includes('/') && cell.trim().split('/').length === 3;
        const potentialJk = (row[j + 2] || '').toUpperCase();
        const isJk = potentialJk.includes('PEREMPUAN') || potentialJk.includes('LAKI') || potentialJk === 'P' || potentialJk === 'L';
        const birthCell = row[j + 4] || '';
        const isBirthDate = birthCell.includes('/') && birthCell.trim().split('/').length === 3;
        
        if (isDate && isJk && isBirthDate) {
          s = j;
          break;
        }
      }

      if (s !== -1) {
        currentTanggal = row[s] || '';
        currentNama = (row[s + 1] || '').trim();
        currentJk = (row[s + 2] || '').trim();
        currentNik = parseScientificToFullString(row[s + 3] || '');
        currentTglLahir = (row[s + 4] || '').trim();
        currentUsia = parseInt(row[s + 5] || '', 10) || 0;
        currentAlamat = (row[s + 6] || '').trim();
        currentRt = (row[s + 7] || '').trim();
        
        // Health metrics start after RT
        const remaining = row.slice(s + 8);
        
        // Find TB index H in remaining elements (value between 100 and 200)
        let h = -1;
        for (let k = 0; k < remaining.length; k++) {
          const valNum = parseNumber(remaining[k]);
          if (valNum >= 100 && valNum <= 200) {
            h = k;
            break;
          }
        }

        // If H is found, parse the sequence of 7 health metrics
        if (h !== -1) {
          tb = parseNumber(remaining[h]);
          bb = h + 1 < remaining.length ? parseNumber(remaining[h + 1]) : 0;
          lp = h + 2 < remaining.length ? parseNumber(remaining[h + 2]) : 0;
          gds = h + 3 < remaining.length ? parseNumber(remaining[h + 3]) : 0;
          chol = h + 4 < remaining.length ? parseNumber(remaining[h + 4]) : 0;
          au = h + 5 < remaining.length ? parseNumber(remaining[h + 5]) : 0;
          hb = h + 6 < remaining.length ? parseNumber(remaining[h + 6]) : 0;

          // Elements before H are part of TD
          const tdElements = remaining.slice(0, h).map(cell => cell.trim()).filter(cell => cell !== '');
          if (tdElements.length > 0) {
            // Check if any element contains '/'
            const withSlash = tdElements.find(cell => cell.includes('/'));
            if (withSlash) {
              const parts = withSlash.split('/');
              tdSistolik = parseInt(parts[0], 10) || 0;
              tdDiastolik = parseInt(parts[1], 10) || 0;
            } else if (tdElements.length >= 2) {
              tdSistolik = parseInt(tdElements[0], 10) || 0;
              tdDiastolik = parseInt(tdElements[1], 10) || 0;
            } else if (tdElements.length === 1) {
              const val = parseInt(tdElements[0], 10) || 0;
              if (val > 100) {
                tdSistolik = val;
                tdDiastolik = 80; // default diastolic
              } else if (val > 0) {
                tdSistolik = 120; // default systolic
                tdDiastolik = val;
              }
            }
          }
        } else {
          // Default positional fallback if height not found
          const rawTd = s + 8 < row.length ? (row[s + 8] || '').trim() : '';
          const parts = rawTd.split('/');
          tdSistolik = parseInt(parts[0], 10) || 0;
          tdDiastolik = parseInt(parts[1], 10) || 0;
          tb = s + 9 < row.length ? parseNumber(row[s + 9]) : 0;
          bb = s + 10 < row.length ? parseNumber(row[s + 10]) : 0;
          lp = s + 11 < row.length ? parseNumber(row[s + 11]) : 0;
          gds = s + 12 < row.length ? parseNumber(row[s + 12]) : 0;
          chol = s + 13 < row.length ? parseNumber(row[s + 13]) : 0;
          au = s + 14 < row.length ? parseNumber(row[s + 14]) : 0;
          hb = s + 15 < row.length ? parseNumber(row[s + 15]) : 0;
        }
      } else {
        // Absolute fallback using hardcoded index list (shifted by +2 because of 2 empty columns)
        const offset = 2;
        currentTanggal = row[offset] || '';
        currentNama = (row[offset + 1] || '').trim();
        currentJk = (row[offset + 2] || '').trim();
        currentNik = parseScientificToFullString(row[offset + 3] || '');
        currentTglLahir = (row[offset + 4] || '').trim();
        currentUsia = parseInt(row[offset + 5] || '', 10) || 0;
        currentAlamat = (row[offset + 6] || '').trim();
        currentRt = (row[offset + 7] || '').trim();
        
        const rawTd = row[offset + 8] || '';
        const parts = rawTd.split('/');
        tdSistolik = parseInt(parts[0], 10) || 0;
        tdDiastolik = parseInt(parts[1], 10) || 0;
        tb = parseNumber(row[offset + 9] || '');
        bb = parseNumber(row[offset + 10] || '');
        lp = parseNumber(row[offset + 11] || '');
        gds = parseNumber(row[offset + 12] || '');
        chol = parseNumber(row[offset + 13] || '');
        au = parseNumber(row[offset + 14] || '');
        hb = parseNumber(row[offset + 15] || '');
      }
    } else {
      // Standard header-based parsing
      rawNo = idxNo !== -1 ? parseInt(row[idxNo] || '', 10) || i : i;
      currentTanggal = idxTanggal !== -1 ? (row[idxTanggal] || '').trim() : '';
      currentNama = idxNama !== -1 ? (row[idxNama] || '').trim() : '';
      currentJk = idxJK !== -1 ? (row[idxJK] || '').trim() : '';
      currentNik = idxNik !== -1 ? parseScientificToFullString(row[idxNik]) : '';
      currentTglLahir = idxTglLahir !== -1 ? (row[idxTglLahir] || '').trim() : '';
      currentUsia = idxUsia !== -1 ? parseInt(row[idxUsia] || '', 10) || 0 : 0;
      currentAlamat = idxAlamat !== -1 ? (row[idxAlamat] || '').trim() : '';
      currentRt = idxRt !== -1 ? (row[idxRt] || '') : '001';
      
      if (idxTd !== -1) {
        const rawTd = (row[idxTd] || '').trim();
        const parts = rawTd.split('/');
        tdSistolik = parseInt(parts[0], 10) || 0;
        tdDiastolik = parseInt(parts[1], 10) || 0;
      }
      
      tb = idxTb !== -1 ? parseNumber(row[idxTb]) : 0;
      bb = idxBb !== -1 ? parseNumber(row[idxBb]) : 0;
      lp = idxLp !== -1 ? parseNumber(row[idxLp]) : 0;
      gds = idxGds !== -1 ? parseNumber(row[idxGds]) : 0;
      chol = idxChol !== -1 ? parseNumber(row[idxChol]) : 0;
      au = idxAu !== -1 ? parseNumber(row[idxAu]) : 0;
      hb = idxHb !== -1 ? parseNumber(row[idxHb]) : 0;
    }

    const jenisKelamin: 'Laki-laki' | 'Perempuan' = 
      currentJk.toUpperCase().includes('PEREMPUAN') || currentJk.toUpperCase() === 'P' 
        ? 'Perempuan' 
        : 'Laki-laki';

    let rtNum = parseInt(currentRt, 10);
    if (isNaN(rtNum)) rtNum = 1;
    const rtFormatted = rtNum.toString().padStart(3, '0');

    const visitDate = parseDateToYYYYMMDD(currentTanggal) || '2026-07-04';
    let birthDate = parseDateToYYYYMMDD(currentTglLahir);

    if (!birthDate && currentNik) {
      birthDate = getBirthdateFromNIK(currentNik);
    }
    if (!birthDate) {
      birthDate = '1980-01-01';
    }

    let finalUsia = currentUsia;
    if ((finalUsia === 0 || !finalUsia) && birthDate && visitDate) {
      const bDate = new Date(birthDate);
      const vDate = new Date(visitDate);
      if (!isNaN(bDate.getTime()) && !isNaN(vDate.getTime())) {
        let age = vDate.getFullYear() - bDate.getFullYear();
        const m = vDate.getMonth() - bDate.getMonth();
        if (m < 0 || (m === 0 && vDate.getDate() < bDate.getDate())) {
          age--;
        }
        finalUsia = age >= 0 ? age : 0;
      }
    }

    parsedKunjunganList.push({
      id: `g_sheet_visit_${i}`,
      no: rawNo,
      tanggal: visitDate,
      nama: currentNama || 'Tanpa Nama',
      jenisKelamin,
      nik: currentNik,
      tanggalLahir: birthDate,
      usia: finalUsia,
      alamat: currentAlamat || 'Alamat tidak diketahui',
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
