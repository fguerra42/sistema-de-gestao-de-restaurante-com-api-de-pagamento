# ==========================================
# ETAPA DE COMPILAÇÃO (BUILDER)
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./

# 🛠️ Instalação leve: Não trava a memória e ignora os bugs de arquivo do Windows
RUN npm install --no-audit --progress=false

# 🗂️ PRISMA 7: Configuração e geração do client
COPY prisma.config.ts ./  
COPY prisma ./prisma

# Gera o Prisma usando as dependências que acabaram de ser instaladas
RUN npx --no-install prisma generate

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

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/prisma.config.ts ./  
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src ./src
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/.next ./.next
COPY start.sh ./

RUN chmod +x start.sh
RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3006
ENV NODE_ENV=production
ENV PORT=3006

CMD ["sh", "start.sh"]