const fs = require('fs');
const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');

const exportKunjRegex = /const exportKunjunganPDF = \([\s\S]*?doc\.save[^}]*\n\s*};\n/;
content = content.replace(exportKunjRegex, '');

const exportHipRegex = /const exportHipertensiPDF = \([\s\S]*?doc\.save[^}]*\n\s*};\n/;
content = content.replace(exportHipRegex, '');

fs.writeFileSync(path, content, 'utf8');
