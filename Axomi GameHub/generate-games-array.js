const fs = require('fs');
const path = require('path');

const root = process.cwd();
const games = [];

function extractNameFromPath(p) {
  const normalized = p.replace(/\\/g, '/');
  if (normalized.includes('/')) {
    const parts = normalized.split('/');
    const file = parts.pop();
    if (file.toLowerCase() === 'index.html' || file.toLowerCase() === 'index.html') {
      return parts.pop();
    }
    return file.replace(/\.html$/i, '');
  }
  return normalized.replace(/\.html$/i, '');
}

function formatName(raw) {
  return raw.replace(/[-_]+/g, ' ').replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function collectGamePaths() {
  const paths = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
        let rel = path.relative(root, p).replace(/\\/g, '/');
        paths.push(rel);
      }
    }
  }
  walk(path.join(root, 'games'));
  return paths.sort((a, b) => {
    const na = formatName(extractNameFromPath(a));
    const nb = formatName(extractNameFromPath(b));
    return na.localeCompare(nb, undefined, { sensitivity: 'base' });
  });
}

const gamePaths = collectGamePaths();
const entries = gamePaths.map((p) => {
  const rawName = extractNameFromPath(p);
  const name = formatName(rawName);
  return {
    name,
    path: p,
    icon: '🎮',
    description: `Play ${name} in your browser.`,
    category: 'Arcade',
    duration: 'Play now',
    tags: ['arcade', 'browser', 'javascript'],
  };
});

const out = ['const games = ['];
for (const game of entries) {
  out.push('  {');
  out.push(`    name: "${game.name}",`);
  out.push(`    path: "${game.path}",`);
  out.push(`    icon: "${game.icon}",`);
  out.push(`    description: "${game.description}",`);
  out.push(`    category: "${game.category}",`);
  out.push(`    duration: "${game.duration}",`);
  out.push(`    tags: ${JSON.stringify(game.tags)},`);
  out.push('  },');
}
out.push('];');
console.log(out.join('\n'));