# CLAUDE.md

SoyCurioso ya no es un proyecto Astro. La arquitectura activa es:

- `datos.json`: contenido.
- `publicar.mjs`: generador estático.
- `estilo.css`: estilos.
- `publico/`: salida publicada.

Comandos útiles:

```bash
npm run build
npm test
```

No ejecutes `astro dev`, `astro build` ni `npm ci` como flujo principal.
