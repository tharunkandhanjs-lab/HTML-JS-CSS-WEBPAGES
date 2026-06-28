const fs = require('fs');
const path = require('path');
const root = process.cwd();

const real = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(p);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      real.push(p.replace(/\\/g, '/').replace(root.replace(/\\/g, '/'), '').replace(/^\//, ''));
    }
  }
}

walk(path.join(root, 'games'));
const realRoot = fs.readdirSync(root).filter((f) => f.toLowerCase().endsWith('.html') && f !== 'index.html');

const actualPaths = real.concat(realRoot).sort();
console.log('REAL_PATHS:');
actualPaths.forEach((p) => console.log(p));
console.log('---');

const scriptText = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const match = scriptText.match(/const games = \[(.*?\n\];)/s);
if (!match) {
  console.error('ERROR: games array not found in script.js');
  process.exit(1);
}

const arrayText = match[1];
const entries = [];
let cur = [];
let brace = 0;
for (const line of arrayText.split(/\r?\n/)) {
  cur.push(line);
  brace += (line.match(/{/g) || []).length - (line.match(/}/g) || []).length;
  if (brace === 0 && cur.length) {
    let obj = cur.join('\n').trim();
    if (obj.endsWith(',')) obj = obj.slice(0, -1);
    entries.push(obj);
    cur = [];
  }
}

const scriptPaths = [];
for (const obj of entries) {
  const m = obj.match(/path:\s*"([^"]+)"/);
  const n = obj.match(/name:\s*"([^"]+)"/);
  if (m) scriptPaths.push([n ? n[1] : '', m[1]]);
}
console.log('SCRIPT_PATHS:');
scriptPaths.forEach(([name, path]) => console.log(path));
console.log('---');

const setActual = new Set(actualPaths);
const setScript = new Set(scriptPaths.map(([, path]) => path));
const missing = [...setActual].filter((p) => !setScript.has(p)).sort();
const extra = [...setScript].filter((p) => !setActual.has(p)).sort();

console.log('MISSING:', missing.length);
missing.forEach((p) => console.log(p));
console.log('EXTRA:', extra.length);
extra.forEach((p) => console.log(p));
