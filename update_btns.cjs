const fs = require('fs');

const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace FileText and PDF for Kunjungan
content = content.replace(
  /onClick=\{\(\) => setPrintPreviewMode\("kunjungan"\)\}\n\s*id="btn-export-kunjungan-pdf"\n\s*className="([^"]*)"\n\s*title="[^"]*"\n\s*>\n\s*<FileText[^>]*\/>\n\s*PDF/g,
  `onClick={() => setPrintPreviewMode("kunjungan")}
                  id="btn-export-kunjungan-pdf"
                  className="$1"
                  title="Cetak PDF Laporan"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF`
);

// Replace FileText and PDF for Hipertensi
content = content.replace(
  /onClick=\{\(\) => setPrintPreviewMode\("hipertensi"\)\}\n\s*id="btn-export-hypertension-pdf"\n\s*className="([^"]*)"\n\s*title="[^"]*"\n\s*>\n\s*<FileText[^>]*\/>\n\s*PDF/g,
  `onClick={() => setPrintPreviewMode("hipertensi")}
                  id="btn-export-hypertension-pdf"
                  className="$1"
                  title="Cetak PDF Laporan"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak PDF`
);

fs.writeFileSync(path, content, 'utf8');
