# SoyCurioso

Sitio estático de curiosidades diarias y enigmas, con estética de bar de barrio basada en la arquitectura enviada por Valentín.

## Arquitectura actual

```text
datos.json      Fuente única de curiosidades y enigmas.
publicar.mjs    Generador Node sin dependencias.
estilo.css      Estilos compartidos por portada y fichas.
publico/        Web generada para GitHub Pages.
```

## Comandos

```bash
npm run build        # genera publico/
npm run build:local  # genera publico/ con CSS incrustado
npm run new          # añade una curiosidad nueva en datos.json
npm test             # verifica estructura, contenido y workflow de Pages
```

## Publicación

GitHub Actions ejecuta `npm run build` y publica `publico/` en GitHub Pages.

URL pública prevista:

```text
https://valenfer.github.io/soycurioso/
```
