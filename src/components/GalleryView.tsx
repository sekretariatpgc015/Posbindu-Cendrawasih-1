import React, { useRef, useState, useEffect } from 'react';
import { Image, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function GalleryView() {
  const images = [
    { url: 'https://lh3.googleusercontent.com/u/0/d/1Lt_8phAAI8KLPHSXuUc45ImetD6ooi_1', alt: 'Posbindu' },
    { url: 'https://lh3.googleusercontent.com/u/0/d/1cFrm_GYeTTPVEgbV5rfU4ckIpZ2KG777', alt: 'Posbindu' },
    { url: 'https://lh3.googleusercontent.com/u/0/d/1PVZlrUfHGp00yHuX2mrGUKBWqqbDh4NF', alt: 'Posbindu' },
    { url: 'https://lh3.googleusercontent.com/u/0/d/1lvESZB0MzXYWlBEZuprKD_nXi3tHUX2a', alt: 'Posbindu' },
    { url: 'https://lh3.googleusercontent.com/u/0/d/1bKrcw_87FzSwWw8UK8O6WAJ_knmC3vRX', alt: 'Posbindu' },
    { url: 'https://lh3.googleusercontent.com/u/0/d/1s1wagoyy8wiDDe4rVNbSt5pkpCPBJI5B', alt: 'Posbindu' },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const openLightbox = (index: number) => {
    setSelectedImageIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setSelectedImageIndex(null);
    document.body.style.overflow = '';
  };

  const lightboxNext = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === images.length - 1 ? 0 : selectedImageIndex + 1);
    }
  };

  const lightboxPrev = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex(selectedImageIndex === 0 ? images.length - 1 : selectedImageIndex - 1);
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
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold border border-indigo-100">
          <Image className="w-5 h-5" />
          <span>{images.length} Foto</span>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div className="mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-800">Giat Posbindu</h2>
          <div className="flex flex-wrap items-center gap-3 mt-3">
             <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-md">Tanggal: 11 April 2026</span>
             <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-md">Tempat: Balai Posyandu</span>
             <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-3 py-1.5 rounded-md">Kategori: Posbindu</span>
          </div>
        </div>
        
        {/* Threads-style Slider Container */}
        <div className="relative -mx-6 px-6">
          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex gap-3 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {images.map((img, idx) => (
              <div 
                key={idx} 
                className="shrink-0 snap-center w-[42%] sm:w-[30%] md:w-[22%] lg:w-[17%] aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 relative shadow-sm border border-slate-200 group cursor-pointer"
                onClick={() => openLightbox(idx)}
              >
                <img 
                  src={img.url} 
                  alt={`${img.alt} ${idx + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>

          {canScrollLeft && (
            <button 
              onClick={() => scroll('left')}
              className="absolute left-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-md hover:bg-white hover:scale-110 transition-all z-10 border border-slate-200 hidden sm:flex"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          
          {canScrollRight && (
            <button 
              onClick={() => scroll('right')}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/90 text-slate-800 shadow-md backdrop-blur-md hover:bg-white hover:scale-110 transition-all z-10 border border-slate-200 hidden sm:flex"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox Popup */}
      {selectedImageIndex !== null && (
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
              src={images[selectedImageIndex].url}
              alt={images[selectedImageIndex].alt}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
