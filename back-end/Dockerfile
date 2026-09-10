FROM node:24-alpine AS builder
WORKDIR /app

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY back-end/package.json ./back-end/

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente y configuración de TypeScript
COPY back-end/tsconfig.json ./back-end/
COPY back-end/src ./back-end/src

# Compilar indicando el filtro del workspace
RUN pnpm --filter back-end build

# Etapa de producción
FROM node:24-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

# Habilitar pnpm
RUN corepack enable && corepack prepare pnpm@12.3.4 --activate

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY back-end/package.json ./back-end/

# Instalar únicamente dependencias de producción
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Copiar código compilado
COPY --from=builder /app/back-end/dist ./back-end/dist

# Puerto utilizado por la aplicación
EXPOSE 3000

# Ejecutar aplicación
CMD ["pnpm", "--filter", "back-end", "start"]
