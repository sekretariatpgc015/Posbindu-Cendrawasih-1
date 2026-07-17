import React, { useState, useEffect, useMemo } from 'react';
import { Save, RefreshCw, UserCheck, HeartPulse, Search, Info, ChevronRight, FileText, Download, AlertTriangle, Filter, Printer, Settings, Copy, Check, Cloud, Code2 } from 'lucide-react';
import { Warga, Kunjungan } from '../types';
import { calculateAge } from '../data/mockData';
import { fetchGoogleSheetKunjungan, parseDateToYYYYMMDD } from '../utils/csvSync';

interface FormPTMViewProps {
  wargaList: Warga[];
  kunjunganList: Kunjungan[];
  onSaveKunjungan: (newKunjungan: Kunjungan, isNewWarga: Warga | null) => void;
  onNavigateToDashboard: () => void;
}

export default function FormPTMView({ wargaList, kunjunganList, onSaveKunjungan, onNavigateToDashboard }: FormPTMViewProps) {
  // Google Sheets Kunjungan Data State
  const [externalKunjunganList, setExternalKunjunganList] = useState<Kunjungan[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [printPreviewMode, setPrintPreviewMode] = useState<"none" | "kunjungan" | "hipertensi">("none");

  // Google Sheets Integration State
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const stored = localStorage.getItem('posbindu_kunjungan_apps_script_url');
    if (stored && stored.trim() !== '') return stored;
    return localStorage.getItem('posbindu_apps_script_url') || '';
  });
  const [sendToGSheets, setSendToGSheets] = useState<boolean>(() => {
    return localStorage.getItem('posbindu_kunjungan_send_to_gsheets') === 'true';
  });
  const [isSubmittingToGSheets, setIsSubmittingToGSheets] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAppsScriptInstructions, setShowAppsScriptInstructions] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('posbindu_kunjungan_last_synced') || null;
  });

  useEffect(() => {
    localStorage.setItem('posbindu_kunjungan_apps_script_url', appsScriptUrl);
  }, [appsScriptUrl]);

  useEffect(() => {
    localStorage.setItem('posbindu_kunjungan_send_to_gsheets', sendToGSheets ? 'true' : 'false');
  }, [sendToGSheets]);

  const handleSyncGoogleSheet = async (silent = false) => {
    if (isLoadingExternal) return;
    setIsLoadingExternal(true);
    setExternalError(null);
    try {
      let data: Kunjungan[] = [];
      let fetchedUsingAppsScript = false;

      if (appsScriptUrl && appsScriptUrl.trim() !== '') {
        try {
          const response = await fetch('/api/submit-keuangan-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: appsScriptUrl.trim(),
              payload: { action: 'read' }
            })
          });

          if (response.ok) {
            const resData = await response.json();
            if (resData.success && Array.isArray(resData.data)) {
              data = resData.data.map((item: any) => ({
                id: item.id || `k-${Date.now()}-${Math.random()}`,
                no: parseInt(item.no) || 0,
                tanggal: parseDateToYYYYMMDD(item.tanggal || ''),
                nama: item.nama || '',
                jenisKelamin: item.jenisKelamin || 'Laki-laki',
                nik: item.nik || '',
                tanggalLahir: parseDateToYYYYMMDD(item.tanggalLahir || ''),
                usia: parseInt(item.usia) || 0,
                alamat: item.alamat || '',
                rt: (item.rt || '').toString().trim().replace(/\D/g, '').padStart(3, '0') || '001',
                tdSistolik: parseInt(item.tdSistolik) || 0,
                tdDiastolik: parseInt(item.tdDiastolik) || 0,
                tb: parseFloat(item.tb) || 0,
                bb: parseFloat(item.bb) || 0,
                lp: parseFloat(item.lp) || 0,
                gds: parseInt(item.gds) || 0,
                chol: parseInt(item.chol) || 0,
                au: parseFloat(item.au) || 0,
                hb: parseFloat(item.hb) || 0,
              }));
              fetchedUsingAppsScript = true;
            }
          }
        } catch (asErr) {
          console.warn('Failed to fetch via custom Apps Script read action, falling back to public CSV:', asErr);
        }
      }

      if (!fetchedUsingAppsScript) {
        data = await fetchGoogleSheetKunjungan('/api/proxy-kunjungan');
      }

      if (data) {
        setExternalKunjunganList(data);
        const now = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        setLastSynced(now);
        localStorage.setItem('posbindu_kunjungan_last_synced', now);
        if (!silent) {
          setNotificationMessage(`Berhasil menyinkronkan ${data.length} data kunjungan dari Google Sheets!`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }
      }
    } catch (err: any) {
      console.error('Failed to sync kunjungan from Google Sheets:', err);
      if (!silent) {
        setExternalError(err.message || 'Gagal menyinkronkan data dari Google Sheets.');
      }
    } finally {
      setIsLoadingExternal(false);
    }
  };

  useEffect(() => {
    handleSyncGoogleSheet(true);
  }, []);

  // Merge local edits/additions with external list (ensure newly added sessions are prepended)
  const activeKunjunganList = useMemo(() => {
    if (externalKunjunganList.length === 0) return kunjunganList;
    const externalIds = new Set(externalKunjunganList.map(k => k.id));
    const localOnly = kunjunganList.filter(k => !externalIds.has(k.id));
    return [...localOnly, ...externalKunjunganList];
  }, [externalKunjunganList, kunjunganList]);

  // Automatically calculate the next sequential 'No'
  const nextNo = useMemo(() => {
    if (activeKunjunganList.length === 0) return 1;
    const maxNo = Math.max(...activeKunjunganList.map(k => k.no || 0));
    return maxNo + 1;
  }, [activeKunjunganList]);

  // Form Fields State
  const [tanggal, setTanggal] = useState<string>('2026-07-04'); // default to current local date
  const [nik, setNik] = useState<string>('');
  const [nama, setNama] = useState<string>('');
  const [jenisKelamin, setJenisKelamin] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [tanggalLahir, setTanggalLahir] = useState<string>('');
  const [usia, setUsia] = useState<number>(0);
  const [alamat, setAlamat] = useState<string>('');
  const [rt, setRt] = useState<string>('001');
  const [noKK, setNoKK] = useState<string>(''); // For adding to citizen list if new

  // Health Metrics
  const [tdSistolik, setTdSistolik] = useState<string>('');
  const [tdDiastolik, setTdDiastolik] = useState<string>('');
  const [tb, setTb] = useState<string>('');
  const [bb, setBb] = useState<string>('');
  const [lp, setLp] = useState<string>('');
  const [gds, setGds] = useState<string>('');
  const [chol, setChol] = useState<string>('');
  const [au, setAu] = useState<string>('');
  const [hb, setHb] = useState<string>('');

  // UI States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [nikSearchQuery, setNikSearchQuery] = useState<string>('');

  // Auto-calculate Usia when Tanggal Lahir changes
  useEffect(() => {
    if (tanggalLahir) {
      const computedAge = calculateAge(tanggalLahir);
      setUsia(computedAge >= 0 ? computedAge : 0);
    } else {
      setUsia(0);
    }
  }, [tanggalLahir]);

  // Handle NIK selection or lookup to autofill existing citizen data
  const handleAutofillCitizen = (citizen: Warga) => {
    setNik(citizen.nik);
    setNama(citizen.nama);
    setJenisKelamin(citizen.jenisKelamin);
    setTanggalLahir(citizen.tanggalLahir);
    setAlamat(citizen.alamat);
    setRt(citizen.rt);
    setNoKK(citizen.noKK);
    setShowSuggestions(false);
    setNikSearchQuery('');
    
    // Notification for helpful feedback
    setNotificationMessage(`Data warga "${citizen.nama}" ditemukan di database RW 015 dan diisi otomatis!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Listen to manual NIK input to check if we can autofill
  const handleNikChange = (inputNik: string) => {
    const cleaned = inputNik.replace(/\D/g, ''); // only digits
    setNik(cleaned);

    // If exactly 16 digits, try to find citizen
    if (cleaned.length === 16) {
      const match = wargaList.find(w => w.nik === cleaned);
      if (match) {
        handleAutofillCitizen(match);
      }
    }
  };

  // Filtered list of warga for search suggestion drop-downs
  const suggestions = useMemo(() => {
    if (!nikSearchQuery) return [];
    const query = nikSearchQuery.toLowerCase();
    return wargaList.filter(w => 
      w.nama.toLowerCase().includes(query) || 
      w.nik.includes(query)
    ).slice(0, 5); // limit 5
  }, [wargaList, nikSearchQuery]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Tanggal Periksa
    if (!tanggal) {
      newErrors.tanggal = 'Tanggal pemeriksaan wajib diisi';
    } else {
      const selectedDate = new Date(tanggal);
      const today = new Date();
      if (selectedDate > today) {
        newErrors.tanggal = 'Tanggal pemeriksaan tidak boleh di masa depan';
      }
    }

    // NIK
    if (!nik) {
      newErrors.nik = 'NIK wajib diisi';
    } else if (nik.length !== 16) {
      newErrors.nik = 'NIK harus tepat 16 digit';
    } else if (!/^\d+$/.test(nik)) {
      newErrors.nik = 'NIK hanya boleh berisi angka';
    }

    // Nama
    if (!nama.trim()) {
      newErrors.nama = 'Nama lengkap wajib diisi';
    } else if (nama.trim().length < 2) {
      newErrors.nama = 'Nama lengkap minimal 2 karakter';
    }

    // Tanggal Lahir
    if (!tanggalLahir) {
      newErrors.tanggalLahir = 'Tanggal lahir wajib diisi';
    } else {
      const dob = new Date(tanggalLahir);
      const today = new Date();
      if (dob > today) {
        newErrors.tanggalLahir = 'Tanggal lahir tidak boleh di masa depan';
      } else {
        const computedAge = calculateAge(tanggalLahir);
        if (computedAge < 15) {
          newErrors.tanggalLahir = 'Sasaran pemeriksaan PTM minimal berusia 15 tahun';
        }
      }
    }

    // RT
    if (!rt) {
      newErrors.rt = 'RT wajib diisi';
    }

    // KK (optional but if filled, must be 16 digits)
    if (noKK && (noKK.length !== 16 || !/^\d+$/.test(noKK))) {
      newErrors.noKK = 'No. KK harus tepat 16 digit angka';
    }

    // Alamat
    if (!alamat.trim()) {
      newErrors.alamat = 'Alamat lengkap wajib diisi';
    }

    // Health Metrics Validation (only if filled)
    if (tdSistolik) {
      const sysVal = parseInt(tdSistolik);
      if (isNaN(sysVal) || sysVal < 50 || sysVal > 300) {
        newErrors.tdSistolik = 'Sistolik tidak realistis (rentang valid: 50 - 300 mmHg)';
      }
    }
    if (tdDiastolik) {
      const diaVal = parseInt(tdDiastolik);
      if (isNaN(diaVal) || diaVal < 30 || diaVal > 200) {
        newErrors.tdDiastolik = 'Diastolik tidak realistis (rentang valid: 30 - 200 mmHg)';
      }
    }
    // Check both if one is filled
    if ((tdSistolik && !tdDiastolik) || (!tdSistolik && tdDiastolik)) {
      newErrors.tdSistolik = 'Kedua nilai Sistolik & Diastolik harus diisi lengkap';
      newErrors.tdDiastolik = 'Kedua nilai Sistolik & Diastolik harus diisi lengkap';
    }

    if (tb) {
      const tbVal = parseFloat(tb);
      if (isNaN(tbVal) || tbVal < 50 || tbVal > 250) {
        newErrors.tb = 'Tinggi Badan tidak realistis (rentang valid: 50 - 250 cm)';
      }
    }

    if (bb) {
      const bbVal = parseFloat(bb);
      if (isNaN(bbVal) || bbVal < 10 || bbVal > 300) {
        newErrors.bb = 'Berat Badan tidak realistis (rentang valid: 10 - 300 kg)';
      }
    }

    if (lp) {
      const lpVal = parseFloat(lp);
      if (isNaN(lpVal) || lpVal < 30 || lpVal > 200) {
        newErrors.lp = 'Lingkar Perut tidak realistis (rentang valid: 30 - 200 cm)';
      }
    }

    if (gds) {
      const gdsVal = parseInt(gds);
      if (isNaN(gdsVal) || gdsVal < 30 || gdsVal > 600) {
        newErrors.gds = 'Nilai GDS tidak realistis (rentang valid: 30 - 600 mg/dL)';
      }
    }

    if (chol) {
      const cholVal = parseInt(chol);
      if (isNaN(cholVal) || cholVal < 50 || cholVal > 500) {
        newErrors.chol = 'Nilai Kolesterol tidak realistis (rentang valid: 50 - 500 mg/dL)';
      }
    }

    if (au) {
      const auVal = parseFloat(au);
      if (isNaN(auVal) || auVal < 1 || auVal > 25) {
        newErrors.au = 'Nilai Asam Urat tidak realistis (rentang valid: 1.0 - 25.0 mg/dL)';
      }
    }

    if (hb) {
      const hbVal = parseFloat(hb);
      if (isNaN(hbVal) || hbVal < 3 || hbVal > 25) {
        newErrors.hb = 'Nilai Hemoglobin tidak realistis (rentang valid: 3.0 - 25.0 g/dL)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const formatDateToDMY = (dateStr: string) => {
    if (!dateStr) return '';
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3 && parts[0].length === 4) {
        // YYYY-MM-DD -> DD/MM/YYYY
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const container = document.getElementById('form-ptm-container');
      if (container) {
        container.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    // Assemble Kunjungan object
    const finalSistolik = parseInt(tdSistolik) || 120;
    const finalDiastolik = parseInt(tdDiastolik) || 80;
    const formattedRT = rt.padStart(3, '0');

    const parseFormattedFloat = (val: string): number => {
      if (!val) return 0;
      const normalized = val.toString().replace(/,/g, '.');
      const parsed = parseFloat(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };

    const parseFormattedInt = (val: string): number => {
      if (!val) return 0;
      const normalized = val.toString().replace(/,/g, '.');
      const parsed = parseInt(normalized);
      return isNaN(parsed) ? 0 : parsed;
    };

    const newKunjungan: Kunjungan = {
      id: `k-${Date.now()}`,
      no: nextNo,
      tanggal,
      nama,
      jenisKelamin,
      nik,
      tanggalLahir,
      usia,
      alamat,
      rt: formattedRT,
      tdSistolik: finalSistolik,
      tdDiastolik: finalDiastolik,
      tb: parseFormattedFloat(tb),
      bb: parseFormattedFloat(bb),
      lp: parseFormattedFloat(lp),
      gds: parseFormattedInt(gds),
      chol: parseFormattedInt(chol),
      au: parseFormattedFloat(au),
      hb: parseFormattedFloat(hb),
    };

    // Check if citizen already exists in wargaList
    const exists = wargaList.some(w => w.nik === nik);
    let newWarga: Warga | null = null;

    if (!exists) {
      newWarga = {
        id: `w-${Date.now()}`,
        noKK: noKK || `KK-GEN-${Date.now()}`, // fallback KK
        nama,
        jenisKelamin,
        nik,
        tanggalLahir,
        alamat,
        rt: formattedRT
      };
    }

    let gSheetsStatusMessage = '';
    if (sendToGSheets && appsScriptUrl.trim() !== '') {
      setIsSubmittingToGSheets(true);
      try {
        const response = await fetch('/api/submit-keuangan-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: appsScriptUrl.trim(),
            payload: {
              tanggal: formatDateToDMY(newKunjungan.tanggal),
              nama: newKunjungan.nama,
              jenisKelamin: newKunjungan.jenisKelamin.toUpperCase(),
              nik: newKunjungan.nik,
              tanggalLahir: formatDateToDMY(newKunjungan.tanggalLahir),
              usia: newKunjungan.usia,
              alamat: newKunjungan.alamat,
              rt: "'" + newKunjungan.rt,
              td: `${newKunjungan.tdSistolik}/${newKunjungan.tdDiastolik}`,
              tb: newKunjungan.tb,
              bb: newKunjungan.bb,
              lp: newKunjungan.lp,
              gds: newKunjungan.gds,
              chol: newKunjungan.chol,
              au: newKunjungan.au,
              hb: newKunjungan.hb,
            }
          })
        });

        if (!response.ok) {
          let errorMsg = 'Gagal mengirim melalui proxy server';
          try {
            const errData = await response.json();
            if (errData.error) errorMsg = errData.error;
          } catch(e) {}
          throw new Error(errorMsg);
        }

        const data = await response.json();
        if (data.success) {
          gSheetsStatusMessage = ' dan berhasil disinkronkan ke Google Sheets';
        } else {
          throw new Error(data.error || 'Respon gagal dari proxy');
        }
      } catch (err: any) {
        console.error('Failed to submit visit to Google Sheets:', err);
        gSheetsStatusMessage = ' (tersimpan lokal, gagal kirim ke Google Sheets)';
        if (err.message && err.message.includes('Apps Script URL')) {
          alert('GAGAL: URL Apps Script tidak valid atau tidak ditemukan (404).\n\nPastikan Anda menyalin URL Web App yang benar (berakhir dengan /exec). Silakan perbaiki URL pada pengaturan "Integrasi Google Sheets" di bagian atas.');
        } else {
          alert(`Gagal sinkronisasi ke GSheets: ${err.message}`);
        }
      } finally {
        setIsSubmittingToGSheets(false);
      }
    }

    onSaveKunjungan(newKunjungan, newWarga);

    // Show success notification & reset inputs (except date)
    setNotificationMessage(`Pemeriksaan ke-${nextNo} atas nama ${nama} berhasil disimpan${gSheetsStatusMessage}!`);
    setShowNotification(true);
    setErrors({});

    // Reset fields
    setNik('');
    setNama('');
    setJenisKelamin('Laki-laki');
    setTanggalLahir('');
    setAlamat('');
    setRt('001');
    setNoKK('');
    setTdSistolik('');
    setTdDiastolik('');
    setTb('');
    setBb('');
    setLp('');
    setGds('');
    setChol('');
    setAu('');
    setHb('');

    // Clear notification after 2s, but stay on the input page
    setTimeout(() => {
      setShowNotification(false);
    }, 2000);
  };

  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);

  const resetForm = () => {
    setNik('');
    setNama('');
    setJenisKelamin('Laki-laki');
    setTanggalLahir('');
    setAlamat('');
    setRt('001');
    setNoKK('');
    setTdSistolik('');
    setTdDiastolik('');
    setTb('');
    setBb('');
    setLp('');
    setGds('');
    setChol('');
    setAu('');
    setHb('');
    setErrors({});
    setShowConfirmReset(false);
  };

  const [tableSearch, setTableSearch] = useState('');
  const [tableAgeFilter, setTableAgeFilter] = useState<'all' | '15-59' | '60+'>('all');
  const [tableMonthFilter, setTableMonthFilter] = useState<string>('all');
  const [tablePage, setTablePage] = useState<number>(1);

  useEffect(() => {
    setTablePage(1);
  }, [tableSearch, tableAgeFilter, tableMonthFilter]);

  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    activeKunjunganList.forEach(k => {
      if (k.tanggal && k.tanggal.length >= 7) {
        monthsSet.add(k.tanggal.substring(0, 7));
      }
    });
    return Array.from(monthsSet).sort();
  }, [activeKunjunganList]);

  const formatMonthName = (yearMonth: string) => {
    const [year, month] = yearMonth.split('-');
    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthIdx = parseInt(month, 10) - 1;
    return `${monthNames[monthIdx]} ${year}`;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    // Clean up or extract date part if it has time
    const cleanDateStr = dateStr.trim().split(' ')[0];
    
    // Split by - or /
    const separator = cleanDateStr.includes('-') ? '-' : '/';
    const parts = cleanDateStr.split(separator);
    
    if (parts.length === 3) {
      // Check if it's YYYY at the beginning
      if (parts[0].length === 4) {
        const [year, month, day] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
      // Check if it's YYYY at the end
      if (parts[2].length === 4) {
        const [day, month, year] = parts;
        return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
      }
    }
    return dateStr;
  };

  const filteredKunjungan = useMemo(() => {
    return activeKunjunganList.filter(k => {
      if (tableMonthFilter !== 'all' && (!k.tanggal || !k.tanggal.startsWith(tableMonthFilter))) return false;
      if (tableAgeFilter === '15-59' && (k.usia < 15 || k.usia > 59)) return false;
      if (tableAgeFilter === '60+' && k.usia < 60) return false;
      if (tableSearch) {
        const query = tableSearch.toLowerCase();
        return k.nama.toLowerCase().includes(query) || k.nik.includes(query) || k.rt.includes(query) || k.alamat.toLowerCase().includes(query);
      }
      return true;
    }).sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }, [activeKunjunganList, tableAgeFilter, tableSearch, tableMonthFilter]);

  const paginatedKunjungan = useMemo(() => {
    const startIdx = (tablePage - 1) * 10;
    return filteredKunjungan.slice(startIdx, startIdx + 10);
  }, [filteredKunjungan, tablePage]);

  const hypertensionKunjungan = useMemo(() => {
    const citizensLatestVisit: { [nik: string]: Kunjungan } = {};
    const sortedOldestFirst = [...activeKunjunganList].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    sortedOldestFirst.forEach(k => { citizensLatestVisit[k.nik] = k; });
    return Object.values(citizensLatestVisit).filter(k => k.tdSistolik >= 139 || k.tdDiastolik >= 89).sort((a, b) => b.tdSistolik - a.tdSistolik);
  }, [activeKunjunganList]);

  // Hypertension Table States
  const [htSearch, setHtSearch] = useState('');
  const [htAgeFilter, setHtAgeFilter] = useState<'all' | '15-59' | '60+'>('all');
  const [htMonthFilter, setHtMonthFilter] = useState<string>('all');
  const [htTablePage, setHtTablePage] = useState(1);

  const filteredHypertensionKunjungan = useMemo(() => {
    return hypertensionKunjungan.filter(k => {
      if (htMonthFilter !== 'all' && (!k.tanggal || !k.tanggal.startsWith(htMonthFilter))) return false;
      if (htAgeFilter === '15-59' && (k.usia < 15 || k.usia > 59)) return false;
      if (htAgeFilter === '60+' && k.usia < 60) return false;
      if (htSearch) {
        const query = htSearch.toLowerCase();
        return k.nama.toLowerCase().includes(query) || k.nik.includes(query) || k.rt.includes(query) || k.alamat.toLowerCase().includes(query);
      }
      return true;
    });
  }, [hypertensionKunjungan, htAgeFilter, htSearch, htMonthFilter]);

  const paginatedHypertensionKunjungan = useMemo(() => {
    const startIdx = (htTablePage - 1) * 10;
    return filteredHypertensionKunjungan.slice(startIdx, startIdx + 10);
  }, [filteredHypertensionKunjungan, htTablePage]);

  const htTotalPages = Math.ceil(filteredHypertensionKunjungan.length / 10) || 1;

  useEffect(() => {
    if (htTablePage > htTotalPages) {
      setHtTablePage(1);
    }
  }, [htTotalPages, htTablePage]);

  const exportCSV = (data: any[], fileName: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `${fileName}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  
  return (
    <div className={`space-y-6 pb-12 ${printPreviewMode !== 'none' ? 'print:hidden' : ''}`} id="form-ptm-container">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-[#FFC8DD] p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">Formulir Input PTM (Penyakit Tidak Menular)</h1>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 hover:bg-white/50 text-slate-700 hover:text-indigo-700 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-300"
              title="Pengaturan Sinkronisasi Google Sheets"
              id="btn-open-ptm-gsheets-settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Pencatatan data antropometri, tensi, dan skrining darah berkala warga.</p>
        </div>
        <button
          onClick={onNavigateToDashboard}
          id="btn-back-dashboard"
          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold border border-slate-200 transition-all cursor-pointer shrink-0"
        >
          Batal & Kembali
        </button>
      </div>

      {/* Alert Notification */}
      {showNotification && (
        <div id="ptm-notification" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <UserCheck className="w-4 h-4 text-emerald-600" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Citizen search helper card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Cari Data Warga (Database RW 015)</h2>
        <div className="relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Masukkan Nama atau NIK warga untuk mengambil data dari database RW 015..."
              value={nikSearchQuery}
              onChange={(e) => {
                setNikSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              id="input-citizen-quicksearch"
              className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          
          {/* Suggestion Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div id="suggestions-dropdown" className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1.5 shadow-lg overflow-hidden divide-y divide-slate-100">
              {suggestions.map(citizen => (
                <button
                  key={citizen.id}
                  type="button"
                  onClick={() => handleAutofillCitizen(citizen)}
                  className="w-full px-4 py-3 text-left hover:bg-slate-50 flex justify-between items-center text-xs transition-all cursor-pointer"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-800">{citizen.nama}</span>
                    <span className="text-[10px] font-mono text-slate-400">NIK: {citizen.nik} • RT {citizen.rt}</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 font-medium">
                    <span>Pilih</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && nikSearchQuery && suggestions.length === 0 && (
            <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-xl mt-1.5 p-4 text-center text-xs text-slate-400 shadow-lg">
              Data warga tidak ditemukan di database RW 015. Anda dapat mengisi formulir di bawah secara manual untuk mendaftarkannya secara otomatis.
            </div>
          )}
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6" id="ptm-form-element">
        {Object.keys(errors).length > 0 && (
          <div id="validation-errors-banner" className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold flex flex-col gap-1.5 animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 text-red-600" />
              <span>Harap perbaiki beberapa kesalahan berikut sebelum menyimpan:</span>
            </div>
            <ul className="list-disc pl-5 font-normal text-[11px] text-red-700 space-y-0.5">
              {Object.entries(errors).map(([field, err]) => (
                <li key={field}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Section 1: Demographics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">1. Data Demografis Warga</h2>
            <p className="text-[11px] text-slate-400">Data demografis diambil dari database RW 015. Pastikan data identitas diisi dengan lengkap dan sesuai KTP.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* No Otomatis */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">No. Urut Pemeriksaan (Otomatis)</label>
              <input
                type="text"
                value={`PMR-${String(nextNo).padStart(4, '0')}`}
                readOnly
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-mono outline-none cursor-not-allowed"
              />
            </div>

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tanggal Periksa <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => {
                  setTanggal(e.target.value);
                  if (errors.tanggal) setErrors(prev => { const copy = { ...prev }; delete copy.tanggal; return copy; });
                }}
                id="input-tanggal-ptm"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.tanggal ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all`}
              />
              {errors.tanggal && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.tanggal}</span>
              )}
            </div>

            {/* NIK */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">NIK (16 Digit) <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                maxLength={16}
                placeholder="Masukkan NIK KTP..."
                value={nik}
                onChange={(e) => {
                  handleNikChange(e.target.value);
                  if (errors.nik) setErrors(prev => { const copy = { ...prev }; delete copy.nik; return copy; });
                }}
                id="input-nik"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.nik ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl font-mono outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all`}
              />
              {errors.nik && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.nik}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Nama */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Nama Lengkap <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Nama sesuai KTP..."
                value={nama}
                onChange={(e) => {
                  setNama(e.target.value);
                  if (errors.nama) setErrors(prev => { const copy = { ...prev }; delete copy.nama; return copy; });
                }}
                id="input-nama"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.nama ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl font-semibold outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all`}
              />
              {errors.nama && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.nama}</span>
              )}
            </div>

            {/* Jenis Kelamin */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jenis Kelamin <span className="text-red-500">*</span></label>
              <select
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as 'Laki-laki' | 'Perempuan')}
                id="input-gender"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
              >
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>

            {/* Tgl Lahir */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tanggal Lahir <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={tanggalLahir}
                onChange={(e) => {
                  setTanggalLahir(e.target.value);
                  if (errors.tanggalLahir) setErrors(prev => { const copy = { ...prev }; delete copy.tanggalLahir; return copy; });
                }}
                id="input-dob"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.tanggalLahir ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all`}
              />
              {errors.tanggalLahir && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.tanggalLahir}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Usia otomatis */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Usia (Otomatis dari Tgl Lahir)</label>
              <input
                type="text"
                value={usia > 0 ? `${usia} Tahun` : 'Harap isi Tgl Lahir...'}
                readOnly
                className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 text-slate-500 font-semibold rounded-xl outline-none cursor-not-allowed"
              />
            </div>

            {/* RT */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Rukun Tetangga (RT) <span className="text-red-500">*</span></label>
              <select
                value={rt}
                onChange={(e) => {
                  setRt(e.target.value);
                  if (errors.rt) setErrors(prev => { const copy = { ...prev }; delete copy.rt; return copy; });
                }}
                id="input-rt"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.rt ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer`}
              >
                <option value="001">RT 001</option>
                <option value="002">RT 002</option>
                <option value="003">RT 003</option>
                <option value="004">RT 004</option>
                <option value="005">RT 005</option>
              </select>
              {errors.rt && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.rt}</span>
              )}
            </div>

            {/* No KK (Optional for registration) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">No. Kartu Keluarga (KK) <span className="text-slate-400 font-normal">(Opsional)</span></label>
              <input
                type="text"
                placeholder="Isi jika pendaftaran warga baru..."
                value={noKK}
                onChange={(e) => {
                  setNoKK(e.target.value.replace(/\D/g, ''));
                  if (errors.noKK) setErrors(prev => { const copy = { ...prev }; delete copy.noKK; return copy; });
                }}
                id="input-kk"
                className={`w-full px-3 py-2 text-xs bg-slate-50 border ${errors.noKK ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl font-mono outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all`}
              />
              {errors.noKK && (
                <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.noKK}</span>
              )}
            </div>
          </div>

          {/* Alamat */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Alamat Lengkap <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={2}
              placeholder="Alamat rumah..."
              value={alamat}
              onChange={(e) => {
                setAlamat(e.target.value);
                if (errors.alamat) setErrors(prev => { const copy = { ...prev }; delete copy.alamat; return copy; });
              }}
              id="input-alamat"
              className={`w-full px-3 py-2.5 text-xs bg-slate-50 border ${errors.alamat ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all resize-none`}
            />
            {errors.alamat && (
              <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.alamat}</span>
            )}
          </div>
        </div>

        {/* Section 2: Health Metrics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-800">2. Antropometri & Skrining PTM</h2>
            <p className="text-[11px] text-slate-400">Masukkan angka hasil pengukuran fisik dan pemeriksaan sampel darah.</p>
          </div>

          {/* Grid: Blood pressure & measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Tensi Darah Split */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2.5 col-span-1 sm:col-span-2">
              <span className="block text-xs font-bold text-slate-700">Tekanan Darah (TD)</span>
              <div className="flex items-center gap-2">
                <div>
                  <input
                    type="number"
                    placeholder="Sistolik"
                    value={tdSistolik}
                    onChange={(e) => {
                      setTdSistolik(e.target.value);
                      if (errors.tdSistolik) setErrors(prev => { const copy = { ...prev }; delete copy.tdSistolik; return copy; });
                    }}
                    id="input-td-systolic"
                    className={`w-full px-3 py-2 text-xs bg-white border ${errors.tdSistolik ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold`}
                  />
                  <span className="text-[9px] text-slate-400 text-center block mt-1">Sistolik (cth: 120)</span>
                </div>
                <span className="text-slate-400 font-bold">/</span>
                <div>
                  <input
                    type="number"
                    placeholder="Diastolik"
                    value={tdDiastolik}
                    onChange={(e) => {
                      setTdDiastolik(e.target.value);
                      if (errors.tdDiastolik) setErrors(prev => { const copy = { ...prev }; delete copy.tdDiastolik; return copy; });
                    }}
                    id="input-td-diastolic"
                    className={`w-full px-3 py-2 text-xs bg-white border ${errors.tdDiastolik ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 text-center font-bold`}
                  />
                  <span className="text-[9px] text-slate-400 text-center block mt-1">Diastolik (cth: 80)</span>
                </div>
                <span className="text-xs text-slate-500 font-medium whitespace-nowrap self-start mt-2">mmHg</span>
              </div>
              {(errors.tdSistolik || errors.tdDiastolik) && (
                <span className="text-[10px] text-red-500 font-semibold block">{errors.tdSistolik || errors.tdDiastolik}</span>
              )}
              
              {/* Hypertension warning indicator */}
              {tdSistolik && tdDiastolik && (parseInt(tdSistolik) >= 139 || parseInt(tdDiastolik) >= 89) && (
                <div className="p-2 bg-red-50 rounded-lg text-[10px] text-red-700 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                  Indikasi Hipertensi (&ge;139/89)
                </div>
              )}
            </div>

            {/* TB */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Tinggi Badan (TB)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Cth: 165"
                    value={tb}
                    onChange={(e) => {
                      setTb(e.target.value);
                      if (errors.tb) setErrors(prev => { const copy = { ...prev }; delete copy.tb; return copy; });
                    }}
                    id="input-tb"
                    className={`w-full pr-10 pl-3 py-2 text-xs bg-white border ${errors.tb ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center font-semibold`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">cm</span>
                </div>
                {errors.tb && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.tb}</span>
                )}
              </div>
            </div>

            {/* BB */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Berat Badan (BB)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Cth: 62.5"
                    value={bb}
                    onChange={(e) => {
                      setBb(e.target.value);
                      if (errors.bb) setErrors(prev => { const copy = { ...prev }; delete copy.bb; return copy; });
                    }}
                    id="input-bb"
                    className={`w-full pr-10 pl-3 py-2 text-xs bg-white border ${errors.bb ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center font-semibold`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">kg</span>
                </div>
                {errors.bb && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.bb}</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* LP */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" title="Lingkar Perut">Lingkar Perut (LP)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Cth: 85"
                    value={lp}
                    onChange={(e) => {
                      setLp(e.target.value);
                      if (errors.lp) setErrors(prev => { const copy = { ...prev }; delete copy.lp; return copy; });
                    }}
                    id="input-lp"
                    className={`w-full pr-10 pl-3 py-2 text-xs bg-white border ${errors.lp ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-semibold">cm</span>
                </div>
                {errors.lp && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.lp}</span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Batas aman: L &le; 90, P &le; 80 cm</span>
            </div>

            {/* GDS */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" title="Gula Darah Sewaktu">Gula Darah (GDS)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Cth: 120"
                    value={gds}
                    onChange={(e) => {
                      setGds(e.target.value);
                      if (errors.gds) setErrors(prev => { const copy = { ...prev }; delete copy.gds; return copy; });
                    }}
                    id="input-gds"
                    className={`w-full pr-12 pl-3 py-2 text-xs bg-white border ${errors.gds ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-semibold">mg/dL</span>
                </div>
                {errors.gds && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.gds}</span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Normal: &lt; 200 mg/dL</span>
            </div>

            {/* CHOL */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" title="Kolesterol Total">Kolesterol (CHOL)</label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="Cth: 190"
                    value={chol}
                    onChange={(e) => {
                      setChol(e.target.value);
                      if (errors.chol) setErrors(prev => { const copy = { ...prev }; delete copy.chol; return copy; });
                    }}
                    id="input-chol"
                    className={`w-full pr-12 pl-3 py-2 text-xs bg-white border ${errors.chol ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-semibold">mg/dL</span>
                </div>
                {errors.chol && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.chol}</span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Normal: &lt; 200 mg/dL</span>
            </div>

            {/* AU */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" title="Asam Urat">Asam Urat (AU)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Cth: 5.4"
                    value={au}
                    onChange={(e) => {
                      setAu(e.target.value);
                      if (errors.au) setErrors(prev => { const copy = { ...prev }; delete copy.au; return copy; });
                    }}
                    id="input-au"
                    className={`w-full pr-12 pl-3 py-2 text-xs bg-white border ${errors.au ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-semibold">mg/dL</span>
                </div>
                {errors.au && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.au}</span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Normal: L &le; 7.0, P &le; 6.0</span>
            </div>

            {/* HB */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5" title="Hemoglobin">Hemoglobin (HB)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="Cth: 13.8"
                    value={hb}
                    onChange={(e) => {
                      setHb(e.target.value);
                      if (errors.hb) setErrors(prev => { const copy = { ...prev }; delete copy.hb; return copy; });
                    }}
                    id="input-hb"
                    className={`w-full pr-10 pl-3 py-2 text-xs bg-white border ${errors.hb ? 'border-red-500 ring-1 ring-red-500 bg-red-50/20' : 'border-slate-200'} text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-center`}
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-semibold">g/dL</span>
                </div>
                {errors.hb && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 block">{errors.hb}</span>
                )}
              </div>
              <span className="text-[9px] text-slate-400 block mt-1">Normal: L: 13-17, P: 12-15</span>
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3">
          <button
            type="button"
            onClick={resetForm}
            id="btn-clear-form"
            className="w-full sm:w-auto px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-semibold flex justify-center items-center gap-2 cursor-pointer transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Kosongkan Form
          </button>
          
          <button
            type="submit"
            id="btn-submit-ptm"
            className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md text-xs font-semibold flex justify-center items-center gap-2 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            Simpan Catatan Pemeriksaan
          </button>
        </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 gap-6 mt-8" id="tables-section">
        
        {/* Visit Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Tabel Data Kunjungan Posbindu</h3>
              <p className="text-xs text-slate-400 mt-1">Daftar lengkap hasil pemeriksaan kesehatan warga.</p>
            </div>
            
            {/* Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari Nama, NIK, RT, Alamat..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  id="input-search-kunjungan"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>

              {/* Age Toggle */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                <button
                  type="button"
                  onClick={() => setTableAgeFilter('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${tableAgeFilter === 'all' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setTableAgeFilter('15-59')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${tableAgeFilter === '15-59' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  15-59 Th
                </button>
                <button
                  type="button"
                  onClick={() => setTableAgeFilter('60+')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${tableAgeFilter === '60+' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  60+ Th
                </button>
              </div>

              {/* Month Filter */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1.5 hidden sm:inline">Bulan:</span>
                <select
                  value={tableMonthFilter}
                  onChange={(e) => setTableMonthFilter(e.target.value)}
                  className="bg-transparent text-xs text-slate-700 font-semibold outline-none py-1 cursor-pointer"
                  id="select-month-filter"
                >
                  <option value="all">Semua Bulan</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Export */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintPreviewMode("kunjungan")}
                  id="btn-export-kunjungan-pdf"
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all"
                  title="Cetak PDF Laporan"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportCSV(filteredKunjungan, 'data_kunjungan_posbindu')}
                  id="btn-export-kunjungan"
                  className="px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-800 rounded-xl flex items-center gap-1.5 text-xs font-medium cursor-pointer transition-all"
                  title="Unduh file spreadsheet"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 text-center">No</th>
                  <th className="py-3 px-4 min-w-[90px]">Tanggal</th>
                  <th className="py-3 px-4 min-w-[130px]">Nama</th>
                  <th className="py-3 px-4">L/P</th>
                  <th className="py-3 px-4 min-w-[130px]">NIK</th>
                  <th className="py-3 px-4 min-w-[90px]">Tgl. Lahir</th>
                  <th className="py-3 px-4 text-center">Usia</th>
                  <th className="py-3 px-4 min-w-[140px]">Alamat</th>
                  <th className="py-3 px-4 text-center">RT</th>
                  <th className="py-3 px-4 text-center min-w-[70px]" title="Tekanan Darah (Sistolik/Diastolik)">TD (mmHg)</th>
                  <th className="py-3 px-4 text-center">TB (cm)</th>
                  <th className="py-3 px-4 text-center">BB (kg)</th>
                  <th className="py-3 px-4 text-center">LP (cm)</th>
                  <th className="py-3 px-4 text-center">GDS (mg)</th>
                  <th className="py-3 px-4 text-center" title="Kolesterol">CHOL</th>
                  <th className="py-3 px-4 text-center" title="Asam Urat">AU</th>
                  <th className="py-3 px-4 text-center">HB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedKunjungan.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="py-10 text-center text-slate-400 font-medium">
                      Tidak ada data kunjungan yang cocok dengan filter / kata kunci.
                    </td>
                  </tr>
                ) : (
                  paginatedKunjungan.map((k, index) => {
                    const isHypertensive = k.tdSistolik >= 139 || k.tdDiastolik >= 89;
                    const globalIndex = (tablePage - 1) * 10 + index + 1;
                    return (
                      <tr key={k.id} className="hover:bg-slate-50/50 transition-all">
                        <td className="py-3.5 px-4 text-center font-medium text-slate-400">{globalIndex}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-semibold text-slate-600">{formatDate(k.tanggal)}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-800">{k.nama}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${k.jenisKelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {k.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500">{k.nik}</td>
                        <td className="py-3.5 px-4 whitespace-nowrap">{formatDate(k.tanggalLahir)}</td>
                        <td className="py-3.5 px-4 text-center font-medium">{k.usia}</td>
                        <td className="py-3.5 px-4 truncate max-w-[150px]" title={k.alamat}>{k.alamat}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{k.rt}</td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${isHypertensive ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100/30'}`}>
                            {k.tdSistolik}/{k.tdDiastolik}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">{k.tb || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{k.bb || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-mono">{k.lp || '-'}</td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className={k.gds >= 200 ? 'text-amber-600 font-bold' : ''}>
                            {k.gds || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className={k.chol >= 200 ? 'text-amber-600 font-bold' : ''}>
                            {k.chol || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className={(k.jenisKelamin === 'Laki-laki' ? k.au >= 7.0 : k.au >= 6.0) ? 'text-amber-600 font-bold' : ''}>
                            {k.au || '-'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className={(k.jenisKelamin === 'Laki-laki' ? (k.hb && k.hb < 13) : (k.hb && k.hb < 12)) ? 'text-amber-600 font-bold' : ''}>
                            {k.hb || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination & Status Footer */}
          {(() => {
            const totalPages = Math.ceil(filteredKunjungan.length / 10);
            const startRange = filteredKunjungan.length === 0 ? 0 : (tablePage - 1) * 10 + 1;
            const endRange = Math.min(tablePage * 10, filteredKunjungan.length);
            
            return (
              <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span>
                    Menampilkan <b>{startRange} - {endRange}</b> dari <b>{filteredKunjungan.length}</b> hasil pemeriksaan ({activeKunjunganList.length} total)
                  </span>
                  <span className="hidden sm:inline text-[10px]">Nilai dengan warna amber menunjukkan indikator di atas batas normal</span>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 select-none">
                    <button
                      type="button"
                      onClick={() => setTablePage(prev => Math.max(prev - 1, 1))}
                      disabled={tablePage === 1}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 disabled:hover:text-slate-300 disabled:opacity-50 disabled:hover:border-slate-200 rounded-lg text-slate-600 text-xs font-semibold disabled:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      Sebelumnya
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        if (
                          totalPages <= 5 ||
                          pageNum === 1 ||
                          pageNum === totalPages ||
                          Math.abs(pageNum - tablePage) <= 1
                        ) {
                          return (
                            <button
                              type="button"
                              key={pageNum}
                              onClick={() => setTablePage(pageNum)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${tablePage === pageNum ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-100' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                        
                        if (
                          (pageNum === 2 && tablePage > 3) ||
                          (pageNum === totalPages - 1 && tablePage < totalPages - 2)
                        ) {
                          return <span key={pageNum} className="px-1 text-slate-400 select-none">...</span>;
                        }
                        
                        return null;
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setTablePage(prev => Math.min(prev + 1, totalPages))}
                      disabled={tablePage === totalPages}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 disabled:hover:text-slate-300 disabled:opacity-50 disabled:hover:border-slate-200 rounded-lg text-slate-600 text-xs font-semibold disabled:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      Selanjutnya
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>        {/* Hypertension Screening Table */}
        <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden flex flex-col" id="hypertension-table-card">
          <div className="p-6 border-b border-red-50 bg-red-50/20 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">Daftar Warga Risiko Hipertensi</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Skrining warga dengan hasil pemeriksaan tekanan darah terakhir <b>&gt;= 139/89 mmHg</b> (Sistolik &ge; 139 atau Diastolik &ge; 89).
                  </p>
                </div>
              </div>
              {/* Export */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setPrintPreviewMode("hipertensi")}
                  id="btn-export-hypertension-pdf"
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
                  title="Cetak PDF Laporan"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF
                </button>
                <button
                  type="button"
                  onClick={() => exportCSV(filteredHypertensionKunjungan, 'skrining_hipertensi_posbindu')}
                  id="btn-export-hypertension"
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all"
                  title="Unduh data CSV Hipertensi"
                >
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama, NIK, alamat..."
                  value={htSearch}
                  onChange={(e) => setHtSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all bg-white"
                />
              </div>
              
              <div className="flex items-center gap-2 text-xs">
                <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                <select
                  value={htAgeFilter}
                  onChange={(e) => setHtAgeFilter(e.target.value as any)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer font-medium text-slate-600"
                >
                  <option value="all">Semua Usia</option>
                  <option value="15-59">15 - 59 Th</option>
                  <option value="60+">60+ Th</option>
                </select>

                <select
                  value={htMonthFilter}
                  onChange={(e) => setHtMonthFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer font-medium text-slate-600"
                >
                  <option value="all">Semua Bulan</option>
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>
                      {formatMonthName(month)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-red-50/5 border-b border-red-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-6 text-center">No</th>
                  <th className="py-3 px-6">Tanggal Periksa</th>
                  <th className="py-3 px-6">Nama Lengkap</th>
                  <th className="py-3 px-6 text-center">L/P</th>
                  <th className="py-3 px-6">NIK</th>
                  <th className="py-3 px-6 text-center">Usia</th>
                  <th className="py-3 px-6">Alamat</th>
                  <th className="py-3 px-6 text-center">RT</th>
                  <th className="py-3 px-6 text-center min-w-[100px]">Tensi Darah</th>
                  <th className="py-3 px-6 text-center">GDS</th>
                  <th className="py-3 px-6 text-center">CHOL</th>
                  <th className="py-3 px-6">Tindakan / Rekomendasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-red-50 text-slate-700">
                {paginatedHypertensionKunjungan.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-10 text-center text-slate-400 font-medium">
                      {hypertensionKunjungan.length === 0 
                        ? "Sangat bagus! Tidak ditemukan data warga dengan tekanan darah tinggi (\u2265 139/89)."
                        : "Tidak ada data yang sesuai dengan filter pencarian."}
                    </td>
                  </tr>
                ) : (
                  paginatedHypertensionKunjungan.map((k, index) => {
                    const sys = k.tdSistolik;
                    const dia = k.tdDiastolik;
                    
                    // Categorize hypertension level
                    let category = 'Hipertensi Ringan';
                    let badgeClass = 'bg-amber-100 text-amber-800';
                    let recommendation = 'Edukasi diet rendah garam, batasi stress, cek ulang 1 minggu.';
                    
                    if (sys >= 160 || dia >= 100) {
                      category = 'Hipertensi Derajat 2 (Berat)';
                      badgeClass = 'bg-red-100 text-red-800 font-bold';
                      recommendation = 'Rujuk segera ke Puskesmas / Dokter untuk terapi farmakologis.';
                    } else if (sys >= 140 || dia >= 90) {
                      category = 'Hipertensi Derajat 1';
                      badgeClass = 'bg-orange-100 text-orange-800 font-semibold';
                      recommendation = 'Konsultasi gaya hidup sehat, evaluasi dalam 2 minggu.';
                    } else {
                      category = 'Pre-Hipertensi / Perbatasan';
                      badgeClass = 'bg-yellow-100 text-yellow-800';
                      recommendation = 'Pantau rutin berkala, olahraga teratur, kurangi garam.';
                    }

                    return (
                      <tr key={`hyp-${k.id}`} className="hover:bg-red-50/10 transition-all">
                        <td className="py-4 px-6 text-center font-medium text-slate-400">{(htTablePage - 1) * 10 + index + 1}</td>
                        <td className="py-4 px-6 whitespace-nowrap">{formatDate(k.tanggal)}</td>
                        <td className="py-4 px-6 font-semibold text-slate-900">{k.nama}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${k.jenisKelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {k.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono text-slate-500">{k.nik}</td>
                        <td className="py-4 px-6 text-center font-semibold text-slate-800">{k.usia} th</td>
                        <td className="py-4 px-6 truncate max-w-[150px]" title={k.alamat}>{k.alamat}</td>
                        <td className="py-4 px-6 text-center font-semibold">{k.rt}</td>
                        <td className="py-4 px-6 text-center">
                          <span className="px-2.5 py-1 bg-red-100 text-red-700 font-bold rounded-lg text-xs tracking-wide">
                            {sys}/{dia}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center font-mono">{k.gds || '-'}</td>
                        <td className="py-4 px-6 text-center font-mono">{k.chol || '-'}</td>
                        <td className="py-4 px-6 min-w-[200px]">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-self-start px-2 py-0.5 rounded text-[10px] uppercase tracking-wide font-semibold ${badgeClass}`}>
                              {category}
                            </span>
                            <span className="text-xs text-slate-600">{recommendation}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {htTotalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                Menampilkan {(htTablePage - 1) * 10 + 1} - {Math.min(htTablePage * 10, filteredHypertensionKunjungan.length)} dari {filteredHypertensionKunjungan.length} hasil
              </span>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setHtTablePage(prev => Math.max(prev - 1, 1))}
                  disabled={htTablePage === 1}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 disabled:hover:text-slate-300 disabled:opacity-50 disabled:hover:border-slate-200 rounded-lg text-slate-600 text-xs font-semibold disabled:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Sebelumnya
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: htTotalPages }, (_, i) => i + 1).map(pageNum => {
                    if (
                      pageNum === 1 || 
                      pageNum === htTotalPages || 
                      (pageNum >= htTablePage - 1 && pageNum <= htTablePage + 1)
                    ) {
                      return (
                        <button
                          type="button"
                          key={pageNum}
                          onClick={() => setHtTablePage(pageNum)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            htTablePage === pageNum 
                              ? 'bg-indigo-600 text-white shadow-sm' 
                              : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:text-indigo-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    }
                    
                    if (
                      (pageNum === 2 && htTablePage > 3) ||
                      (pageNum === htTotalPages - 1 && htTablePage < htTotalPages - 2)
                    ) {
                      return <span key={pageNum} className="px-1 text-slate-400 select-none">...</span>;
                    }
                    
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setHtTablePage(prev => Math.min(prev + 1, htTotalPages))}
                  disabled={htTablePage === htTotalPages}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 disabled:hover:text-slate-300 disabled:opacity-50 disabled:hover:border-slate-200 rounded-lg text-slate-600 text-xs font-semibold disabled:text-slate-300 transition-all cursor-pointer disabled:cursor-not-allowed"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

          <div className="p-4 bg-red-50/10 border-t border-red-50 text-xs text-red-500 font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" />
            <span>Ditemukan {hypertensionKunjungan.length} orang warga berisiko tinggi yang perlu pemantauan intensif / rujukan.</span>
          </div>
        </div>
      </div>

      </form>

      
      {/* Hidden Print Layout (Only visible during window.print) */}
      <div className="hidden print:block bg-white w-full font-sans text-slate-800">
        <div>
          {/* KOP Surat Instansi */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
            <div className="flex-shrink-0">
              <img 
                src="https://drive.google.com/thumbnail?id=17G7evIeHShfqn7aSm7L1mfgjlb1hStya" 
                alt="Logo RW" 
                className="h-16 w-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="text-center flex-1">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">POSBINDU CENDRAWASIH 1</h1>
              <p className="text-sm font-black text-slate-950 uppercase mt-1">RW 015 PESONA GADING CIBITUNG</p>
              <p className="text-[10px] text-slate-700 font-bold uppercase mt-1">DESA WANAJAYA, KECAMATAN CIBITUNG</p>
              <p className="text-[8px] text-slate-500 italic mt-0.5">Alamat: Jl. Cempaka Blok C2 RT 001, Bekasi, Jawa Barat</p>
            </div>
            
            <div className="flex-shrink-0">
              <img 
                src="https://drive.google.com/thumbnail?id=1YibmCQLufPZ9t5gDx7I7JTLY4m1oymrM" 
                alt="Logo Posbindu" 
                className="h-16 w-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase underline">
              {printPreviewMode === 'kunjungan' ? 'LAPORAN REKAPITULASI KUNJUNGAN POSBINDU PTM' : 'DAFTAR WARGA RESIKO HIPERTENSI TINGGI'}
            </h3>
          </div>

          <div className="mb-6">
            <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
              <thead className="table-header-group">
                <tr className="bg-slate-100 text-slate-700">
                  <th className="border border-slate-300 py-1.5 px-2">No</th>
                  <th className="border border-slate-300 py-1.5 px-2">Tanggal</th>
                  <th className="border border-slate-300 py-1.5 px-2">Nama</th>
                  <th className="border border-slate-300 py-1.5 px-2">L/P</th>
                  <th className="border border-slate-300 py-1.5 px-2">Usia</th>
                  <th className="border border-slate-300 py-1.5 px-2">RT</th>
                  <th className="border border-slate-300 py-1.5 px-2 text-center">TD</th>
                  <th className="border border-slate-300 py-1.5 px-2 text-center">GDS</th>
                  <th className="border border-slate-300 py-1.5 px-2 text-center">CHOL</th>
                  <th className="border border-slate-300 py-1.5 px-2 text-center">AU</th>
                </tr>
              </thead>
              <tbody>
                {(printPreviewMode === 'kunjungan' ? filteredKunjungan : filteredHypertensionKunjungan).map((k, idx) => (
                  <tr key={k.id || idx} className="break-inside-avoid">
                    <td className="border border-slate-300 py-1 px-2">{idx + 1}</td>
                    <td className="border border-slate-300 py-1 px-2">{formatDate(k.tanggal)}</td>
                    <td className="border border-slate-300 py-1 px-2">{k.nama}</td>
                    <td className="border border-slate-300 py-1 px-2">{k.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                    <td className="border border-slate-300 py-1 px-2">{k.usia}</td>
                    <td className="border border-slate-300 py-1 px-2">{k.rt}</td>
                    <td className="border border-slate-300 py-1 px-2 text-center">{k.tdSistolik}/{k.tdDiastolik}</td>
                    <td className="border border-slate-300 py-1 px-2 text-center">{k.gds || '-'}</td>
                    <td className="border border-slate-300 py-1 px-2 text-center">{k.chol || '-'}</td>
                    <td className="border border-slate-300 py-1 px-2 text-center">{k.au || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 text-center text-xs text-slate-800 mt-10 pt-6 border-t border-dashed border-slate-200 w-full">
          <div className="flex flex-col items-center justify-between min-h-[140px]">
            <div>
              <p className="font-semibold text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Ketua Posbindu Cendrawasih 1</p>
            </div>
            <div className="my-2 h-16 flex items-center justify-center">
              <img 
                src="https://drive.google.com/thumbnail?id=1SvusQZJ_OJ2P90OZlLtPYduUFszrdwWO" 
                alt="Tanda Tangan Ketua" 
                className="h-16 w-auto object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="font-bold text-slate-950 underline">Dewi Tri P.</p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between min-h-[140px]">
            <div>
              <p className="font-semibold text-slate-600">Bekasi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-slate-900 mt-0.5">Sekretaris</p>
            </div>
            <div className="my-2 h-16 flex items-center justify-center">
              
            </div>
            <div>
              <p className="font-bold text-slate-950 underline">Eny Suciaty</p>
            </div>
          </div>
        </div>
      </div>
{/* Print Preview Modal */}
      {printPreviewMode !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Pratinjau {printPreviewMode === 'kunjungan' ? 'Data Kunjungan' : 'Daftar Hipertensi'}
                  </h2>
                  <p className="text-[10px] text-slate-500">Tampilan sebelum dicetak ke kertas / PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold rounded-full animate-pulse">
                  Kertas A4 (Lanskap)
                </span>
                <button 
                  onClick={() => setPrintPreviewMode('none')}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content Container */}
            <div className="p-6 md:p-8 overflow-y-auto bg-slate-100/50 flex-1 flex justify-center">
              
              {/* Paper Layout */}
              <div className="bg-white p-10 md:p-12 shadow-md border border-slate-200/80 max-w-5xl w-full rounded-md min-h-[210mm] flex flex-col font-sans text-slate-800">
                <div>
                  {/* KOP Surat Instansi */}
                  <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
                    {/* Left Logo (Logo RW) */}
                    <div className="flex-shrink-0">
                      <img 
                        src="https://drive.google.com/thumbnail?id=17G7evIeHShfqn7aSm7L1mfgjlb1hStya" 
                        alt="Logo RW" 
                        className="h-16 w-16 md:h-20 md:w-20 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* Center Text */}
                    <div className="text-center flex-1">
                      <h1 className="text-sm md:text-base font-extrabold tracking-tight text-slate-950 uppercase">POSBINDU CENDRAWASIH 1</h1>
                      <p className="text-sm md:text-base font-black text-slate-950 uppercase mt-1">RW 015 PESONA GADING CIBITUNG</p>
                      <p className="text-[10px] md:text-[11px] text-slate-700 font-bold uppercase mt-1">DESA WANAJAYA, KECAMATAN CIBITUNG</p>
                      <p className="text-[8px] md:text-[9px] text-slate-500 italic mt-0.5">Alamat: Jl. Cempaka Blok C2 RT 001, Bekasi, Jawa Barat</p>
                    </div>
                    
                    {/* Right Logo (Logo Posbindu) */}
                    <div className="flex-shrink-0">
                      <img 
                        src="https://drive.google.com/thumbnail?id=1YibmCQLufPZ9t5gDx7I7JTLY4m1oymrM" 
                        alt="Logo Posbindu" 
                        className="h-16 w-16 md:h-20 md:w-20 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  </div>

                  {/* Judul Laporan */}
                  <div className="text-center mb-6">
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase underline">
                      {printPreviewMode === 'kunjungan' ? 'LAPORAN REKAPITULASI KUNJUNGAN POSBINDU PTM' : 'DAFTAR WARGA RESIKO HIPERTENSI TINGGI'}
                    </h3>
                  </div>

                  {/* Tabel Data */}
                  <div className="mb-6">
                    <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
              <thead className="table-header-group">
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-300 py-1.5 px-2">No</th>
                          <th className="border border-slate-300 py-1.5 px-2">Tanggal</th>
                          <th className="border border-slate-300 py-1.5 px-2">Nama</th>
                          <th className="border border-slate-300 py-1.5 px-2">L/P</th>
                          <th className="border border-slate-300 py-1.5 px-2">Usia</th>
                          <th className="border border-slate-300 py-1.5 px-2">RT</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">TB</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">BB</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">IMT</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">LP</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">TD</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">GDS</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">CHOL</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">AU</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">HB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(printPreviewMode === 'kunjungan' ? filteredKunjungan : filteredHypertensionKunjungan).map((k, idx) => (
                          <tr key={k.id || idx} className="break-inside-avoid">
                            <td className="border border-slate-300 py-1 px-2">{idx + 1}</td>
                            <td className="border border-slate-300 py-1 px-2">{formatDate(k.tanggal)}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.nama}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.usia}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.rt}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.tb || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.bb || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.tb && k.bb ? (k.bb / Math.pow(k.tb / 100, 2)).toFixed(1) : '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.lp || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.tdSistolik}/{k.tdDiastolik}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.gds || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.chol || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.au || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.hb || '-'}</td>
                          </tr>
                        ))}
                        {(printPreviewMode === 'kunjungan' ? filteredKunjungan : filteredHypertensionKunjungan).length === 0 && (
                          <tr>
                            <td colSpan={15} className="border border-slate-300 py-4 text-center text-slate-400 italic">
                              Tidak ada data yang ditampilkan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Print only Tanda Tangan */}
                <div className="grid grid-cols-2 text-center text-xs text-slate-800 mt-auto pt-6 border-t border-dashed border-slate-200 w-full">
                  <div className="flex flex-col items-center justify-between min-h-[140px]">
                    <div>
                      <p className="font-semibold text-slate-600">Mengetahui,</p>
                      <p className="font-bold text-slate-900 mt-0.5">Ketua Posbindu Cendrawasih 1</p>
                    </div>
                    <div className="my-2 h-16 flex items-center justify-center">
                      <img 
                        src="https://drive.google.com/thumbnail?id=1SvusQZJ_OJ2P90OZlLtPYduUFszrdwWO" 
                        alt="Tanda Tangan Ketua" 
                        className="h-16 w-auto object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 underline">Dewi Tri P.</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-between min-h-[140px]">
                    <div>
                      <p className="font-semibold text-slate-600">Bekasi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold text-slate-900 mt-0.5">Sekretaris</p>
                    </div>
                    <div className="my-2 h-16 flex items-center justify-center">
                      {/* Blank space for signature */}
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 underline">Eny Suciaty</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPrintPreviewMode('none')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Batal / Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimeout(() => {
                    const originalTitle = document.title;
                    document.title = printPreviewMode === 'kunjungan' ? 'Laporan_Kunjungan_Posbindu' : 'Daftar_Hipertensi_Posbindu';
                    // We need to show the print layout inside the actual page for window.print to capture it.
                    // This means we might need a dedicated CSS class for printing.
                    // Actually, since FormPTMView is a huge form, printing it directly with window.print() might print the whole form instead of just the report.
                    window.print();
                    document.title = originalTitle;
                  }, 150);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md hover:shadow-indigo-100"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Google Sheets Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-[90vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-indigo-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Integrasi & Sinkronisasi Google Sheets</h2>
                  <p className="text-[10px] text-slate-500">Hubungkan tabel web ini dengan Google Spreadsheet pribadi Anda</p>
                </div>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600">
              
              {/* Toggle Automatic Submission */}
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <label htmlFor="toggle-ptm-autosync" className="font-bold text-slate-700 cursor-pointer block">Kirim Otomatis ke Google Sheets</label>
                  <p className="text-[10px] text-slate-400 mt-0.5">Kirim data pemeriksaan baru ke spreadsheet secara real-time saat disimpan</p>
                </div>
                <button
                  type="button"
                  id="toggle-ptm-autosync"
                  onClick={() => setSendToGSheets(!sendToGSheets)}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none cursor-pointer ${sendToGSheets ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${sendToGSheets ? 'translate-x-5.5' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* Sync Status / Manual Sync Trigger */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-700">Status Sinkronisasi</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {lastSynced ? `Terakhir disinkronkan: ${lastSynced}` : 'Belum pernah disinkronkan.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleSyncGoogleSheet(false);
                  }}
                  disabled={isLoadingExternal}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingExternal ? 'animate-spin' : ''}`} />
                  <span>{isLoadingExternal ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>
              </div>

              {/* URL Apps Script Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-slate-700">URL Google Apps Script Web App</label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={appsScriptUrl}
                  onChange={(e) => setAppsScriptUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-slate-700 font-mono text-[11px] outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
                <p className="text-[10px] text-slate-400">Pastikan URL berakhir dengan <code className="font-mono text-slate-600 bg-slate-100 px-1 rounded">/exec</code>. URL ini digunakan untuk menulis dan membaca data pemeriksaan (PTM) secara langsung.</p>
              </div>

              {/* Instructions Accordion */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAppsScriptInstructions(!showAppsScriptInstructions)}
                  className="w-full p-3 bg-slate-50 hover:bg-slate-100 text-left font-bold text-slate-700 flex justify-between items-center transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span>Panduan & Kode Google Apps Script</span>
                  </div>
                  <span>{showAppsScriptInstructions ? '▲' : '▼'}</span>
                </button>

                {showAppsScriptInstructions && (
                  <div className="p-4 border-t border-slate-100 bg-white space-y-3 max-h-[250px] overflow-y-auto">
                    <p className="font-medium text-slate-700">Langkah-langkah:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                      <li>Buka Google Spreadsheet target Anda.</li>
                      <li>Di menu atas, pilih <strong>Extensions &gt; Apps Script</strong>.</li>
                      <li>Hapus kode bawaan, lalu salin dan tempel kode di bawah ini.</li>
                      <li>Simpan proyek dengan ikon disket.</li>
                      <li>Klik tombol <strong>Deploy &gt; New deployment</strong> di bagian kanan atas.</li>
                      <li>Pilih jenis deployment <strong>Web app</strong> (klik ikon gerigi di sebelah "Select type").</li>
                      <li>Atur <strong>Execute as:</strong> <code className="bg-slate-100 p-0.5 rounded text-indigo-700 font-bold">Me</code>.</li>
                      <li>Atur <strong>Who has access:</strong> <code className="bg-slate-100 p-0.5 rounded text-indigo-700 font-bold">Anyone</code>.</li>
                      <li>Klik <strong>Deploy</strong>, lalu salin <strong>Web app URL</strong> yang dihasilkan (berakhir dengan <code className="font-mono bg-slate-100 px-1 rounded">/exec</code>) dan tempel di input URL di atas.</li>
                    </ol>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-indigo-600">Kode Apps Script (Kunjungan PTM):</span>
                        <button
                          type="button"
                          onClick={() => {
                            const code = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "read") {
      var sheetName = "Kunjungan";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        var sheets = ss.getSheets();
        sheet = sheets[0];
      }
      var values = sheet.getDataRange().getValues();
      var records = [];
      if (values.length > 1) {
        var headers = values[0].map(function(h) { return h.toString().toUpperCase().trim(); });
        var idxID = headers.indexOf("ID");
        var idxNo = headers.indexOf("NO");
        var idxTanggal = headers.indexOf("TANGGAL");
        var idxNama = headers.indexOf("NAMA");
        var idxGender = headers.indexOf("JENIS KELAMIN") !== -1 ? headers.indexOf("JENIS KELAMIN") : headers.indexOf("L/P");
        var idxNIK = headers.indexOf("NIK");
        var idxTglLahir = headers.indexOf("TANGGAL LAHIR") !== -1 ? headers.indexOf("TANGGAL LAHIR") : headers.indexOf("TGL. LAHIR");
        var idxUsia = headers.indexOf("USIA");
        var idxAlamat = headers.indexOf("ALAMAT");
        var idxRT = headers.indexOf("RT");
        var idxTD = headers.indexOf("TD") !== -1 ? headers.indexOf("TD") : headers.indexOf("TEKANAN DARAH");
        var idxTB = headers.indexOf("TB");
        var idxBB = headers.indexOf("BB");
        var idxLP = headers.indexOf("LP");
        var idxGDS = headers.indexOf("GDS");
        var idxChol = headers.indexOf("CHOL") !== -1 ? headers.indexOf("CHOL") : headers.indexOf("KOLOSTEROL");
        var idxAU = headers.indexOf("AU") !== -1 ? headers.indexOf("AU") : headers.indexOf("ASAM URAT");
        var idxHB = headers.indexOf("HB") !== -1 ? headers.indexOf("HB") : headers.indexOf("HEMOGLOBIN");

        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          if (!row[idxNama !== -1 ? idxNama : 1]) continue;
          
          var tdValue = idxTD !== -1 ? row[idxTD].toString() : "120/80";
          var tdParts = tdValue.split("/");
          var tdSistolik = parseInt(tdParts[0]) || 120;
          var tdDiastolik = parseInt(tdParts[1]) || 80;

          records.push({
            id: idxID !== -1 ? row[idxID].toString() : "k-" + i,
            no: idxNo !== -1 ? parseInt(row[idxNo]) || i : i,
            tanggal: idxTanggal !== -1 ? row[idxTanggal].toString() : "",
            nama: idxNama !== -1 ? row[idxNama].toString() : "",
            jenisKelamin: idxGender !== -1 ? (row[idxGender].toString().toUpperCase() === "L" || row[idxGender].toString().toUpperCase() === "LAKI-LAKI" ? "Laki-laki" : "Perempuan") : "Laki-laki",
            nik: idxNIK !== -1 ? row[idxNIK].toString() : "",
            tanggalLahir: idxTglLahir !== -1 ? row[idxTglLahir].toString() : "",
            usia: idxUsia !== -1 ? parseInt(row[idxUsia]) || 0 : 0,
            alamat: idxAlamat !== -1 ? row[idxAlamat].toString() : "",
            rt: idxRT !== -1 ? row[idxRT].toString().padStart(3, "0") : "001",
            tdSistolik: tdSistolik,
            tdDiastolik: tdDiastolik,
            tb: idxTB !== -1 ? parseFloat(row[idxTB]) || 0 : 0,
            bb: idxBB !== -1 ? parseFloat(row[idxBB]) || 0 : 0,
            lp: idxLP !== -1 ? parseFloat(row[idxLP]) || 0 : 0,
            gds: idxGDS !== -1 ? parseInt(row[idxGDS]) || 0 : 0,
            chol: idxChol !== -1 ? parseInt(row[idxChol]) || 0 : 0,
            au: idxAU !== -1 ? parseFloat(row[idxAU]) || 0 : 0,
            hb: idxHB !== -1 ? parseFloat(row[idxHB]) || 0 : 0
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: records }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      var sheetName = "Kunjungan";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        var sheets = ss.getSheets();
        sheet = sheets[0];
      }
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "TANGGAL", "NAMA", "JENIS KELAMIN", "NIK", 
          "TANGGAL LAHIR", "USIA", "ALAMAT", "RT", "TD", 
          "TB", "BB", "LP", "GDS", "CHOL", "AU", "HB"
        ]);
      }
      sheet.appendRow([
        data.tanggal, data.nama, data.jenisKelamin, data.nik,
        data.tanggalLahir, data.usia, data.alamat, data.rt, data.td,
        data.tb, data.bb, data.lp, data.gds, data.chol, data.au, data.hb
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;
                            navigator.clipboard.writeText(code);
                            setIsCopied(true);
                            setTimeout(() => setIsCopied(false), 2000);
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded flex items-center gap-1 cursor-pointer transition-all"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{isCopied ? 'Tersalin!' : 'Salin Kode'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto text-[10px] font-mono leading-relaxed max-h-[150px]">
{`function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "read") {
      var sheetName = "Kunjungan";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        var sheets = ss.getSheets();
        sheet = sheets[0];
      }
      var values = sheet.getDataRange().getValues();
      var records = [];
      if (values.length > 1) {
        var headers = values[0].map(function(h) { return h.toString().toUpperCase().trim(); });
        var idxID = headers.indexOf("ID");
        var idxNo = headers.indexOf("NO");
        var idxTanggal = headers.indexOf("TANGGAL");
        var idxNama = headers.indexOf("NAMA");
        var idxGender = headers.indexOf("JENIS KELAMIN") !== -1 ? headers.indexOf("JENIS KELAMIN") : headers.indexOf("L/P");
        var idxNIK = headers.indexOf("NIK");
        var idxTglLahir = headers.indexOf("TANGGAL LAHIR") !== -1 ? headers.indexOf("TANGGAL LAHIR") : headers.indexOf("TGL. LAHIR");
        var idxUsia = headers.indexOf("USIA");
        var idxAlamat = headers.indexOf("ALAMAT");
        var idxRT = headers.indexOf("RT");
        var idxTD = headers.indexOf("TD") !== -1 ? headers.indexOf("TD") : headers.indexOf("TEKANAN DARAH");
        var idxTB = headers.indexOf("TB");
        var idxBB = headers.indexOf("BB");
        var idxLP = headers.indexOf("LP");
        var idxGDS = headers.indexOf("GDS");
        var idxChol = headers.indexOf("CHOL") !== -1 ? headers.indexOf("CHOL") : headers.indexOf("KOLOSTEROL");
        var idxAU = headers.indexOf("AU") !== -1 ? headers.indexOf("AU") : headers.indexOf("ASAM URAT");
        var idxHB = headers.indexOf("HB") !== -1 ? headers.indexOf("HB") : headers.indexOf("HEMOGLOBIN");

        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          if (!row[idxNama !== -1 ? idxNama : 1]) continue;
          
          var tdValue = idxTD !== -1 ? row[idxTD].toString() : "120/80";
          var tdParts = tdValue.split("/");
          var tdSistolik = parseInt(tdParts[0]) || 120;
          var tdDiastolik = parseInt(tdParts[1]) || 80;

          records.push({
            id: idxID !== -1 ? row[idxID].toString() : "k-" + i,
            no: idxNo !== -1 ? parseInt(row[idxNo]) || i : i,
            tanggal: idxTanggal !== -1 ? row[idxTanggal].toString() : "",
            nama: idxNama !== -1 ? row[idxNama].toString() : "",
            jenisKelamin: idxGender !== -1 ? (row[idxGender].toString().toUpperCase() === "L" || row[idxGender].toString().toUpperCase() === "LAKI-LAKI" ? "Laki-laki" : "Perempuan") : "Laki-laki",
            nik: idxNIK !== -1 ? row[idxNIK].toString() : "",
            tanggalLahir: idxTglLahir !== -1 ? row[idxTglLahir].toString() : "",
            usia: idxUsia !== -1 ? parseInt(row[idxUsia]) || 0 : 0,
            alamat: idxAlamat !== -1 ? row[idxAlamat].toString() : "",
            rt: idxRT !== -1 ? row[idxRT].toString().padStart(3, "0") : "001",
            tdSistolik: tdSistolik,
            tdDiastolik: tdDiastolik,
            tb: idxTB !== -1 ? parseFloat(row[idxTB]) || 0 : 0,
            bb: idxBB !== -1 ? parseFloat(row[idxBB]) || 0 : 0,
            lp: idxLP !== -1 ? parseFloat(row[idxLP]) || 0 : 0,
            gds: idxGDS !== -1 ? parseInt(row[idxGDS]) || 0 : 0,
            chol: idxChol !== -1 ? parseInt(row[idxChol]) || 0 : 0,
            au: idxAU !== -1 ? parseFloat(row[idxAU]) || 0 : 0,
            hb: idxHB !== -1 ? parseFloat(row[idxHB]) || 0 : 0
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, data: records }))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      var sheetName = "Kunjungan";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        var sheets = ss.getSheets();
        sheet = sheets[0];
      }
      if (sheet.getLastRow() === 0) {
        sheet.appendRow([
          "TANGGAL", "NAMA", "JENIS KELAMIN", "NIK", 
          "TANGGAL LAHIR", "USIA", "ALAMAT", "RT", "TD", 
          "TB", "BB", "LP", "GDS", "CHOL", "AU", "HB"
        ]);
      }
      sheet.appendRow([
        data.tanggal, data.nama, data.jenisKelamin, data.nik,
        data.tanggalLahir, data.usia, data.alamat, data.rt, data.td,
        data.tb, data.bb, data.lp, data.gds, data.chol, data.au, data.hb
      ]);
      return ContentService.createTextOutput(JSON.stringify({ success: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer transition-all shadow-sm"
              >
                Selesai & Tutup
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
  
