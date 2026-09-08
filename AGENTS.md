# AGENTS.md

## Proyecto

SoyCurioso usa ahora un generador estático Node sin dependencias.

## Comandos

```bash
npm run build
npm test
```

## Flujo

- Edita contenido en `datos.json`.
- Edita estilos en `estilo.css`.
- El generador `publicar.mjs` escribe la web completa en `publico/`.
- GitHub Pages publica la carpeta `publico/` mediante `.github/workflows/deploy.yml`.

No uses comandos Astro en este proyecto activo; la versión anterior está preservada fuera del repo activo como backup local.
