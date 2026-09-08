# SoyCurioso

Una curiosidad al día, con estética de bar de barrio. El contenido vive en `datos.json`
y un script de Node genera la web entera: portada, una página por curiosidad, RSS y sitemap.
No hay dependencias: solo Node 18 o superior.

## Archivos

```
datos.json      Todas las curiosidades y los enigmas. Es lo único que tocas a diario.
publicar.mjs    El generador. Lee datos.json y escribe /publico.
estilo.css      Los estilos, compartidos por portada y fichas.
publico/        Lo generado. Esto es lo que se sube al hosting.
```

## Publicar

```bash
node publicar.mjs          # genera /publico, listo para subir al hosting
node publicar.mjs local    # lo mismo, pero con el CSS incrustado: se abre con doble clic
node publicar.mjs nueva    # añade una entrada en blanco con la próxima fecha libre
```

La versión normal carga `estilo.css` como archivo aparte, así que para verla en el navegador
hace falta un servidor, aunque sea mínimo:

```bash
npx serve publico          # o: python3 -m http.server -d publico
```

Si solo quieres echarle un vistazo rápido sin montar nada, usa `node publicar.mjs local`
y abre `publico/index.html` directamente. Para subir a producción, genera siempre sin `local`:
el CSS en archivo aparte se cachea y las páginas pesan la mitad.

## Cómo funciona la portada automática

Cada curiosidad lleva una `fecha`. Al generar:

- **El plato del día** es la curiosidad publicada más reciente (fecha de hoy o anterior).
- **La carta** son las 12 siguientes por orden de fecha.
- Lo que tenga **fecha futura queda programado** y no aparece en ningún sitio.
- El **enigma** funciona igual: el más reciente con fecha de hoy o anterior.

Así que puedes escribir diez curiosidades un domingo, ponerles fechas de los diez días
siguientes, y la portada se irá renovando sola cada mañana en cuanto el script vuelva a correr.
El día se calcula en la zona horaria de `SITIO.zona`, no en la del servidor.

## Añadir una curiosidad

```bash
node publicar.mjs nueva
```

Deja una plantilla al principio de `datos.json`. Rellénala:

```json
{
  "fecha": "2026-09-15",
  "cat": "historia",
  "nivel": 4,
  "min": 3,
  "titular": "Frase corta y concreta, sin signos de exclamación",
  "entradilla": "Una o dos frases que enganchen sin destripar el desarrollo.",
  "cuerpo": ["Párrafo uno.", "Párrafo dos.", "Párrafo tres, con el giro final."],
  "fuente": "Autor, publicación (año)."
}
```

- `cat`: `ciencia`, `tecnologia`, `filosofia`, `historia`, `citas`, `logica`, `psicologia`, `antropologia`.
  Para cambiar los nombres o añadir secciones, edita `SECCIONES` en `publicar.mjs`.
  Cada sección tiene ya su propio azulejo dibujado; una sección nueva usará el de ciencia
  hasta que le añadas un motivo en `MOTIVOS`.
- `nivel`: de 1 a 5 aceitunas. Es el cuñadómetro: lo demoledor que resulta el dato en una comida familiar.
- `min`: minutos de lectura, se muestra en la ficha y en el ticket del pie.
- La `fuente` no es decorativa. Es lo que separa esto de una cuenta de datos curiosos inventados.

Los enigmas van en el array `enigmas`, con `reto`, `pista`, `solucion` y una lista de
`respuestas` válidas (se comparan en minúsculas y sin acentos, así que incluye variantes:
`["3", "tres", "3 extremos"]`).

## Configurar el sitio

Arriba de `publicar.mjs`, en el objeto `SITIO`: dominio, lema, correo, hora de envío y zona horaria.
El dominio se usa en las etiquetas canónicas, en el RSS y en el sitemap, así que cámbialo
antes de publicar de verdad.

## El formulario de suscripción

Ahora mismo valida el correo y confirma en pantalla, pero no envía nada. Para que funcione:

1. Abre una cuenta en un servicio de newsletter (Buttondown, Beehiiv, Mailchimp, Kit).
2. Copia la URL del formulario de alta.
3. Pégala en `SITIO.endpointSuscripcion` y regenera.

El script convierte entonces el formulario en un `POST` real hacia ese endpoint. Para el envío
diario, la mayoría de esos servicios pueden leer directamente tu `feed.xml`: configuras una
campaña RSS y cada mañana sale sola la curiosidad nueva, sin escribir el correo a mano.

## Subirlo

Cualquier hosting estático sirve. Sube el contenido de `publico/`:

- **Netlify o Vercel**: comando de build `node publicar.mjs`, carpeta de publicación `publico`.
- **GitHub Pages**: ya tienes el flujo en `.github/workflows/publicar.yml`. Regenera y despliega
  cada mañana a las 8:05 hora española y también cada vez que edites `datos.json`.
- **FTP de toda la vida**: arrastra la carpeta `publico`.

## Ideas para más adelante

- Archivo por secciones (`/seccion/historia.html`) reutilizando la función `portada`.
- Imagen social por curiosidad: los azulejos ya son SVG, basta con convertirlos a PNG al generar.
- Racha de visitas con `localStorage` en la portada, para premiar al que vuelve cada día.
