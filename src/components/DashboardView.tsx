import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ComposedChart
} from 'recharts';
import { 
  Users, Home, UserCheck, AlertTriangle, Search, Filter, Download, HeartPulse, ChevronRight, ChevronLeft, Plus,
  Database, RefreshCw, Check, Eye, X, Building2, Users2, FileText
} from 'lucide-react';
import { Warga, Kunjungan } from '../types';
import { calculateAge } from '../data/mockData';
import { fetchGoogleSheetKunjungan } from '../utils/csvSync';

interface DashboardViewProps {
  wargaList: Warga[];
  kunjunganList: Kunjungan[];
  onNavigateToInput: () => void;
  isSyncing?: boolean;
  syncError?: string | null;
  lastSynced?: string | null;
  onSyncWarga?: () => void;
}

export default function DashboardView({ 
  wargaList, 
  kunjunganList, 
  onNavigateToInput,
  isSyncing = false,
  syncError = null,
  lastSynced = null,
  onSyncWarga
}: DashboardViewProps) {
  
  const [annualFilter, setAnnualFilter] = useState<'breakdown' | '15-59' | '60+' | 'gender' | 'total'>('breakdown');
  
  const [rtAgeFilter, setRtAgeFilter] = useState<'all' | '15-59' | '60+'>('all');
  const [monthlyFilter, setMonthlyFilter] = useState<'breakdown' | '15-59' | '60+' | 'gender' | 'total'>('breakdown');
  const [monthlyYear, setMonthlyYear] = useState<string>('2026');
  const [monthlyViewMode, setMonthlyViewMode] = useState<'chart' | 'table'>('chart');
  
  const [htViewMode, setHtViewMode] = useState<'chart' | 'table'>('chart');
  const [htFilter, setHtFilter] = useState<'all' | '15-59' | '60+'>('all');
  const [htYear, setHtYear] = useState<string>('2026');


  // Google Sheets Kunjungan Data State
  const [externalKunjunganList, setExternalKunjunganList] = useState<Kunjungan[]>([]);
  const [isLoadingExternal, setIsLoadingExternal] = useState<boolean>(false);
  const [externalError, setExternalError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoadingExternal(true);
    setExternalError(null);
    
    fetchGoogleSheetKunjungan('/api/proxy-kunjungan')
      .then(data => {
        if (!isMounted) return;
        setExternalKunjunganList(data);
        setIsLoadingExternal(false);
      })
      .catch(err => {
        if (!isMounted) return;
        console.error('Error fetching Google Sheets Kunjungan:', err);
        setExternalError(err.message || 'Gagal memuat data kunjungan dari Google Sheets.');
        setIsLoadingExternal(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const activeKunjunganList = externalKunjunganList.length > 0 ? externalKunjunganList : kunjunganList;

  // RT Pop-up detail states
  const [isRtDetailOpen, setIsRtDetailOpen] = useState(false);
  const [selectedRtName, setSelectedRtName] = useState<string | null>(null);

  // Helper to validate actual KK
  const isValidKK = (kk: string) => kk && kk !== '3171000000000000' && !kk.startsWith('KK-GEN-');

  // Calculate Summary Cards Data
  const summaryStats = useMemo(() => {
    const totalKK = wargaList.filter(w => w.hubKeluarga?.toUpperCase().includes('KEPALA KELUARGA')).length;
    const totalWarga = wargaList.length;
    const totalLaki = wargaList.filter(w => w.jenisKelamin === 'Laki-laki').length;
    const totalPerempuan = wargaList.filter(w => w.jenisKelamin === 'Perempuan').length;

    return { totalKK, totalWarga, totalLaki, totalPerempuan };
  }, [wargaList]);

  // 1. Chart: Warga per RT with age & gender breakdown
  const rtChartData = useMemo(() => {
    const rts = Array.from(new Set(wargaList.map(w => w.rt))).sort();
    return rts.map(rt => {
      const wargaInRt = wargaList.filter(w => w.rt === rt);
      const m15_59 = wargaInRt.filter(w => w.jenisKelamin === 'Laki-laki' && calculateAge(w.tanggalLahir) >= 15 && calculateAge(w.tanggalLahir) <= 59).length;
      const f15_59 = wargaInRt.filter(w => w.jenisKelamin === 'Perempuan' && calculateAge(w.tanggalLahir) >= 15 && calculateAge(w.tanggalLahir) <= 59).length;
      const m60 = wargaInRt.filter(w => w.jenisKelamin === 'Laki-laki' && calculateAge(w.tanggalLahir) >= 60).length;
      const f60 = wargaInRt.filter(w => w.jenisKelamin === 'Perempuan' && calculateAge(w.tanggalLahir) >= 60).length;
      
      return {
        rt: `RT ${rt}`,
        'Laki-laki 15-59': m15_59,
        'Perempuan 15-59': f15_59,
        'Laki-laki 60+': m60,
        'Perempuan 60+': f60,
        'Total Laki-laki': m15_59 + m60,
        'Total Perempuan': f15_59 + f60,
        'Total Warga': wargaInRt.length,
        'Total KK': wargaInRt.filter(w => w.hubKeluarga?.toUpperCase().includes('KEPALA KELUARGA')).length,
      };
    });
  }, [wargaList]);

  const selectedRtData = useMemo(() => {
    if (!selectedRtName) return null;
    return rtChartData.find(d => d.rt === selectedRtName) || null;
  }, [selectedRtName, rtChartData]);

  // 2. Chart: Annual visits
  const annualYears = useMemo(() => {
    const years = Array.from(new Set(activeKunjunganList.map(k => k.tanggal.substring(0, 4)))).sort();
    // Default fallback if empty
    return years.length > 0 ? years : ['2024', '2025', '2026'];
  }, [activeKunjunganList]);

  // Set the default/initial year of monthly chart to the most recent year available
  useEffect(() => {
    if (annualYears.length > 0) {
      const latestYear = annualYears[annualYears.length - 1];
      setMonthlyYear(latestYear);
    }
  }, [annualYears]);

  const annualChartData = useMemo(() => {
    return annualYears.map(year => {
      const yearVisits = activeKunjunganList.filter(k => k.tanggal.startsWith(year));
      
      const m15_59 = yearVisits.filter(k => k.jenisKelamin === 'Laki-laki' && k.usia <= 59).length;
      const f15_59 = yearVisits.filter(k => k.jenisKelamin === 'Perempuan' && k.usia <= 59).length;
      const m60 = yearVisits.filter(k => k.jenisKelamin === 'Laki-laki' && k.usia >= 60).length;
      const f60 = yearVisits.filter(k => k.jenisKelamin === 'Perempuan' && k.usia >= 60).length;

      return {
        year,
        'Laki-laki 15-59': m15_59,
        'Perempuan 15-59': f15_59,
        'Laki-laki 60+': m60,
        'Perempuan 60+': f60,
        'Total 15-59': m15_59 + f15_59,
        'Total 60+': m60 + f60,
        'Total Laki-laki': m15_59 + m60,
        'Total Perempuan': f15_59 + f60,
        'Total Kunjungan': yearVisits.length
      };
    });
  }, [activeKunjunganList, annualYears]);

  // 3. Chart: Monthly visits
  const monthsList = [
    { value: '01', label: 'Jan' },
    { value: '02', label: 'Feb' },
    { value: '03', label: 'Mar' },
    { value: '04', label: 'Apr' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Jun' },
    { value: '07', label: 'Jul' },
    { value: '08', label: 'Agu' },
    { value: '09', label: 'Sep' },
    { value: '10', label: 'Okt' },
    { value: '11', label: 'Nov' },
    { value: '12', label: 'Des' }
  ];

  const monthlyChartData = useMemo(() => {
    return monthsList.map(m => {
      const prefix = `${monthlyYear}-${m.value}`;
      const monthVisits = activeKunjunganList.filter(k => k.tanggal.startsWith(prefix));

      const m15_59 = monthVisits.filter(k => k.jenisKelamin === 'Laki-laki' && k.usia <= 59).length;
      const f15_59 = monthVisits.filter(k => k.jenisKelamin === 'Perempuan' && k.usia <= 59).length;
      const m60 = monthVisits.filter(k => k.jenisKelamin === 'Laki-laki' && k.usia >= 60).length;
      const f60 = monthVisits.filter(k => k.jenisKelamin === 'Perempuan' && k.usia >= 60).length;

      return {
        month: m.label,
        'Laki-laki 15-59': m15_59,
        'Perempuan 15-59': f15_59,
        'Laki-laki 60+': m60,
        'Perempuan 60+': f60,
        'Total 15-59': m15_59 + f15_59,
        'Total 60+': m60 + f60,
        'Total Laki-laki': m15_59 + m60,
        'Total Perempuan': f15_59 + f60,
        'Total Kunjungan': monthVisits.length
      };
    });
  }, [activeKunjunganList, monthlyYear]);

  const htByMonthChartData = useMemo(() => {
    return monthsList.map(m => {
      const prefix = `${htYear}-${m.value}`;
      const monthVisits = activeKunjunganList.filter(k => k.tanggal.startsWith(prefix));
      
      const riskyCitizensInMonth: { [nik: string]: Kunjungan } = {};
      monthVisits.forEach(k => {
        if (k.tdSistolik >= 139 || k.tdDiastolik >= 89) {
          let include = true;
          if (htFilter === '15-59' && k.usia >= 60) include = false;
          if (htFilter === '60+' && k.usia < 60) include = false;
          if (include) {
            riskyCitizensInMonth[k.nik] = k;
          }
        }
      });
      
      const risky = Object.values(riskyCitizensInMonth);
      const mRisky = risky.filter(k => k.jenisKelamin === 'Laki-laki').length;
      const fRisky = risky.filter(k => k.jenisKelamin === 'Perempuan').length;
      
      return {
        month: m.label,
        'Laki-laki': mRisky,
        'Perempuan': fRisky,
        'Total': risky.length
      };
    });
  }, [activeKunjunganList, htYear, htFilter]);

  const trendChartData = useMemo(() => {
    const monthYearCounts: Record<string, number> = {};
    activeKunjunganList.forEach(k => {
      if (k.tanggal) {
        const my = k.tanggal.substring(0, 7); // YYYY-MM
        monthYearCounts[my] = (monthYearCounts[my] || 0) + 1;
      }
    });
    
    return Object.keys(monthYearCounts).sort().map(my => {
      const [year, month] = my.split('-');
      const monthName = monthsList.find(m => m.value === month)?.label || month;
      return {
        periode: `${monthName} ${year}`,
        'Total Kunjungan': monthYearCounts[my]
      };
    });
  }, [activeKunjunganList]);

  // Demographic Charts Data computed from wargaList
  const balitaData = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    wargaList.forEach(w => {
      const age = calculateAge(w.tanggalLahir);
      if (age >= 0 && age <= 5) {
        counts[age]++;
      }
    });
    return counts.map((count, index) => ({
      name: `${index} th`,
      'Jumlah': count
    }));
  }, [wargaList]);

  const totalBalita = useMemo(() => {
    return wargaList.filter(w => {
      const age = calculateAge(w.tanggalLahir);
      return age >= 0 && age <= 5;
    }).length;
  }, [wargaList]);

  const dewasaData = useMemo(() => {
    let group1 = 0; // 19-29
    let group2 = 0; // 30-39
    let group3 = 0; // 40-49
    let group4 = 0; // 50-59
    wargaList.forEach(w => {
      const age = calculateAge(w.tanggalLahir);
      if (age >= 19 && age <= 29) group1++;
      else if (age >= 30 && age <= 39) group2++;
      else if (age >= 40 && age <= 49) group3++;
      else if (age >= 50 && age <= 59) group4++;
    });
    return [
      { name: '19-29 th', 'Jumlah': group1 },
      { name: '30-39 th', 'Jumlah': group2 },
      { name: '40-49 th', 'Jumlah': group3 },
      { name: '50-59 th', 'Jumlah': group4 }
    ];
  }, [wargaList]);

  const totalDewasa = useMemo(() => {
    return wargaList.filter(w => {
      const age = calculateAge(w.tanggalLahir);
      return age >= 19 && age <= 59;
    }).length;
  }, [wargaList]);

  const lansiaData = useMemo(() => {
    let group1 = 0; // 60-69
    let group2 = 0; // 70-79
    let group3 = 0; // 80+
    wargaList.forEach(w => {
      const age = calculateAge(w.tanggalLahir);
      if (age >= 60 && age <= 69) group1++;
      else if (age >= 70 && age <= 79) group2++;
      else if (age >= 80) group3++;
    });
    return [
      { name: '60-69 th', value: group1, color: '#ec4899' },
      { name: '70-79 th', value: group2, color: '#8b5cf6' },
      { name: '80+ th', value: group3, color: '#3b82f6' }
    ];
  }, [wargaList]);

  const totalLansia = useMemo(() => {
    return wargaList.filter(w => {
      const age = calculateAge(w.tanggalLahir);
      return age >= 60;
    }).length;
  }, [wargaList]);

  const pusData = useMemo(() => {
    const rts = Array.from(new Set(wargaList.map(w => w.rt))).sort();
    return rts.map(rt => {
      const wargaInRt = wargaList.filter(w => w.rt === rt);
      const kks = Array.from(new Set(wargaInRt.map(w => w.noKK).filter(isValidKK)));
      let pusCount = 0;
      kks.forEach(noKK => {
        const familyWarga = wargaInRt.filter(w => w.noKK === noKK);
        const hasMale = familyWarga.some(w => w.jenisKelamin === 'Laki-laki');
        const hasReproductiveFemale = familyWarga.some(w => {
          const age = calculateAge(w.tanggalLahir);
          return w.jenisKelamin === 'Perempuan' && age >= 15 && age <= 49;
        });
        if (hasMale && hasReproductiveFemale) {
          pusCount++;
        }
      });
      const formattedRt = `RT ${rt.padStart(3, '0')}`;
      return {
        name: formattedRt,
        'Jumlah': pusCount
      };
    });
  }, [wargaList]);

  const totalPus = useMemo(() => {
    const kks = Array.from(new Set(wargaList.map(w => w.noKK).filter(isValidKK)));
    let total = 0;
    kks.forEach(noKK => {
      const familyWarga = wargaList.filter(w => w.noKK === noKK);
      const hasMale = familyWarga.some(w => w.jenisKelamin === 'Laki-laki');
      const hasReproductiveFemale = familyWarga.some(w => {
        const age = calculateAge(w.tanggalLahir);
        return w.jenisKelamin === 'Perempuan' && age >= 15 && age <= 49;
      });
      if (hasMale && hasReproductiveFemale) {
        total++;
      }
    });
    return total;
  }, [wargaList]);

  const remajaData = useMemo(() => {
    let group1 = 0; // 6-9
    let group2 = 0; // 10-12
    let group3 = 0; // 13-15
    let group4 = 0; // 16-18
    wargaList.forEach(w => {
      const age = calculateAge(w.tanggalLahir);
      if (age >= 6 && age <= 9) group1++;
      else if (age >= 10 && age <= 12) group2++;
      else if (age >= 13 && age <= 15) group3++;
      else if (age >= 16 && age <= 18) group4++;
    });
    return [
      { name: '6-9 th', 'Jumlah': group1 },
      { name: '10-12 th', 'Jumlah': group2 },
      { name: '13-15 th', 'Jumlah': group3 },
      { name: '16-18 th', 'Jumlah': group4 }
    ];
  }, [wargaList]);

  const totalRemaja = useMemo(() => {
    return wargaList.filter(w => {
      const age = calculateAge(w.tanggalLahir);
      return age >= 6 && age <= 18;
    }).length;
  }, [wargaList]);

  const wusData = useMemo(() => {
    let group1 = 0; // 15-29
    let group2 = 0; // 30-49
    let group3 = 0; // 50-59
    wargaList.forEach(w => {
      if (w.jenisKelamin === 'Perempuan') {
        const age = calculateAge(w.tanggalLahir);
        if (age >= 15 && age <= 29) group1++;
        else if (age >= 30 && age <= 49) group2++;
        else if (age >= 50 && age <= 59) group3++;
      }
    });
    return [
      { name: '15-29 th', value: group1, color: '#ec4899' },
      { name: '30-49 th', value: group2, color: '#f43f5e' },
      { name: '50-59 th', value: group3, color: '#a855f7' }
    ];
  }, [wargaList]);

  const totalWus = useMemo(() => {
    return wargaList.filter(w => {
      const age = calculateAge(w.tanggalLahir);
      return w.jenisKelamin === 'Perempuan' && age >= 15 && age <= 59;
    }).length;
  }, [wargaList]);

  return (
    <div className="space-y-8 pb-12" id="dashboard-container">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#FFC8DD] p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Posbindu PTM</h1>
          <p className="text-sm text-slate-500 mt-1">Pemantauan data kesehatan berkala warga dan faktor risiko Penyakit Tidak Menular.</p>
        </div>
      </div>

      {/* Google Sheets Sync Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0 mt-0.5">
            <Database className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Database Warga RW 015 (Google Sheets)</span>
              {isSyncing ? (
                <span className="px-2 py-0.5 text-[10px] bg-indigo-50 text-indigo-600 rounded-md font-bold animate-pulse">Menyinkronkan...</span>
              ) : syncError ? (
                <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-600 rounded-md font-bold">Gagal Sinkron</span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 rounded-md font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Sinkron
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Data jumlah KK, jumlah warga total, klasifikasi jenis kelamin, serta komposisi warga per RT diambil langsung dari Google Sheets RW secara otomatis.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5">
              {lastSynced && (
                <span className="text-[10px] text-slate-400 font-medium">
                  Terakhir Diperbarui: <span className="text-indigo-600 font-bold">{lastSynced}</span>
                </span>
              )}
              {syncError && (
                <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  Kendala: {syncError}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {onSyncWarga && (
          <button
            onClick={onSyncWarga}
            disabled={isSyncing}
            className={`px-4.5 py-2.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 disabled:opacity-50 text-xs font-bold rounded-xl border border-slate-200 hover:border-indigo-200 flex items-center gap-2 transition-all cursor-pointer ${isSyncing ? 'cursor-not-allowed' : ''}`}
            id="btn-sync-google-sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
            {isSyncing ? 'Menghubungkan...' : 'Perbarui Database'}
          </button>
        )}
      </div>

      {/* Google Sheets Visits (Kunjungan) Sync Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-5 transition-all">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-bold text-slate-800">Database Kunjungan RW 015 (Google Sheets)</span>
              {isLoadingExternal ? (
                <span className="px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-600 rounded-md font-bold animate-pulse">Menghubungkan & Memuat Lembar Kerja...</span>
              ) : externalError ? (
                <span className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-600 rounded-md font-bold">Gagal Memuat Google Sheets</span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-700 rounded-md font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> Sinkron ({externalKunjunganList.length} kunjungan)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tren kunjungan per tahun, distribusi kunjungan bulanan, dan tren kunjungan per bulan disinkronkan langsung dari lembar kerja Google Sheets Posbindu RW 015 secara otomatis.
            </p>
            {externalError && (
              <div className="text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 mt-1">
                Kendala: {externalError} (Menggunakan cadangan data simulasi lokal)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="summary-cards">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-5">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah KK</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{summaryStats.totalKK}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-5">
          <div className="p-3.5 bg-cyan-50 text-cyan-600 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah Warga</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{summaryStats.totalWarga}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-5">
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Laki-Laki</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{summaryStats.totalLaki} <span className="text-sm font-normal text-slate-400">jiwa</span></span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-5">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-xl">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Perempuan</span>
            <span className="text-2xl font-bold text-slate-800 block mt-0.5">{summaryStats.totalPerempuan} <span className="text-sm font-normal text-slate-400">jiwa</span></span>
          </div>
        </div>
      </div>

      {/* Target Groups & Demographic Section */}
      <div className="space-y-4" id="demographic-section">
        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users2 className="w-5 h-5 text-indigo-500" />
              Statistik Kelompok Sasaran & Demografi Warga
            </h2>
            <p className="text-xs text-slate-400">Analisis sebaran kelompok usia, gender, dan status reproduktif dari database warga aktif.</p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-extrabold bg-indigo-50 text-indigo-600 rounded-lg">Real-Time Sync</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Balita */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Balita</h4>
                <p className="text-xs text-slate-400">Usia 0-5 tahun</p>
              </div>
              <span className="text-2xl font-black text-rose-500">{totalBalita}</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={balitaData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#f1f5f9', fontSize: '10px' }} />
                  <Bar dataKey="Jumlah" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 2: Dewasa */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Dewasa</h4>
                <p className="text-xs text-slate-400">Usia 19-59 tahun</p>
              </div>
              <span className="text-2xl font-black text-emerald-500">{totalDewasa}</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dewasaData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDewasa" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#f1f5f9', fontSize: '10px' }} />
                  <Area type="monotone" dataKey="Jumlah" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorDewasa)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 3: Lansia */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Lansia</h4>
                <p className="text-xs text-slate-400">Usia 60+ tahun</p>
              </div>
              <span className="text-2xl font-black text-purple-600">{totalLansia}</span>
            </div>
            <div className="h-44 w-full relative flex flex-col justify-center">
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={lansiaData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {lansiaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#f1f5f9', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-[10px] text-slate-500 font-semibold mt-1">
                {lansiaData.map((item, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Card 4: Pasangan Usia Subur */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Pasangan Usia Subur</h4>
                <p className="text-xs text-slate-400">Kepala Keluarga Kawin</p>
              </div>
              <span className="text-2xl font-black text-blue-600">{totalPus}</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pusData} layout="vertical" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#f1f5f9', fontSize: '10px' }} />
                  <Bar dataKey="Jumlah" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 5: Sekolah & Remaja */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Sekolah & Remaja</h4>
                <p className="text-xs text-slate-400">Usia 6-18 tahun</p>
              </div>
              <span className="text-2xl font-black text-orange-500">{totalRemaja}</span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={remajaData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#f1f5f9', fontSize: '10px' }} />
                  <Line type="monotone" dataKey="Jumlah" stroke="#f97316" strokeWidth={2.5} dot={{ r: 4, fill: '#f97316', strokeWidth: 1.5, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Card 6: Wanita Usia Subur */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">Wanita Usia Subur</h4>
                <p className="text-xs text-slate-400">Perempuan 15-59 tahun</p>
              </div>
              <span className="text-2xl font-black text-rose-500">{totalWus}</span>
            </div>
            <div className="h-44 w-full relative flex flex-col justify-center">
              <div className="h-32 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={wusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={50}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {wusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', borderColor: '#f1f5f9', fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-3 text-[10px] text-slate-500 font-semibold mt-1">
                {wusData.map((item, index) => (
                  <span key={index} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="charts-section">
        {/* RT Population Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Jumlah Warga Per RT</h3>
              <p className="text-xs text-slate-400 mt-1">Komposisi sebaran warga berdasarkan kelompok usia di setiap RT.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setSelectedRtName(null);
                  setIsRtDetailOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-indigo-100"
                title="Tampilkan data lengkap Laki-laki & Perempuan per RT"
              >
                <Eye className="w-3.5 h-3.5" />
                Rincian L/P
              </button>
              {/* Filter Dropdown Selector for RT Chart */}
              <select
                value={rtAgeFilter}
                onChange={(e) => setRtAgeFilter(e.target.value as 'all' | '15-59' | '60+')}
                className="px-3 py-1.5 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="all">Semua Usia</option>
                <option value="15-59">15-59 Th</option>
                <option value="60+">60+ Th (Lansia)</option>
              </select>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={rtChartData} 
                margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                onClick={(state) => {
                  if (state && state.activeLabel) {
                    setSelectedRtName(state.activeLabel);
                    setIsRtDetailOpen(true);
                  }
                }}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="rt" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                {(rtAgeFilter === 'all' || rtAgeFilter === '15-59') && (
                  <>
                    <Bar dataKey="Laki-laki 15-59" stackId="a" fill="#6366f1" name="L 15-59" />
                    <Bar dataKey="Perempuan 15-59" stackId="a" fill="#ec4899" name="P 15-59" />
                  </>
                )}
                
                {(rtAgeFilter === 'all' || rtAgeFilter === '60+') && (
                  <>
                    <Bar dataKey="Laki-laki 60+" stackId={rtAgeFilter === 'all' ? "b" : "a"} fill="#4338ca" name="L 60+" />
                    <Bar dataKey="Perempuan 60+" stackId={rtAgeFilter === 'all' ? "b" : "a"} fill="#be185d" name="P 60+" />
                  </>
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Annual Visit Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-800">Tren Kunjungan Per Tahun</h3>
              <p className="text-xs text-slate-400 mt-1">Total pencatatan pemeriksaan tahunan warga.</p>
            </div>
            {/* Filter Dropdown Selector */}
            <select
              value={annualFilter}
              onChange={(e) => setAnnualFilter(e.target.value as any)}
              className="px-3 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              <option value="breakdown">Detail Kelompok</option>
              <option value="15-59">15-59 Th</option>
              <option value="60+">60+ Th</option>
              <option value="gender">L vs P</option>
              <option value="total">Total</option>
            </select>
          </div>
          
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={annualChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                 {annualFilter === 'breakdown' && (
                  <>
                    <Bar dataKey="Laki-laki 15-59" fill="#6366f1" name="L 15-59" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Perempuan 15-59" fill="#ec4899" name="P 15-59" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Laki-laki 60+" fill="#4338ca" name="L 60+" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Perempuan 60+" fill="#be185d" name="P 60+" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="Total Kunjungan" stroke="#10b981" strokeWidth={3} name="Total Kunjungan" dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </>
                )}

                {annualFilter === '15-59' && (
                  <>
                    <Bar dataKey="Laki-laki 15-59" fill="#6366f1" name="L (15-59)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Perempuan 15-59" fill="#ec4899" name="P (15-59)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="Total 15-59" stroke="#10b981" strokeWidth={3} name="Total 15-59 (Garis)" dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </>
                )}

                {annualFilter === '60+' && (
                  <>
                    <Bar dataKey="Laki-laki 60+" fill="#4338ca" name="L (60+)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Perempuan 60+" fill="#be185d" name="P (60+)" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="Total 60+" stroke="#10b981" strokeWidth={3} name="Total 60+ (Garis)" dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </>
                )}

                {annualFilter === 'gender' && (
                  <>
                    <Bar dataKey="Total Laki-laki" fill="#4f46e5" name="Total L" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Total Perempuan" fill="#db2777" name="Total P" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="Total Kunjungan" stroke="#10b981" strokeWidth={3} name="Total Kunjungan" dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </>
                )}

                {annualFilter === 'total' && (
                  <>
                    <Bar dataKey="Total Kunjungan" fill="#10b981" name="Total (Batang)" radius={[4, 4, 0, 0]} opacity={0.6} barSize={40} />
                    <Line type="monotone" dataKey="Total Kunjungan" stroke="#10b981" strokeWidth={4} name="Total Kunjungan (Garis)" dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                  </>
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Chart/Table Full Width */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="monthly-chart-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Distribusi Kunjungan Bulanan</h3>
            <p className="text-xs text-slate-400 mt-1">Statistik pencatatan bulanan untuk mengamati pola kehadiran warga sepanjang tahun.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Control for View Mode */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setMonthlyViewMode('chart')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${monthlyViewMode === 'chart' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Grafik
              </button>
              <button
                type="button"
                onClick={() => setMonthlyViewMode('table')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${monthlyViewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Tabel
              </button>
            </div>

            {/* Year selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tahun:</span>
              <select
                value={monthlyYear}
                onChange={(e) => setMonthlyYear(e.target.value)}
                id="select-monthly-year"
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {annualYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Filter dropdown - only show if chart is active */}
            {monthlyViewMode === 'chart' && (
              <select
                value={monthlyFilter}
                onChange={(e) => setMonthlyFilter(e.target.value as any)}
                className="px-3 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
              >
                <option value="breakdown">Detail Kelompok</option>
                <option value="15-59">15-59 Th</option>
                <option value="60+">60+ Th</option>
                <option value="gender">L vs P</option>
                <option value="total">Total</option>
              </select>
            )}
          </div>
        </div>

        {monthlyViewMode === 'chart' ? (
          <div className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                 {monthlyFilter === 'breakdown' && (
                  <>
                    <Line type="monotone" dataKey="Laki-laki 15-59" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="L 15-59" />
                    <Line type="monotone" dataKey="Perempuan 15-59" stroke="#ec4899" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="P 15-59" />
                    <Line type="monotone" dataKey="Laki-laki 60+" stroke="#4338ca" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="L 60+" />
                    <Line type="monotone" dataKey="Perempuan 60+" stroke="#be185d" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="P 60+" />
                  </>
                )}

                {monthlyFilter === '15-59' && (
                  <>
                    <Line type="monotone" dataKey="Laki-laki 15-59" stroke="#6366f1" strokeWidth={2.5} name="L 15-59" />
                    <Line type="monotone" dataKey="Perempuan 15-59" stroke="#ec4899" strokeWidth={2.5} name="P 15-59" />
                    <Line type="monotone" dataKey="Total 15-59" stroke="#10b981" strokeWidth={2.5} name="Total 15-59" />
                  </>
                )}

                {monthlyFilter === '60+' && (
                  <>
                    <Line type="monotone" dataKey="Laki-laki 60+" stroke="#4338ca" strokeWidth={2.5} name="L 60+" />
                    <Line type="monotone" dataKey="Perempuan 60+" stroke="#be185d" strokeWidth={2.5} name="P 60+" />
                    <Line type="monotone" dataKey="Total 60+" stroke="#10b981" strokeWidth={2.5} name="Total 60+" />
                  </>
                )}

                {monthlyFilter === 'gender' && (
                  <>
                    <Line type="monotone" dataKey="Total Laki-laki" stroke="#4f46e5" strokeWidth={2.5} name="Total L" />
                    <Line type="monotone" dataKey="Total Perempuan" stroke="#db2777" strokeWidth={2.5} name="Total P" />
                  </>
                )}

                {monthlyFilter === 'total' && (
                  <Line type="monotone" dataKey="Total Kunjungan" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} name="Total Kunjungan Warga" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto w-full border border-slate-100 rounded-xl animate-fade-in">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Bulan ({monthlyYear})</th>
                  <th className="py-3 px-4 text-center">L (15-59 Th)</th>
                  <th className="py-3 px-4 text-center">P (15-59 Th)</th>
                  <th className="py-3 px-4 text-center">L (60+ Th)</th>
                  <th className="py-3 px-4 text-center">P (60+ Th)</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-700 bg-slate-50/50">Total Kunjungan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {monthlyChartData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-3 px-4 font-semibold text-slate-600">{row.month}</td>
                    <td className="py-3 px-4 text-center text-indigo-600 font-medium">{row['Laki-laki 15-59']}</td>
                    <td className="py-3 px-4 text-center text-pink-600 font-medium">{row['Perempuan 15-59']}</td>
                    <td className="py-3 px-4 text-center text-blue-800 font-medium">{row['Laki-laki 60+']}</td>
                    <td className="py-3 px-4 text-center text-rose-700 font-medium">{row['Perempuan 60+']}</td>
                    <td className="py-3 px-4 text-center font-bold text-slate-800 bg-emerald-50/30">{row['Total Kunjungan']}</td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-50/80 font-bold text-slate-800 border-t-2 border-slate-200">
                  <td className="py-3.5 px-4">Total Setahun</td>
                  <td className="py-3.5 px-4 text-center text-indigo-700">
                    {monthlyChartData.reduce((acc, row) => acc + row['Laki-laki 15-59'], 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-pink-700">
                    {monthlyChartData.reduce((acc, row) => acc + row['Perempuan 15-59'], 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-blue-900">
                    {monthlyChartData.reduce((acc, row) => acc + row['Laki-laki 60+'], 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-rose-900">
                    {monthlyChartData.reduce((acc, row) => acc + row['Perempuan 60+'], 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-emerald-700 bg-emerald-50/50">
                    {monthlyChartData.reduce((acc, row) => acc + row['Total Kunjungan'], 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Data Warga Risiko Hipertensi */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between" id="hypertension-chart-card">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h3 className="text-base font-semibold text-slate-800">Data Warga Risiko Hipertensi per Bulan</h3>
            <p className="text-xs text-slate-400 mt-1">Distribusi dan riwayat warga yang berisiko tinggi terhadap hipertensi (&ge;139/89) berdasarkan jenis kelamin.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {/* Segmented Control for View Mode */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setHtViewMode('chart')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${htViewMode === 'chart' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Grafik
              </button>
              <button
                type="button"
                onClick={() => setHtViewMode('table')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${htViewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Tabel
              </button>
            </div>

            {/* Year selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium">Tahun:</span>
              <select
                value={htYear}
                onChange={(e) => setHtYear(e.target.value)}
                className="px-3 py-1.5 text-xs font-semibold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
              >
                {annualYears.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Filter dropdown */}
            <select
              value={htFilter}
              onChange={(e) => setHtFilter(e.target.value as any)}
              className="px-3 py-1.5 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
            >
              <option value="all">Semua Usia</option>
              <option value="15-59">15-59 Th</option>
              <option value="60+">60+ Th</option>
            </select>
          </div>
        </div>

        {htViewMode === 'chart' ? (
          <div className="h-80 w-full animate-fade-in">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={htByMonthChartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f1f5f9' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                
                <Bar dataKey="Laki-laki" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Laki-laki" />
                <Bar dataKey="Perempuan" fill="#db2777" radius={[4, 4, 0, 0]} name="Perempuan" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto w-full border border-slate-100 rounded-xl animate-fade-in">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Bulan ({htYear})</th>
                  <th className="py-3 px-4 text-center">Laki-laki</th>
                  <th className="py-3 px-4 text-center">Perempuan</th>
                  <th className="py-3 px-4 text-center font-bold text-slate-700 bg-slate-50/50">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {htByMonthChartData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/50 transition-all">
                    <td className="py-3 px-4 font-semibold text-slate-700">{row.month}</td>
                    <td className="py-3 px-4 text-center text-indigo-600">{row['Laki-laki']}</td>
                    <td className="py-3 px-4 text-center text-pink-600">{row['Perempuan']}</td>
                    <td className="py-3 px-4 text-center font-bold text-red-600 bg-red-50/30">{row['Total']}</td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr className="bg-slate-50/80 font-bold text-slate-800 border-t-2 border-slate-200">
                  <td className="py-3.5 px-4">Total Setahun</td>
                  <td className="py-3.5 px-4 text-center text-indigo-700">
                    {htByMonthChartData.reduce((acc, row) => acc + row['Laki-laki'], 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center text-pink-700">
                    {htByMonthChartData.reduce((acc, row) => acc + row['Perempuan'], 0)}
                  </td>
                  <td className="py-3.5 px-4 text-center font-extrabold text-red-700 bg-red-50/50">
                    {htByMonthChartData.reduce((acc, row) => acc + row['Total'], 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pop-up Jendela Detail Demografi RT */}
      {isRtDetailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 sm:p-6 animate-fade-in" id="modal-rt-detail">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Rincian Sebaran Warga & Gender per RT</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Komparasi dan tabulasi jumlah total laki-laki & perempuan di setiap RT.</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsRtDetailOpen(false);
                  setSelectedRtName(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-lg transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: RT Table (Col Span: 7) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tabulasi RT</span>
                  <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-bold">
                    Total: {rtChartData.length} RT
                  </span>
                </div>
                <div className="border border-slate-100 rounded-xl overflow-x-auto shadow-xs">
                  <table className="w-full text-left text-xs min-w-[500px]">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase">
                        <th className="py-2.5 px-4 text-center">RT</th>
                        <th className="py-2.5 px-4 text-center">KK</th>
                        <th className="py-2.5 px-4 text-center">Laki-laki</th>
                        <th className="py-2.5 px-4 text-center">Perempuan</th>
                        <th className="py-2.5 px-4 text-center font-bold">Total Warga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {rtChartData.map((item) => {
                        const isSelected = selectedRtName === item.rt;
                        return (
                          <tr
                            key={item.rt}
                            onClick={() => setSelectedRtName(item.rt)}
                            className={`cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/60 font-medium text-indigo-950 border-l-2 border-l-indigo-600' : 'hover:bg-slate-50/50'}`}
                          >
                            <td className="py-2.5 px-4 text-center font-bold text-indigo-600">{item.rt}</td>
                            <td className="py-2.5 px-4 text-center font-semibold text-slate-600">{item['Total KK']}</td>
                            <td className="py-2.5 px-4 text-center text-blue-600 font-medium">
                              {item['Total Laki-laki']} L
                            </td>
                            <td className="py-2.5 px-4 text-center text-pink-500 font-medium">
                              {item['Total Perempuan']} P
                            </td>
                            <td className="py-2.5 px-4 text-center font-bold text-slate-800">
                              {item['Total Warga']} jiwa
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-400 italic">
                  * Klik pada salah satu baris RT untuk memunculkan rincian kelompok usia dan perbandingan persentase.
                </p>
              </div>

              {/* Right Column: Visual Breakdown & Analysis (Col Span: 5) */}
              <div className="lg:col-span-5 bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex flex-col justify-between space-y-5">
                {selectedRtData ? (
                  <div className="space-y-5">
                    {/* Header RT */}
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-indigo-950">{selectedRtData.rt}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Analisis komposisi demografis warga</p>
                      </div>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold">
                        {selectedRtData['Total Warga']} Jiwa
                      </span>
                    </div>

                    {/* Gender Ratio Bar */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-blue-600 flex items-center gap-1">
                          Laki-laki ({Math.round((selectedRtData['Total Laki-laki'] / selectedRtData['Total Warga']) * 100) || 0}%)
                        </span>
                        <span className="text-pink-500 flex items-center gap-1">
                          Perempuan ({Math.round((selectedRtData['Total Perempuan'] / selectedRtData['Total Warga']) * 100) || 0}%)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${(selectedRtData['Total Laki-laki'] / selectedRtData['Total Warga']) * 100}%` }}
                          className="bg-indigo-500 h-full transition-all duration-500"
                        />
                        <div
                          style={{ 
                            width: `${(selectedRtData['Total Perempuan'] / selectedRtData['Total Warga']) * 100}%`,
                            backgroundColor: '#ec4899'
                          }}
                          className="h-full transition-all duration-500"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                        <span>{selectedRtData['Total Laki-laki']} Laki-laki</span>
                        <span>{selectedRtData['Total Perempuan']} Perempuan</span>
                      </div>
                    </div>

                    {/* Age Classification */}
                    <div className="space-y-3 pt-1">
                      <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Berdasarkan Kelompok Usia</h5>
                      
                      {/* Usia Produktif */}
                      <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-700">Usia Produktif (15 - 59 Th)</span>
                          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                            {selectedRtData['Laki-laki 15-59'] + selectedRtData['Perempuan 15-59']} Jiwa
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center pt-1 border-t border-slate-50">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Laki-laki</span>
                            <span className="text-xs font-bold text-blue-600">{selectedRtData['Laki-laki 15-59']}</span>
                          </div>
                          <div className="border-l border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Perempuan</span>
                            <span className="text-xs font-bold text-pink-500">{selectedRtData['Perempuan 15-59']}</span>
                          </div>
                        </div>
                      </div>

                      {/* Usia Lansia */}
                      <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-2 shadow-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-indigo-900">Lansia (60+ Th)</span>
                          <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                            {selectedRtData['Laki-laki 60+'] + selectedRtData['Perempuan 60+']} Jiwa
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-center pt-1 border-t border-slate-50">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Laki-laki</span>
                            <span className="text-xs font-bold text-indigo-600">{selectedRtData['Laki-laki 60+']}</span>
                          </div>
                          <div className="border-l border-slate-100">
                            <span className="text-[10px] text-slate-400 block">Perempuan</span>
                            <span className="text-xs font-bold text-pink-500">{selectedRtData['Perempuan 60+']}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3.5">
                    <div className="p-4 bg-indigo-50/60 text-indigo-500 rounded-full">
                      <Users2 className="w-8 h-8 stroke-[1.5]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 font-sans">Rincian Per RT</h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1 max-w-[200px] mx-auto">
                        Silakan pilih salah satu baris RT di tabel samping untuk melihat sebaran usia dan gender yang komprehensif.
                      </p>
                    </div>
                  </div>
                )}

                {/* Overall Stats Footer */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-100 flex items-center justify-between text-xs shrink-0">
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-slate-400 block">Total Laki-laki</span>
                    <span className="text-sm font-extrabold text-emerald-500">
                      {rtChartData.reduce((acc, item) => acc + item['Total Laki-laki'], 0)}
                    </span>
                  </div>
                  <div className="h-6 w-px bg-slate-100" />
                  <div className="text-center flex-1">
                    <span className="text-[10px] text-slate-400 block">Total Perempuan</span>
                    <span className="text-sm font-extrabold text-emerald-500">
                      {rtChartData.reduce((acc, item) => acc + item['Total Perempuan'], 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button
                onClick={() => {
                  setIsRtDetailOpen(false);
                  setSelectedRtName(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
