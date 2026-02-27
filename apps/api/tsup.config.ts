import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs'],
    outDir: 'dist',
    bundle: true,
    // Bundle all @packages/* workspace deps inline instead of leaving them as
    // external references that point to raw .ts source files
    noExternal: [/@packages\/.*/],
    skipNodeModulesBundle: true, // Still exclude node_modules like express/cors
});
