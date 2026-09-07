# Diseño del email diario de SoyCurioso

Este documento explica cómo debe funcionar la suscripción diaria cuando el MVP pase a producción.

## Objetivo

Cada suscriptor recibe una curiosidad diaria que todavía no haya recibido. El catálogo puede mezclar publicaciones antiguas ya existentes y curiosidades nuevas que Valentín vaya publicando.

## Tablas recomendadas

```sql
-- Personas que pidieron recibir una curiosidad diaria.
CREATE TABLE subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  unsubscribe_token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  confirmed_at TIMESTAMP
);

-- Índice dinámico opcional de contenidos publicados.
CREATE TABLE content_items (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  published_at DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'published'
);

-- Historial que evita repetir curiosidades al mismo suscriptor.
CREATE TABLE sent_items (
  subscriber_id TEXT NOT NULL REFERENCES subscribers(id),
  content_id TEXT NOT NULL REFERENCES content_items(id),
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscriber_id, content_id)
);
```

## Algoritmo diario

1. Leer suscriptores activos.
2. Para cada suscriptor, buscar publicaciones `published` que no aparezcan en `sent_items`.
3. Priorizar la curiosidad nueva del día si el usuario no la recibió.
4. Si no hay novedad disponible, escoger la publicación antigua no recibida más adecuada.
5. Enviar email HTML con título, resumen, imagen, enlace y baja.
6. Registrar el envío en `sent_items`.

## Requisitos legales mínimos

- Doble opt-in antes de enviar correos reales.
- Enlace de baja en cada email.
- Política de privacidad visible.
- Guardar solo email, estado, fechas y token de baja.
- No meter claves API en el frontend. El proveedor de email debe vivir en backend o GitHub/Vercel secrets.

## Proveedores posibles

- Resend: API limpia para desarrolladores.
- Brevo: útil para newsletters y listas.
- MailerSend: alternativa similar.
- Supabase + Edge Functions o Vercel Cron para ejecutar la tarea diaria.
