import { mkdir, writeFile } from 'node:fs/promises';

// Ensure Node treats the CommonJS build as CommonJS even though the package root is `"type": "module"`.
await mkdir('dist/cjs', { recursive: true });
await writeFile('dist/cjs/package.json', JSON.stringify({ type: 'commonjs' }, null, 2) + '\n', 'utf8');
