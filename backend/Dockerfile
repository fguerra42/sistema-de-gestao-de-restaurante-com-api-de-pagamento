FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./

# 🔧 CONFIGURAÇÃO DE REDE: Ajustada com as propriedades corretas para o NPM do Node 22
RUN npm config set fetch-retry-maxtimeout 120000 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-timeout 120000

RUN npm ci

# 🗂️ PRISMA 7: Configuração e geração do client
COPY prisma.config.ts ./  
COPY prisma ./prisma
RUN npx prisma generate

# 🚀 NEXT.JS: Cópia do código e compilação da aplicação
COPY tsconfig.json ./
COPY next.config.ts ./
COPY src ./src
COPY server.ts ./

RUN npm run build

# ==========================================
# ETAPA DE PRODUÇÃO (RUNNER)
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache openssl

# Configura usuário do sistema para segurança do container
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia dependências e arquivos gerados no builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma.config.ts ./  
COPY --from=builder /app/prisma ./prisma

# Copia código fonte e o build de produção do Next.js
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/.next ./.next
COPY start.sh ./

# Permissões do script de inicialização e pastas de upload
RUN chmod +x start.sh
RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["sh", "start.sh"]