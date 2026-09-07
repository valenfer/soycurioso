# SoyCurioso

MVP funcional de una web de curiosidades, enigmas y suscripción diaria por email.

## Qué incluye

- Web pública con Astro y TypeScript.
- 10 curiosidades iniciales con imagen SVG local, categoría, etiquetas, fuente y desarrollo breve.
- Archivo buscable con filtros en cliente.
- Sección inicial de enigmas con solución desplegable.
- Formulario de suscripción simulado para validar UX sin manejar datos reales todavía.
- Documentación técnica del sistema de email diario por suscriptor.
- Despliegue preparado para GitHub Pages en `https://valenfer.github.io/soycurioso/`.

## Comandos

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Estructura

```text
src/content/curiosidades/  # publicaciones MDX con frontmatter
src/content/enigmas/       # pasatiempos y acertijos
src/components/            # tarjetas, buscador y suscripción
src/pages/                 # rutas públicas generadas por Astro
public/images/             # imágenes SVG locales del MVP
docs/                      # documentación del proyecto
```

## Nota sobre el email diario

El MVP no envía correos reales. La siguiente fase debe añadir base de datos, doble opt-in, baja legal y tarea diaria programada. Está documentado en `docs/EMAIL_DIARIO.md`.
