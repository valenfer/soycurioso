#!/usr/bin/env node
/**
 * SoyCurioso — generador del sitio.
 *
 *   node publicar.mjs          Genera la web entera en /publico
 *   node publicar.mjs local    Igual, pero con el CSS incrustado para abrirlo con doble clic
 *   node publicar.mjs nueva    Añade una curiosidad en blanco a datos.json con la próxima fecha libre
 *
 * Regla editorial: se publica lo que tenga fecha de hoy o anterior.
 * Lo que tenga fecha futura queda programado y no aparece.
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = dirname(fileURLToPath(import.meta.url));
const SALIDA = join(RAIZ, 'publico');

/* ======================= CONFIGURACIÓN ======================= */
const SITIO = {
  nombre: 'SoyCurioso',
  url: 'https://valenfer.github.io/soycurioso',           // cámbialo por tu dominio
  lema: 'Una ración diaria de conocimiento que no cabe en una conversación normal.',
  hora: '8:00',
  desde: 2026,
  correo: 'hola@soycurioso.example',
  endpointSuscripcion: '',                    // p. ej. 'https://buttondown.com/api/emails/embed-subscribe/tunombre'
  zona: 'Europe/Madrid'                       // el día se decide con esta hora, no con la del servidor
};

const SECCIONES = {
  ciencia: 'Ciencia al límite',
  tecnologia: 'Tecnología extrema',
  filosofia: 'Filosofía radical',
  historia: 'La cara oculta de la historia',
  citas: 'Citas que rompen la mesa',
  logica: 'Lógica y escape room',
  psicologia: 'Psicología radical',
  antropologia: 'Antropología desquiciante'
};

const MAX_EN_PORTADA = 12;   // cuántas curiosidades acompañan al plato del día

const MODO_LOCAL = process.argv[2] === 'local';
const CSS_EN_LINEA = MODO_LOCAL ? readFileSync(join(RAIZ, 'estilo.css'), 'utf8') : '';

/* ======================= UTILIDADES ======================= */
const hoyISO = () => new Date().toLocaleDateString('sv-SE', { timeZone: SITIO.zona });

const esc = s => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const slug = s => String(s).toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);

const fechaLarga = iso => {
  const [a, m, d] = iso.split('-').map(Number);
  const txt = new Date(Date.UTC(a, m - 1, d)).toLocaleDateString('es-ES',
    { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  return txt.charAt(0).toUpperCase() + txt.slice(1);
};

const numeroEdicion = iso => {
  const inicio = Date.UTC(SITIO.desde, 0, 1);
  const [a, m, d] = iso.split('-').map(Number);
  return Math.floor((Date.UTC(a, m - 1, d) - inicio) / 86400000) + 1;
};

/* ======================= AZULEJOS (ilustraciones) ======================= */
const AZUL = '#1449A8', HONDO = '#0D2B63', ROJO = '#C4362B', LOZA = '#FBFAF5';

const MOTIVOS = {
  ciencia: `<g fill="none" stroke="${AZUL}" stroke-width="7" stroke-linecap="round">
      <ellipse cx="200" cy="130" rx="112" ry="44"/>
      <ellipse cx="200" cy="130" rx="112" ry="44" transform="rotate(60 200 130)"/>
      <ellipse cx="200" cy="130" rx="112" ry="44" transform="rotate(-60 200 130)"/>
    </g><circle cx="200" cy="130" r="19" fill="${ROJO}"/>
    <path d="M200 44c-16 22-26 36-26 48a26 26 0 0 0 52 0c0-12-10-26-26-48z" fill="${HONDO}"/>`,
  tecnologia: `<g fill="none" stroke="${AZUL}" stroke-width="8" stroke-linecap="round">
      <path d="M96 214a150 150 0 0 1 150-150"/><path d="M96 214a108 108 0 0 1 108-108"/>
      <path d="M96 214a66 66 0 0 1 66-66"/></g>
    <circle cx="96" cy="214" r="16" fill="${ROJO}"/>
    <g stroke="${HONDO}" stroke-width="7" fill="none"><rect x="264" y="46" width="72" height="48"/>
    <path d="M300 94v34M276 128h48"/></g>`,
  filosofia: `<path d="M60 130c0-46 63-82 140-82s140 36 140 82-63 82-140 82S60 176 60 130z" fill="none" stroke="${AZUL}" stroke-width="8"/>
    <circle cx="200" cy="130" r="46" fill="${HONDO}"/><circle cx="200" cy="130" r="17" fill="${LOZA}"/>
    <path d="M200 96a34 34 0 1 1-31 48" fill="none" stroke="${ROJO}" stroke-width="6"/>`,
  historia: `<rect x="92" y="34" width="216" height="192" fill="none" stroke="${AZUL}" stroke-width="8"/>
    <g fill="${HONDO}"><rect x="118" y="70" width="120" height="15"/><rect x="118" y="102" width="164" height="15"/>
    <rect x="118" y="134" width="88" height="15"/><rect x="118" y="166" width="140" height="15"/></g>
    <g transform="rotate(-14 262 178)"><circle cx="262" cy="178" r="46" fill="none" stroke="${ROJO}" stroke-width="8"/>
    <circle cx="262" cy="178" r="30" fill="none" stroke="${ROJO}" stroke-width="5"/></g>`,
  citas: `<g fill="${AZUL}"><path d="M92 66h68v66c0 40-24 66-62 74v-26c20-6 30-20 30-40H92z"/>
    <path d="M186 66h68v66c0 40-24 66-62 74v-26c20-6 30-20 30-40h-36z"/></g>
    <rect x="92" y="228" width="216" height="10" fill="${ROJO}"/>`,
  logica: `<g fill="none" stroke="${AZUL}" stroke-width="9" stroke-linecap="square">
      <path d="M70 40h260v180H70z"/><path d="M70 96h150M330 96H260M120 40v56M120 152h210M180 220v-68M240 96v56"/>
    </g><circle cx="96" cy="66" r="13" fill="${ROJO}"/><circle cx="300" cy="192" r="13" fill="${HONDO}"/>`,
  psicologia: `<path d="M118 232V166c-16-12-26-32-26-56 0-52 44-84 96-84s94 34 94 82c0 30-18 48-40 60v64" fill="none" stroke="${AZUL}" stroke-width="8"/>
    <path d="M188 138a26 26 0 1 1 24-30 46 46 0 1 0-52 54" fill="none" stroke="${ROJO}" stroke-width="7"/>`,
  antropologia: `<path d="M200 34c62 0 104 42 104 96 0 34-16 56-34 70v42h-140v-42c-18-14-34-36-34-70 0-54 42-96 104-96z" fill="none" stroke="${AZUL}" stroke-width="8"/>
    <ellipse cx="160" cy="126" rx="24" ry="30" fill="${HONDO}"/><ellipse cx="240" cy="126" rx="24" ry="30" fill="${HONDO}"/>
    <path d="M186 176h28l-14 26z" fill="${ROJO}"/>
    <g stroke="${AZUL}" stroke-width="7"><path d="M164 226v16M200 226v16M236 226v16"/></g>`
};

let contadorSvg = 0;
function azulejo(cat, alt = '') {
  const n = ++contadorSvg;
  return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(alt)}">
  <defs><pattern id="cr${n}" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill="${AZUL}" opacity=".2"/></pattern></defs>
  <rect width="400" height="260" fill="#fff"/><rect width="400" height="260" fill="url(#cr${n})"/>
  ${MOTIVOS[cat] || MOTIVOS.ciencia}
  <g fill="none" stroke="${AZUL}" stroke-width="5" opacity=".65">
    <path d="M0 26A26 26 0 0 0 26 0"/><path d="M400 26A26 26 0 0 1 374 0"/>
    <path d="M0 234A26 26 0 0 1 26 260"/><path d="M400 234A26 26 0 0 0 374 260"/>
    <rect x="8" y="8" width="384" height="244"/></g>
</svg>`;
}


const temaVisual = d => {
  const t = `${d.titular} ${d.entradilla} ${(d.cuerpo || []).join(' ')}`.toLowerCase();
  const reglas = [
    ['aves', /(em[uú]|p[aá]jar|ave|animal|caracol|pulpo|axolote|gusano)/],
    ['espacio', /(nasa|voyager|estrella|galaxia|v[ií]a l[aá]ctea|planeta|agujero negro|gps|sat[eé]lite)/],
    ['religion', /(papa|cad[aá]ver|formoso|iglesia|bas[ií]lica|bendici[oó]n)/],
    ['mente', /(cerebro|paciente|cotard|capgras|psicolog|recuerdo|muerto|anestesia)/],
    ['tiempo', /(tiempo|reloj|gota|brea|minuto|segundo|a[yñ]o|envejece)/],
    ['guerra', /(guerra|submarino|torpedo|nuclear|ej[eé]rcito|ametralladora|misiles)/],
    ['filosofia', /(nietzsche|russell|occam|abismo|filosof|moral|l[oó]gica)/],
    ['ritual', /(funeral|kuru|prion|pap[uú]a|fore|mutaci[oó]n|adn)/],
    ['mecanica', /(anticitera|engranaje|ordenador|bronce|m[aá]quina|tecnolog)/]
  ];
  return (reglas.find(([, rx]) => rx.test(t)) || [d.cat, null])[0];
};

const MOTIVOS_RELACIONADOS = {
  aves: `<path d="M96 178c34-70 88-98 146-88 38 7 63 31 75 64" fill="none" stroke="${AZUL}" stroke-width="8" stroke-linecap="round"/>
    <path d="M135 185c36 18 96 17 137-10 22-15 34-36 34-64" fill="${LOZA}" stroke="${HONDO}" stroke-width="7"/>
    <circle cx="282" cy="105" r="8" fill="${ROJO}"/><path d="M303 113l38 13-36 13z" fill="${ROJO}"/>
    <path d="M170 191l-24 42M222 190l-13 43" stroke="${HONDO}" stroke-width="7" stroke-linecap="round"/>
    <path d="M72 218c58-18 105-20 154-8" stroke="${ROJO}" stroke-width="6" stroke-linecap="round"/>`,
  espacio: `<circle cx="276" cy="76" r="18" fill="${ROJO}"/><circle cx="98" cy="70" r="4" fill="${AZUL}"/><circle cx="335" cy="166" r="5" fill="${AZUL}"/>
    <path d="M78 204c78-100 168-117 244-84" fill="none" stroke="${AZUL}" stroke-width="7" stroke-linecap="round"/>
    <path d="M116 198l58-34 22 38-80 27z" fill="${HONDO}"/>
    <path d="M184 167l94-64" stroke="${ROJO}" stroke-width="5" stroke-dasharray="10 9" stroke-linecap="round"/>
    <path d="M230 205a72 72 0 0 1 72-72" fill="none" stroke="${AZUL}" stroke-width="9"/>`,
  religion: `<path d="M200 43v168" stroke="${HONDO}" stroke-width="11" stroke-linecap="round"/><path d="M150 92h100" stroke="${HONDO}" stroke-width="11" stroke-linecap="round"/>
    <rect x="104" y="142" width="192" height="72" fill="${LOZA}" stroke="${AZUL}" stroke-width="7"/>
    <circle cx="200" cy="180" r="28" fill="none" stroke="${ROJO}" stroke-width="7"/>
    <path d="M126 226h148" stroke="${HONDO}" stroke-width="8" stroke-linecap="round"/>`,
  mente: `<path d="M124 218V156c-22-18-31-52-18-82 18-42 75-55 112-29 28-18 72-6 82 31 35 12 43 61 12 87v55" fill="none" stroke="${AZUL}" stroke-width="8"/>
    <path d="M144 119c30-6 49 7 56 28 16-23 42-28 69-13" fill="none" stroke="${HONDO}" stroke-width="7" stroke-linecap="round"/>
    <path d="M152 184h96M186 214h68" stroke="${ROJO}" stroke-width="7" stroke-linecap="round"/>`,
  tiempo: `<circle cx="200" cy="139" r="78" fill="${LOZA}" stroke="${AZUL}" stroke-width="8"/><path d="M200 139V90M200 139l42 24" stroke="${HONDO}" stroke-width="8" stroke-linecap="round"/>
    <path d="M200 35c-18 23-28 39-28 54a28 28 0 0 0 56 0c0-15-10-31-28-54z" fill="${ROJO}"/>
    <path d="M134 226h132" stroke="${HONDO}" stroke-width="8" stroke-linecap="round"/>`,
  guerra: `<path d="M65 178h202c40 0 59-24 68-50H125c-32 0-53 18-60 50z" fill="${LOZA}" stroke="${AZUL}" stroke-width="8"/>
    <path d="M114 128l-20-42h72l18 42" fill="${HONDO}"/><circle cx="145" cy="181" r="12" fill="${ROJO}"/>
    <path d="M288 98l44-24M292 122l56 0M286 146l45 25" stroke="${ROJO}" stroke-width="6" stroke-linecap="round"/>`,
  filosofia: `<path d="M64 130c62-75 210-75 272 0-62 75-210 75-272 0z" fill="${LOZA}" stroke="${AZUL}" stroke-width="8"/>
    <circle cx="200" cy="130" r="42" fill="${HONDO}"/><circle cx="200" cy="130" r="14" fill="${LOZA}"/>
    <path d="M80 216h240" stroke="${ROJO}" stroke-width="8" stroke-linecap="round"/><path d="M126 216c32-46 68-66 108-61" stroke="${HONDO}" stroke-width="6" stroke-linecap="round"/>`,
  ritual: `<path d="M200 42c58 0 98 40 98 91 0 30-14 52-34 67v32H136v-32c-20-15-34-37-34-67 0-51 40-91 98-91z" fill="${LOZA}" stroke="${AZUL}" stroke-width="8"/>
    <circle cx="164" cy="130" r="22" fill="${HONDO}"/><circle cx="236" cy="130" r="22" fill="${HONDO}"/>
    <path d="M187 174h26l-13 24z" fill="${ROJO}"/><path d="M124 74c32 18 66 18 104 0" stroke="${ROJO}" stroke-width="6" fill="none"/>`,
  mecanica: `<circle cx="154" cy="124" r="58" fill="none" stroke="${AZUL}" stroke-width="10"/><circle cx="248" cy="150" r="42" fill="none" stroke="${HONDO}" stroke-width="9"/>
    <circle cx="154" cy="124" r="14" fill="${ROJO}"/><circle cx="248" cy="150" r="10" fill="${ROJO}"/>
    <path d="M154 57v32M154 159v32M87 124h32M189 124h32M248 103v24M248 173v25M206 150h24M266 150h35" stroke="${AZUL}" stroke-width="7" stroke-linecap="round"/>`
};

function ilustracionSvg(d) {
  const tema = temaVisual(d);
  const motivo = MOTIVOS_RELACIONADOS[tema] || MOTIVOS[d.cat] || MOTIVOS.ciencia;
  const etiqueta = esc((SECCIONES[d.cat] || tema).toUpperCase());
  return `<svg viewBox="0 0 400 260" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(d.titular)}">
  <defs><pattern id="fondo" width="14" height="14" patternUnits="userSpaceOnUse"><circle cx="7" cy="7" r="1.5" fill="${AZUL}" opacity=".16"/></pattern></defs>
  <rect width="400" height="260" fill="#fff"/><rect width="400" height="260" fill="url(#fondo)"/>
  <rect x="16" y="16" width="368" height="228" rx="22" fill="none" stroke="${AZUL}" stroke-width="5" opacity=".55"/>
  ${motivo}
  <rect x="22" y="22" rx="12" width="150" height="30" fill="${ROJO}"/><text x="36" y="43" font-family="Karla, Arial, sans-serif" font-size="13" font-weight="800" fill="${LOZA}">${etiqueta.slice(0, 18)}</text>
</svg>`;
}

const rutaImagen = (d, ruta = '') => d.imagen ? `${ruta}${d.imagen}` : `${ruta}img/${d.slug}.svg`;
const imagenHTML = (d, ruta = '') => `<img class="ilustracion" src="${rutaImagen(d, ruta)}" alt="Ilustración de ${esc(d.titular)}" loading="lazy">`;

function aceitunas(n) {
  let s = '';
  for (let i = 1; i <= 5; i++) {
    const lleno = i <= n;
    s += `<svg class="aceituna" viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="9" ry="11" fill="${lleno ? '#5C7A33' : 'none'}" stroke="#5C7A33" stroke-width="2.5"/>${lleno ? '<ellipse cx="12" cy="12" rx="3.2" ry="4.4" fill="#C4362B"/>' : ''}</svg>`;
  }
  return `<span class="aceitunas" title="Nivel de cuñado: ${n} de 5">${s}</span>`;
}

/* ======================= TROZOS DE PÁGINA ======================= */
const cabezaHTML = ({ titulo, descripcion, ruta, canonica }) => `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${SITIO.url}${canonica}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(SITIO.nombre)}">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${SITIO.url}${canonica}">
<meta name="twitter:card" content="summary_large_image">
<link rel="alternate" type="application/rss+xml" title="${esc(SITIO.nombre)}" href="${SITIO.url}/feed.xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Karla:wght@400;600;800&family=Caveat:wght@600;700&display=swap" rel="stylesheet">
${CSS_EN_LINEA ? `<style>\n${CSS_EN_LINEA}\n</style>` : `<link rel="stylesheet" href="${ruta}estilo.css">`}
</head>
<body>`;

const suscripcionHTML = () => `
<section class="reserva" id="reserva">
  <div>
    <h2>Reserva mesa fija</h2>
    <p>Cada mañana te mandamos la curiosidad del día por correo. Un email, un dato, cero relleno.
    Y los domingos, el enigma con la solución de la semana.</p>
  </div>
  <div>
    <form id="formEmail" novalidate${SITIO.endpointSuscripcion ? ` action="${SITIO.endpointSuscripcion}" method="post"` : ''}>
      <input id="email" name="email" type="email" placeholder="tu@correo.com" aria-label="Tu correo electrónico" autocomplete="email">
      <button type="submit">Apuntarme</button>
    </form>
    <p class="aviso" id="avisoEmail" role="status"></p>
  </div>
</section>`;

const pieHTML = (ruta, cuenta) => `
<footer class="pie">
  <div class="envoltorio pie__cols">
    <div>
      <h2 style="font-size:1.8rem;margin-bottom:12px">${esc(SITIO.nombre)}</h2>
      <p style="max-width:46ch;margin:0 0 14px">Publicamos una curiosidad al día desde ${SITIO.desde}. Sin titulares inflados y sin datos que se caigan al primer intento de verificarlos: cada ficha lleva su fuente.</p>
      <p style="margin:0;font-size:.9rem">
        <a href="${ruta}#reserva">Suscribirse</a> ·
        <a href="${ruta}feed.xml">RSS</a> ·
        <a href="mailto:${SITIO.correo}">Proponer una curiosidad</a>
      </p>
    </div>
    ${cuenta ? `<div class="ticket">
      <h3>La cuenta de hoy</h3>
      <div><span>Curiosidades servidas</span><span>${cuenta.n}</span></div>
      <div><span>Enigma de la casa</span><span>${cuenta.enigma}</span></div>
      <div><span>Tiempo total de lectura</span><span>${cuenta.min} min</span></div>
      <div><span>Precio</span><span>0,00 €</span></div>
      <p style="margin:14px 0 0;font-family:'Caveat',cursive;font-size:1.35rem">¡Gracias por su visita!</p>
    </div>` : '<div></div>'}
  </div>
</footer>`;

const guionSuscripcion = `
var f = document.getElementById('formEmail');
if (f) f.addEventListener('submit', function(e){
  var email = document.getElementById('email').value.trim();
  var aviso = document.getElementById('avisoEmail');
  var ok = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(email);
  if (!ok){ e.preventDefault(); aviso.className='aviso mal';
    aviso.textContent='Ese correo no parece completo. Revisa que tenga arroba y dominio.'; return; }
  if (!f.getAttribute('action')){ e.preventDefault(); f.reset(); }
  aviso.className='aviso bien';
  aviso.textContent='Mesa reservada. Mañana a las ${SITIO.hora} tienes la primera curiosidad en ' + email + '.';
});`;

/* ======================= PORTADA ======================= */
function portada(hero, resto, enigma, hoy) {
  const cats = Object.keys(SECCIONES).filter(c => resto.some(d => d.cat === c));

  const piezas = resto.map((d, i) => `
    <a class="pieza" href="c/${d.slug}.html" data-cat="${d.cat}" style="animation-delay:${Math.min(i * 45, 450)}ms">
      <div class="pieza__lamina">${imagenHTML(d)}</div>
      <div class="pieza__txt">
        <p class="pieza__seccion">${esc(SECCIONES[d.cat])}</p>
        <h3>${esc(d.titular)}</h3>
        <p>${esc(d.entradilla)}</p>
        <div class="pieza__pie">${aceitunas(d.nivel)}<span class="pieza__enlace">Leer el desarrollo</span></div>
      </div>
    </a>`).join('');

  const chips = ['todo', ...cats].map(c =>
    `<button class="chip" type="button" data-filtro="${c}" aria-pressed="${c === 'todo'}">${c === 'todo' ? 'Toda la carta' : esc(SECCIONES[c])}</button>`
  ).join('');

  return `${cabezaHTML({
    titulo: `${SITIO.nombre} · ${hero.titular}`,
    descripcion: hero.entradilla,
    ruta: '', canonica: '/'
  })}

<header class="cabecera">
  <div class="envoltorio">
    <div class="rotulo">
      <h1 class="marca">Soy<span>Curioso</span></h1>
      <p class="lema">${esc(SITIO.lema)}</p>
    </div>
    <p class="pizarrita">
      <span>${fechaLarga(hoy)}</span>
      <span>Menú nº <b>${numeroEdicion(hoy)}</b></span>
      <span>Se sirve todos los días a las <b>${SITIO.hora}</b></span>
    </p>
  </div>
</header>

<article class="carta">
  <div class="carta__cinta"><span>El plato del día</span><span>${esc(SECCIONES[hero.cat])}</span></div>
  <div class="carta__cuerpo">
    <div class="carta__lamina">${imagenHTML(hero)}</div>
    <div class="carta__texto">
      <p class="carta__seccion">${esc(SECCIONES[hero.cat])}</p>
      <h2>${esc(hero.titular)}</h2>
      <p>${esc(hero.entradilla)}</p>
      <div class="medida"><span>Nivel de cuñado:</span>${aceitunas(hero.nivel)}</div>
      <a class="boton" href="c/${hero.slug}.html">Leer el desarrollo</a>
      <a class="boton boton--azul" href="#" id="sorprendeme">Ponme otra cosa</a>
    </div>
  </div>
</article>

<nav class="barra" aria-label="Secciones de la carta">
  <div class="envoltorio barra__int" id="filtros">${chips}</div>
</nav>

<main class="envoltorio">
  <section class="muro">
    <div class="muro__titulo">
      <h2>La carta de hoy</h2>
      <p id="contador" style="margin:0;font-weight:600">${resto.length} raciones en la carta</p>
    </div>
    <div class="rejilla" id="rejilla">${piezas}
    </div>
  </section>

  ${enigma ? `<section class="pizarra" id="enigma">
    <h2>${esc(enigma.titulo || 'El enigma de la barra')}</h2>
    <p class="pizarra__reto">${esc(enigma.reto)}</p>
    <form id="formEnigma">
      <input id="respuesta" type="text" placeholder="tu respuesta" aria-label="Tu respuesta al enigma" autocomplete="off">
      <button class="boton boton--fino" type="submit">Comprobar</button>
    </form>
    <p class="veredicto" id="veredicto" role="status"></p>
    <button class="pista" id="botonPista">Necesito una pista</button>
    <p class="pista__txt" id="textoPista" hidden>${esc(enigma.pista)}</p>
  </section>` : ''}

  ${suscripcionHTML()}
</main>

${pieHTML('', { n: resto.length + 1, enigma: enigma ? 1 : 0, min: [hero, ...resto].reduce((s, d) => s + (d.min || 3), 0) })}

<script>
(function(){
  /* Filtros de la carta */
  var piezas = [].slice.call(document.querySelectorAll('.pieza'));
  var contador = document.getElementById('contador');
  document.getElementById('filtros').addEventListener('click', function(e){
    var b = e.target.closest('.chip'); if (!b) return;
    var f = b.dataset.filtro, n = 0;
    [].forEach.call(this.children, function(x){ x.setAttribute('aria-pressed', x === b); });
    piezas.forEach(function(p){
      var ver = (f === 'todo' || p.dataset.cat === f);
      p.hidden = !ver; if (ver) n++;
    });
    contador.textContent = n === 1 ? 'Queda 1 ración en la carta' : n + ' raciones en la carta';
  });

  /* Ponme otra cosa */
  document.getElementById('sorprendeme').addEventListener('click', function(e){
    e.preventDefault();
    var vis = piezas.filter(function(p){ return !p.hidden; });
    if (vis.length) window.location.href = vis[Math.floor(Math.random()*vis.length)].getAttribute('href');
  });

  /* Enigma */
  var fe = document.getElementById('formEnigma');
  if (fe) {
    var VALIDAS = ${JSON.stringify((enigma?.respuestas || []).map(r => r.toLowerCase()))};
    var SOL = ${JSON.stringify(enigma?.solucion || '')};
    fe.addEventListener('submit', function(e){
      e.preventDefault();
      var v = document.getElementById('respuesta').value.trim().toLowerCase()
                .normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');
      var out = document.getElementById('veredicto');
      if (!v) { out.textContent = 'Escribe algo y lo miramos.'; return; }
      out.textContent = VALIDAS.indexOf(v) !== -1
        ? '¡Exacto! ' + SOL
        : 'No es esa. Vuelve a leer el enunciado, hay una palabra que sobra en tu razonamiento.';
    });
    document.getElementById('botonPista').addEventListener('click', function(){
      var p = document.getElementById('textoPista');
      p.hidden = !p.hidden;
      this.textContent = p.hidden ? 'Necesito una pista' : 'Esconder la pista';
    });
  }
${guionSuscripcion}
})();
</script>
</body>
</html>`;
}

/* ======================= FICHA ======================= */
function ficha(d, siguiente) {
  return `${cabezaHTML({
    titulo: `${d.titular} · ${SITIO.nombre}`,
    descripcion: d.entradilla,
    ruta: '../', canonica: `/c/${d.slug}.html`
  })}

<header class="cabecera cabecera--baja">
  <div class="envoltorio">
    <a class="marca marca--chica" href="../">Soy<span>Curioso</span></a>
    <p class="pizarrita" style="margin-top:8px"><span>${fechaLarga(d.fecha)}</span><span>${esc(SECCIONES[d.cat])}</span></p>
  </div>
</header>

<main class="envoltorio">
  <article class="ficha">
    <div class="ficha__cinta"><span>${esc(SECCIONES[d.cat])}</span><span>Se lee en ${d.min || 3} minutos</span></div>
    <div class="ficha__cuerpo">
      <div class="ficha__lamina">${imagenHTML(d, '../')}</div>
      <h1>${esc(d.titular)}</h1>
      <p class="ficha__entradilla">${esc(d.entradilla)}</p>
      ${d.cuerpo.map(p => `<p>${esc(p)}</p>`).join('\n      ')}
      <div class="medida" style="margin-top:26px"><span>Nivel de cuñado:</span>${aceitunas(d.nivel)}</div>
      <div class="ficha__pie">
        <p class="fuente">Fuente: ${esc(d.fuente)}</p>
        <button class="boton boton--fino" id="copiar" type="button">Guardarme el dato</button>
        <a class="boton boton--fino boton--azul" href="../">Volver a la carta</a>
      </div>
    </div>
  </article>

  ${siguiente ? `<a class="siguiente" href="${siguiente.slug}.html">
    <span>La siguiente ración</span>
    <strong>${esc(siguiente.titular)}</strong>
  </a>` : ''}

  ${suscripcionHTML()}
</main>

${pieHTML('../', null)}

<script>
(function(){
  var b = document.getElementById('copiar');
  b.addEventListener('click', function(){
    var t = ${JSON.stringify(`${d.titular}\n\n${d.entradilla}\n\n(${d.fuente}) — vía ${SITIO.nombre}`)};
    if (navigator.clipboard) {
      navigator.clipboard.writeText(t).then(
        function(){ b.textContent = 'Copiado, ya es tuyo'; },
        function(){ b.textContent = 'No se ha podido copiar'; });
    } else { b.textContent = 'No se ha podido copiar'; }
  });
${guionSuscripcion}
})();
</script>
</body>
</html>`;
}

/* ======================= FEED Y SITEMAP ======================= */
function feed(items) {
  const rfc = iso => new Date(iso + 'T06:00:00Z').toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(SITIO.nombre)}</title>
<link>${SITIO.url}/</link>
<description>${esc(SITIO.lema)}</description>
<language>es</language>
${items.map(d => `<item>
  <title>${esc(d.titular)}</title>
  <link>${SITIO.url}/c/${d.slug}.html</link>
  <guid>${SITIO.url}/c/${d.slug}.html</guid>
  <pubDate>${rfc(d.fecha)}</pubDate>
  <category>${esc(SECCIONES[d.cat])}</category>
  <description>${esc(d.entradilla)}</description>
</item>`).join('\n')}
</channel></rss>`;
}

const sitemap = items => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url><loc>${SITIO.url}/</loc><changefreq>daily</changefreq></url>
${items.map(d => `<url><loc>${SITIO.url}/c/${d.slug}.html</loc><lastmod>${d.fecha}</lastmod></url>`).join('\n')}
</urlset>`;

/* ======================= COMANDO: nueva ======================= */
function nuevaEntrada() {
  const ruta = join(RAIZ, 'datos.json');
  const datos = JSON.parse(readFileSync(ruta, 'utf8'));
  const ultima = datos.curiosidades.map(c => c.fecha).sort().pop() || hoyISO();
  const d = new Date(ultima + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + 1);
  const fecha = d.toISOString().slice(0, 10);

  datos.curiosidades.unshift({
    fecha, cat: 'ciencia', nivel: 4, min: 3,
    titular: 'TITULAR PENDIENTE',
    entradilla: 'Una o dos frases que enganchen sin destripar el desarrollo.',
    cuerpo: ['Primer párrafo.', 'Segundo párrafo.', 'Tercer párrafo con el giro final.'],
    fuente: 'Autor, publicación (año).'
  });
  writeFileSync(ruta, JSON.stringify(datos, null, 2) + '\n');
  console.log(`Añadida una entrada en blanco para el ${fecha}. Edítala en datos.json (está la primera).`);
  console.log(`Secciones disponibles: ${Object.keys(SECCIONES).join(', ')}`);
}

/* ======================= CONSTRUIR ======================= */
function construir() {
  const datos = JSON.parse(readFileSync(join(RAIZ, 'datos.json'), 'utf8'));
  const hoy = hoyISO();

  const todas = datos.curiosidades.map(c => ({ ...c, slug: slug(c.titular) }));
  const desconocidas = todas.filter(c => !SECCIONES[c.cat]);
  if (desconocidas.length) {
    console.warn(`Aviso: sección desconocida en ${desconocidas.map(c => `"${c.titular}"`).join(', ')}`);
  }

  const publicadas = todas.filter(c => c.fecha <= hoy).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const programadas = todas.filter(c => c.fecha > hoy);
  if (!publicadas.length) throw new Error('No hay ninguna curiosidad con fecha de hoy o anterior.');

  const hero = publicadas[0];
  const resto = publicadas.slice(1, 1 + MAX_EN_PORTADA);

  const enigmas = (datos.enigmas || []).filter(e => e.fecha <= hoy).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const enigma = enigmas[0] || null;

  rmSync(SALIDA, { recursive: true, force: true });
  mkdirSync(join(SALIDA, 'c'), { recursive: true });
  mkdirSync(join(SALIDA, 'img'), { recursive: true });

  publicadas.forEach(d => {
    if (!d.imagen) writeFileSync(join(SALIDA, 'img', `${d.slug}.svg`), ilustracionSvg(d));
  });

  writeFileSync(join(SALIDA, 'index.html'), portada(hero, resto, enigma, hoy));
  publicadas.forEach((d, i) => {
    writeFileSync(join(SALIDA, 'c', `${d.slug}.html`), ficha(d, publicadas[i + 1] || null));
  });
  writeFileSync(join(SALIDA, 'feed.xml'), feed(publicadas.slice(0, 20)));
  writeFileSync(join(SALIDA, 'sitemap.xml'), sitemap(publicadas));
  writeFileSync(join(SALIDA, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITIO.url}/sitemap.xml\n`);
  copyFileSync(join(RAIZ, 'estilo.css'), join(SALIDA, 'estilo.css'));

  console.log(`SoyCurioso publicado en /publico`);
  console.log(`  Plato del día  ${hero.titular}`);
  console.log(`  En portada     ${resto.length} raciones más`);
  console.log(`  Fichas         ${publicadas.length}`);
  console.log(`  Enigma         ${enigma ? enigma.fecha : 'ninguno para hoy'}`);
  console.log(`  Programadas    ${programadas.length}${programadas.length ? ' (próxima: ' + programadas.map(p => p.fecha).sort()[0] + ')' : ''}`);
}

if (process.argv[2] === 'nueva') nuevaEntrada();
else construir();
