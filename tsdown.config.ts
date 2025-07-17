import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    Nil: 'src/Nil.ts',
    Result: 'src/Result.ts',
  },
  platform: 'neutral',
  dts: true,
  format: ['cjs', 'esm'],
  exports: true,
});
