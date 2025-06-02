# Etap 1

# Instalacja obrazu i określenie autora pliku
FROM scratch AS dev_app
ADD alpine-minirootfs-3.21.3-aarch64.tar /
LABEL org.opencontainers.image.authors="Daniel Mędrek"

# Instalacja niezbędnych zależności
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl nodejs npm

# Kopiowanie pliku package z informacjami dla serwera node i instalacja zależności
WORKDIR /app
COPY package.json ./
RUN npm install

# Etap 2

# Instalacja obrazu z zależnością node i określenie autora pliku
FROM node:20-alpine AS prod_app
LABEL org.opencontainers.image.authors="Daniel Mędrek"

# Instalacja zależności curl
RUN apk update && \
    apk upgrade && \
    apk add --no-cache curl

# Kopiowanie zainstalowanych bibliotek node oraz plików z funkcjonalnościami serwera do głównego katalogu aplikacji
WORKDIR /app

COPY --from=dev_app /app/node_modules ./node_modules
COPY . .

# Informacja o umożliwieniu aplikacji nasłuchiwania na porcie 3000
EXPOSE 3000

# Implementacja healthcheck aby zautomatyzować proces weryfikacji prawidłowego działania uruchomionej aplikacji
HEALTHCHECK --interval=10s --timeout=1s \
  CMD curl http://localhost:3000/ || exit 1

# Domyślne polecenie uruchamiane przy starcie kontenera
CMD ["node", "app.js"]
