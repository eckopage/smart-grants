# Smart Grants

Platforma agregująca dotacje i kredyty unijne oraz krajowe dla polskich
przedsiębiorców (MŚP). Model: subskrypcja dla przedsiębiorców + marketplace
leadów dla firm doradczych.

> **Status:** Faza 0 — szkielet monorepo. Kolejne fazy (Auth, model `Grant`,
> mapa, płatności, marketplace firm, workspace aplikacji, scraper, SEO) będą
> dodawane etapami — patrz specyfikacja projektu.

## Struktura repozytorium

Monorepo oparte o npm workspaces:

```
apps/
  api/   # NestJS — REST API (MongoDB/Mongoose, Swagger, JWT w kolejnych fazach)
  web/   # React + Vite + TypeScript — frontend (Tailwind, React Query, React Router)
```

## Stack (Faza 0)

- **Backend:** NestJS, Mongoose (MongoDB), `@nestjs/config` (walidacja env przez
  `class-validator`), Swagger (`/api/docs`), Helmet, CORS, globalny
  `ValidationPipe`.
- **Frontend:** React + TypeScript (Vite), Tailwind CSS, TanStack Query, React
  Router, react-hook-form + zod (gotowe pod formularze w kolejnych fazach).
- **Baza danych (lokalnie):** MongoDB przez Docker Compose. Docelowo (staging/
  produkcja): MongoDB Atlas — wystarczy podmienić `MONGODB_URI`.
- **Redis (lokalnie):** Docker Compose. Docelowo: Upstash Redis (kompatybilny
  z BullMQ) — kolejki/scraper zostaną dodane w Fazie 8.
- **CI:** GitHub Actions — lint, testy (unit + e2e z realnym kontenerem
  MongoDB), build dla obu aplikacji.

## Wymagania

- Node.js 20+ (patrz `.nvmrc`)
- Docker (dla lokalnej bazy MongoDB/Redis) — opcjonalnie, wymagane do testów
  e2e API i pełnego działania aplikacji lokalnie

## Szybki start (lokalnie)

```bash
# 1. Instalacja zależności (root, obejmuje oba workspace'y)
npm install

# 2. Zmienne środowiskowe
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 3. Baza danych lokalnie (MongoDB + Redis)
docker compose up -d

# 4. Uruchomienie API (http://localhost:3000, Swagger: /api/docs)
npm run dev:api

# 5. Uruchomienie frontendu (http://localhost:5173)
npm run dev:web
```

Strona główna frontendu wywołuje `GET /health` na API, żeby potwierdzić
połączenie między aplikacjami.

## Skrypty (root)

| Skrypt | Opis |
|---|---|
| `npm run dev:api` / `npm run dev:web` | Serwery deweloperskie |
| `npm run build` | Build obu aplikacji |
| `npm run lint` | Lint obu aplikacji |
| `npm run test` | Testy jednostkowe obu aplikacji |
| `npm run test:e2e:api` | Testy e2e API (wymaga działającego MongoDB — patrz niżej) |

## Testy e2e API

Testy e2e (`apps/api/test/app.e2e-spec.ts`) uruchamiają pełny `AppModule`,
więc wymagają dostępnego MongoDB pod `MONGODB_URI`:

```bash
docker compose up -d mongo
npm run test:e2e:api
```

W CI (GitHub Actions) e2e uruchamiane są automatycznie z kontenerem
serwisowym `mongo:7`.

## Endpointy API (Faza 0)

- `GET /health` — liveness check
- `GET /health/db` — sprawdzenie połączenia z MongoDB
- `GET /api/docs` — dokumentacja Swagger/OpenAPI

## Architektura pod przyszłe wymagania

- **Mapa jako główny widok przeglądania dotacji** zostanie dodana w Fazie 3
  za interfejsem `MapProvider`, tak aby dostawcę mapy (Google Maps →
  Leaflet/Mapbox) można było podmienić bez zmian w logice biznesowej.
- **Integracje infrastrukturalne** (storage plików, e-mail, kolejki) będą
  budowane za interfejsami (`StorageProvider`, `MailProvider`,
  `QueueProvider`), żeby przejście z tanich usług startowych (Cloudflare R2,
  Resend/Brevo, Upstash) na AWS (S3, SES, SQS) w przyszłości było wymianą
  jednej implementacji.
- **Ceny i limity planów subskrypcji** będą konfigurowalne w bazie danych /
  panelu admina, a nie zahardkodowane — dodane w Fazie 4.

## Docelowe środowisko (staging/produkcja)

- Backend (API + worker scrapera): Railway.app / Render.com
- Frontend: Vercel / Netlify
- Baza danych: MongoDB Atlas (tier M0 na start)
- Redis/kolejki: Upstash
- Storage plików: Cloudflare R2
- E-mail transakcyjny: Resend / Brevo
- Monitoring błędów: Sentry
- CDN/domena: Cloudflare

Sekrety (klucze PayU, Upstash, Resend/Brevo, R2, JWT) trzymane wyłącznie w
zmiennych środowiskowych platformy hostingowej — nigdy w repozytorium.
