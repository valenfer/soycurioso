// Verificación editorial mínima del MVP.
// Comprueba que hay 10 curiosidades, imágenes locales y campos esenciales.
import { readdir, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const dir = join(root, 'src', 'content', 'curiosidades');
const files = (await readdir(dir)).filter((file) => file.endsWith('.md'));
if (files.length !== 10) throw new Error(`Se esperaban 10 curiosidades y hay ${files.length}`);
for (const file of files) {
  const text = await readFile(join(dir, file), 'utf8');
  for (const field of ['title:', 'summary:', 'category:', 'tags:', 'image:', 'sourceUrl:']) {
    if (!text.includes(field)) throw new Error(`${file} no contiene ${field}`);
  }
  const image = text.match(/image: "\/soycurioso\/images\/(.+?)"/)?.[1];
  if (!image) throw new Error(`${file} no declara imagen local`);
  await access(join(root, 'public', 'images', image));
}
console.log('verify-content: 10 curiosidades con metadatos e imágenes locales OK');
