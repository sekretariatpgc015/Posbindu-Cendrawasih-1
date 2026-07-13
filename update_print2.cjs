const fs = require('fs');
const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');
const stateInsertIdx = content.indexOf('const [formState, setFormState]');
content = content.slice(0, stateInsertIdx) + 
  "const [printPreviewMode, setPrintPreviewMode] = useState<'none' | 'kunjungan' | 'hipertensi'>('none');\n  " + 
  content.slice(stateInsertIdx);
fs.writeFileSync(path, content, 'utf8');
