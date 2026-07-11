import React, { useState, useMemo } from 'react';
import { 
  Coins, Wallet, TrendingUp, TrendingDown, Save, Plus, Trash2, 
  Search, Download, Info, CheckCircle 
} from 'lucide-react';
import { KeuanganRecord } from '../types';

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
  const [jenisKas, setJenisKas] = useState<'Kas Posbindu' | 'Kas Cek Darah'>('Kas Posbindu');
  const [jumlah, setJumlah] = useState<string>('');
  const [pj, setPj] = useState<string>('');

  // UI State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'Pemasukan' | 'Pengeluaran'>('all');
  const [jenisKasFilter, setJenisKasFilter] = useState<'Kas Posbindu' | 'Kas Cek Darah'>('Kas Posbindu');
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationMessage, setNotificationMessage] = useState<string>('');

  // Currency Formatter
  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
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

      // Category filter
      if (categoryFilter !== 'all' && item.kategori !== categoryFilter) return false;

      // Search term (Description or PJ)
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchKeterangan = item.keterangan.toLowerCase().includes(query);
        const matchPj = item.pj.toLowerCase().includes(query);
        return matchKeterangan || matchPj;
      }

      return true;
    });
  }, [ledgerWithRunningBalance, categoryFilter, searchTerm]);

  // Handle submit form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal) { alert('Harap isi tanggal.'); return; }
    if (!keterangan) { alert('Harap isi keterangan.'); return; }
    if (!jumlah || parseFloat(jumlah) <= 0) { alert('Harap isi jumlah uang yang valid.'); return; }
    if (!pj) { alert('Harap isi penanggung jawab.'); return; }

    const newRecord: KeuanganRecord = {
      id: `f-${Date.now()}`,
      tanggal,
      keterangan,
      kategori,
      jenisKas,
      jumlah: parseFloat(jumlah),
      pj
    };

    onSaveKeuangan(newRecord);

    // Success notify
    setNotificationMessage(`Berhasil mencatat ${kategori} sebesar ${formatRupiah(parseFloat(jumlah))}!`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);

    // Reset Form
    setKeterangan('');
    setJumlah('');
    setPj('');
  };

  const handleManualDelete = (id: string, detail: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus catatan keuangan "${detail}"?`)) {
      onDeleteKeuangan(id);
      setNotificationMessage('Catatan transaksi berhasil dihapus.');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 2000);
    }
  };

  const exportCSV = () => {
    if (filteredLedger.length === 0) return;
    
    // Custom CSV mapping with rupiah columns separated
    const rows = filteredLedger.map((item, index) => ({
      'No': index + 1,
      'Tanggal': item.tanggal.split('-').reverse().join('/'),
      'Jenis Kas': item.jenisKas,
      'Kategori': item.kategori,
      'Keterangan': item.keterangan,
      'Jumlah (Rp)': item.jumlah,
      'Saldo Berjalan (Rp)': item.saldoBerjalan,
      'Penanggung Jawab (PJ)': item.pj
    }));

    const headers = Object.keys(rows[0]).join(',');
    const csvContent = "data:text/csv;charset=utf-8," + [
      headers,
      ...rows.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_keuangan_posbindu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12" id="keuangan-view-container">
      {/* Header section with Tabs */}
      <div className="bg-[#FFC8DD] p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
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
        <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
          <div className="absolute right-3 -bottom-3 opacity-15">
            <Coins className="w-24 h-24 text-white" />
          </div>
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-100">{financialSummary.label}</span>
            <div className="p-1.5 bg-indigo-500/30 rounded-lg text-indigo-50">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <span className="text-3xl font-bold block mt-3 tracking-tight">{formatRupiah(financialSummary.saldo)}</span>
          <p className="text-[10px] text-indigo-100/80 mt-2">Akumulasi sisa kas operasional siap digunakan.</p>
        </div>

        {/* Pemasukan */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pemasukan</span>
            <span className="text-xl font-extrabold text-slate-800 block">{formatRupiah(financialSummary.totalPemasukan)}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" /> Dana Swadaya / Puskesmas
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pengeluaran</span>
            <span className="text-xl font-extrabold text-slate-800 block">{formatRupiah(financialSummary.totalPengeluaran)}</span>
            <span className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1">
              <TrendingDown className="w-3.5 h-3.5" /> Konsumsi & Reagen Alat Tes
            </span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Feedback banner */}
      {showNotification && (
        <div id="keuangan-notification" className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>{notificationMessage}</span>
        </div>
      )}

      {/* Dual Layout: Input Form & Ledger list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="keuangan-main-grid">
        
        {/* Left Side: Form Input */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-fit">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h2 className="text-sm font-bold text-slate-800">Input Mutasi Kas Baru</h2>
            <p className="text-[11px] text-slate-400">Catat setiap transaksi operasional Posbindu demi transparansi.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" id="form-mutasi-keuangan">
            {/* Tanggal */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Tanggal Mutasi</label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                id="keuangan-tanggal"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jenis Transaksi</label>
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

            {/* Jenis Kas */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Jenis Kas</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJenisKas('Kas Posbindu')}
                  className={`py-2 text-xs font-bold rounded-xl border flex justify-center items-center transition-all cursor-pointer ${jenisKas === 'Kas Posbindu' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'}`}
                >
                  Kas Posbindu
                </button>
                <button
                  type="button"
                  onClick={() => setJenisKas('Kas Cek Darah')}
                  className={`py-2 text-xs font-bold rounded-xl border flex justify-center items-center transition-all cursor-pointer ${jenisKas === 'Kas Cek Darah' ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/50'}`}
                >
                  Kas Cek Darah
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

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Keterangan Transaksi</label>
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

            {/* Penanggung Jawab */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Penanggung Jawab (PJ)</label>
              <input
                type="text"
                required
                placeholder="Nama bendahara / kader pelaksana..."
                value={pj}
                onChange={(e) => setPj(e.target.value)}
                id="keuangan-pj"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all font-semibold"
              />
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
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Buku Kas Operasional Posbindu</h2>
                <p className="text-[11px] text-slate-400">Daftar arus kas masuk dan keluar secara terperinci.</p>
              </div>

              {/* Controls */}
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari keterangan / PJ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    id="input-search-keuangan"
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Category dropdown */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'Pemasukan' | 'Pengeluaran')}
                  id="select-keuangan-filter"
                  className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded-lg outline-none cursor-pointer"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="Pemasukan">Pemasukan Only</option>
                  <option value="Pengeluaran">Pengeluaran Only</option>
                </select>

                {/* Export CSV */}
                <button
                  onClick={exportCSV}
                  id="btn-export-keuangan"
                  className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg flex items-center justify-center cursor-pointer transition-all"
                  title="Unduh laporan keuangan (.csv)"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4 text-center">No</th>
                    <th className="py-2.5 px-4 min-w-[90px]">Tanggal</th>
                    <th className="py-2.5 px-4">Kas</th>
                    <th className="py-2.5 px-4">Mutasi</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Keterangan</th>
                    <th className="py-2.5 px-4 text-right">Jumlah</th>
                    <th className="py-2.5 px-4 text-right">Saldo Berjalan</th>
                    <th className="py-2.5 px-4">PJ</th>
                    <th className="py-2.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredLedger.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400 font-medium">
                        Belum ada data mutasi kas yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLedger.map((item, idx) => {
                      const isIncome = item.kategori === 'Pemasukan';
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-3 px-4 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3 px-4 whitespace-nowrap">{item.tanggal.split('-').reverse().join('/')}</td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-medium">{item.jenisKas}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                              {isIncome ? 'MASUK' : 'KELUAR'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-800 break-words max-w-[240px]" title={item.keterangan}>
                            {item.keterangan}
                          </td>
                          <td className={`py-3 px-4 text-right font-bold ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isIncome ? '+' : '-'}{formatRupiah(item.jumlah).replace('Rp', '').trim()}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-700">
                            {formatRupiah(item.saldoBerjalan)}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{item.pj}</td>
                          <td className="py-3 px-4 text-center">
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

          <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-xl text-[10px] text-slate-400 flex items-center gap-1.5 mt-4">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Setiap transaksi diarsipkan demi akuntabilitas laporan bulanan pertanggungjawaban operasional RW / Kelurahan.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
