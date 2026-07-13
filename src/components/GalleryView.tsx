import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar, MapPin } from 'lucide-react';

interface ImageItem {
  url: string;
  alt: string;
}

interface Activity {
  id: number;
  title: string;
  date: string;
  location: string;
  images: ImageItem[];
}

interface ActivityGallerySectionProps {
  title: string;
  date: string;
  location: string;
  images: ImageItem[];
  onImageClick: (idx: number) => void;
}

const ActivityGallerySection: React.FC<ActivityGallerySectionProps> = ({
  title,
  date,
  location,
  images,
  onImageClick
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    checkScroll();
    const timer = setTimeout(checkScroll, 300);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [images]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-800">{title}</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2.5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Tanggal: {date}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100/30">
            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
            Tempat: {location}
          </span>
        </div>
      </div>
      
      {/* Horizontal Slider (works on all devices) */}
      <div className="relative -mx-6 px-6">
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {images.map((img, idx) => (
            <div 
              key={idx} 
              className="shrink-0 snap-start w-[240px] sm:w-[280px] md:w-[320px] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-50 relative shadow-xs border border-slate-100 group cursor-pointer"
              onClick={() => onImageClick(idx)}
            >
              <img 
                src={img.url} 
                alt={`${img.alt} ${idx + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                <span className="text-[10px] text-white font-medium bg-black/40 backdrop-blur-xs px-2.5 py-1.5 rounded-lg">
                  Lihat Foto {idx + 1}
                </span>
              </div>
            </div>
          ))}
        </div>

        {canScrollLeft && (
          <button 
            onClick={() => scroll('left')}
            className="absolute left-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-md hover:bg-white hover:scale-110 transition-all z-10 border border-slate-100 hidden sm:flex items-center justify-center"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        
        {canScrollRight && (
          <button 
            onClick={() => scroll('right')}
            className="absolute right-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/95 text-slate-800 shadow-md backdrop-blur-md hover:bg-white hover:scale-110 transition-all z-10 border border-slate-100 hidden sm:flex items-center justify-center"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function GalleryView() {
  const activities: Activity[] = [
    {
      id: 3,
      title: "Giat Posbindu",
      date: "7 Mei 2026",
      location: "Balai Posbindu",
      images: [
        { url: "https://drive.google.com/thumbnail?id=1ozvh1ncBXQjKGJYb3qDL6SDEaM8k_0xA&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1T6qaELuPdbKvk7luxM0pQpprIs1ESxT2&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1-HbM0d_Xojdae6EKR-gomKzg_MDYZhpt&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1A-k8Tx1A6bGQjjEoXQJyQT5HExlXD1Fm&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1zKtNukBEtkSGvXt2h_0Bn9UR1M3YjLX3&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1wx9aXpm3NOGBGNghwinIOBymLKyf3niM&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1YJ3yEomncSqb4LaGE7IiLYvNbp7_BdWh&sz=w1000", alt: "Giat Posbindu" },
        { url: "https://drive.google.com/thumbnail?id=1wn1m7R8wUizWUzJxl8HHdjlW4XCzxKGE&sz=w1000", alt: "Giat Posbindu" }
      ]
    },
    {
      id: 1,
      title: "Validasi Input Data PTM",
      date: "20 April 2026",
      location: "Puskesmas Wanajaya",
      images: [
        { url: "https://drive.google.com/thumbnail?id=1W7usTQQ6bcdH5Rets5AMuds7h3f2J49c&sz=w1000", alt: "Validasi Input Data PTM" },
        { url: "https://drive.google.com/thumbnail?id=1E8kBKSF6yAv11uxHIQs7PPZcC8wRb6ZG&sz=w1000", alt: "Validasi Input Data PTM" },
        { url: "https://drive.google.com/thumbnail?id=1igBnH065Y2QheNMULRWlWsxtofGv0xF3&sz=w1000", alt: "Validasi Input Data PTM" }
      ]
    },
    {
      id: 2,
      title: "Giat Posbindu",
      date: "11 April 2026",
      location: "Balai Posyandu",
      images: [
        { url: 'https://lh3.googleusercontent.com/u/0/d/1Lt_8phAAI8KLPHSXuUc45ImetD6ooi_1', alt: 'Giat Posbindu' },
        { url: 'https://lh3.googleusercontent.com/u/0/d/1cFrm_GYeTTPVEgbV5rfU4ckIpZ2KG777', alt: 'Giat Posbindu' },
        { url: 'https://lh3.googleusercontent.com/u/0/d/1PVZlrUfHGp00yHuX2mrGUKBWqqbDh4NF', alt: 'Giat Posbindu' },
        { url: 'https://lh3.googleusercontent.com/u/0/d/1lvESZB0MzXYWlBEZuprKD_nXi3tHUX2a', alt: 'Giat Posbindu' },
        { url: 'https://lh3.googleusercontent.com/u/0/d/1bKrcw_87FzSwWw8UK8O6WAJ_knmC3vRX', alt: 'Giat Posbindu' },
        { url: 'https://lh3.googleusercontent.com/u/0/d/1s1wagoyy8wiDDe4rVNbSt5pkpCPBJI5B', alt: 'Giat Posbindu' },
      ]
    }
  ];

  const [selectedActivityIndex, setSelectedActivityIndex] = useState<number | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openLightbox = (activityIdx: number, imgIdx: number) => {
    setSelectedActivityIndex(activityIdx);
    setSelectedImageIndex(imgIdx);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedActivityIndex(null);
    setSelectedImageIndex(null);
    document.body.style.overflow = '';
  };

  const lightboxNext = () => {
    if (selectedActivityIndex !== null && selectedImageIndex !== null) {
      const activeImages = activities[selectedActivityIndex].images;
      setSelectedImageIndex(selectedImageIndex === activeImages.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  const lightboxPrev = () => {
    if (selectedActivityIndex !== null && selectedImageIndex !== null) {
      const activeImages = activities[selectedActivityIndex].images;
      setSelectedImageIndex(selectedImageIndex === 0 ? activeImages.length - 1 : selectedImageIndex - 1);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in" id="gallery-view-container">
      {/* Header */}
      <div className="bg-[#FFC8DD] p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">Dokumentasi Posbindu</h1>
          <p className="text-xs text-slate-500 mt-1">Dokumentasi kegiatan Posbindu PTM Cendrawasih 1.</p>
        </div>
      </div>

      {/* Activities Grid / List */}
      <div className="space-y-6">
        {activities.map((activity, activityIdx) => (
          <ActivityGallerySection
            key={activity.id}
            title={activity.title}
            date={activity.date}
            location={activity.location}
            images={activity.images}
            onImageClick={(imgIdx) => openLightbox(activityIdx, imgIdx)}
          />
        ))}
      </div>

      {/* Lightbox Popup */}
      {selectedActivityIndex !== null && selectedImageIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={closeLightbox}>
          <button 
            onClick={closeLightbox}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50 cursor-pointer"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/70 rounded-full transition-colors z-50 cursor-pointer"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
          
          <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
              src={activities[selectedActivityIndex].images[selectedImageIndex].url}
              alt={activities[selectedActivityIndex].images[selectedImageIndex].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-xs text-white rounded-xl text-xs font-semibold flex items-center gap-3">
              <span>{selectedImageIndex + 1} / {activities[selectedActivityIndex].images.length}</span>
              <span className="opacity-50">|</span>
              <span>{activities[selectedActivityIndex].title}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
