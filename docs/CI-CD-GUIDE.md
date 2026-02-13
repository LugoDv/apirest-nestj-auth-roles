# Guía: CI/CD Pipeline con GitHub Actions y Docker

Este documento explica paso a paso cómo funciona el pipeline de CI/CD automatizado para desplegar la aplicación NestJS en AWS EC2.

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Requisitos Previos](#requisitos-previos)
3. [Paso 1: Configurar Secrets en GitHub](#paso-1-configurar-secrets-en-github)
4. [Paso 2: Crear el Workflow](#paso-2-crear-el-workflow)
5. [Paso 3: Compilar y Publicar en Docker Hub](#paso-3-compilar-y-publicar-en-docker-hub)
6. [Paso 4: Desplegar en AWS EC2](#paso-4-desplegar-en-aws-ec2)
7. [Flujo Completo](#flujo-completo)

---

## 🎯 Visión General

El pipeline CI/CD automatiza todo el proceso de:

```
Código → Git Push → Build Docker → Push a Docker Hub → Deploy en EC2
```

Esto permite que cualquier cambio en la rama `main` se compile, se suba automáticamente a Docker Hub y se despliegue en su servidor AWS sin intervención manual.

---

## 📦 Requisitos Previos

Antes de configurar el CI/CD, asegúrate de tener:

### 1. **Docker Hub Account**

- Cuenta creada en [Docker Hub](https://hub.docker.com)
- Nombre de usuario
- Token de acceso generado

### 2. **AWS EC2 Instance**

- Instancia EC2 corriendo Linux (Ubuntu recomendado)
- Docker instalado en la instancia
- Docker Compose instalado
- Acceso SSH configurado

### 3. **GitHub Repository**

- Repositorio con el código del proyecto
- Rama `main` como rama por defecto

### 4. **docker-compose.yml**

- Archivo configurado en la raíz del proyecto
- Define todos los servicios necesarios

---

## Paso 1: Configurar Secrets en GitHub

### ¿Qué son los Secrets?

Los Secrets son variables encriptadas que almacena GitHub. El workflow las usa sin exponerlas públicamente.

### ¿Cómo agregarlos?

1. Ve a tu repositorio en GitHub
2. Click en **Settings** (Configuración)
3. En el menú lateral, busca **Secrets and variables** → **Actions**
4. Click en **New repository secret**

### Secrets necesarios:

#### 🐳 **Para Docker Hub:**

```
DOCKERHUB_USERNAME = tu_usuario_dockerhub
DOCKERHUB_TOKEN = tu_token_dockerhub
```

💡 **Cómo generar el token:**

- En Docker Hub: Settings → Security → New Access Token
- Dale un nombre descriptivo
- Copia el token y guárdalo

#### 🔒 **Para AWS EC2:**

```
EC2_HOST = ejemplo: 54.213.45.123 (IP pública de tu EC2)
EC2_USERNAME = ubuntu (o ec2-user si es Amazon Linux)
EC2_SSH_KEY = tu_clave_privada_ssh
```

💡 **Cómo obtener la clave SSH:**

- Al crear tu instancia EC2, AWS descarga un `.pem` file
- Copia el contenido completo del archivo incluyendo `-----BEGIN...` y `-----END...`

#### 🗄️ **Para la Base de Datos:**

```
DB_USERNAME = usuario_base_de_datos
DB_PASSWORD = contraseña_segura
DB_NAME = nombre_base_de_datos
JWT_SECRET = tu_secret_jwt_muy_seguro
```

---

## Paso 2: Crear el Workflow

### Estructura de archivos

```
.github/
└── workflows/
    └── main.yml
```

### ¿Dónde crear el archivo?

1. En la raíz de tu repositorio, crea la carpeta `.github/workflows/`
2. Dentro, crea el archivo `main.yml`

### Estructura básica de un workflow YAML

```yaml
name: Nombre del Pipeline
on: [evento que lo dispara]
jobs:
  nombre-trabajo:
    runs-on: [sistema operativo]
    steps:
      - name: Descripción del paso
        uses: acción@versión
```

---

## Paso 3: Compilar y Publicar en Docker Hub

Este trabajo (job) compila la imagen Docker y la sube a Docker Hub.

### Paso 3.1: Trigger del Workflow

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: ['main']
```

**Explicación:**

- `name`: Nombre visible en GitHub
- `on: push`: Se ejecuta cuando hay un push
- `branches: ['main']`: Solo en la rama main

### Paso 3.2: Configurar el Job de Build

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
```

**Explicación:**

- `build-and-push`: Nombre del trabajo
- `runs-on: ubuntu-latest`: Se ejecuta en Ubuntu más reciente

### Paso 3.3: Pasos (Steps)

#### **Paso 1: Obtener el código**

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4
```

**¿Qué hace?** Descarga tu código del repositorio en el servidor de GitHub Actions.

#### **Paso 2: Preparar Docker Buildx**

```yaml
- name: Set up Docker Buildx
  uses: docker/setup-buildx-action@v3
```

**¿Qué hace?** Prepara Docker para construir imágenes de forma más rápida y eficiente.

#### **Paso 3: Autenticarse en Docker Hub**

```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

**¿Qué hace?** Se conecta a tu cuenta de Docker Hub usando los secrets guardados.

**Sintaxis de secrets:** `${{ secrets.NOMBRE_SECRET }}` accede a los valores encriptados.

#### **Paso 4: Compilar y Subir la Imagen**

```yaml
- name: Build and push
  uses: docker/build-push-action@v5
  with:
    context: .
    push: true
    tags: ${{ secrets.DOCKERHUB_USERNAME }}/nest-api-auth:latest
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

**Explicación de parámetros:**

- `context: .` → Construye desde la raíz del repositorio
- `push: true` → Sube la imagen a Docker Hub
- `tags: ...` → Nombre de la imagen: `usuario/nombre:latest`
- `cache-from: type=gha` → Usa caché de GitHub para compilar más rápido
- `cache-to: type=gha,mode=max` → Guarda el caché para futuras compilaciones

**¿Qué pasa aquí?**

1. Lee el `Dockerfile` de tu proyecto
2. Construye la imagen Docker
3. Sube la imagen a Docker Hub con la etiqueta `latest`
4. Guarda el caché para acelerar compilaciones futuras

---

## Paso 4: Desplegar en AWS EC2

Este trabajo (job) se ejecuta **después** de que `build-and-push` termine exitosamente.

### Paso 4.1: Dependencias entre trabajos

```yaml
deploy:
  needs: build-and-push
  runs-on: ubuntu-latest
```

**Explicación:**

- `needs: build-and-push` → Solo ejecuta si el anterior fue exitoso
- Si `build-and-push` falla, `deploy` nunca inicia

### Paso 4.2: Descargar el código

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4
```

**¿Por qué?** Necesitamos el `docker-compose.yml` para copiarlo a EC2.

### Paso 4.3: Copiar docker-compose.yml a EC2

```yaml
- name: Copy docker-compose.yml to EC2
  uses: appleboy/scp-action@v0.1.7
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USERNAME }}
    key: ${{ secrets.EC2_SSH_KEY }}
    source: 'docker-compose.yml'
    target: '~/'
```

**¿Qué hace?**

- `scp-action` → Usa el protocolo SCP (copia segura por SSH)
- `source: 'docker-compose.yml'` → Copia este archivo
- `target: '~/'` → Lo pega en el directorio home del usuario en EC2

**Flujo:** GitHub Actions → EC2

### Paso 4.4: Ejecutar comandos en EC2

```yaml
- name: Deploy with Docker Compose
  uses: appleboy/ssh-action@v1.0.3
  with:
    host: ${{ secrets.EC2_HOST }}
    username: ${{ secrets.EC2_USERNAME }}
    key: ${{ secrets.EC2_SSH_KEY }}
    script: |
      export DOCKERHUB_USERNAME=${{ secrets.DOCKERHUB_USERNAME }}
      export DB_USERNAME=${{ secrets.DB_USERNAME }}
      export DB_PASSWORD=${{ secrets.DB_PASSWORD }}
      export DB_NAME=${{ secrets.DB_NAME }}
      export JWT_SECRET=${{ secrets.JWT_SECRET }}

      docker compose pull
      docker compose up -d
```

**¿Qué hace?**

1. Conecta por SSH a tu EC2
2. Exporta todas las variables de entorno desde los secrets
3. `docker compose pull` → Descarga la última imagen de Docker Hub
4. `docker compose up -d` → Inicia los contenedores en modo detached (background)

**¿Por qué exportar las variables?**
El `docker-compose.yml` usa variables como `${DB_USERNAME}`. Exportarlas las hace disponibles en ese contexto.

---

## 🔄 Flujo Completo

### Cuando haces un `git push` a `main`:

```
1. GitHub detecta el push
   ↓
2. Inicia el workflow "CI/CD Pipeline"
   ↓
3. JOB: build-and-push (en paralelo)
   ├─ Git checkout
   ├─ Setup Docker Buildx
   ├─ Login Docker Hub
   └─ Build and push image
   ↓
4. JOB: deploy (espera a que build-and-push termine)
   ├─ Git checkout
   ├─ Copy docker-compose.yml a EC2
   └─ SSH: Ejecuta docker compose pull && docker compose up -d
   ↓
5. Tu app está corriendo en EC2 con la última imagen 🚀
```

---

## 📊 Visualización en GitHub

### Ver el progreso del Pipeline

1. Ve a tu repositorio
2. Click en la pestaña **Actions**
3. Verás un listado de los pipelines ejecutados
4. Click en uno para ver los detalles
5. Expande cada job (build-and-push, deploy) para ver los logs

### Estados posibles:

- ✅ **Success** → Todo funcionó
- ❌ **Failure** → Algo falló (revisa los logs)
- ⏳ **In progress** → Se está ejecutando
- ⊘ **Skipped** → No se ejecutó (ej: un job fue skipped porque otro falló)

---

## 🐛 Troubleshooting (Solución de Problemas)

### Problema: "Failed to log in to Docker Hub"

**Posible causa:** Secret incorrecto

**Solución:**

1. Verifica que `DOCKERHUB_TOKEN` sea válido
2. Regenera el token en Docker Hub si es necesario
3. Actualiza el secret en GitHub

### Problema: "SSH connection refused"

**Posible causa:** Host o credenciales incorrectas

**Solución:**

1. Verifica que `EC2_HOST` sea la IP correcta
2. Prueba conectarte manualmente: `ssh -i clave.pem usuario@host`
3. Verifica que `EC2_SSH_KEY` contenga la clave completa

### Problema: "docker-compose: command not found"

**Posible causa:** Docker Compose no está instalado en EC2

**Solución:**

```bash
sudo apt-get update
sudo apt-get install -y docker-compose
```

### Problema: "Permission denied while trying to connect"

**Posible causa:** El usuario de EC2 no tiene permisos para Docker

**Solución:**

```bash
sudo usermod -aG docker $USER
# Luego desconecta y conecta de nuevo
```

---

## 📝 Resumen

| Componente         | Propósito               |
| ------------------ | ----------------------- |
| **GitHub Actions** | Automatiza el proceso   |
| **Docker**         | Crea imagen consistente |
| **Docker Hub**     | Almacena la imagen      |
| **AWS EC2**        | Servidor de producción  |
| **Secrets**        | Variables seguras       |

---

## 🎓 Conceptos Clave

- **Job:** Trabajo dentro del workflow (ej: build-and-push, deploy)
- **Step:** Paso dentro de un job
- **Action:** Acción reutilizable (ej: docker/login-action)
- **Runner:** Máquina que ejecuta el workflow (ej: ubuntu-latest)
- **Secret:** Variable encriptada segura
- **Cache:** Almacenamiento temporal para acelerar builds

---

## 🚀 Próximos Pasos

1. Implementar tests automáticos antes del build
2. Agregar notificaciones (email, Slack)
3. Usar environments para dev/staging/prod
4. Agregar approval manual antes de desplegar
5. Implementar rollback automático si falla el deploy

---

**Última actualización:** February 2026
