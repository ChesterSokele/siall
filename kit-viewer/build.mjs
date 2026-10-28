// Bundles src/main.js (three.js + viewer) into ../assets/kit-viewer.js as one classic script.
// The mannequin .glb is inlined as a data URL so the page also works when opened from file://.
import { build, context } from 'esbuild';
const opts = {
  entryPoints: ['src/main.js'],
  bundle: true, minify: true, format: 'iife', target: 'es2019',
  outfile: '../assets/kit-viewer.js',
  loader: { '.bin': 'binary', '.png': 'dataurl' },
  legalComments: 'none',
  logLevel: 'info',
};
if (process.argv.includes('--watch')) { const ctx = await context(opts); await ctx.watch(); }
else await build(opts);
