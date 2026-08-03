# Despliegue en AWS — {{domain}}

Guía para el equipo de IT. Este proyecto es **100% estático**: HTML/CSS/JS puro, sin build step, sin backend, sin variables de entorno, sin dependencias que instalar. Desplegar es literalmente copiar los archivos a un sitio que sirva estáticos por HTTPS.

Reemplace "domain" por algo como "microgrames.cognifit.com".

## IMPORTANTE: no despliegues el gate de contraseña a AWS

Cada `index.html` del repo trae, solo para el preview público en GitHub Pages, un `<script>` al inicio del `<head>` que pide una contraseña (ask the developer) con `prompt()`. **Es exclusivo de ese preview temporal — no es seguridad real y no debe llegar a `{{domain}}`.** El control de acceso en AWS lo da la propia infraestructura (CloudFront/Cognito/lo que decida IT), no ese script.

Por eso, **el paso 2 de abajo (subir a S3) incluye quitar ese bloque de todos los `index.html` antes de subir** — no es opcional, es parte del despliegue. Si por lo que sea no se quita, el sitio en `{{domain}}` pediría esa contraseña a cada visitante, que no es el objetivo una vez hay control de acceso real.

## IMPORTANTE: `robots.txt` y `noindex` también son temporales

Mientras el sitio es un preview público en GitHub Pages, está bloqueado para buscadores: hay un `robots.txt` en la raíz con `Disallow: /` para todos los crawlers, y cada `index.html` trae `<meta name="robots" content="noindex, nofollow">`. Esto es intencional — no queremos que Google indexe una versión de prueba.

**En AWS esto no se hereda tal cual.** Cuándo, cómo y si `{{domain}}` se deja rastrear/cachear es una decisión de producto que se toma aparte, no algo que este `robots.txt` de preview deba imponer. Por eso el paso 2 también quita el `<meta name="robots">` de cada página y **no sube el `robots.txt` de este repo** — el bucket de producción simplemente no tiene `robots.txt` hasta que alguien decida cuál poner (puede ser "abierto", uno con reglas específicas, o gestionarlo aparte vía CloudFront). Si hace falta uno el día del lanzamiento, se escribe entonces con el contenido que se decida — no reutilices el de este repo.

## Arquitectura recomendada

```
Usuario → Route 53 (DNS) → CloudFront (CDN + HTTPS) → S3 (archivos estáticos)
                                     ↑
                              Certificado ACM (us-east-1)
```

- **S3**: almacena los archivos, bucket privado (no público).
- **CloudFront**: sirve por HTTPS con el dominio propio, cachea, y accede a S3 mediante Origin Access Control (OAC) — el bucket nunca se expone directamente.
- **ACM**: certificado TLS para `{{domain}}`. Debe pedirse en la región **us-east-1**, es un requisito de CloudFront aunque el resto de la infra esté en otra región.
- **Route 53** (o el DNS que use CogniFit si no es Route 53): registro que apunte `{{domain}}` a la distribución de CloudFront.

## Detalle importante: rutas de carpeta (`/GRIDFLIP/`, `/MATCHCOLOR/`, etc.)

Cada juego es una carpeta con su propio `index.html`. Cuando alguien visite `{{domain}}/GRIDFLIP/` (sin escribir `index.html`), el servidor debe resolverlo automáticamente al `index.html` de esa carpeta. Dos formas de conseguirlo:

- **Opción recomendada — origin = S3 Static Website Hosting endpoint**: activa "Static website hosting" en el bucket S3 (documento índice: `index.html`), y usa **ese endpoint HTTP** (`<bucket>.s3-website-<region>.amazonaws.com`) como origen de CloudFront (origen "custom", no "S3 origin"). Este modo de S3 sí resuelve `/carpeta/` → `/carpeta/index.html` automáticamente. Nota: con este modo el bucket debe permitir lectura pública (S3 Static Website Hosting no es compatible con OAC); mitigarlo restringiendo el bucket policy a solo el rango de IPs de CloudFront, o aceptar que es solo-lectura de contenido público (no hay datos sensibles en este repo).
- **Alternativa — origin = S3 REST endpoint + OAC + CloudFront Function**: mantiene el bucket totalmente privado, pero requiere añadir una CloudFront Function (JS corto) que reescriba peticiones que terminan en `/` a `/index.html` antes de llegar a S3. Más seguro, un poco más de configuración inicial.

Cualquiera de las dos funciona con este repo tal cual está (todos los enlaces son relativos, no hay rutas absolutas hardcodeadas).

## Pasos

1. **Bucket S3**
   ```bash
   aws s3 mb s3://<NOMBRE_BUCKET> --region <REGION>
   ```
   Configura "Static website hosting" con documento índice `index.html` (ver sección anterior).

2. **Subir el contenido** (repetir en cada despliegue). No hay build, pero **sí hay que limpiar el staging primero** (gate de contraseña, meta `robots` y `robots.txt` de preview) — nunca subas el repo original directo:
   ```bash
   # 1) Copiar el repo a una carpeta temporal de staging (no tocar el repo real)
   rm -rf /tmp/microgames-deploy && cp -r . /tmp/microgames-deploy

   # 2) Quitar el gate de contraseña de todos los index.html, solo en el staging
   find /tmp/microgames-deploy -name "index.html" -exec \
     sed -i '/<!-- Temporary access gate/,/<\/script>/d' {} +

   # 3) Quitar el bloque de noindex (comentario + meta) de todos los index.html
   find /tmp/microgames-deploy -name "index.html" -exec \
     sed -i '/<!-- Temporary: keep this out of search engines/,/noindex, nofollow/d' {} +

   # 4) No subir el robots.txt de preview — producción no hereda esta política
   rm -f /tmp/microgames-deploy/robots.txt

   # 5) Subir el staging (ya limpio) a S3 — nunca "aws s3 sync ." desde el repo real
   aws s3 sync /tmp/microgames-deploy s3://<NOMBRE_BUCKET> --delete \
     --exclude ".git/*" --exclude "*.md" --exclude ".claude/*"
   ```
   `--delete` elimina en el bucket lo que ya no exista en el staging.

3. **Certificado ACM** (una sola vez, en `us-east-1`)
   ```bash
   aws acm request-certificate --domain-name {{domain}} \
     --validation-method DNS --region us-east-1
   ```
   Valida el certificado añadiendo el registro CNAME que AWS indique en el DNS de `cognifit.com`.

4. **Distribución CloudFront**
   - Origen: el endpoint elegido en la sección anterior.
   - Alternate domain name (CNAME): `{{domain}}`.
   - Certificado: el de ACM del paso 3.
   - Default root object: `index.html`.
   - Viewer protocol policy: "Redirect HTTP to HTTPS".

5. **DNS**
   En Route 53 (o el proveedor DNS de CogniFit), crea un registro tipo **A/ALIAS** (o CNAME si no es Route 53) para `{{domain}}` apuntando al dominio de la distribución CloudFront (`dxxxxxxxxxxxxx.cloudfront.net`).

6. **Invalidar caché tras cada despliegue**
   ```bash
   aws cloudfront create-invalidation --distribution-id <ID_DISTRIBUCION> --paths "/*"
   ```
   CloudFront cachea agresivamente; sin este paso los cambios pueden tardar horas en verse.

## Checklist de despliegue

- [ ] Bucket S3 creado, static website hosting activo (o CloudFront Function de reescritura si se usó la alternativa privada).
- [ ] Certificado ACM emitido y validado en `us-east-1`.
- [ ] Distribución CloudFront con dominio alternativo y certificado configurados.
- [ ] DNS de `{{domain}}` apuntando a CloudFront.
- [ ] Gate de contraseña quitado del staging antes de subir (paso 2) — **no debe pedir contraseña en producción**.
- [ ] Meta `robots` (`noindex`) quitada de todos los `index.html` del staging, y `robots.txt` de preview **no** subido — la política de rastreo de producción se decide aparte.
- [ ] `aws s3 sync` ejecutado (desde el staging, no desde el repo real) y `create-invalidation` lanzado.
- [ ] Verificar manualmente: `https://{{domain}}/` (launcher) y al menos un juego, ej. `https://{{domain}}/GRIDFLIP/` — no debe aparecer ningún prompt de contraseña, y `view-source:` no debe traer `noindex`.

## Lo que NO hace falta

- Ningún build (`npm install`, webpack, etc.) — no existe ese paso en este proyecto.
- Ninguna variable de entorno ni secreto — todo el contenido es estático y público.
- Ningún backend/API — `Utils.finishGame` solo hace `postMessage` al padre si el juego está embebido en un iframe; si no, no hace nada de red.
