# Etapa 1: Instalación y Construcción
FROM node:22-alpine AS builder

# Instalamos pnpm globalmente
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copiamos solo los archivos de dependencias primero para aprovechar el cache de Docker
COPY package.json pnpm-lock.yaml ./

# Instalamos todas las dependencias (incluyendo las de desarrollo para poder compilar)
RUN pnpm install --frozen-lockfile

# Copiamos el resto del código y generamos la carpeta /dist
COPY . .
RUN pnpm run build

# Etapa 2: Producción
FROM node:22-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copiamos solo lo necesario desde la etapa anterior
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist

# Instalamos solo las dependencias de producción para ahorrar espacio
RUN pnpm install --prod --frozen-lockfile

# Exponemos el puerto que usa tu app de NestJS (por defecto 3000)
EXPOSE 3000

CMD ["node", "dist/main"]