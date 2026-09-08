#!/usr/bin/env node
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const root = process.cwd();
const dataPath = join(root, 'datos.json');
const out = join(root, 'publico');
const fail = (msg) => { console.error(`FAIL ${msg}`); process.exitCode = 1; };

if (!existsSync(dataPath)) fail('datos.json no existe en la raíz');
else {
  const data = JSON.parse(readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(data.curiosidades) || data.curiosidades.length < 30) fail('faltan curiosidades combinadas');
  if (!Array.isArray(data.enigmas) || data.enigmas.length < 3) fail('faltan enigmas');
  const titles = new Set(data.curiosidades.map((c) => c.titular));
  ['Australia declaró la guerra a unos pájaros y la perdió', 'El ordenador griego de hace más de 2.000 años'].forEach((title) => {
    if (!titles.has(title)) fail(`falta curiosidad esperada: ${title}`);
  });
  globalThis.__publicadas = data.curiosidades.filter((c) => c.fecha <= new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' })).length;
}

['publicar.mjs', 'estilo.css', 'LEEME.md'].forEach((file) => {
  if (!existsSync(join(root, file))) fail(`${file} no existe`);
});

const workflowPath = join(root, '.github', 'workflows', 'deploy.yml');
if (!existsSync(workflowPath)) fail('falta .github/workflows/deploy.yml');
else {
  const workflow = readFileSync(workflowPath, 'utf8');
  if (!workflow.includes('path: ./publico')) fail('el workflow no publica la carpeta publico/');
  if (workflow.includes('npm ci')) fail('el workflow todavía usa npm ci de la versión anterior');
  if (workflow.includes('path: ./dist')) fail('el workflow todavía sube dist/');
}

if (!existsSync(out)) fail('publico no existe; ejecuta node publicar.mjs');
else {
  ['index.html', 'feed.xml', 'sitemap.xml', 'robots.txt', 'estilo.css'].forEach((file) => {
    if (!existsSync(join(out, file))) fail(`publico/${file} no existe`);
  });
  const cDir = join(out, 'c');
  if (!existsSync(cDir)) fail('publico/c no existe');
  else if (readdirSync(cDir).filter((f) => f.endsWith('.html')).length !== globalThis.__publicadas) fail('el número de fichas generadas no coincide con las publicadas');
  const html = existsSync(join(out, 'index.html')) ? readFileSync(join(out, 'index.html'), 'utf8') : '';
  if (!html.includes('Soy<span>Curioso</span>')) fail('la portada no usa marca SoyCurioso');
  if (html.includes('sobremesa.example')) fail('quedan URLs de sobremesa.example');
  if (html.includes('SoyCurioso — curiosidades y enigmas diarios')) fail('queda el título viejo de la versión Astro');
  const css = readFileSync(join(out, 'estilo.css'), 'utf8');
  if (/\.barra__int\{[^}]*overflow-x\s*:\s*auto/.test(css)) fail('los filtros siguen usando barra horizontal');
  if (!/\.barra__int\{[^}]*flex-wrap\s*:\s*wrap/.test(css)) fail('los filtros no permiten salto de línea sin scroll');
  if (!css.includes('linear-gradient(135deg')) fail('los chips no tienen estilo colorido/dinámico');
  if (!readFileSync(dataPath, 'utf8').includes('Australia declaró la guerra a unos pájaros y la perdió')) fail('no se guardó la curiosidad programada de Australia');
}

try {
  const leftovers = execFileSync('git', ['grep', '-n', 'SoyCurioso — curiosidades y enigmas diarios', '--', 'src', 'publico', 'docs', 'public'], { cwd: root, encoding: 'utf8' }).trim();
  if (leftovers) fail(`queda portada Astro antigua: ${leftovers}`);
} catch (error) {
  if (error.status !== 1 && !String(error.message).includes('pathspec')) throw error;
}

if (process.exitCode) process.exit(process.exitCode);
console.log('OK verificación Sobremesa/SoyCurioso');
