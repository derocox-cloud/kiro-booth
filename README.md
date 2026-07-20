# Kiro Booth Landing Page

Landing page estática para el booth de Kiro en eventos de tecnología. Presenta Kiro como IDE con IA, guía a los visitantes en la descarga e instalación, muestra el reto específico del evento y expone recursos de la comunidad. El contenido variable por evento se configura en un único archivo JSON sin tocar el código fuente.

---

## Estructura del proyecto

```
booth/
├── index.html            # Estructura HTML de la página
├── styles.css            # Estilos y diseño responsivo
├── app.js                # Lógica de carga de config y renderizado
├── event-config.json     # ← Editar por evento (reto, nombre, recursos)
├── assets/
│   └── logo.svg          # Logotipo de Kiro
├── tests/                # Suite de pruebas (Vitest + fast-check)
├── package.json
└── vitest.config.js
```

---

## Cambiar el reto para un nuevo evento

Edita únicamente el archivo `event-config.json` en la raíz del proyecto:

```json
{
  "eventName": "Nombre del evento (ej. AWS re:Invent 2025)",
  "challenge": {
    "title": "Título del reto",
    "description": "Descripción breve de lo que el visitante debe hacer.",
    "steps": [
      "Paso 1",
      "Paso 2",
      "Paso 3"
    ],
    "successCriteria": [
      "Criterio de éxito 1",
      "Criterio de éxito 2"
    ]
  },
  "communityResources": [
    {
      "name": "Nombre del recurso",
      "description": "Descripción breve del recurso.",
      "url": "https://ejemplo.com",
      "type": "docs"
    }
  ]
}
```

**Campos obligatorios:**

| Campo | Descripción |
|---|---|
| `eventName` | Nombre del evento; aparece en el hero de la página |
| `challenge.title` | Título del reto mostrado en la sección "Reto del Evento" |
| `challenge.description` | Descripción del reto |
| `challenge.steps` | Array de pasos a seguir (mínimo uno) |
| `challenge.successCriteria` | Array de criterios de éxito (mínimo uno) |
| `communityResources` | Array de recursos; cada uno requiere `name`, `description`, `url` y `type` |

Los tipos válidos para `type` en recursos son: `"docs"`, `"github"`, `"community"`, `"social"`.

Si un campo obligatorio está ausente o vacío, la página muestra el placeholder `[Pendiente de configuración]` en lugar de dejarlo en blanco.

---

## Pruebas locales

**Ejecutar la suite de pruebas:**

```bash
npm test
```

**Abrir la página en el navegador sin servidor:**

Abre `index.html` directamente desde el sistema de archivos:

```
file:///ruta/absoluta/al/proyecto/booth/index.html
```

> **Nota:** Algunos navegadores bloquean `fetch()` para rutas `file://` por restricciones CORS. En ese caso, la página carga automáticamente el contenido por defecto definido en `app.js` — el comportamiento es el mismo que en producción cuando el archivo de config no está disponible. Para pruebas completas con el config real, usa un servidor local:
>
> ```bash
> npx serve .
> # o
> python3 -m http.server 8080
> ```

---

## Despliegue en AWS S3

### 1. Requisitos previos

- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) instalado y configurado (`aws configure`)
- Credenciales con permisos sobre S3: `s3:CreateBucket`, `s3:PutObject`, `s3:PutBucketPolicy`, `s3:PutBucketWebsite`

### 2. Crear el bucket y habilitar el hosting estático

```bash
# Crear el bucket (reemplaza BUCKET_NAME y REGION)
aws s3api create-bucket \
  --bucket BUCKET_NAME \
  --region REGION \
  --create-bucket-configuration LocationConstraint=REGION

# Deshabilitar el bloqueo de acceso público
aws s3api delete-public-access-block \
  --bucket BUCKET_NAME

# Configurar el bucket para hosting de sitio web estático
aws s3 website s3://BUCKET_NAME/ \
  --index-document index.html \
  --error-document index.html
```

### 3. Aplicar la política de acceso público

Crea un archivo temporal `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*"
    }
  ]
}
```

Aplica la política:

```bash
aws s3api put-bucket-policy \
  --bucket BUCKET_NAME \
  --policy file://bucket-policy.json
```

### 4. Subir los archivos al bucket

Desde la raíz del proyecto:

```bash
aws s3 sync . s3://BUCKET_NAME \
  --exclude "node_modules/*" \
  --exclude "tests/*" \
  --exclude ".kiro/*" \
  --exclude "*.sh" \
  --exclude "package*.json" \
  --exclude "vitest.config.js" \
  --exclude "README.md"
```

La página estará disponible en la URL de hosting estático de S3:

```
http://BUCKET_NAME.s3-website-REGION.amazonaws.com
```

---

## Configurar CloudFront

CloudFront actúa como CDN, distribuye el contenido globalmente y permite usar HTTPS con un dominio personalizado.

### 1. Crear la distribución

En la consola de AWS o con la CLI:

```bash
aws cloudfront create-distribution \
  --origin-domain-name BUCKET_NAME.s3-website-REGION.amazonaws.com \
  --default-root-object index.html
```

> Para configuraciones avanzadas (certificado SSL, dominio personalizado, comportamientos de caché), usa la consola de AWS CloudFront o una plantilla CloudFormation.

### 2. Anotar el Distribution ID

El comando anterior devuelve un JSON con el campo `"Id"`. Guarda ese valor — lo necesitarás para invalidar la caché.

```
DIST_ID=EXXXXXXXXXXXXX
```

### 3. Verificar

Una vez desplegada (puede tardar ~5–15 minutos), la página estará disponible en:

```
https://XXXXXXXXXXXX.cloudfront.net
```

---

## Actualizar `event-config.json` en producción

Para cambiar el reto entre eventos solo es necesario subir el archivo de config e invalidar la caché de CloudFront:

### 1. Editar el archivo local

Modifica `event-config.json` con el contenido del nuevo evento (ver sección [Cambiar el reto para un nuevo evento](#cambiar-el-reto-para-un-nuevo-evento)).

### 2. Subir el archivo al bucket

```bash
aws s3 cp event-config.json s3://BUCKET_NAME/event-config.json
```

### 3. Invalidar la caché de CloudFront

```bash
aws cloudfront create-invalidation \
  --distribution-id DIST_ID \
  --paths "/event-config.json"
```

La invalidación suele completarse en 1–2 minutos. Tras eso, los visitantes verán el nuevo reto sin necesidad de redesplegar la página completa.

---

## Requisitos

| Herramienta | Versión mínima | Notas |
|---|---|---|
| AWS CLI | v2 | Configurado con `aws configure` |
| Node.js | 18 LTS | Solo para pruebas locales (`npm test`) |
| npm | 9 | Solo para pruebas locales |

**Permisos IAM necesarios para el despliegue:**

- `s3:CreateBucket`, `s3:DeletePublicAccessBlock`, `s3:PutBucketWebsite`, `s3:PutBucketPolicy`
- `s3:PutObject`, `s3:GetObject`, `s3:ListBucket`
- `cloudfront:CreateDistribution`, `cloudfront:CreateInvalidation`
