/**
 * Convierte private class fields (#field) a propiedades regulares (_field)
 * en todos los paquetes JavaScript del bundle que hermesc no puede compilar.
 *
 * El hermesc de RN 0.81.5 (HBC 96) no soporta private class fields en bytecode.
 * RN 0.81.5 los usa en src/private/, Libraries/, y otros paquetes del ecosistema.
 *
 * Se ejecuta como postinstall en cada `pnpm install` (local y EAS cloud builds).
 */

const fs = require('fs');
const path = require('path');

// Paquetes y subdirectorios a parchear
// Estas rutas son relativas a node_modules/<pkg>/
const TARGETS = [
  { pkg: 'react-native',               dirs: ['src/private', 'Libraries'] },
  { pkg: 'react-native-reanimated',    dirs: ['lib/module'] },
  { pkg: 'react-native-worklets',      dirs: ['lib/module'] },
  { pkg: '@tanstack/query-core',       dirs: ['build/modern'] },
];

// Detecta si un archivo tiene private class fields reales
// Debe tener:
//   - ".#identifier" (member access), O
//   - una línea que empieza con 2+ espacios y luego "#identifier" y luego ; : =
function hasPrivateFields(src) {
  if (!src.includes('#')) return false;
  return /\.#[a-zA-Z_]/.test(src) ||
    /(?:^|\n)[ \t]{2,}#[a-zA-Z_][a-zA-Z0-9_]*\s*[;:=]/.test(src);
}

// Parcha el contenido de forma segura
function patch(src) {
  return src
    // Member access: "this.#field" → "this._field"
    .replace(/\.#([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, n) => `._${n}`)
    // Field declaration en class body: "  #field: Type;" → "  _field;"
    // (cubre también "  #field = val;" y "  #field;")
    .replace(/((?:^|\n)([ \t]{2,}))#([a-zA-Z_][a-zA-Z0-9_]*)(\s*[;:=])/g,
      (_, prefix, _sp, name, suffix) => `${prefix}_${name}${suffix}`);
}

function processFile(filePath, stats) {
  let src;
  try { src = fs.readFileSync(filePath, 'utf8'); }
  catch { return; }

  if (!hasPrivateFields(src)) return;

  const patched = patch(src);
  if (patched === src) return;

  // Romper el hard-link del store antes de escribir
  try {
    fs.unlinkSync(filePath);
    fs.writeFileSync(filePath, patched, 'utf8');
    stats.patched++;
  } catch { /* archivo de solo lectura o sin permisos */ }
}

function processDir(dir, stats) {
  if (!fs.existsSync(dir)) return;
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return; }

  for (const e of entries) {
    if (e.name === '__tests__' || e.name === 'android' || e.name === 'ios') continue;
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory()) {
      processDir(fullPath, stats);
    } else if (e.isFile() && e.name.endsWith('.js') && !e.name.endsWith('.map')) {
      processFile(fullPath, stats);
    }
  }
}

function findPkgInStore(pkgName, store) {
  const prefix = pkgName.startsWith('@')
    ? pkgName.replace('/', '+').replace('@', '') + '@'
    : pkgName + '@';

  const found = new Set();
  let entries;
  try { entries = fs.readdirSync(store); }
  catch { return []; }

  for (const entry of entries) {
    if (!entry.startsWith(prefix)) continue;
    const nodeModules = path.join(store, entry, 'node_modules');
    const pkgPath = path.join(nodeModules, pkgName);
    if (fs.existsSync(pkgPath)) {
      try {
        const real = fs.realpathSync(pkgPath);
        found.add(real);
      } catch {
        found.add(pkgPath);
      }
    }
  }
  return [...found];
}

const store = path.join(__dirname, '..', 'node_modules', '.pnpm');
if (!fs.existsSync(store)) {
  console.log('[patch-rn] pnpm store no encontrado, omitiendo.');
  process.exit(0);
}

const stats = { patched: 0 };

for (const { pkg, dirs } of TARGETS) {
  const pkgPaths = findPkgInStore(pkg, store);
  for (const pkgPath of pkgPaths) {
    for (const dir of dirs) {
      processDir(path.join(pkgPath, dir), stats);
    }
  }
}

if (stats.patched === 0) {
  console.log('[patch-rn] Sin private class fields pendientes.');
} else {
  console.log(`[patch-rn] ${stats.patched} archivo(s) parcheado(s).`);
}
