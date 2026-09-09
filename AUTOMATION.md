# Automatización diaria de SoyCurioso

Este contrato guía al job diario de AIDA para publicar una curiosidad nueva en SoyCurioso.

## Objetivo

Cada día debe añadirse una curiosidad original, breve y verificable a `datos.json`, generar una imagen local relacionada con su contenido, reconstruir `publico/`, hacer commit, push y verificar GitHub Pages en `https://valenfer.github.io/soycurioso/`.

## Reglas editoriales

- Escribir siempre en español de España.
- Buscar una curiosidad real usando fuentes verificables; preferir fuentes primarias, universidades, museos, agencias espaciales, revistas científicas, instituciones públicas o medios especializados fiables.
- Leer la fuente elegida antes de escribir. No usar solo snippets de búsqueda.
- Evitar duplicados: comparar el tema y la URL con las curiosidades existentes en `datos.json`.
- Si no hay una fuente suficientemente fiable o el repositorio no está sincronizado, salir sin publicar y explicar el bloqueo.
- Mantener el estilo SoyCurioso: curioso, claro, con un toque de retranca, sin sensacionalismo.
- Usar campos: `fecha`, `cat`, `nivel`, `min`, `titular`, `entradilla`, `cuerpo`, `fuente`, `imagen`.
- La fecha debe ser la fecha local de Madrid del día de ejecución, salvo que ya exista una entrada con esa fecha y tema nuevo; en ese caso puede añadirse otra entrada del mismo día si no es duplicada.
- Categorías válidas: `ciencia`, `historia`, `filosofia`, `tecnologia`, `psicologia`, `antropologia`, `logica`, `citas`.

## Imagen diaria

- Crear una imagen original local relacionada con la curiosidad, sin usar imágenes externas ni hotlinking.
- Ruta fuente: `img/<slug-del-titular>.webp`.
- Tamaño recomendado: 900x507, WebP, calidad aproximada 78.
- Se puede generar mediante SVG/HTML propio renderizado a WebP con `sharp`; debe ser visualmente relacionado con palabras clave del contenido, no un placeholder genérico.
- Usar nombres ASCII seguros: sin tildes, espacios, ñ, puntos raros ni caracteres especiales.
- El campo `imagen` de `datos.json` debe apuntar a `img/<slug>.webp`.

## Secuencia obligatoria

1. `git fetch origin main` y comprobar que `HEAD` local coincide con `origin/main` antes de editar. Si no coincide o hay cambios locales no relacionados, parar.
2. Leer `datos.json` y construir un conjunto de titulares, slugs y fuentes existentes.
3. Investigar una curiosidad nueva con búsqueda web y extracción de la fuente.
4. Editar `datos.json` insertando la nueva curiosidad.
5. Generar `img/<slug>.webp`.
6. Ejecutar:
   ```bash
   npm run build
   npm test
   ```
7. Comprobar que la portada o la ficha referencian la nueva imagen WebP y que el archivo existe en `publico/img/`.
8. Ejecutar `git diff --check`.
9. Hacer commit con mensaje `content: publicar curiosidad YYYY-MM-DD`.
10. `git push origin main`.
11. Esperar el workflow de GitHub Pages correspondiente al SHA empujado con `gh run watch --repo valenfer/soycurioso --exit-status`.
12. Verificar:
    - `git rev-parse HEAD` igual a `git ls-remote origin refs/heads/main`.
    - `git status --short --branch` limpio.
    - `https://valenfer.github.io/soycurioso/` devuelve HTTP 200 y contiene el titular nuevo o un enlace a la ficha.
    - La ficha nueva devuelve HTTP 200.
    - La imagen `https://valenfer.github.io/soycurioso/img/<slug>.webp` devuelve HTTP 200 y cabecera `image/webp`.

## Resultado del job

El mensaje final debe incluir:

- Fecha publicada.
- Titular.
- Fuente y URL.
- Archivo de imagen generado.
- Commit SHA.
- URL pública de la ficha.
- Resultado de build, test, workflow de Pages y verificación pública.

## Fallos esperados

- Si no hay publicación, no hacer commit vacío.
- Si falla investigación, fuente, build, test, push o Pages, explicar el fallo exacto.
- No inventar una publicación ni decir que Pages está actualizado sin leer la URL pública.
