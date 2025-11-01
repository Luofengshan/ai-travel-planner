# ---- Build stage ----
FROM node:18-alpine AS builder

WORKDIR /app

ARG NPM_REGISTRY=https://registry.npmmirror.com

# Build-time envs for Vite (must start with VITE_). Pass via --build-arg
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_AMAP_API_KEY
ARG VITE_AMAP_SECURITY_JS_CODE
ARG VITE_ALIBABA_ACCESS_KEY_ID
ARG VITE_ALIBABA_ACCESS_KEY_SECRET
ARG VITE_DASHSCOPE_API_KEY
ARG VITE_XUNFEI_APP_ID
ARG VITE_XUNFEI_API_KEY
ARG VITE_XUNFEI_API_SECRET

# Install dependencies first (better layer caching)
COPY package.json package-lock.json ./
# Speed up npm by using mirror; disable audit/fund for CI (no BuildKit flags)
RUN npm config set registry $NPM_REGISTRY \
  && npm ci --no-audit --no-fund

# Copy the rest of the source and build
COPY . .
# Expose VITE_ variables to Vite at build time
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_AMAP_API_KEY=$VITE_AMAP_API_KEY \
    VITE_AMAP_SECURITY_JS_CODE=$VITE_AMAP_SECURITY_JS_CODE \
    VITE_ALIBABA_ACCESS_KEY_ID=$VITE_ALIBABA_ACCESS_KEY_ID \
    VITE_ALIBABA_ACCESS_KEY_SECRET=$VITE_ALIBABA_ACCESS_KEY_SECRET \
    VITE_DASHSCOPE_API_KEY=$VITE_DASHSCOPE_API_KEY \
    VITE_XUNFEI_APP_ID=$VITE_XUNFEI_APP_ID \
    VITE_XUNFEI_API_KEY=$VITE_XUNFEI_API_KEY \
    VITE_XUNFEI_API_SECRET=$VITE_XUNFEI_API_SECRET
RUN npm run build


# ---- Runtime stage ----
FROM nginx:alpine AS runtime

# Nginx config with SPA fallback for React/Vite
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static assets
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Healthcheck (optional but helpful in orchestrators)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ || exit 1

# Nginx will run by default with the provided config

