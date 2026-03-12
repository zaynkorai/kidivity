const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Zod v4 ships as "type": "module" with ESM-only .js files.
// Metro doesn't fully support import.meta, so we need to
// prioritise the CJS entry (.cjs) for packages that use ESM.
config.resolver.sourceExts = [
    ...config.resolver.sourceExts.filter((ext) => ext !== "cjs"),
    "cjs",             // ensure .cjs is recognised
];

// Tell Metro to prefer the "require" (CJS) export condition
// over the default "import" (ESM) when resolving package.json
// "exports" maps.  This makes Zod (and any other dual-format
// package) resolve to its .cjs entry automatically.
config.resolver.unstable_conditionNames = [
    "require",
    "react-native",
    "default",
];

module.exports = config;
