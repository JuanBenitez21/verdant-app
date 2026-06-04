const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// En pnpm monorepos los symlinks de node_modules apuntan al store del workspace
// root (../../node_modules/.pnpm/). Sin watchFolders, Metro no puede acceder
// a esos archivos porque están fuera del directorio del proyecto.
config.watchFolders = [
  path.resolve(__dirname, '../..'), // workspace root (verdant-app/)
];

// hermesc (RN 0.81.5) no soporta private class fields (#field) en bytecode.
// Este transformer los convierte a propiedades regulares (_field) antes de Babel.
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('./metro-private-fields-transformer'),
};

// @expo/dom-webview usa private class fields que hermesc no puede compilar.
// Verdant no usa DOM components, así que lo reemplazamos con un stub vacío.
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...config.resolver?.extraNodeModules,
    '@expo/dom-webview': path.resolve(__dirname, './stubs/dom-webview.js'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
