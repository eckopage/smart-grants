# Smart Grants

Platforma agregująca dotacje i kredyty unijne oraz krajowe dla polskich
przedsiębiorców (MŚP). Model: subskrypcja dla przedsiębiorców + marketplace
leadów dla firm doradczych.

> **Status:** Faza 6 — przycisk „Chcę aplikować” + podstawowy model
> `Application` (status, dopasowanie firmy) + powiadomienia e-mail. Kolejne
> fazy (pełny workspace aplikacji, scraper, SEO) będą dodawane etapami —
> patrz specyfikacja projektu.

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

## Endpointy API

- `GET /health` — liveness check
- `GET /health/db` — sprawdzenie połączenia z MongoDB
- `GET /api/docs` — dokumentacja Swagger/OpenAPI
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`,
  `POST /auth/logout`, `GET /auth/me` — rejestracja i logowanie (JWT access +
  refresh token w httpOnly cookie, hasła hashowane argon2)
- `GET /grants`, `GET /grants/:slug` — publiczna lista (z filtrowaniem:
  województwo, kategoria, tagi, typ, status naboru, kwota, termin) i widok
  szczegółowy dotacji
- `POST/GET/PATCH/DELETE /admin/grants(/:id)` — CRUD dotacji dla roli `admin`
- `GET /plans?audience=entrepreneur|company` — publiczna lista aktywnych
  planów; `POST/GET/PATCH/DELETE /admin/plans(/:key)` — CRUD planów dla roli
  `admin` (ceny i limity konfigurowalne w bazie, nie hardkodowane)
- `POST /payments/checkout` — tworzy zamówienie PayU dla wybranego planu i
  zwraca URL do przekierowania; `POST /payments/webhook` — odbiera
  powiadomienia PayU (IPN), weryfikuje podpis MD5 i aktywuje subskrypcję
- `GET /subscriptions/me` — aktywna subskrypcja zalogowanego użytkownika
- `GET/POST/DELETE /users/me/favorites(/:grantId)` — ulubione dotacje;
  dodawanie wymaga aktywnej subskrypcji i respektuje limit `maxFavorites`
  planu użytkownika
- `GET /companies`, `GET /companies/:id` — publiczny katalog firm doradczych
  (filtrowanie: województwo, specjalizacja, nazwa), posortowany wg planu
  (premium_leads > featured > basic_listing)
- `POST /companies/me`, `GET/PATCH /companies/me/profile` — profil firmy dla
  roli `company`
- `PATCH /admin/companies/:id/verify` — weryfikacja firmy przez admina
- `GET /grants/:slug/recommended-companies` — firmy dopasowane do dotacji wg
  kategorii i województwa (widoczne w widoku szczegółowym dotacji)
- `POST /applications` — „Chcę aplikować” (tworzy zgłoszenie w statusie
  `intent`, wymaga aktywnej subskrypcji), wysyła e-mail potwierdzający do
  użytkownika i powiadomienia do dopasowanych firm doradczych
- `GET /applications/me` — zgłoszenia zalogowanego przedsiębiorcy
- `GET /applications/company/matched` — zgłoszenia pasujące do specjalizacji
  firmy (rola `company`), jeszcze nie podjęte
- `PATCH /applications/:id/take` — firma podejmuje zgłoszenie (status →
  `matched`); `PATCH /applications/:id/withdraw` — użytkownik wycofuje
  zgłoszenie
- `GET /applications/:id` — szczegóły (dostęp: właściciel zgłoszenia lub
  przypisana firma)

### Dane przykładowe

```bash
npm run seed:grants --workspace=api
npm run seed:plans --workspace=api
```

`seed:grants` wypełnia bazę kilkoma przykładowymi dotacjami (dotacja
regionalna, kredyt BGK, program centralny UE). `seed:plans` tworzy plany
Starter/Pro/Business (przedsiębiorcy) oraz Basic Listing/Featured/Premium
Leads (firmy doradcze) z cennika ze specyfikacji.

### Płatności (PayU)

Integracja PayU jest zbudowana za interfejsem `PaymentProvider`
(`apps/api/src/payments/providers`), więc dodanie kolejnego operatora (np.
Stripe pod inne rynki) nie wymaga zmian w logice checkout/webhooka.
Domyślnie `PAYU_API_URL` wskazuje na środowisko sandbox
(`secure.snd.payu.com`) — do pełnego przetestowania płatności potrzebne są
prawdziwe dane testowe z panelu PayU (`PAYU_CLIENT_ID`, `PAYU_CLIENT_SECRET`,
`PAYU_POS_ID`, `PAYU_SECOND_KEY` w `.env`).

## Architektura pod przyszłe wymagania

- **Mapa jako główny widok przeglądania dotacji** — zaimplementowana za
  interfejsem `MapProvider` (`apps/web/src/lib/map`). Domyślny provider to
  Leaflet + OpenStreetMap (bez płatnego API i klucza), z granicami
  województw (`public/geo/wojewodztwa.geojson`). Podmiana na Google
  Maps/Mapbox w przyszłości = nowa implementacja `MapProviderComponent` +
  zmiana jednego eksportu w `lib/map/index.ts`, bez zmian w logice
  biznesowej (`GrantsPage`).
- **Integracje infrastrukturalne** za interfejsami adapterów:
  `MailProvider` (`apps/api/src/mail`) — domyślnie `ConsoleMailProvider`
  (loguje zamiast wysyłać), docelowo Resend/Brevo bez zmian w logice
  biznesowej. `StorageProvider`/`QueueProvider` (Cloudflare R2, Upstash)
  dołączą w Fazie 7/8, z myślą o migracji na AWS (S3, SQS) w przyszłości
  przez wymianę jednej implementacji.
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
