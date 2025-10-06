"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tsup_1 = require("tsup");
exports.default = (0, tsup_1.defineConfig)({
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: true,
    sourcemap: true,
    target: 'es2022',
    platform: 'node',
    bundle: true,
    splitting: false,
    minify: false,
    external: ['node:*']
});
//# sourceMappingURL=tsup.config.js.map