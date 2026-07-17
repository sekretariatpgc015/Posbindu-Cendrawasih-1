import React, { useState, useMemo, useEffect } from 'react';
import { 
  Coins, Wallet, TrendingUp, TrendingDown, Save, Plus, Trash2, 
  Search, Printer, Info, CheckCircle, RefreshCw, Cloud, ArrowDownToLine, ArrowUpFromLine,
  Copy, Check, ExternalLink, Code2, Settings
} from 'lucide-react';
import { KeuanganRecord } from '../types';
import { fetchGoogleSheetKeuangan } from '../utils/csvSync';

const INDONESIAN_MONTHS = [
  { value: 'all', label: 'Semua Bulan' },
  { value: '01', label: 'Januari' },
  { value: '02', label: 'Februari' },
  { value: '03', label: 'Maret' },
  { value: '04', label: 'April' },
  { value: '05', label: 'Mei' },
  { value: '06', label: 'Juni' },
  { value: '07', label: 'Juli' },
  { value: '08', label: 'Agustus' },
  { value: '09', label: 'September' },
  { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' },
  { value: '12', label: 'Desember' }
];

interface FormKeuanganViewProps {
  keuanganList: KeuanganRecord[];
  onSaveKeuangan: (newRecord: KeuanganRecord) => void;
  onDeleteKeuangan: (id: string) => void;
  onBulkSaveKeuangan: (newList: KeuanganRecord[]) => void;
}

export default function FormKeuanganView({ keuanganList, onSaveKeuangan, onDeleteKeuangan, onBulkSaveKeuangan }: FormKeuanganViewProps) {
  // Form State
  const [tanggal, setTanggal] = useState<string>('2026-07-04');
  const [keterangan, setKeterangan] = useState<string>('');
  const [kategori, setKategori] = useState<'Pemasukan' | 'Pengeluaran'>('Pemasukan');
  const [jumlah, setJumlah] = useState<string>('');

  // UI State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [jenisKasFilter, setJenisKasFilter] = useState<'Kas Posbindu' | 'Kas Cek Darah'>('Kas Posbindu');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, jenisKasFilter]);

  // Google Apps Script Integration State
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    const stored = localStorage.getItem('posbindu_apps_script_url');
    // Clear out the dummy example URL if it was saved to localStorage
    if (stored && stored.includes('_example/exec')) {
      localStorage.removeItem('posbindu_apps_script_url');
      return localStorage.getItem('posbindu_kunjungan_apps_script_url') || '';
    }
    if (stored && stored.trim() !== '') return stored;
    return localStorage.getItem('posbindu_kunjungan_apps_script_url') || '';
  });
  const [sendToGSheets, setSendToGSheets] = useState<boolean>(() => {
    return localStorage.getItem('posbindu_send_to_gsheets') === 'true';
  });
  const [isSubmittingToGSheets, setIsSubmittingToGSheets] = useState<boolean>(false);
  const [showAppsScriptInstructions, setShowAppsScriptInstructions] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('posbindu_apps_script_url', appsScriptUrl);
  }, [appsScriptUrl]);

  useEffect(() => {
    localStorage.setItem('posbindu_send_to_gsheets', sendToGSheets ? 'true' : 'false');
  }, [sendToGSheets]);

  // Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('posbindu_keuangan_last_synced') || null;
  });

  // Sync GSheets handler for both Kas Posbindu and Kas Cek Darah
  const handleSyncGoogleSheet = async (silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      let posbinduRecords: KeuanganRecord[] = [];
      let cekDarahRecords: KeuanganRecord[] = [];
      let fetchedUsingAppsScript = false;

      // 1. Try fetching directly via user's Apps Script Web App if available
      if (appsScriptUrl && appsScriptUrl.trim() !== '') {
        try {
          // Fetch Kas Posbindu
          const posbinduResponse = await fetch('/api/submit-keuangan-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: appsScriptUrl.trim(),
              payload: { action: 'read', jenisKas: 'Kas Posbindu' }
            })
          });
          
          if (posbinduResponse.ok) {
            const resData = await posbinduResponse.json();
            if (resData.status === 'success' && Array.isArray(resData.data)) {
              posbinduRecords = resData.data.map((item: any, i: number) => ({
                id: `g_sheet_finance_p_${i}_${Date.now()}`,
                tanggal: item.tanggal,
                keterangan: item.keterangan,
                kategori: item.kategori,
                jenisKas: 'Kas Posbindu',
                jumlah: item.jumlah,
                pj: item.pj || 'Kader'
              }));
              fetchedUsingAppsScript = true;
            }
          }

          // Fetch Kas Cek Darah
          const cekDarahResponse = await fetch('/api/submit-keuangan-proxy', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              url: appsScriptUrl.trim(),
              payload: { action: 'read', jenisKas: 'Kas Cek Darah' }
            })
          });

          if (cekDarahResponse.ok) {
            const resData = await cekDarahResponse.json();
            if (resData.status === 'success' && Array.isArray(resData.data)) {
              cekDarahRecords = resData.data.map((item: any, i: number) => ({
                id: `g_sheet_finance_c_${i}_${Date.now()}`,
                tanggal: item.tanggal,
                keterangan: item.keterangan,
                kategori: item.kategori,
                jenisKas: 'Kas Cek Darah',
                jumlah: item.jumlah,
                pj: item.pj || 'Kader'
              }));
            }
          }
        } catch (asErr) {
          console.warn('Failed to fetch via custom Apps Script read action, falling back to public CSV:', asErr);
        }
      }

      // 2. Fallback to reading the public read-only Spreadsheet CSV
      if (!fetchedUsingAppsScript) {
        posbinduRecords = await fetchGoogleSheetKeuangan('/api/proxy-keuangan', 'Kas Posbindu');
        cekDarahRecords = await fetchGoogleSheetKeuangan('/api/proxy-keuangan-cekdarah', 'Kas Cek Darah');
      }
      
      const combinedRecords = [...posbinduRecords, ...cekDarahRecords];
      
      if (combinedRecords.length > 0) {
        const updatedList = [...keuanganList];
        let addedCount = 0;
        
        // Load locally deleted transaction signatures to filter them out
        const deletedSigs = JSON.parse(localStorage.getItem('posbindu_deleted_keuangan_signatures') || '[]');
        
        combinedRecords.forEach(fetched => {
          const sig = `${fetched.tanggal}_${fetched.keterangan.toLowerCase().trim()}_${fetched.kategori}_${fetched.jenisKas}_${fetched.jumlah}`;
          if (deletedSigs.includes(sig)) {
            // Skip importing records deleted locally
            return;
          }

          const isDuplicate = updatedList.some(local => 
            local.tanggal === fetched.tanggal &&
            local.keterangan.toLowerCase().trim() === fetched.keterangan.toLowerCase().trim() &&
            local.kategori === fetched.kategori &&
            local.jenisKas === fetched.jenisKas &&
            local.jumlah === fetched.jumlah
          );
          
          if (!isDuplicate) {
            updatedList.push(fetched);
            addedCount++;
          }
        });
        
        onBulkSaveKeuangan(updatedList);
        
        const now = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        setLastSynced(now);
        localStorage.setItem('posbindu_keuangan_last_synced', now);
        
        if (!silent) {
          setNotificationMessage(`Sinkronisasi Berhasil! ${combinedRecords.length} transaksi dimuat (${addedCount} transaksi baru).`);
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }
      } else {
        if (!silent) {
          setNotificationMessage('Lembar kerja Google Sheets kosong atau tidak memiliki data transaksi valid.');
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 5000);
        }
      }
    } catch (err: any) {
      console.error('Failed to sync keuangan from Google Sheets:', err);
      if (!silent) {
        setSyncError(err.message || 'Gagal menyinkronkan data keuangan dari Google Sheets.');
      }
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-sync on component mount and on tab changes
  useEffect(() => {
    handleSyncGoogleSheet(true);
  }, [jenisKasFilter]);

  // Export cash ledger to CSV
  const handleExportCSV = () => {
    // Filter transactions by the active jenisKasFilter (e.g., Kas Posbindu)
    const activeList = keuanganList.filter(f => f.jenisKas === jenisKasFilter);
    if (activeList.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }
    
    // Sort chronologically ascending for the export
    const sorted = [...activeList].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    
    // Generate CSV Content with exactly the requested columns: TANGGAL, URAIAN, PEMASUKAN, PENGELUARAN
    const csvRows = [
      ['TANGGAL', 'URAIAN', 'PEMASUKAN', 'PENGELUARAN'].join(','),
      ...sorted.map((item) => {
        const escapedDesc = `"${item.keterangan.replace(/"/g, '""')}"`;
        const formattedDate = item.tanggal.split('-').reverse().join('/'); // DD/MM/YYYY
        
        const isIncome = item.kategori === 'Pemasukan';
        const pemasukanValue = isIncome ? item.jumlah : '';
        const pengeluaranValue = !isIncome ? item.jumlah : '';
        
        return [
          formattedDate,
          escapedDesc,
          pemasukanValue,
          pengeluaranValue
        ].join(',');
      })
    ];
    
    // Create download link
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LaporanKeuangan-${jenisKasFilter.replace(/\s+/g, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotificationMessage(`Ekspor berhasil! File LaporanKeuangan-${jenisKasFilter.replace(/\s+/g, '')}.csv telah diunduh.`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  };


  // Currency Formatter
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Helper to get last date of selected month
  const getSignatureDate = () => {
    if (monthFilter && monthFilter !== 'all') {
      const year = new Date().getFullYear();
      const monthInt = parseInt(monthFilter, 10);
      const lastDay = new Date(year, monthInt, 0).getDate();
      const dateObj = new Date(year, monthInt - 1, lastDay);
      return `Bekasi, ${dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    return `Bekasi, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
  };

  // Helper to get Bendahara info based on active filter
  const getBendaharaInfo = () => {
    if (jenisKasFilter === 'Kas Cek Darah') {
      return {
        nama: 'Uun Yuningsih',
        signatureUrl: 'https://drive.google.com/thumbnail?id=1lgKyVDF1LsoTJtHDE8Sawb03sRt-dySs'
      };
    }
    return {
      nama: 'Sumarni',
      signatureUrl: 'https://drive.google.com/thumbnail?id=1DKZ9ZYQB8t4DcyHqu2L43AMC-BlbJ8NN'
    };
  };

  // Calculate Cumulative Financial Metrics
  const financialSummary = useMemo(() => {
    const listToSummarize = keuanganList.filter(f => f.jenisKas === jenisKasFilter);

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let saldoBulanLalu = 0;

    if (monthFilter !== 'all') {
      listToSummarize.forEach(item => {
        const itemMonth = item.tanggal.split('-')[1]; // YYYY-MM-DD
        if (itemMonth < monthFilter) {
          if (item.kategori === 'Pemasukan') saldoBulanLalu += item.jumlah;
          else saldoBulanLalu -= item.jumlah;
        } else if (itemMonth === monthFilter) {
          if (item.kategori === 'Pemasukan') totalPemasukan += item.jumlah;
          else totalPengeluaran += item.jumlah;
        }
      });
    } else {
      totalPemasukan = listToSummarize
        .filter(f => f.kategori === 'Pemasukan')
        .reduce((sum, item) => sum + item.jumlah, 0);

      totalPengeluaran = listToSummarize
        .filter(f => f.kategori === 'Pengeluaran')
        .reduce((sum, item) => sum + item.jumlah, 0);
    }

    const saldo = monthFilter !== 'all' 
      ? saldoBulanLalu + totalPemasukan - totalPengeluaran
      : totalPemasukan - totalPengeluaran;

    return { 
      totalPemasukan, 
      totalPengeluaran, 
      saldo,
      saldoBulanLalu,
      label: `Saldo ${jenisKasFilter}`
    };
  }, [keuanganList, jenisKasFilter, monthFilter]);

  // Calculate running balance per record BEFORE filtering
  const ledgerWithRunningBalance = useMemo(() => {
    // Sort chronologically ascending for running balance computation
    const sorted = [...keuanganList].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
    let balancePosbindu = 0;
    let balanceCekDarah = 0;
    
    const computed = sorted.map(item => {
      let currentBalance = 0;
      if (item.jenisKas === 'Kas Posbindu') {
        if (item.kategori === 'Pemasukan') balancePosbindu += item.jumlah;
        else balancePosbindu -= item.jumlah;
        currentBalance = balancePosbindu;
      } else {
        if (item.kategori === 'Pemasukan') balanceCekDarah += item.jumlah;
        else balanceCekDarah -= item.jumlah;
        currentBalance = balanceCekDarah;
      }
      return { ...item, saldoBerjalan: currentBalance };
    });
    
    return computed;
  }, [keuanganList]);

  // Filter and Search Ledger
  const filteredLedger = useMemo(() => {
    return ledgerWithRunningBalance.filter(item => {
      // Jenis Kas filter
      if (item.jenisKas !== jenisKasFilter) return false;

      // Month filter
      if (monthFilter !== 'all') {
        const itemMonth = item.tanggal.split('-')[1]; // YYYY-MM-DD
        if (itemMonth !== monthFilter) return false;
      }

      // Search term (Description)
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        return item.keterangan.toLowerCase().includes(query);
      }

      return true;
    });
  }, [ledgerWithRunningBalance, monthFilter, searchTerm]);

  // Handle submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal) { alert('Harap isi tanggal.'); return; }
    if (!keterangan) { alert('Harap isi keterangan.'); return; }
    if (!jumlah || parseFloat(jumlah) <= 0) { alert('Harap isi jumlah uang yang valid.'); return; }

    const nominalValue = parseFloat(jumlah);
    const newRecord: KeuanganRecord = {
      id: `f-${Date.now()}`,
      tanggal,
      keterangan,
      kategori,
      jenisKas: jenisKasFilter,
      jumlah: nominalValue,
      pj: 'Kader'
    };

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
              tanggal: newRecord.tanggal,
              keterangan: newRecord.keterangan,
              kategori: newRecord.kategori,
              jenisKas: newRecord.jenisKas,
              jumlah: newRecord.jumlah,
              pj: newRecord.pj
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
        console.error('Failed to submit to Google Sheets:', err);
        gSheetsStatusMessage = ' (tersimpan lokal, gagal kirim ke Google Sheets)';
        
        // If it's an invalid URL error, show a clear message
        if (err.message && err.message.includes('Invalid Apps Script URL')) {
          alert('GAGAL: URL Apps Script tidak valid atau tidak ditemukan (404).\n\nPastikan Anda menyalin URL Web App yang benar (berakhir dengan /exec). Silakan perbaiki URL pada pengaturan "Integrasi Google Sheets" di bawah.');
        } else {
          alert(`Gagal sinkronisasi ke GSheets: ${err.message}`);
        }
      } finally {
        setIsSubmittingToGSheets(false);
      }
    }

    onSaveKeuangan(newRecord);

    // Success notify
    setNotificationMessage(`Berhasil mencatat ${kategori} sebesar ${formatRupiah(nominalValue)}${gSheetsStatusMessage}!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);

    // Reset Form
    setKeterangan('');
    setJumlah('');

    // Trigger auto background sync after save to fetch updated records from Google Sheets
    setTimeout(() => {
      handleSyncGoogleSheet(true);
    }, 1500);
  };

  const handleManualDelete = (id: string, detail: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus catatan keuangan "${detail}"?`)) {
      // Find the record being deleted to generate its signature
      const recordToDelete = keuanganList.find(item => item.id === id);
      if (recordToDelete) {
        const sig = `${recordToDelete.tanggal}_${recordToDelete.keterangan.toLowerCase().trim()}_${recordToDelete.kategori}_${recordToDelete.jenisKas}_${recordToDelete.jumlah}`;
        try {
          const deletedSigs = JSON.parse(localStorage.getItem('posbindu_deleted_keuangan_signatures') || '[]');
          if (!deletedSigs.includes(sig)) {
            deletedSigs.push(sig);
            localStorage.setItem('posbindu_deleted_keuangan_signatures', JSON.stringify(deletedSigs));
          }
        } catch (e) {
          console.error('Error saving deleted signature:', e);
        }
      }
      onDeleteKeuangan(id);
      setNotificationMessage('Catatan transaksi berhasil dihapus.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  };

  const handleCopyScript = () => {
    const scriptText = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    var data = JSON.parse(e.postData.contents);
    
    // Support reading records to sync back to the web application
    if (data.action === "read") {
      var sheetName = data.jenisKas || "Kas Posbindu";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        var sheets = ss.getSheets();
        if (sheetName === "Kas Cek Darah" && sheets.length > 1) {
          sheet = sheets[1];
        } else {
          sheet = sheets[0];
        }
      }
      
      var values = sheet.getDataRange().getValues();
      var records = [];
      
      if (values.length > 1) {
        var headers = values[0].map(function(h) { return h.toString().toUpperCase().trim(); });
        var idxTanggal = headers.indexOf("TANGGAL");
        var idxUraian = headers.indexOf("URAIAN") !== -1 ? headers.indexOf("URAIAN") : headers.indexOf("KETERANGAN");
        var idxPemasukan = headers.indexOf("PEMASUKAN");
        var idxPengeluaran = headers.indexOf("PENGELUARAN");
        
        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          var rawTanggal = row[idxTanggal !== -1 ? idxTanggal : 0];
          var rawUraian = row[idxUraian !== -1 ? idxUraian : 1];
          var rawPemasukan = row[idxPemasukan !== -1 ? idxPemasukan : 2];
          var rawPengeluaran = row[idxPengeluaran !== -1 ? idxPengeluaran : 3];
          
          if (!rawTanggal && !rawUraian) continue;
          
          // Format Date to YYYY-MM-DD
          var dateStr = "";
          if (rawTanggal instanceof Date) {
            var y = rawTanggal.getFullYear();
            var m = ("0" + (rawTanggal.getMonth() + 1)).slice(-2);
            var d = ("0" + rawTanggal.getDate()).slice(-2);
            dateStr = y + "-" + m + "-" + d;
          } else if (rawTanggal) {
            var parts = rawTanggal.toString().split("/");
            if (parts.length === 3) {
              dateStr = parts[2] + "-" + parts[1].padStart(2, "0") + "-" + parts[0].padStart(2, "0");
            } else {
              dateStr = rawTanggal.toString();
            }
          }
          
          var valPemasukan = parseFloat(rawPemasukan) || 0;
          var valPengeluaran = parseFloat(rawPengeluaran) || 0;
          var kategori = valPengeluaran > 0 && valPemasukan === 0 ? "Pengeluaran" : "Pemasukan";
          var jumlah = valPengeluaran > 0 && valPemasukan === 0 ? valPengeluaran : valPemasukan;
          
          records.push({
            tanggal: dateStr,
            keterangan: rawUraian.toString().trim() || "Transaksi Tanpa Keterangan",
            kategori: kategori,
            jenisKas: sheetName,
            jumlah: jumlah,
            pj: "Kader"
          });
        }
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: records }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Normal append row (Save transaction)
    var rawTanggal = data.tanggal || ""; 
    var formattedDate = rawTanggal;
    var parts = rawTanggal.split('-');
    if (parts.length === 3) {
      formattedDate = parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    
    var uraian = data.keterangan || "";
    var kategori = data.kategori || "Pemasukan";
    var jenisKas = data.jenisKas || "Kas Posbindu";
    var jumlah = parseFloat(data.jumlah) || 0;
    
    var sheetName = "Kas Posbindu";
    if (jenisKas.toLowerCase().indexOf("cek") !== -1 || jenisKas.toLowerCase().indexOf("darah") !== -1) {
      sheetName = "Kas Cek Darah";
    }
    
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      var sheets = ss.getSheets();
      if (sheetName === "Kas Cek Darah" && sheets.length > 1) {
        sheet = sheets[1];
      } else {
        sheet = sheets[0];
      }
    }
    
    var pemasukan = "";
    var pengeluaran = "";
    
    if (kategori.toLowerCase().indexOf("keluar") !== -1) {
      pengeluaran = jumlah;
    } else {
      pemasukan = jumlah;
    }
    
    sheet.appendRow([formattedDate, uraian, pemasukan, pengeluaran]);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaksi berhasil disimpan ke " + sheet.getName() }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`;
    navigator.clipboard.writeText(scriptText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12" id="keuangan-view-container">
      {/* Print only Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
        {/* Left Logo (Logo RW) */}
        <div className="flex-shrink-0">
          <img 
            src="https://drive.google.com/thumbnail?id=17G7evIeHShfqn7aSm7L1mfgjlb1hStya" 
            alt="Logo RW" 
            className="h-16 w-16 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        
        {/* Center Text */}
        <div className="text-center flex-1">
          <h1 className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">POSBINDU CENDRAWASIH 1</h1>
          <p className="text-sm font-black text-slate-950 uppercase mt-1">RW 015 PESONA GADING CIBITUNG</p>
          <p className="text-[10px] text-slate-800 font-bold uppercase mt-1">DESA WANAJAYA, KECAMATAN CIBITUNG</p>
          <p className="text-[8px] text-slate-500 italic mt-0.5">Alamat: Jl. Cempaka Blok C2 RT 001, Bekasi, Jawa Barat</p>
          <div className="flex justify-center gap-4 mt-2 text-[9px] text-slate-800 font-semibold border-t border-slate-100 pt-1.5">
            <div><span>KAS:</span> {jenisKasFilter}</div>
            {monthFilter !== 'all' && (
              <div><span>BULAN:</span> {INDONESIAN_MONTHS.find(m => m.value === monthFilter)?.label.toUpperCase()}</div>
            )}
            <div><span>TGL CETAK:</span> {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</div>
          </div>
        </div>
        
        {/* Right Logo (Logo Posbindu) */}
        <div className="flex-shrink-0">
          <img 
            src="https://drive.google.com/thumbnail?id=1YibmCQLufPZ9t5gDx7I7JTLY4m1oymrM" 
            alt="Logo Posbindu" 
            className="h-16 w-16 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* Header section with Tabs */}
      <div className="bg-[#FFC8DD] p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Laporan Keuangan</h1>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 hover:bg-white/50 text-slate-700 hover:text-indigo-700 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-slate-300"
              title="Pengaturan Sinkronisasi Google Sheets"
              id="btn-open-gsheets-settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">Pencatatan pemasukan, pengeluaran kas, saldo akhir keuangan operasional kader.</p>
        </div>
        
        <div className="flex bg-slate-50 p-1 rounded-xl w-full md:w-auto border border-slate-200 shadow-sm">
           <button 
             onClick={() => setJenisKasFilter('Kas Posbindu')} 
             className={`flex-1 md:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${jenisKasFilter === 'Kas Posbindu' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Kas Posbindu
           </button>
           <button 
             onClick={() => setJenisKasFilter('Kas Cek Darah')} 
             className={`flex-1 md:flex-none px-5 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${jenisKasFilter === 'Kas Cek Darah' ? 'bg-white text-indigo-700 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Kas Cek Darah
           </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className={`grid grid-cols-1 gap-5 ${monthFilter !== 'all' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-3'}`} id="keuangan-summary">
        {monthFilter !== 'all' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between print:border-slate-200 print:shadow-none">
            <div className="space-y-1">
              <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo Bulan Lalu</span>
              <span className="text-xl font-extrabold text-slate-800 block">{formatRupiah(financialSummary.saldoBulanLalu)}</span>
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1 mt-1 print:text-slate-600">
                Sisa kas bulan sebelumnya
              </span>
            </div>
            <div className="p-3 bg-slate-50 text-slate-500 rounded-2xl print:hidden">
              <Wallet className="w-6 h-6" />
            </div>
          </div>
        )}

        {/* Pemasukan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between print:border-slate-200 print:shadow-none">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan</span>
            <span className="text-xl font-extrabold text-slate-800 block">{formatRupiah(financialSummary.totalPemasukan)}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl print:hidden">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between print:border-slate-200 print:shadow-none">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
            <span className="text-xl font-extrabold text-slate-800 block">{formatRupiah(financialSummary.totalPengeluaran)}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl print:hidden">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>

        {/* Saldo Akhir */}
        <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-6 rounded-2xl shadow-md relative overflow-hidden print:bg-none print:bg-slate-50 print:text-slate-800 print:border print:border-slate-200 print:shadow-none">
          <div className="absolute right-3 -bottom-3 opacity-15 print:hidden">
            <Coins className="w-24 h-24 text-white" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100 print:text-slate-500">{financialSummary.label}</span>
            <div className="p-1.5 bg-indigo-500/30 rounded-lg text-indigo-50 print:hidden">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-bold block mt-3 tracking-tight">{formatRupiah(financialSummary.saldo)}</span>
          <p className="text-[10px] text-indigo-100/80 mt-2 print:text-slate-400">Akumulasi sisa kas operasional siap digunakan.</p>
        </div>
      </div>


      {/* Feedback banner */}
      {showNotification && (
        <div id="keuangan-notification" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in print:hidden">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Dual Layout: Input Form & Ledger list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="keuangan-main-grid">
        
        {/* Left Side: Form Input */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit print:hidden">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-800">Input Mutasi Kas Baru</h2>
            <p className="text-[11px] text-slate-400">Catat setiap transaksi operasional {jenisKasFilter === 'Kas Posbindu' ? 'Posbindu' : 'Cek Darah'} demi transparansi.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="form-mutasi-keuangan">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tanggal</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                id="keuangan-tanggal"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Uraian */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Uraian</label>
              <textarea
                required
                rows={3}
                placeholder="Pembelian konsumsi lansia, iuran bulanan warga, dll..."
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                id="keuangan-keterangan"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
              />
            </div>

            {/* Jenis Transaksi */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jenis Transaksi (Pemasukan/Pengeluaran)</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setKategori('Pemasukan')}
                  id="btn-cat-pemasukan"
                  className={`py-2 text-xs font-bold rounded-xl border flex justify-center items-center gap-1.5 transition-all cursor-pointer ${kategori === 'Pemasukan' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'}`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => setKategori('Pengeluaran')}
                  id="btn-cat-pengeluaran"
                  className={`py-2 text-xs font-bold rounded-xl border flex justify-center items-center gap-1.5 transition-all cursor-pointer ${kategori === 'Pengeluaran' ? 'bg-rose-50 border-rose-300 text-rose-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'}`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  Pengeluaran
                </button>
              </div>
            </div>

            {/* Jumlah (Rp) */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jumlah Nominal (Rupiah)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">Rp</span>
                <input
                  type="number"
                  required
                  placeholder="Cth: 150000"
                  value={jumlah}
                  onChange={(e) => setJumlah(e.target.value)}
                  id="keuangan-jumlah"
                  className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Input hanya angka saja tanpa tanda baca titik/koma.</span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-save-keuangan"
              disabled={isSubmittingToGSheets}
              className={`w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-md transition-all hover:scale-[1.01] cursor-pointer ${isSubmittingToGSheets ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmittingToGSheets ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSubmittingToGSheets ? 'Mengirim ke GSheets...' : 'Simpan Transaksi'}</span>
            </button>
          </form>


        </div>

        {/* Right Side: Ledger Table */}
        <div className="lg:col-span-8 print:col-span-12 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between print:shadow-none print:border-none print:p-0">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4 print:mb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Buku {jenisKasFilter === 'Kas Posbindu' ? 'Kas Operasional Posbindu' : 'Kas Operasional Cek Darah'}</h2>
                <p className="text-[11px] text-slate-400 print:hidden">
                  Daftar arus kas masuk dan keluar secara terperinci.
                  {lastSynced && (
                    <span className="text-emerald-600 font-semibold ml-1">
                      (Sinkron: {lastSynced})
                    </span>
                  )}
                </p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto print:hidden">
                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari uraian..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    id="input-search-keuangan"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Month dropdown */}
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  id="select-keuangan-filter-bulan"
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-lg outline-none cursor-pointer font-semibold"
                >
                  {INDONESIAN_MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>


                {/* Print PDF (Show Preview First) */}
                <button
                  onClick={() => setShowPrintPreview(true)}
                  id="btn-print-keuangan"
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                  title="Pratinjau sebelum cetak"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak PDF</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4 min-w-[90px]">Tanggal</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Uraian</th>
                    <th className="py-2.5 px-4 text-right">Pemasukan</th>
                    <th className="py-2.5 px-4 text-right">Pengeluaran</th>
                    <th className="py-2.5 px-4 text-center print:hidden">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-400 font-medium">
                        Belum ada data mutasi kas yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    (() => {
                      const startIndex = (currentPage - 1) * rowsPerPage;
                      const paginatedLedger = filteredLedger.slice(startIndex, startIndex + rowsPerPage);
                      return paginatedLedger.map((item) => {
                        const isIncome = item.kategori === 'Pemasukan';
                        return (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                            <td className="py-3 px-4 whitespace-nowrap">{item.tanggal.split('-').reverse().join('/')}</td>
                            <td className="py-3 px-4 font-medium text-slate-800 break-words max-w-[240px]" title={item.keterangan}>
                              {item.keterangan}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-emerald-600">
                              {isIncome ? formatRupiah(item.jumlah) : <span className="text-slate-300 font-normal">-</span>}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-rose-600">
                              {!isIncome ? formatRupiah(item.jumlah) : <span className="text-slate-300 font-normal">-</span>}
                            </td>
                            <td className="py-3 px-4 text-center print:hidden">
                              <button
                                onClick={() => handleManualDelete(item.id, item.keterangan)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                                title="Hapus transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredLedger.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-6 print:hidden mt-2">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs text-slate-500">
                      Menampilkan <span className="font-bold text-slate-700">{((currentPage - 1) * rowsPerPage) + 1}</span> hingga <span className="font-bold text-slate-700">{Math.min(currentPage * rowsPerPage, filteredLedger.length)}</span> dari <span className="font-bold text-slate-700">{filteredLedger.length}</span> data
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-l-md border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all"
                      >
                        <span className="sr-only">Previous</span>
                        Sebelumnya
                      </button>
                      
                      {(() => {
                        const totalPages = Math.ceil(filteredLedger.length / rowsPerPage);
                        if (totalPages <= 7) {
                          return Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium cursor-pointer transition-all ${
                                currentPage === pageNum
                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {pageNum}
                            </button>
                          ));
                        }

                        const pages = [];
                        let startPage = Math.max(1, currentPage - 1);
                        let endPage = Math.min(totalPages, currentPage + 1);

                        if (currentPage <= 3) {
                          endPage = 4;
                        }
                        if (currentPage >= totalPages - 2) {
                          startPage = totalPages - 3;
                        }

                        if (startPage > 1) {
                          pages.push(
                            <button key={1} onClick={() => setCurrentPage(1)} className="relative inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-medium cursor-pointer transition-all bg-white text-slate-500 hover:bg-slate-50">1</button>
                          );
                          if (startPage > 2) {
                            pages.push(<span key="ellipsis-start" className="relative inline-flex items-center px-2 py-1.5 border border-slate-200 bg-white text-xs font-medium text-slate-500">...</span>);
                          }
                        }

                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i)}
                              className={`relative inline-flex items-center px-3 py-1.5 border text-xs font-medium cursor-pointer transition-all ${
                                currentPage === i
                                  ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-700 font-bold'
                                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              {i}
                            </button>
                          );
                        }

                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(<span key="ellipsis-end" className="relative inline-flex items-center px-2 py-1.5 border border-slate-200 bg-white text-xs font-medium text-slate-500">...</span>);
                          }
                          pages.push(
                            <button key={totalPages} onClick={() => setCurrentPage(totalPages)} className="relative inline-flex items-center px-3 py-1.5 border border-slate-200 text-xs font-medium cursor-pointer transition-all bg-white text-slate-500 hover:bg-slate-50">{totalPages}</button>
                          );
                        }

                        return pages;
                      })()}

                      <button
                        onClick={() => setCurrentPage(Math.min(Math.ceil(filteredLedger.length / rowsPerPage), currentPage + 1))}
                        disabled={currentPage === Math.ceil(filteredLedger.length / rowsPerPage) || filteredLedger.length === 0}
                        className="relative inline-flex items-center px-2 py-1.5 rounded-r-md border border-slate-200 bg-white text-xs font-medium text-slate-500 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed cursor-pointer transition-all"
                      >
                        <span className="sr-only">Next</span>
                        Berikutnya
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-xl text-[10px] text-slate-400 flex items-center gap-1.5 mt-4 print:hidden">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Setiap transaksi diarsipkan demi akuntabilitas laporan bulanan pertanggungjawaban operasional RW / Kelurahan.</span>
          </div>
          
          {/* Print only Tanda Tangan */}
          <div className="hidden print:grid grid-cols-2 text-center text-xs text-slate-800 mt-10 pt-6 border-t border-dashed border-slate-200 w-full">
            {/* Kiri: Ketua Posbindu */}
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
                <p className="font-bold text-slate-950 underline">Dewi Tri Purwaningsih</p>
              </div>
            </div>

            {/* Kanan: Bendahara */}
            <div className="flex flex-col items-center justify-between min-h-[140px]">
              <div>
                <p className="font-semibold text-slate-600">{getSignatureDate()}</p>
                <p className="font-bold text-slate-900 mt-0.5">Bendahara / Kader Pelaksana</p>
              </div>
              <div className="my-2 h-16 flex items-center justify-center">
                <img 
                  src={getBendaharaInfo().signatureUrl} 
                  alt="Tanda Tangan Bendahara" 
                  className="h-16 w-auto object-contain mix-blend-multiply"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <p className="font-bold text-slate-950 underline">{getBendaharaInfo().nama}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Print Preview Modal */}
      {showPrintPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Pratinjau Laporan Keuangan</h2>
                  <p className="text-[10px] text-slate-500">Tampilan sebelum dicetak ke kertas / PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold rounded-full animate-pulse">
                  Kertas A4 (Potret)
                </span>
                <button 
                  onClick={() => setShowPrintPreview(false)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content Container */}
            <div className="p-6 md:p-8 overflow-y-auto bg-slate-100/50 flex-1 flex justify-center">
              
              {/* Paper Layout (Simulated A4 Paper Sheet) */}
              <div className="bg-white p-10 md:p-12 shadow-md border border-slate-200/80 max-w-3xl w-full rounded-md min-h-[297mm] flex flex-col justify-between font-sans text-slate-800">
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
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase underline">LAPORAN MUTASI & SALDO KAS</h3>
                    <p className="text-[11px] font-bold text-slate-700 mt-1 uppercase">UNIT: {jenisKasFilter}</p>
                    {monthFilter !== 'all' && (
                      <p className="text-[10px] text-slate-600 font-semibold mt-0.5">
                        PERIODE: {INDONESIAN_MONTHS.find(m => m.value === monthFilter)?.label.toUpperCase()} 2026
                      </p>
                    )}
                  </div>

                  {/* Summary Informasi */}
                  <div className={`grid gap-4 mb-6 border border-slate-200 bg-slate-50/50 p-4 rounded-xl ${monthFilter !== 'all' ? 'grid-cols-4' : 'grid-cols-3'}`}>
                    {monthFilter !== 'all' && (
                      <div className="space-y-1 border-r border-slate-200 pr-4">
                        <span className="block text-[10px] text-slate-500 font-semibold uppercase">Saldo B. Lalu</span>
                        <span className="text-sm font-bold text-slate-800 block">{formatRupiah(financialSummary.saldoBulanLalu)}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="block text-[10px] text-slate-500 font-semibold uppercase">Total Pemasukan</span>
                      <span className="text-sm font-bold text-emerald-600 block">{formatRupiah(financialSummary.totalPemasukan)}</span>
                    </div>
                    <div className="space-y-1 border-l border-slate-200 pl-4">
                      <span className="block text-[10px] text-slate-500 font-semibold uppercase">Total Pengeluaran</span>
                      <span className="text-sm font-bold text-rose-600 block">{formatRupiah(financialSummary.totalPengeluaran)}</span>
                    </div>
                    <div className="space-y-1 border-l border-slate-200 pl-4">
                      <span className="block text-[10px] text-slate-500 font-semibold uppercase">Saldo Akhir</span>
                      <span className="text-sm font-extrabold text-slate-900 block">{formatRupiah(financialSummary.saldo)}</span>
                    </div>
                  </div>

                  {/* Tabel Laporan */}
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-[11px] border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase tracking-wider text-left">
                          <th className="py-2 px-3 border-r border-slate-300">Tanggal</th>
                          <th className="py-2 px-3 border-r border-slate-300">Uraian</th>
                          <th className="py-2 px-3 text-right border-r border-slate-300">Pemasukan</th>
                          <th className="py-2 px-3 text-right">Pengeluaran</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {filteredLedger.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400 font-medium italic">
                              Tidak ada data transaksi keuangan untuk periode ini.
                            </td>
                          </tr>
                        ) : (
                          filteredLedger.map((item) => {
                            const isIncome = item.kategori === 'Pemasukan';
                            return (
                              <tr key={item.id} className="hover:bg-slate-50">
                                <td className="py-2 px-3 border-r border-slate-200 whitespace-nowrap">
                                  {item.tanggal.split('-').reverse().join('/')}
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 font-medium text-slate-900">
                                  {item.keterangan}
                                </td>
                                <td className="py-2 px-3 text-right border-r border-slate-200 text-emerald-600 font-bold whitespace-nowrap">
                                  {isIncome ? formatRupiah(item.jumlah) : '-'}
                                </td>
                                <td className="py-2 px-3 text-right text-rose-600 font-bold whitespace-nowrap">
                                  {!isIncome ? formatRupiah(item.jumlah) : '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tanda Tangan */}
                <div className="mt-12 grid grid-cols-2 text-center text-xs text-slate-800 pt-8 border-t border-dashed border-slate-200">
                  {/* Kiri: Ketua Posbindu */}
                  <div className="flex flex-col items-center justify-between min-h-[140px]">
                    <div>
                      <p className="font-semibold text-slate-600">Mengetahui,</p>
                      <p className="font-bold text-slate-900 mt-0.5">Ketua Posbindu Cendrawasih 1</p>
                    </div>
                    
                    {/* Signature Image */}
                    <div className="my-2 h-16 flex items-center justify-center">
                      <img 
                        src="https://drive.google.com/thumbnail?id=1SvusQZJ_OJ2P90OZlLtPYduUFszrdwWO" 
                        alt="Tanda Tangan Ketua" 
                        className="h-16 w-auto object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <p className="font-bold text-slate-950 underline">Dewi Tri Purwaningsih</p>
                    </div>
                  </div>

                  {/* Kanan: Bendahara */}
                  <div className="flex flex-col items-center justify-between min-h-[140px]">
                    <div>
                      <p className="font-semibold text-slate-600">{getSignatureDate()}</p>
                      <p className="font-bold text-slate-900 mt-0.5">Bendahara / Kader Pelaksana</p>
                    </div>
                    
                    {/* Signature Image */}
                    <div className="my-2 h-16 flex items-center justify-center">
                      <img 
                        src={getBendaharaInfo().signatureUrl} 
                        alt="Tanda Tangan Bendahara" 
                        className="h-16 w-auto object-contain mix-blend-multiply"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <div>
                      <p className="font-bold text-slate-950 underline">{getBendaharaInfo().nama}</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer (Controls) */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 font-semibold hidden md:flex items-center gap-1">
                <Info className="w-3.5 h-3.5 animate-bounce" />
                <span>Tips: Gunakan ukuran kertas A4 dengan orientasi Portrait pada dialog cetak peramban.</span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
                >
                  Batal / Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPrintPreview(false);
                    setTimeout(() => window.print(), 150);
                  }}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md hover:shadow-indigo-100"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Laporan</span>
                </button>
              </div>
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
                  disabled={isSyncing}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer transition-all shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
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
                <p className="text-[10px] text-slate-400">Pastikan URL berakhir dengan <code className="font-mono text-slate-600 bg-slate-100 px-1 rounded">/exec</code>. URL ini digunakan untuk menulis dan membaca data secara langsung dari spreadsheet Anda.</p>
              </div>

              {/* Auto Sync Toggle */}
              <label className="flex items-start gap-2.5 p-3.5 border border-slate-150 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sendToGSheets}
                  onChange={(e) => setSendToGSheets(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer h-4 w-4"
                />
                <div>
                  <span className="font-bold text-slate-700 block">Kirim Otomatis ke Google Sheets</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Setiap kali Anda menekan tombol "Simpan Transaksi", mutasi kas akan langsung dicatat secara real-time ke lembar kerja Google Sheets Anda.</span>
                </div>
              </label>

              {/* Advanced: Clear deleted signatures */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-slate-700">Setel Ulang Riwayat Terhapus</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Hapus jejak penolakan data agar transaksi yang pernah dihapus di web dapat dimuat kembali saat sinkronisasi.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('posbindu_deleted_keuangan_signatures');
                    alert('Jejak penghapusan berhasil disetel ulang! Semua baris dari spreadsheet akan kembali dimuat saat tombol "Sinkronkan Sekarang" ditekan.');
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-lg text-[10px] cursor-pointer transition-all"
                >
                  Setel Ulang
                </button>
              </div>

              {/* Apps Script Guide Code */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    Panduan & Kode Google Apps Script
                  </span>
                  <button
                    onClick={() => setShowAppsScriptInstructions(!showAppsScriptInstructions)}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{showAppsScriptInstructions ? 'Sembunyikan' : 'Lihat Cara Pasang'}</span>
                  </button>
                </div>

                {showAppsScriptInstructions && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 text-[11px] leading-relaxed animate-fade-in text-slate-700">
                    <p className="font-bold text-indigo-700">Langkah Pemasangan di Google Spreadsheet:</p>
                    <ol className="list-decimal pl-4 space-y-1.5">
                      <li>Buka Google Spreadsheet Anda. Buat dua lembar kerja (Tab) dengan nama persis: <strong className="text-slate-900">"Kas Posbindu"</strong> dan <strong className="text-slate-900">"Kas Cek Darah"</strong>.</li>
                      <li>Di menu atas spreadsheet, klik <strong className="text-slate-900">Ekstensi &gt; Apps Script</strong>.</li>
                      <li>Hapus semua kode bawaan, lalu salin dan tempel kode lengkap di bawah ini.</li>
                      <li>Klik ikon Simpan (disket) atau tekan <kbd className="bg-white border border-slate-300 px-1 rounded text-[9px] shadow-sm font-mono">Ctrl+S</kbd>.</li>
                      <li>Klik tombol <strong className="text-slate-900">Terapkan &gt; Penerapan Baru (Deploy &gt; New Deployment)</strong>.</li>
                      <li>Pilih jenis penerapan: <strong className="text-slate-900">Aplikasi Web (Web App)</strong>.</li>
                      <li>Konfigurasi: 
                        <ul className="list-disc pl-4 mt-1 space-y-1">
                          <li>Jalankan sebagai: <strong className="text-slate-900">Saya sendiri (Your Email)</strong></li>
                          <li>Siapa yang memiliki akses: <strong className="text-slate-900">Siapa saja (Anyone)</strong> (Penting agar web dapat mengaksesnya)</li>
                        </ul>
                      </li>
                      <li>Klik <strong className="text-slate-900">Terapkan</strong>, berikan izin akses akun Google Anda jika diminta.</li>
                      <li>Salin <strong className="text-slate-900 font-mono">URL Aplikasi Web</strong> yang dihasilkan (berakhir dengan <code className="font-semibold text-indigo-600">/exec</code>) dan tempel di kotak isian di atas!</li>
                    </ol>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center bg-slate-200/60 p-1.5 rounded-t-lg px-3">
                        <span className="font-mono font-bold text-[10px] text-slate-600">Kode Apps Script Lengkap (Baca & Tulis)</span>
                        <button
                          onClick={handleCopyScript}
                          className="px-2 py-1 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-300 hover:border-indigo-300 font-bold rounded text-[9px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Salin Kode</span>
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="bg-slate-900 text-slate-200 p-3 rounded-b-lg overflow-x-auto text-[9px] font-mono leading-normal max-h-48 scrollbar-thin">
                        {`function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  try {
    var data = JSON.parse(e.postData.contents);
    if (data.action === "read") {
      var sheetName = data.jenisKas || "Kas Posbindu";
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        var sheets = ss.getSheets();
        sheet = (sheetName === "Kas Cek Darah" && sheets.length > 1) ? sheets[1] : sheets[0];
      }
      var values = sheet.getDataRange().getValues();
      var records = [];
      if (values.length > 1) {
        var headers = values[0].map(function(h) { return h.toString().toUpperCase().trim(); });
        var idxTanggal = headers.indexOf("TANGGAL");
        var idxUraian = headers.indexOf("URAIAN") !== -1 ? headers.indexOf("URAIAN") : headers.indexOf("KETERANGAN");
        var idxPemasukan = headers.indexOf("PEMASUKAN");
        var idxPengeluaran = headers.indexOf("PENGELUARAN");
        for (var i = 1; i < values.length; i++) {
          var row = values[i];
          var rawTanggal = row[idxTanggal !== -1 ? idxTanggal : 0];
          var rawUraian = row[idxUraian !== -1 ? idxUraian : 1];
          var rawPemasukan = row[idxPemasukan !== -1 ? idxPemasukan : 2];
          var rawPengeluaran = row[idxPengeluaran !== -1 ? idxPengeluaran : 3];
          if (!rawTanggal && !rawUraian) continue;
          var dateStr = "";
          if (rawTanggal instanceof Date) {
            var y = rawTanggal.getFullYear();
            var m = ("0" + (rawTanggal.getMonth() + 1)).slice(-2);
            var d = ("0" + rawTanggal.getDate()).slice(-2);
            dateStr = y + "-" + m + "-" + d;
          } else if (rawTanggal) {
            var parts = rawTanggal.toString().split("/");
            if (parts.length === 3) {
              dateStr = parts[2] + "-" + parts[1].padStart(2, "0") + "-" + parts[0].padStart(2, "0");
            } else {
              dateStr = rawTanggal.toString();
            }
          }
          var valPemasukan = parseFloat(rawPemasukan) || 0;
          var valPengeluaran = parseFloat(rawPengeluaran) || 0;
          var kategori = valPengeluaran > 0 && valPemasukan === 0 ? "Pengeluaran" : "Pemasukan";
          var jumlah = valPengeluaran > 0 && valPemasukan === 0 ? valPengeluaran : valPemasukan;
          records.push({
            tanggal: dateStr,
            keterangan: rawUraian.toString().trim() || "Transaksi Tanpa Keterangan",
            kategori: kategori,
            jenisKas: sheetName,
            jumlah: jumlah,
            pj: "Kader"
          });
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success", data: records }))
                           .setMimeType(ContentService.MimeType.JSON);
    }
    // Append row
    var rawTanggal = data.tanggal || ""; 
    var formattedDate = rawTanggal;
    var parts = rawTanggal.split('-');
    if (parts.length === 3) {
      formattedDate = parts[2] + '/' + parts[1] + '/' + parts[0];
    }
    var uraian = data.keterangan || "";
    var kategori = data.kategori || "Pemasukan";
    var jenisKas = data.jenisKas || "Kas Posbindu";
    var jumlah = parseFloat(data.jumlah) || 0;
    var sheetName = (jenisKas.toLowerCase().indexOf("cek") !== -1 || jenisKas.toLowerCase().indexOf("darah") !== -1) ? "Kas Cek Darah" : "Kas Posbindu";
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      var sheets = ss.getSheets();
      sheet = (sheetName === "Kas Cek Darah" && sheets.length > 1) ? sheets[1] : sheets[0];
    }
    var pemasukan = kategori === "Pemasukan" ? jumlah : "";
    var pengeluaran = kategori === "Pengeluaran" ? jumlah : "";
    sheet.appendRow([formattedDate, uraian, pemasukan, pengeluaran]);
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Transaksi berhasil disimpan ke " + sheet.getName() }))
                         .setMimeType(ContentService.MimeType.JSON);
  } catch(error) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}`}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md"
              >
                Simpan & Tutup
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
