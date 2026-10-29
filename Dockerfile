FROM node:24-bookworm-slim
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml ./
RUN npx --yes pnpm@11.25.0 install --frozen-lockfile
COPY . .
RUN npm run build:server && mkdir -p /data && chown -R node:node /data /app/.next
ENV NODE_ENV=production LESSONBENCH_PUBLIC_MODE=1 LESSONBENCH_DB_FILE=/data/lessonbench.sqlite
USER node
EXPOSE 3000
CMD ["node","node_modules/next/dist/bin/next","start","-H","0.0.0.0","-p","3000"]
