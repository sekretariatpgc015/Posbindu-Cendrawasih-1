import React from 'react';
import { Home, LayoutDashboard, HeartPulse, Coins, Menu, X, Users, LogOut, Image } from 'lucide-react';

export type ActiveTab = 'home' | 'dashboard' | 'ptm-input' | 'finance-input' | 'structure' | 'gallery' | 'login';

interface NavbarProps {
  activeTab: ActiveTab;
  onChangeTab: (tab: ActiveTab) => void;
  isOpenMobile: boolean;
  onToggleMobile: () => void;
  userRole?: 'ptm' | 'finance' | null;
  onLogout?: () => void;
}

export default function Navbar({ activeTab, onChangeTab, isOpenMobile, onToggleMobile, userRole, onLogout }: NavbarProps) {
  const menuItems = [
    {
      id: 'home' as ActiveTab,
      label: 'Beranda',
      icon: Home,
      color: 'text-blue-400',
      activeBg: 'bg-indigo-800/60 border-indigo-500 text-white',
      hoverBg: 'hover:bg-indigo-900/40 text-indigo-200 hover:text-white',
    },
    {
      id: 'structure' as ActiveTab,
      label: 'Struktur Pengurus',
      icon: Users,
      color: 'text-emerald-400',
      activeBg: 'bg-indigo-800/60 border-indigo-500 text-white',
      hoverBg: 'hover:bg-indigo-900/40 text-indigo-200 hover:text-white',
    },
    {
      id: 'dashboard' as ActiveTab,
      label: 'Dashboard Statistik',
      icon: LayoutDashboard,
      color: 'text-indigo-400',
      activeBg: 'bg-indigo-800/60 border-indigo-500 text-white',
      hoverBg: 'hover:bg-indigo-900/40 text-indigo-200 hover:text-white',
    },
    {
      id: 'ptm-input' as ActiveTab,
      label: 'Input Data PTM',
      icon: HeartPulse,
      color: 'text-rose-400',
      activeBg: 'bg-indigo-800/60 border-indigo-500 text-white',
      hoverBg: 'hover:bg-indigo-900/40 text-indigo-200 hover:text-white',
    },
    {
      id: 'finance-input' as ActiveTab,
      label: 'Laporan Keuangan',
      icon: Coins,
      color: 'text-amber-400',
      activeBg: 'bg-indigo-800/60 border-indigo-500 text-white',
      hoverBg: 'hover:bg-indigo-900/40 text-indigo-200 hover:text-white',
    },
    {
      id: 'gallery' as ActiveTab,
      label: 'Dokumentasi Posbindu',
      icon: Image,
      color: 'text-pink-400',
      activeBg: 'bg-indigo-800/60 border-indigo-500 text-white',
      hoverBg: 'hover:bg-indigo-900/40 text-indigo-200 hover:text-white',
    },
  ];

  const visibleMenuItems = menuItems.filter(item => {
    if (item.id === 'ptm-input') return userRole === 'ptm';
    if (item.id === 'finance-input') return userRole === 'finance';
    return true;
  });

  const handleItemClick = (id: ActiveTab) => {
    onChangeTab(id);
    if (isOpenMobile) {
      onToggleMobile();
    }
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="w-full bg-indigo-950 border-b border-indigo-900/50 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white p-0.5 flex items-center justify-center shrink-0 shadow-sm">
              <img 
                src="https://drive.google.com/thumbnail?id=1YibmCQLufPZ9t5gDx7I7JTLY4m1oymrM" 
                alt="Logo Posbindu" 
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs sm:text-sm font-black text-white tracking-tight leading-none uppercase">
                Posbindu PTM
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold text-indigo-400 tracking-widest mt-0.5 uppercase">
                Cendrawasih 1
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {visibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border-b-2 transition-all duration-200 cursor-pointer ${
                    isActive ? item.activeBg : `border-transparent ${item.hoverBg}`
                  }`}
                  id={`nav-link-${item.id}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                  <span className={`text-xs font-bold leading-none ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            
            {userRole ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-b-2 border-transparent hover:bg-rose-900/40 text-rose-300 hover:text-white transition-all duration-200 cursor-pointer ml-2"
                title="Keluar"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold leading-none">Keluar</span>
              </button>
            ) : (
              <button
                onClick={() => handleItemClick('login')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all duration-200 cursor-pointer ml-2 shadow-sm"
                title="Login Petugas"
                id="btn-login"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span className="text-xs leading-none">Login</span>
              </button>
            )}
          </nav>

          {/* Mobile Toggle Button */}
          <button
            onClick={onToggleMobile}
            id="btn-toggle-mobile"
            className="lg:hidden p-2 text-indigo-200 hover:text-white hover:bg-indigo-900/40 rounded-lg border border-indigo-800/60 transition-colors cursor-pointer"
          >
            {isOpenMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-40 flex pt-16">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={onToggleMobile}
          />
          
          {/* Menu Content */}
          <div className="relative w-full bg-indigo-950 border-b border-indigo-900 shadow-2xl animate-slide-down flex flex-col p-4 gap-2 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest px-2 mb-2">Menu Utama</div>
            {visibleMenuItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.id)}
                  className={`flex items-center gap-3 w-full p-4 rounded-xl border-l-4 transition-all cursor-pointer text-left ${
                    isActive ? item.activeBg : `border-transparent ${item.hoverBg}`
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                  <span className={`text-sm font-bold leading-none ${isActive ? 'text-white' : 'text-slate-200'}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
            
            {userRole ? (
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full p-4 rounded-xl border-l-4 border-transparent hover:bg-rose-900/40 text-rose-300 hover:text-white transition-all cursor-pointer text-left mt-2"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold leading-none">Keluar</span>
              </button>
            ) : (
              <button
                onClick={() => handleItemClick('login')}
                className="flex items-center gap-3 w-full p-4 rounded-xl border-l-4 border-transparent bg-indigo-800/40 text-white hover:bg-indigo-700/60 transition-all cursor-pointer text-left mt-2"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                <span className="text-sm font-bold leading-none">Login Petugas</span>
              </button>
            )}

            <div className="mt-4 p-4 bg-indigo-900/30 rounded-xl border border-indigo-800/40 flex items-center justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
              <span className="text-xs text-indigo-300 font-semibold">Sistem Aktif (Offline)</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
