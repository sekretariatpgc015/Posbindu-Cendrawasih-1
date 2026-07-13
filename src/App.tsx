import React, { useState, useEffect } from 'react';
import Navbar, { ActiveTab } from './components/Navbar';
import BerandaView from './components/BerandaView';
import DashboardView from './components/DashboardView';
import FormPTMView from './components/FormPTMView';
import FormKeuanganView from './components/FormKeuanganView';
import StrukturPengurusView from './components/StrukturPengurusView';
import GalleryView from './components/GalleryView';
import LoginView from './components/LoginView';
import { Warga, Kunjungan, KeuanganRecord } from './types';
import { initialWarga, initialKunjungan, initialKeuangan } from './data/mockData';
import { fetchGoogleSheetWarga } from './utils/csvSync';
import { HeartPulse, Database, ShieldAlert } from 'lucide-react';

const GOOGLE_SHEET_CSV_URL = '/api/proxy-warga';

export default function App() {
  // 1. Initialize states from localStorage or mock data
  const [wargaList, setWargaList] = useState<Warga[]>(() => {
    const saved = localStorage.getItem('posbindu_warga');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialWarga;
  });

  const [kunjunganList, setKunjunganList] = useState<Kunjungan[]>(() => {
    const saved = localStorage.getItem('posbindu_kunjungan');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialKunjungan;
  });

  const [keuanganList, setKeuanganList] = useState<KeuanganRecord[]>(() => {
    const saved = localStorage.getItem('posbindu_keuangan');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialKeuangan;
  });

  // Google Sheets sync state
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(() => {
    return localStorage.getItem('posbindu_warga_last_synced') || null;
  });

  // Auth State
  const [userRole, setUserRole] = useState<'ptm' | 'finance' | null>(() => {
    return localStorage.getItem('posbindu_user_role') as 'ptm' | 'finance' | null;
  });

  // Navigation states
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  // Helper helper functions to update both state and localStorage
  const updateWargaList = (newList: Warga[]) => {
    setWargaList(newList);
    localStorage.setItem('posbindu_warga', JSON.stringify(newList));
  };

  const handleLogin = (role: 'ptm' | 'finance') => {
    setUserRole(role);
    localStorage.setItem('posbindu_user_role', role);
    if (role === 'ptm') setActiveTab('ptm-input');
    if (role === 'finance') setActiveTab('finance-input');
  };

  const handleLogout = () => {
    setUserRole(null);
    localStorage.removeItem('posbindu_user_role');
    setActiveTab('home');
  };

  const updateKunjunganList = (newList: Kunjungan[]) => {
    setKunjunganList(newList);
    localStorage.setItem('posbindu_kunjungan', JSON.stringify(newList));
  };

  const updateKeuanganList = (newList: KeuanganRecord[]) => {
    setKeuanganList(newList);
    localStorage.setItem('posbindu_keuangan', JSON.stringify(newList));
  };

  // Sync handler
  const handleSyncWarga = async (silent = false) => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncError(null);
    try {
      const data = await fetchGoogleSheetWarga(GOOGLE_SHEET_CSV_URL);
      if (data && data.length > 0) {
        updateWargaList(data);
        const now = new Date().toLocaleString('id-ID', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
        setLastSynced(now);
        localStorage.setItem('posbindu_warga_last_synced', now);
      }
    } catch (err: any) {
      console.error('Failed to sync citizens from Google Sheets:', err);
      setSyncError(err.message || 'Gagal sinkronisasi data');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Initial sync on mount
    handleSyncWarga(true);
  }, []);

  // State modification handlers
  const handleSaveKunjungan = (newKunjungan: Kunjungan, isNewWarga: Warga | null) => {
    // Add new visit
    const updatedKunjungan = [newKunjungan, ...kunjunganList];
    updateKunjunganList(updatedKunjungan);

    // Add new citizen if doesn't exist
    if (isNewWarga) {
      const updatedWarga = [isNewWarga, ...wargaList];
      updateWargaList(updatedWarga);
    }
  };

  const handleSaveKeuangan = (newRecord: KeuanganRecord) => {
    const updatedKeuangan = [newRecord, ...keuanganList];
    updateKeuanganList(updatedKeuangan);
  };

  const handleDeleteKeuangan = (id: string) => {
    const updatedKeuangan = keuanganList.filter(f => f.id !== id);
    updateKeuanganList(updatedKeuangan);
  };

  // System Utility: Reset to factory default data
  const handleResetToDefault = () => {
    if (window.confirm('Apakah Anda yakin ingin MERESET data aplikasi? Seluruh data yang baru Anda input akan dihapus dan dikembalikan ke data simulasi awal.')) {
      localStorage.removeItem('posbindu_warga');
      localStorage.removeItem('posbindu_kunjungan');
      localStorage.removeItem('posbindu_keuangan');
      setWargaList(initialWarga);
      setKunjunganList(initialKunjungan);
      setKeuanganList(initialKeuangan);
      setActiveTab('home');
      alert('Aplikasi berhasil direset ke data simulasi awal!');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800" id="app-root-container">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        onToggleMobile={() => setIsOpenMobile(!isOpenMobile)}
        userRole={userRole}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6 sm:p-8 lg:p-10 w-full max-w-7xl mx-auto">
        
        {/* Dynamic Screen Renderer */}
        <div className="transition-all duration-200">
          {activeTab === 'home' && (
            <BerandaView onNavigate={setActiveTab} />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              wargaList={wargaList}
              kunjunganList={kunjunganList}
              onNavigateToInput={() => setActiveTab('ptm-input')}
              isSyncing={isSyncing}
              syncError={syncError}
              lastSynced={lastSynced}
              onSyncWarga={() => handleSyncWarga(false)}
            />
          )}

          {activeTab === 'login' && (
            <LoginView 
              onLogin={handleLogin} 
              onCancel={() => setActiveTab('home')} 
            />
          )}

          {activeTab === 'ptm-input' && (
            userRole === 'ptm' ? (
              <FormPTMView
                wargaList={wargaList}
                kunjunganList={kunjunganList}
                onSaveKunjungan={handleSaveKunjungan}
                onNavigateToDashboard={() => setActiveTab('dashboard')}
              />
            ) : (
              <LoginView 
                onLogin={handleLogin} 
                onCancel={() => setActiveTab('home')} 
              />
            )
          )}

          {activeTab === 'finance-input' && (
            userRole === 'finance' ? (
              <FormKeuanganView
                keuanganList={keuanganList}
                onSaveKeuangan={handleSaveKeuangan}
                onDeleteKeuangan={handleDeleteKeuangan}
              />
            ) : (
              <LoginView 
                 onLogin={handleLogin} 
                 onCancel={() => setActiveTab('home')} 
               />
            )
          )}

          {activeTab === 'structure' && (
            <StrukturPengurusView />
          )}

          {activeTab === 'gallery' && (
            <GalleryView />
          )}
        </div>

        {/* Subtle Footer with developer reset helper */}
        <footer className="mt-16 border-t border-slate-200 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 print:hidden">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <span>Sistem Informasi Posbindu PTM Cendrawasih 1 &copy; 2026</span>
          </div>

          <div className="flex items-center gap-3">
          </div>
        </footer>

      </main>
    </div>
  );
}
