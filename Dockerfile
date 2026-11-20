# ==========================================
# Multi-stage Dockerfile para Fixer Backend
# Node.js + TypeScript + Express + Sequelize
# ==========================================

# 1. Etapa de Compilación / Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copia de manifiestos de dependencias
COPY package*.json tsconfig.json ./

# Instalación de dependencias completas para compilar TypeScript
RUN npm install

# Copia de código fuente
COPY src ./src

# Compilación de TypeScript a JavaScript estándar en dist/
RUN npm run build

# 2. Etapa de Producción / Runtime Liviano
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copia de manifiesto de dependencias y solo instalación de dependencias de producción
COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Copia de artefactos compilados desde el stage builder
COPY --from=builder /app/dist ./dist

# Uso de usuario no privilegiado por seguridad
USER node

# Exposición del puerto HTTP
EXPOSE 3000

# Verificación de salud interna del contenedor
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

# Comando de inicio del servidor
CMD ["node", "dist/server.js"]
