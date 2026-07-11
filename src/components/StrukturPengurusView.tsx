import React from 'react';
import { motion } from 'motion/react';
import { Award, Users, ShieldCheck, Heart, User } from 'lucide-react';

interface PengurusMember {
  id: string;
  role: string;
  name: string;
  imageUrl: string;
  category: 'inti' | 'kader';
  color: string;
  badgeBg: string;
}

export default function StrukturPengurusView() {
  const pengurusData: PengurusMember[] = [
    {
      id: 'ketua',
      role: 'Ketua',
      name: 'Dewi Tri P.',
      imageUrl: 'https://drive.google.com/thumbnail?id=1fCpYQeYeotor5ES2F4MIuKlLS9i-tJjl&sz=w500',
      category: 'inti',
      color: 'border-indigo-500 text-indigo-700 bg-indigo-50',
      badgeBg: 'bg-indigo-600 text-white shadow-indigo-100',
    },
    {
      id: 'sekretaris',
      role: 'Sekretaris',
      name: 'Eny Suciati',
      imageUrl: 'https://drive.google.com/thumbnail?id=1uPf_oC31s-b3_gIIs2R6IWVhY0mbJ6JP&sz=w500',
      category: 'inti',
      color: 'border-emerald-500 text-emerald-700 bg-emerald-50',
      badgeBg: 'bg-emerald-600 text-white shadow-emerald-100',
    },
    {
      id: 'bendahara1',
      role: 'Bendahara 1',
      name: 'Sumarni',
      imageUrl: 'https://drive.google.com/thumbnail?id=1ac8aqWGzgG0aZUd5I-OnKKK1rK8c3_g3&sz=w500',
      category: 'inti',
      color: 'border-amber-500 text-amber-700 bg-amber-50',
      badgeBg: 'bg-amber-500 text-white shadow-amber-100',
    },
    {
      id: 'bendahara2',
      role: 'Bendahara 2',
      name: 'Uun Yuningsih',
      imageUrl: 'https://drive.google.com/thumbnail?id=1sGlLXZ_Ua4S37Cz4gW1W398s_UrbK_3C&sz=w500',
      category: 'inti',
      color: 'border-amber-500 text-amber-700 bg-amber-50',
      badgeBg: 'bg-amber-500 text-white shadow-amber-100',
    },
    {
      id: 'kader1',
      role: 'Kader',
      name: 'Ernawati',
      imageUrl: 'https://drive.google.com/thumbnail?id=1SjHe3io-odF2UswZU4PbZlV50M_TLHnX&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
    {
      id: 'kader2',
      role: 'Kader',
      name: 'Erni Suprapti',
      imageUrl: 'https://drive.google.com/thumbnail?id=1MhOPzYC4tlmMKnxKmJr2H1S29mBgufD1&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
    {
      id: 'kader3',
      role: 'Kader',
      name: 'Puspa Ningsih',
      imageUrl: 'https://drive.google.com/thumbnail?id=1d6ActG-hKcaiGXl4-_NzRXNkK1XoseZO&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
    {
      id: 'kader4',
      role: 'Kader',
      name: 'Sanni Noviati',
      imageUrl: 'https://drive.google.com/thumbnail?id=1ZL-751cgNN5Hxe4K7k6QZiVPeMXEG1Tz&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
    {
      id: 'kader5',
      role: 'Kader',
      name: 'Sri Astuti',
      imageUrl: 'https://drive.google.com/thumbnail?id=1GP6PBpAW3sCgs0ioy_Ouiz8OINpxJMV6&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
    {
      id: 'kader6',
      role: 'Kader',
      name: 'Sri Nunung',
      imageUrl: 'https://drive.google.com/thumbnail?id=11VDogVPDNQ2jwuTAtqRgQvEfafeiLdO7&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
    {
      id: 'kader7',
      role: 'Kader',
      name: 'Uum Sari',
      imageUrl: 'https://drive.google.com/thumbnail?id=15q8zdimFVRPZZdEly93vqk06tsX_HT14&sz=w500',
      category: 'kader',
      color: 'border-rose-300 text-rose-700 bg-rose-50/50',
      badgeBg: 'bg-rose-500 text-white shadow-rose-100',
    },
  ];

  const coreMembers = pengurusData.filter((m) => m.category === 'inti');
  const cadreMembers = pengurusData.filter((m) => m.category === 'kader');

  // Animation variants for children stagger
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
      id="struktur-pengurus-container"
    >
      {/* Header Banner */}
      <div className="bg-[#FFC8DD] rounded-3xl p-6 sm:p-8 text-slate-900 shadow-md relative overflow-hidden" id="struktur-header-banner">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-pink-300/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 translate-y-1/2 w-48 h-48 bg-white/20 rounded-full blur-xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 text-pink-700 text-[10px] font-bold uppercase tracking-wider rounded-full border border-pink-300/50">
              <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
              Sinergi & Dedikasi
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-tight">
              Struktur Pengurus & Kader
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
              Tim berdedikasi Posbindu PTM Cendrawasih 1 yang mengelola, mengawasi, dan melayani pemeriksaan kesehatan berkala bagi warga masyarakat.
            </p>
          </div>
          
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/40 flex items-center gap-3.5 shrink-0">
            <div className="p-2.5 bg-emerald-500 text-white rounded-xl shadow-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Total Personel</div>
              <div className="text-xl font-extrabold text-white">{pengurusData.length} Orang</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Pengurus Inti */}
      <div className="space-y-4" id="section-pengurus-inti">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg">
            <Award className="w-4 h-4" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Pengurus Inti Posbindu</h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {coreMembers.map((member) => (
            <motion.div
              key={member.id}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col items-center p-6 text-center group transition-all"
              id={`card-pengurus-${member.id}`}
            >
              <div className="relative mb-5">
                {/* Decorative background ring */}
                <div className="absolute inset-0 rounded-full bg-slate-100 scale-105 group-hover:scale-110 transition-transform duration-300" />
                
                {/* Member profile image */}
                <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-white shadow-md z-10 bg-slate-50">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
                    }}
                  />
                </div>

                {/* Micro badge indicator */}
                <div className={`absolute bottom-1 right-1 z-20 p-1.5 rounded-full ${member.badgeBg}`}>
                  <User className="w-3 h-3" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${member.color}`}>
                  {member.role}
                </span>
                <h3 className="text-sm font-bold text-slate-800 tracking-tight block pt-1 group-hover:text-indigo-600 transition-colors">
                  {member.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* SECTION 2: Kader & Layanan Lapangan */}
      <div className="space-y-4" id="section-kader-lapangan">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
          <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
            <Heart className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-base font-bold text-slate-800">Kader Pelaksana Lapangan</h2>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-6"
        >
          {cadreMembers.map((member) => (
            <motion.div
              key={member.id}
              variants={itemVariants}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col items-center p-5 text-center group transition-all"
              id={`card-kader-${member.id}`}
            >
              <div className="relative mb-4">
                {/* Decorative background ring */}
                <div className="absolute inset-0 rounded-full bg-slate-100 scale-105 group-hover:scale-110 transition-transform duration-300" />
                
                {/* Member profile image */}
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md z-10 bg-slate-50">
                  <img
                    src={member.imageUrl}
                    alt={member.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
                    }}
                  />
                </div>

                <div className={`absolute bottom-0 right-1 z-20 p-1.5 rounded-full ${member.badgeBg}`}>
                  <Heart className="w-2.5 h-2.5 fill-current" />
                </div>
              </div>

              <div className="space-y-1.5">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${member.color}`}>
                  {member.role}
                </span>
                <h3 className="text-xs font-bold text-slate-800 tracking-tight block pt-1 group-hover:text-rose-600 transition-colors">
                  {member.name}
                </h3>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Footer Info Box */}
      <div className="bg-slate-100 rounded-2xl p-5 border border-slate-200/60 text-slate-500 text-xs leading-relaxed flex flex-col sm:flex-row items-center gap-4" id="struktur-footer-info">
        <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm shrink-0">
          <Heart className="w-5 h-5 text-rose-500 fill-current" />
        </div>
        <div className="space-y-0.5">
          <p className="font-bold text-slate-700">Tugas Pokok & Tanggung Jawab Kader</p>
          <p className="text-slate-500">
            Mengkoordinasikan pendaftaran, melaksanakan penimbangan berat badan, pengukuran tinggi badan, lingkar perut, pemeriksaan tekanan darah, cek kadar gula/kolesterol darah, serta memberikan pencatatan dan penyuluhan edukatif.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
