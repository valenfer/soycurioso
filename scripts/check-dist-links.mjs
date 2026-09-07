// Revisión simple del build estático.
// Detecta referencias internas básicas que deberían existir antes de publicar.
import { access, readFile } from 'node:fs/promises';
import { join } from 'node:path';
const root = process.cwd();
const index = await readFile(join(root, 'dist', 'index.html'), 'utf8');
for (const marker of ['SoyCurioso', '/soycurioso/curiosidades/', '/soycurioso/enigmas/', 'Curiosidad diaria']) {
  if (!index.includes(marker)) throw new Error(`No aparece el marcador ${marker}`);
}
await access(join(root, 'dist', 'curiosidades', 'cielo-azul', 'index.html'));
await access(join(root, 'dist', 'enigmas', 'index.html'));
console.log('check-dist-links: build estático con rutas principales OK');
