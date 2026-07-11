import React from 'react';
import { HeartPulse, Activity, ShieldPlus, ChevronRight, Calendar, MapPin, Images, Clock } from 'lucide-react';
import { ActiveTab } from './Navbar';

interface BerandaViewProps {
  onNavigate: (tab: ActiveTab) => void;
}

export default function BerandaView({ onNavigate }: BerandaViewProps) {
  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Hero Section */}
      <div className="bg-[#FFC8DD] rounded-3xl p-8 sm:p-12 text-slate-900 shadow-xl relative overflow-hidden">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0 select-none pointer-events-none opacity-20">
          <img 
            src="https://drive.google.com/thumbnail?id=1i5M0bnvfLS0uA-XB-O-ZX2cKr23Me-uc&sz=w2048" 
            alt="Hero Background" 
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Gradient Overlay for superior text contrast */}
        <div className="absolute inset-0 z-0 bg-white/20 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-pink-700 mb-4">
            <HeartPulse className="w-5 h-5" />
            <span className="text-sm font-semibold tracking-wider uppercase">Sistem Informasi Posbindu</span>
          </div>
          <h1 className="text-[32px] font-sans font-black mb-6 leading-[40px] text-slate-900">
            Selamat Datang di Posbindu PTM Cendrawasih 1
          </h1>
          <p className="text-slate-800 text-lg mb-8 leading-relaxed">
            Platform terpadu untuk pencatatan, pemantauan, dan pelaporan kesehatan warga RW 015. 
            Mendukung deteksi dini Penyakit Tidak Menular (PTM) menuju masyarakat yang lebih sehat.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors shadow-lg shadow-indigo-900/20 cursor-pointer"
            >
              Lihat Dashboard Statistik
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('structure')}
              className="bg-indigo-800/50 text-white border border-indigo-700/50 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-800 transition-colors cursor-pointer"
            >
              Lihat Struktur Pengurus
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute right-40 -top-20 w-72 h-72 bg-rose-500 rounded-full blur-3xl opacity-10 pointer-events-none" />
      </div>

      {/* Schedule Banner */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-6 sm:p-8 text-white shadow-sm border border-emerald-400/30 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/30 shadow-inner">
            <Calendar className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3">Jadwal Giat Posbindu</h2>
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-emerald-50 font-medium text-sm">
              <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Calendar className="w-4 h-4 shrink-0" />
                Setiap Minggu Ke-2
              </span>
              <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Clock className="w-4 h-4 shrink-0" />
                08.00 - 10.30 WIB
              </span>
              <span className="flex items-center gap-2 bg-black/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <MapPin className="w-4 h-4 shrink-0" />
                Balai Posyandu Blok B2 RT 004 RW 015
              </span>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-48 h-48 bg-emerald-900 rounded-full blur-3xl opacity-20 pointer-events-none" />
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-indigo-200 transition-all hover:shadow-md group cursor-pointer" onClick={() => onNavigate('dashboard')}>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Activity className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Pemantauan Hipertensi</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Pantau grafik tren tekanan darah dan skrining riwayat penyakit warga secara real-time.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-rose-200 transition-all hover:shadow-md group cursor-pointer" onClick={() => onNavigate('ptm-input')}>
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <HeartPulse className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Pencatatan Medis</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Input data antropometri, cek gula darah, kolesterol, dan asam urat dengan mudah.</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start hover:border-emerald-200 transition-all hover:shadow-md group cursor-pointer" onClick={() => onNavigate('structure')}>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            <ShieldPlus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Kader & Pengurus</h3>
          <p className="text-sm text-slate-500 leading-relaxed">Informasi struktur organisasi dan daftar relawan kader kesehatan RW 015 yang bertugas.</p>
        </div>
      </div>

      {/* Galeri Kegiatan Section */}
      <div className="mt-12 bg-slate-50/50 rounded-3xl p-6 sm:p-8 border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
              <Images className="w-4 h-4" />
              <span>Dokumentasi Posbindu</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Galeri Kegiatan Warga</h2>
            <p className="text-sm text-slate-500 mt-1">Potret pelaksanaan program kesehatan berkala di lingkungan RW 015.</p>
          </div>
          <div className="text-xs font-semibold text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 self-start sm:self-auto shadow-xs">
            Total: 3 Kegiatan Terkini
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              id: 1,
              title: "Pemeriksaan Kesehatan Rutin Bulanan",
              category: "Skrining",
              date: "14 Juni 2026",
              location: "Balai Warga RW 015",
              description: "Skrining kesehatan berkala meliputi pengukuran tekanan darah, penimbangan berat badan, pemeriksaan kolesterol, dan konseling gizi terpadu.",
              image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
              categoryColor: "bg-indigo-600"
            },
            {
              id: 2,
              title: "Edukasi & Sosialisasi Gizi Seimbang",
              category: "Edukasi",
              date: "24 Mei 2026",
              location: "Ruang Pertemuan RW 015",
              description: "Penyuluhan bersama tenaga medis Puskesmas mengenai pencegahan dini diabetes melitus dan hipertensi melalui pola makan rendah garam dan gula.",
              image: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&w=800&q=80",
              categoryColor: "bg-rose-600"
            },
            {
              id: 3,
              title: "Senam Jantung Sehat Bersama",
              category: "Olahraga",
              date: "09 Mei 2026",
              location: "Lapangan Olahraga RW 015",
              description: "Kegiatan senam bugar rutin setiap Sabtu pagi untuk meningkatkan kapasitas jantung dan pembuluh darah serta membangun kekompakan warga RW 015.",
              image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80",
              categoryColor: "bg-emerald-600"
            }
          ].map((activity) => (
            <div key={activity.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all group">
              {/* Image with category badge */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img 
                  src={activity.image} 
                  alt={activity.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className={`absolute top-4 left-4 ${activity.categoryColor} text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm`}>
                  {activity.category}
                </span>
              </div>

              {/* Content block */}
              <div className="p-5 flex flex-col justify-between h-56">
                <div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-400 text-[11px] mb-2.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {activity.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {activity.location}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {activity.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                    {activity.description}
                  </p>
                </div>

                <div className="border-t border-slate-50 pt-3 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
                  <span>Lihat Detail</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
