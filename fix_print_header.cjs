const fs = require('fs');

const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Update signatures
content = content.replace(/<p className="font-bold text-slate-900 mt-0\.5">Kader Pelaksana<\/p>/g, '<p className="font-bold text-slate-900 mt-0.5">Sekretaris</p>');
content = content.replace(/<p className="font-bold text-slate-950 underline">\( \.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\.\. \)<\/p>/g, '<p className="font-bold text-slate-950 underline">Eny Suciaty</p>');

// Ensure table header repeats
content = content.replace(/<thead className="bg-slate-100 text-slate-700">/g, '<thead className="bg-slate-100 text-slate-700 table-header-group">');
content = content.replace(/<tr key=\{k\.id \|\| idx\}>/g, '<tr key={k.id || idx} className="break-inside-avoid">');

fs.writeFileSync(path, content, 'utf8');
