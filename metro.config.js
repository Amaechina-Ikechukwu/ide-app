const { getDefaultConfig } = require('@expo/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Add TypeScript extensions
defaultConfig.resolver.sourceExts.push('ts', 'tsx', 'cjs');

// Ensure TypeScript files are transformed properly
defaultConfig.transformer.babelTransformerPath = require.resolve('@expo/metro-config/babel-transformer');

// This is the new line you should add in, after the previous lines
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;