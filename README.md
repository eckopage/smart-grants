# Smart Grants

Platforma agregująca dotacje i kredyty unijne oraz krajowe dla polskich
przedsiębiorców (MŚP). Model: subskrypcja dla przedsiębiorców + marketplace
leadów dla firm doradczych.

> **Status:** Faza 9 (ostatnia) — dopracowanie UX (wspólny navbar), SEO
> (dynamiczne tytuły/opisy stron, sitemap.xml, robots.txt) i integracja GA4.
> Wszystkie fazy ze specyfikacji projektu są zaimplementowane; dalszy rozwój
> (realne dane testowe PayU/R2, dodatkowe adaptery scrapera, SSR) to naturalne
> kolejne kroki opisane w odpowiednich sekcjach poniżej.

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

W CI (GitHub Actions) e2e uruchamiane są automatycznie z kontenerami
serwisowymi `mongo:7` i `redis:7-alpine` (od Fazy 8 API wymaga Redis do
uruchomienia — kolejki BullMQ).

## Moduł ingestion (scraper)

Adaptery źródeł danych implementują wspólny interfejs `GrantSource`
(`apps/api/src/ingestion/grant-source.interface.ts`) i są uruchamiane przez
`IngestionService` w zadaniu BullMQ (kolejka `ingestion`, harmonogram co 6h
przez `@nestjs/schedule`), każdy z osobną obsługą błędów, żeby awaria
jednego źródła nie przerywała synchronizacji pozostałych.

Zaimplementowane adaptery (w kolejności priorytetowej ze specyfikacji):

1. **EU Funding & Tenders Portal** (`eu-funding.source.ts`) — publiczne API
   wyszukiwania SEDIA. Dokładny kształt zapytania/odpowiedzi nie był
   możliwy do zweryfikowania na żywo z tego środowiska (brak dostępu
   wychodzącego do tego hosta w trakcie developmentu) — adapter jest
   napisany defensywnie (błędny kształt odpowiedzi = zalogowany błąd i
   pusty wynik dla tego przebiegu, a nie wyjątek), ale mapowanie pól w
   `mapResult()` warto zweryfikować względem aktualnej dokumentacji portalu
   przed użyciem produkcyjnym.
2. **dane.gov.pl** (`dane-gov.source.ts`) — oficjalne REST API
   (`api.dane.gov.pl`, format JSON:API). Ponieważ dane.gov.pl to katalog
   otwartych danych, a nie baza dotacji, adapter celowo nie zgaduje, który
   zbiór danych zawiera nabory — działa jako udokumentowany no-op, dopóki
   nie skonfigurujesz `DANE_GOV_PL_RESOURCE_ID` wskazującego na konkretny
   zasób (np. publikowany przez ministerstwo wykaz naborów), po czym
   mapowanie kolumn w `mapRow()` należy dopasować do tego zasobu.
3. Portale RPO (16 województw) i `funduszeeuropejskie.gov.pl` (wymaga
   Playwright i ostrożnej weryfikacji regulaminu/robots.txt) — zaplanowane,
   nie zaimplementowane w tej fazie.

Deduplikacja/diffing: `GrantsService.upsertFromExternalSource()` dopasowuje
rekordy po parze `(sourceSystem, externalId)` (unikalny indeks), aktualizuje
istniejące dotacje tylko przy realnej zmianie (tytuł/opis/termin), zamiast
nadpisywać ślepo. Historia przebiegów (`IngestionRun`) jest dostępna przez
`GET /admin/ingestion/runs`.

## SEO, UX i analityka

- Wspólny navbar (`Navbar.tsx`) z linkami zależnymi od stanu logowania,
  widoczny na wszystkich stronach.
- Dynamiczny `<title>` i meta description per strona (`useDocumentMeta`) —
  **to rozwiązanie działa tylko po stronie klienta**: aplikacja to SPA
  (Vite + React Router), więc crawlery, które nie wykonują JS (lub robią to
  zanim treść się zamontuje), tego nie zobaczą. Prawdziwe SEO dla
  publicznego katalogu ofert (`/grants/:slug`) wymagałoby SSR/prerenderingu
  — np. migracji na Next.js/Remix albo osobnego kroku prerenderującego —
  co jest świadomie poza zakresem tego etapu.
- `GET /sitemap.xml` (API) — generowany dynamicznie z aktualnych dotacji;
  w produkcji podepnij go pod domenę główną (np. regułą/workerem
  Cloudflare), żeby crawlery widziały go pod `/sitemap.xml` strony, a nie
  subdomeny API. `apps/web/public/robots.txt` wskazuje na tę ścieżkę.
- Google Analytics 4: `VITE_GA4_MEASUREMENT_ID` — nieustawiony = brak
  jakiegokolwiek trackingu (bezpieczny domyślny stan); ustawiony = ładuje
  gtag.js i wysyła `page_view` przy każdej zmianie trasy.

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
- `POST /applications/:id/documents/upload-url` — zwraca podpisany URL do
  przesłania pliku bezpośrednio do Cloudflare R2 (PUT), bez przechodzenia
  przez API; `POST /applications/:id/documents` — rejestruje metadane
  dokumentu (wersjonowanie po nazwie+kategorii); `GET
  /applications/:id/documents/:documentId/download-url` — podpisany URL do
  pobrania (5 min ważności) — pliki nigdy nie są publicznie dostępne
- `POST /applications/:id/messages` — wątek wiadomości klient↔doradca (z
  powiadomieniem e-mail do drugiej strony); `PATCH
  /applications/:id/messages/read` — oznacza wiadomości jako przeczytane
- `POST /applications/:id/timeline` — dodaje pozycję osi czasu (termin,
  przypisanie, opis); `PATCH /applications/:id/timeline/:itemId` — zmienia
  status (pending/done/overdue)
- Codzienne przypomnienia e-mail o zbliżających się terminach z osi czasu
  (`DeadlineReminderScheduler`, `@nestjs/schedule`, 2 dni przed terminem)
- `GET /admin/ingestion/runs` — historia uruchomień scrapera (per źródło:
  liczba znalezionych/utworzonych/zaktualizowanych dotacji, błędy);
  `POST /admin/ingestion/run` — ręczne wymuszenie synchronizacji

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
  (loguje zamiast wysyłać), docelowo Resend/Brevo. `StorageProvider`
  (`apps/api/src/storage`) — domyślnie `R2StorageProvider` (Cloudflare R2,
  S3-compatible, presigned URLs do uploadu/downloadu). Kolejki: BullMQ na
  Redis (lokalnie: docker-compose; docelowo: Upstash Redis — kompatybilny,
  wystarczy podmienić `REDIS_URL`). Migracja na AWS (S3, SES, SQS) w
  przyszłości = wymiana jednej implementacji za każdym interfejsem, bez
  zmian w logice biznesowej.
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
