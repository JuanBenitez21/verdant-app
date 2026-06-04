/**
 * Metro transformer personalizado: convierte private class fields (#field → _field)
 * antes de que Babel/hermesc los procesen.
 *
 * El hermesc de RN 0.81.5 (HBC 96) no soporta compilar private class fields a bytecode.
 * React Native 0.81.5 los usa en src/private/ y el bundle falla al compilar.
 */

const path = require('path');
const fs = require('fs');

// En pnpm monorepos, @expo/metro-config no está en apps/mobile/node_modules directamente.
// Lo resolvemos siguiendo el symlink de expo hasta el pnpm store, donde es sibling de expo.
const expoRealDir = path.dirname(fs.realpathSync(require.resolve('expo/package.json')));
const upstreamTransformer = require(
  path.join(expoRealDir, '..', '@expo', 'metro-config', 'build', 'babel-transformer')
);

// Detecta archivos que tienen private class fields reales (no solo "#" en strings/urls)
const HAS_PRIVATE_FIELD = /\.#[a-zA-Z_]|(?:[\n\r][ \t]{2,})#[a-zA-Z_]/;

function patchPrivateFields(src) {
  return src
    // Field declarations: "  #name: Type;" o "  #name = val;" con indentación
    .replace(/([\n\r])([ \t]{2,})#([a-zA-Z_][a-zA-Z0-9_]*)(\s*[;:=])/g,
      (_, nl, indent, name, suffix) => `${nl}${indent}_${name}${suffix}`)
    // Member access: "this.#name" o "obj.#name"
    .replace(/\.#([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, name) => `._${name}`)
    // Remaining: "in #name", "(#name", " #name,"
    .replace(/([ \t(,!])#([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, pre, name) => `${pre}_${name}`);
}

module.exports = {
  ...upstreamTransformer,
  transform(config) {
    const src = config.src;
    if (typeof src === 'string' && HAS_PRIVATE_FIELD.test(src)) {
      return upstreamTransformer.transform({ ...config, src: patchPrivateFields(src) });
    }
    return upstreamTransformer.transform(config);
  },
};
