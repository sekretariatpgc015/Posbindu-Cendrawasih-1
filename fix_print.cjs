const fs = require('fs');

const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. We already added the modal. We need to add the PrintLayout inside the return statement but outside the main div (or as a sibling).
// Wait, first let's fix the button `onClick` in the modal so it DOES NOT reset `printPreviewMode` immediately.
content = content.replace(
  /setPrintPreviewMode\('none'\);\n\s*setTimeout\(\(\) => \{/g,
  'setTimeout(() => {'
);
// And also, we might want to reset it AFTER print? No, the user can close the modal manually after printing. Or we can listen to `onafterprint`. For simplicity, leave it open.

// 2. Wrap the main UI with a conditional `print:hidden`
// Find the first `<div className="space-y-6 pb-12" id="form-ptm-container">`
content = content.replace(
  '<div className="space-y-6 pb-12" id="form-ptm-container">',
  '<div className={`space-y-6 pb-12 ${printPreviewMode !== \'none\' ? \'print:hidden\' : \'\'}`} id="form-ptm-container">'
);

// 3. Add the PrintLayout block right before the Modal
const insertionPoint = content.indexOf('{/* Print Preview Modal */}');
const printLayout = `
      {/* Hidden Print Layout (Only visible during window.print) */}
      <div className="hidden print:block bg-white w-full font-sans text-slate-800">
        <div>
          {/* KOP Surat Instansi */}
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-4 mb-6 gap-4">
            <div className="flex-shrink-0">
              <img 
                src="https://drive.google.com/thumbnail?id=17G7evIeHShfqn7aSm7L1mfgjlb1hStya" 
                alt="Logo RW" 
                className="h-16 w-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            
            <div className="text-center flex-1">
              <h1 className="text-sm font-extrabold tracking-tight text-slate-950 uppercase">POSBINDU CENDRAWASIH 1</h1>
              <p className="text-sm font-black text-slate-950 uppercase mt-1">RW 015 PESONA GADING CIBITUNG</p>
              <p className="text-[10px] text-slate-700 font-bold uppercase mt-1">DESA WANAJAYA, KECAMATAN CIBITUNG</p>
              <p className="text-[8px] text-slate-500 italic mt-0.5">Alamat: Jl. Cempaka Blok C2 RT 001, Bekasi, Jawa Barat</p>
            </div>
            
            <div className="flex-shrink-0">
              <img 
                src="https://drive.google.com/thumbnail?id=1YibmCQLufPZ9t5gDx7I7JTLY4m1oymrM" 
                alt="Logo Posbindu" 
                className="h-16 w-16 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>

          <div className="text-center mb-6">
            <h3 className="text-xs font-extrabold tracking-wider text-slate-900 uppercase underline">
              {printPreviewMode === 'kunjungan' ? 'LAPORAN REKAPITULASI KUNJUNGAN POSBINDU PTM' : 'DAFTAR WARGA RESIKO HIPERTENSI TINGGI'}
            </h3>
          </div>

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
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-2 text-center text-xs text-slate-800 mt-10 pt-6 border-t border-dashed border-slate-200 w-full">
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
              
            </div>
            <div>
              <p className="font-bold text-slate-950 underline">( ...................................... )</p>
            </div>
          </div>
        </div>
      </div>
`;

if (insertionPoint !== -1) {
  content = content.slice(0, insertionPoint) + printLayout + content.slice(insertionPoint);
  fs.writeFileSync(path, content, 'utf8');
}
