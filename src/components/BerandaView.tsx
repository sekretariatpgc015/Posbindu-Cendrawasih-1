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
            Platform terpadu untuk pencatatan, pemantauan, dan pelaporan kesehatan warga RW 015 Pesona Gading Cibitung. 
            Mendukung deteksi dini Penyakit Tidak Menular (PTM) menuju masyarakat yang lebih sehat.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate('dashboard')}
              className="bg-white text-pink-950 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-pink-50 transition-colors shadow-lg shadow-pink-900/10 cursor-pointer"
            >
              Lihat Dashboard Statistik
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onNavigate('structure')}
              className="bg-[#FFAFCC] text-pink-950 border border-pink-300 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-pink-300 transition-colors cursor-pointer shadow-sm"
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
      <div className="bg-[#FFAFCC] rounded-2xl p-6 sm:p-8 text-slate-900 shadow-sm border border-pink-300 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full">
          <div className="w-16 h-16 bg-white/50 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-md border border-white/40 shadow-inner">
            <Calendar className="w-8 h-8 text-pink-700" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-3 text-slate-900">Jadwal Giat Posbindu</h2>
            <div className="flex flex-col md:flex-row gap-3 md:gap-6 text-slate-800 font-medium text-sm">
              <span className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Calendar className="w-4 h-4 shrink-0 text-pink-700" />
                Setiap Minggu Ke-2
              </span>
              <span className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <Clock className="w-4 h-4 shrink-0 text-pink-700" />
                08.00 - 10.30 WIB
              </span>
              <span className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                <MapPin className="w-4 h-4 shrink-0 text-pink-700" />
                Balai Posyandu Blok B2 RT 004 RW 015
              </span>
            </div>
          </div>
        </div>
        
        {/* Background Decorative Elements */}
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-white rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-48 h-48 bg-pink-300 rounded-full blur-3xl opacity-30 pointer-events-none" />
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

        <div className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
          {[
            {
              id: 3,
              title: "Giat Posbindu",
              category: "Skrining",
              date: "7 Mei 2026",
              location: "Balai Posbindu",
              description: "Kegiatan rutin pemeriksaan kesehatan",
              image: "https://drive.google.com/thumbnail?id=1ozvh1ncBXQjKGJYb3qDL6SDEaM8k_0xA&sz=w1000",
              categoryColor: "bg-indigo-600 text-white"
            },
            {
              id: 2,
              title: "Validasi Input Data PTM",
              category: "Edukasi",
              date: "24 April 2026",
              location: "Puskesmas Wanajaya",
              description: "Penyuluhan bersama tenaga medis Puskesmas mengenai pencegahan dini diabetes melitus dan hipertensi melalui pola makan rendah garam dan gula.",
              image: "https://drive.google.com/thumbnail?id=1W7usTQQ6bcdH5Rets5AMuds7h3f2J49c&sz=w1000",
              categoryColor: "bg-rose-600 text-white"
            },
            {
              id: 1,
              title: "Pemeriksaan Kesehatan Rutin Bulanan",
              category: "Skrining",
              date: "11 Juni 2026",
              location: "Balai Posbindu",
              description: "Skrining kesehatan berkala meliputi pengukuran tekanan darah, penimbangan berat badan, pemeriksaan kolesterol, dan konseling gizi terpadu.",
              image: "https://drive.google.com/thumbnail?id=1Lt_8phAAI8KLPHSXuUc45ImetD6ooi_1&sz=w1000",
              categoryColor: "bg-[#FFAFCC] text-pink-950"
            }
          ].map((activity) => (
            <div key={activity.id} className="w-[280px] sm:w-[320px] md:w-[360px] shrink-0 snap-start bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-200/80 transition-all group">
              {/* Image with category badge */}
              <div className="relative h-48 overflow-hidden bg-slate-100">
                <img 
                  src={activity.image} 
                  alt={activity.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className={`absolute top-4 left-4 ${activity.categoryColor} text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm`}>
                  {activity.category}
                </span>
              </div>

              {/* Content block */}
              <div className="p-5 flex flex-col justify-between h-40">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
