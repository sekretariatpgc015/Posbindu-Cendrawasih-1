import React, { useState, useMemo } from 'react';
import { 
  Coins, Wallet, TrendingUp, TrendingDown, Save, Plus, Trash2, 
  Search, Printer, Info, CheckCircle 
} from 'lucide-react';
import { KeuanganRecord } from '../types';

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
}

export default function FormKeuanganView({ keuanganList, onSaveKeuangan, onDeleteKeuangan }: FormKeuanganViewProps) {
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

    const totalPemasukan = listToSummarize
      .filter(f => f.kategori === 'Pemasukan')
      .reduce((sum, item) => sum + item.jumlah, 0);

    const totalPengeluaran = listToSummarize
      .filter(f => f.kategori === 'Pengeluaran')
      .reduce((sum, item) => sum + item.jumlah, 0);

    const saldo = totalPemasukan - totalPengeluaran;

    return { 
      totalPemasukan, 
      totalPengeluaran, 
      saldo,
      label: `Saldo ${jenisKasFilter}`
    };
  }, [keuanganList, jenisKasFilter]);

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
    // Reverse so newest is at the top
    return computed.reverse();
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal) { alert('Harap isi tanggal.'); return; }
    if (!keterangan) { alert('Harap isi keterangan.'); return; }
    if (!jumlah || parseFloat(jumlah) <= 0) { alert('Harap isi jumlah uang yang valid.'); return; }

    const newRecord: KeuanganRecord = {
      id: `f-${Date.now()}`,
      tanggal,
      keterangan,
      kategori,
      jenisKas: jenisKasFilter,
      jumlah: parseFloat(jumlah),
      pj: ''
    };

    onSaveKeuangan(newRecord);

    // Success notify
    setNotificationMessage(`Berhasil mencatat ${kategori} sebesar ${formatRupiah(parseFloat(jumlah))}!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);

    // Reset Form
    setKeterangan('');
    setJumlah('');
  };

  const handleManualDelete = (id: string, detail: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus catatan keuangan "${detail}"?`)) {
      onDeleteKeuangan(id);
      setNotificationMessage('Catatan transaksi berhasil dihapus.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
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
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Laporan Keuangan</h1>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="keuangan-summary">
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

        {/* Pemasukan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between print:border-slate-200 print:shadow-none">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan</span>
            <span className="text-xl font-extrabold text-slate-800 block">{formatRupiah(financialSummary.totalPemasukan)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1 print:text-emerald-700">
              <TrendingUp className="w-3.5 h-3.5" /> Dana Swadaya / Puskesmas
            </span>
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
            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1 print:text-rose-700">
              <TrendingDown className="w-3.5 h-3.5" /> Konsumsi & Reagen Alat Tes
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl print:hidden">
            <TrendingDown className="w-6 h-6" />
          </div>
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
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-md transition-all hover:scale-[1.01] cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Simpan Transaksi
            </button>
          </form>
        </div>

        {/* Right Side: Ledger Table */}
        <div className="lg:col-span-8 print:col-span-12 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between print:shadow-none print:border-none print:p-0">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4 print:mb-2">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Buku {jenisKasFilter === 'Kas Posbindu' ? 'Kas Operasional Posbindu' : 'Kas Operasional Cek Darah'}</h2>
                <p className="text-[11px] text-slate-400 print:hidden">Daftar arus kas masuk dan keluar secara terperinci.</p>
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
                    filteredLedger.map((item) => {
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
                    })
                  )}
                </tbody>
              </table>
            </div>
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
                <p className="font-bold text-slate-950 underline">Dewi Tri P.</p>
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
                  <div className="grid grid-cols-3 gap-4 mb-6 border border-slate-200 bg-slate-50/50 p-4 rounded-xl">
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
                      <p className="font-bold text-slate-950 underline">Dewi Tri P.</p>
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
    </div>
  );
}
