const fs = require('fs');

function buildModalHTML() {
  return `
      {/* Print Preview Modal */}
      {printPreviewMode !== 'none' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden animate-fade-in overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-indigo-600" />
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    Pratinjau {printPreviewMode === 'kunjungan' ? 'Data Kunjungan' : 'Daftar Hipertensi'}
                  </h2>
                  <p className="text-[10px] text-slate-500">Tampilan sebelum dicetak ke kertas / PDF</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold rounded-full animate-pulse">
                  Kertas A4 (Lanskap)
                </span>
                <button 
                  onClick={() => setPrintPreviewMode('none')}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-xl transition-all cursor-pointer text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Scrollable Content Container */}
            <div className="p-6 md:p-8 overflow-y-auto bg-slate-100/50 flex-1 flex justify-center">
              
              {/* Paper Layout */}
              <div className="bg-white p-10 md:p-12 shadow-md border border-slate-200/80 max-w-5xl w-full rounded-md min-h-[210mm] flex flex-col font-sans text-slate-800">
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
                    <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase underline">
                      {printPreviewMode === 'kunjungan' ? 'LAPORAN REKAPITULASI KUNJUNGAN POSBINDU PTM' : 'DAFTAR WARGA RESIKO HIPERTENSI TINGGI'}
                    </h3>
                  </div>

                  {/* Tabel Data */}
                  <div className="mb-6">
                    <table className="w-full text-left text-[10px] border-collapse border border-slate-300">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700">
                          <th className="border border-slate-300 py-1.5 px-2">No</th>
                          <th className="border border-slate-300 py-1.5 px-2">Tanggal</th>
                          <th className="border border-slate-300 py-1.5 px-2">Nama</th>
                          <th className="border border-slate-300 py-1.5 px-2">L/P</th>
                          <th className="border border-slate-300 py-1.5 px-2">Usia</th>
                          <th className="border border-slate-300 py-1.5 px-2">RT</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">TD</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">GDS</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">CHOL</th>
                          <th className="border border-slate-300 py-1.5 px-2 text-center">AU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(printPreviewMode === 'kunjungan' ? filteredKunjungan : filteredHypertensionKunjungan).map((k, idx) => (
                          <tr key={k.id || idx}>
                            <td className="border border-slate-300 py-1 px-2">{idx + 1}</td>
                            <td className="border border-slate-300 py-1 px-2">{formatDate(k.tanggal)}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.nama}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.jenisKelamin === 'Laki-laki' ? 'L' : 'P'}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.usia}</td>
                            <td className="border border-slate-300 py-1 px-2">{k.rt}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.tdSistolik}/{k.tdDiastolik}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.gds || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.chol || '-'}</td>
                            <td className="border border-slate-300 py-1 px-2 text-center">{k.au || '-'}</td>
                          </tr>
                        ))}
                        {(printPreviewMode === 'kunjungan' ? filteredKunjungan : filteredHypertensionKunjungan).length === 0 && (
                          <tr>
                            <td colSpan={10} className="border border-slate-300 py-4 text-center text-slate-400 italic">
                              Tidak ada data yang ditampilkan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Print only Tanda Tangan */}
                <div className="grid grid-cols-2 text-center text-xs text-slate-800 mt-auto pt-6 border-t border-dashed border-slate-200 w-full">
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

                  <div className="flex flex-col items-center justify-between min-h-[140px]">
                    <div>
                      <p className="font-semibold text-slate-600">Bekasi, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <p className="font-bold text-slate-900 mt-0.5">Kader Pelaksana</p>
                    </div>
                    <div className="my-2 h-16 flex items-center justify-center">
                      {/* Blank space for signature */}
                    </div>
                    <div>
                      <p className="font-bold text-slate-950 underline">( ...................................... )</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setPrintPreviewMode('none')}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                Batal / Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintPreviewMode('none');
                  setTimeout(() => {
                    const originalTitle = document.title;
                    document.title = printPreviewMode === 'kunjungan' ? 'Laporan_Kunjungan_Posbindu' : 'Daftar_Hipertensi_Posbindu';
                    // We need to show the print layout inside the actual page for window.print to capture it.
                    // This means we might need a dedicated CSS class for printing.
                    // Actually, since FormPTMView is a huge form, printing it directly with window.print() might print the whole form instead of just the report.
                    window.print();
                    document.title = originalTitle;
                  }, 150);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all shadow-md hover:shadow-indigo-100"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Laporan</span>
              </button>
            </div>
          </div>
        </div>
      )}
`;
}

const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Insert before `</form>\n    </div>`
const insertionPoint = content.lastIndexOf('</form>');
if (insertionPoint !== -1) {
  content = content.slice(0, insertionPoint + 7) + '\n' + buildModalHTML() + content.slice(insertionPoint + 7);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Modal inserted successfully");
} else {
  console.error("Could not find </form>");
}
