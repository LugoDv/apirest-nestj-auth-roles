<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

API REST desarrollada con [NestJS](https://github.com/nestjs/nest) que implementa autenticación con **JWT (JSON Web Tokens)** y control de acceso basado en **roles**.

### ✨ Características Principales

- **API REST** - Endpoints estructurados para gestionar usuarios, gatos y razas
- **Autenticación JWT** - Sistema seguro de autenticación basado en tokens
- **Control de Roles** - Autorización basada en roles de usuario (ADMIN, USER)
- **Guardias** - Protección de rutas con `AuthGuard` y `RolesGuard`
- **TypeScript** - Código completamente tipado
- **Base de Datos** - Integración con TypeORM
- **Dockerizado** - Incluye `Dockerfile` y `docker-compose.yml` para facilitar el deployment
- **CI/CD Automatizado** - Pipeline con GitHub Actions (`main.yml`) para build y deploy automático a AWS EC2

### 📦 Stack Tecnológico

| Componente      | Tecnología          |
| --------------- | ------------------- |
| Backend         | NestJS + TypeScript |
| Base de Datos   | PostgreSQL          |
| ORM             | TypeORM             |
| Autenticación   | JWT                 |
| Contenerización | Docker              |
| Orquestación    | Docker Compose      |
| CI/CD           | GitHub Actions      |
| Hosting         | AWS EC2             |

## 📚 Propósito del Repositorio

Este repositorio es una **guía completa y práctica** que demuestra cómo realizar un deploy automático usando **GitHub Actions y AWS EC2**.

El proyecto combina:

- Una aplicación NestJS ejemplo (API REST con JWT y Roles)
- Configuración Docker completa
- Pipeline CI/CD automatizado en GitHub Actions
- Documentación detallada paso a paso

### 📖 Documentación

Toda la documentación está disponible en la carpeta `docs/`:

- **[CI-CD-GUIDE.md](docs/CI-CD-GUIDE.md)** - Guía completa explicando cada paso del pipeline de GitHub Actions
- **[auth-implementation-guide.md](docs/auth-implementation-guide.md)** - Documentación de la implementación de autenticación JWT

**Ideal para aprender:**

- Cómo configurar un workflow en GitHub Actions
- Cómo crear imágenes Docker y subirlas a Docker Hub
- Cómo desplegar en AWS EC2 automáticamente
- Cómo implementar autenticación JWT en NestJS

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

- **Node.js** (v18 o superior) - [Descargar](https://nodejs.org/)
- **pnpm** - Instalar con: `npm install -g pnpm`
- **PostgreSQL** (v14 o superior) - [Descargar](https://www.postgresql.org/download/)
- **Docker & Docker Compose** (Opcional, para desarrollo local) - [Descargar](https://www.docker.com/)
- **Git** - [Descargar](https://git-scm.com/)

## Project setup

```bash
$ pnpm install
```

## Environment Configuration

Para ejecutar el proyecto en modo **desarrollo**, debes crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de Datos
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=tu_usuario_db
DB_PASSWORD=tu_contraseña_db
DB_NAME=nombre_tu_base_datos

# Autenticación
JWT_SECRET=tu_secret_muy_seguro

# Docker Hub (opcional - solo para CI/CD)
DOCKERHUB_USERNAME=tu_usuario_dockerhub
DOCKERHUB_TOKEN=tu_token_dockerhub
```

**Variables obligatorias:**

- `DB_*` - Configuración de la base de datos PostgreSQL
- `JWT_SECRET` - Clave secreta para firmar tokens JWT (mínimo 20 caracteres)

**Variables opcionales:**

- `DOCKERHUB_*` - Solo necesarias si vas a usar el CI/CD con Docker Hub

### Opción 1: PostgreSQL Local

Si tienes PostgreSQL instalado localmente, crea la base de datos:

```bash
# Acceder a PostgreSQL
psql -U postgres

# Crear la base de datos
CREATE DATABASE nombre_tu_base_datos;

# Crear usuario (opcional)
CREATE USER tu_usuario_db WITH PASSWORD 'tu_contraseña_db';
GRANT ALL PRIVILEGES ON DATABASE nombre_tu_base_datos TO tu_usuario_db;
```

### Opción 2: PostgreSQL con Docker (Recomendado)

Usa el `docker-compose.yml` incluido para levantar PostgreSQL automáticamente:

```bash
# Levanta solo la base de datos
docker-compose up -d db
```

Esto creará automáticamente una base de datos PostgreSQL con las variables configuradas en el `.env`.

## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## � Running with Docker

### Desarrollo Local con Docker Compose

Puedes ejecutar toda la aplicación (API + Base de Datos) usando Docker:

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver los logs
docker-compose logs -f

# Detener los servicios
docker-compose down
```

La aplicación estará disponible en `http://localhost:3000`

### Build de imagen Docker manualmente

```bash
# Construir la imagen
docker build -t nest-api-auth .

# Ejecutar el contenedor
docker run -p 3000:3000 --env-file .env nest-api-auth
```

## API Documentation

Esta API está documentada con **Swagger**. Una vez que ejecutes el servidor, puedes acceder a la documentación interactiva en:

```
http://localhost:3000/api/docs
```

En Swagger UI podrás:

- Ver todos los endpoints disponibles
- Probar los endpoints directamente desde la interfaz
- Ver los schemas de las request y response
- Entender los parámetros requeridos y opcionales

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## 🚀 Deployment

Este proyecto incluye un **pipeline CI/CD completo** configurado con GitHub Actions que automatiza el deploy a AWS EC2.

### Flujo automático:

1. Push a la rama `main`
2. GitHub Actions construye la imagen Docker
3. La imagen se sube a Docker Hub
4. Se despliega automáticamente en AWS EC2

### Configuración del Deployment:

Para configurar el deployment automático, consulta la **[Guía completa de CI/CD](docs/CI-CD-GUIDE.md)** donde encontrarás:

- Cómo configurar los Secrets en GitHub
- Explicación detallada del workflow `.github/workflows/main.yml`
- Setup de AWS EC2
- Troubleshooting y solución de problemas

**Archivos clave:**

- `.github/workflows/main.yml` - Pipeline de CI/CD
- `Dockerfile` - Configuración de la imagen Docker
- `docker-compose.yml` - Orquestación de servicios

## 🔮 Futuras Implementaciones

Este proyecto es funcional pero hay mejoras pendientes para hacerlo production-ready:

### Autenticación Avanzada

- **Passport.js Integration** - Migrar la autenticación actual a usar `@nestjs/passport` para mayor flexibilidad y soporte de múltiples estrategias (JWT, OAuth, etc.)
- **Refresh Token** - Implementar sistema de refresh tokens para renovar el access token sin que el usuario deba autenticarse nuevamente
  - Tokens de corta duración (access token: 15 min)
  - Refresh token de larga duración (7-30 días)
  - Endpoint `/auth/refresh` para obtener nuevo access token
  - Almacenamiento seguro de refresh tokens

### Otras Mejoras Planeadas

- Tests automáticos en el pipeline CI/CD
- Versionado de API (v1, v2)
- Rate limiting y throttling
- Logging estructurado con Winston
- Health checks endpoints
- Migraciones de base de datos automáticas
- Monitoreo y alertas

**Contribuciones:** Si quieres implementar alguna de estas features, ¡los PRs son bienvenidos! 🚀

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
