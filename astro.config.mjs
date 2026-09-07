// Configuración principal de Astro.
// `site` y `base` son necesarios para publicar correctamente en GitHub Pages
// bajo https://valenfer.github.io/soycurioso/ en vez de en la raíz del dominio.
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://valenfer.github.io',
  base: '/soycurioso',
});
