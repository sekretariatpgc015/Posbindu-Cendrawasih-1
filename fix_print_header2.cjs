const fs = require('fs');

const path = 'src/components/FormPTMView.tsx';
let content = fs.readFileSync(path, 'utf8');

// The thead tags are just `<thead>` without attributes.
// The tables that we care about are inside `<div className="mb-6">\n            <table className="w-full text-left text-[10px] border-collapse border border-slate-300">\n              <thead>`
// Let's replace `<thead>` inside print layouts with `<thead className="table-header-group">`
content = content.replace(/<table className="w-full text-left text-\[10px\] border-collapse border border-slate-300">\s*<thead>/g, '<table className="w-full text-left text-[10px] border-collapse border border-slate-300">\n              <thead className="table-header-group">');

fs.writeFileSync(path, content, 'utf8');
