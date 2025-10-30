# Hono Telescope Monorepo

Bu proje bir Turborepo monorepoya dönüştürülmüştür. Aşağıda klasör yapısı ve her paketin açıklaması bulunmaktadır.

## Klasör Yapısı

```
hono-telescope-3/
├── apps/
│   ├── core/              # @hono-telescope/core - Temel monitoring ve debugging kütüphanesi
│   ├── example/           # @hono-telescope/example - Örnek uygulama
│   └── dashboard/         # @hono-telescope/dashboard - React dashboard
├── packages/
│   └── types/             # @hono-telescope/types - Paylaşılan type tanımları
├── package.json           # Root workspace package.json
├── turbo.json             # Turborepo konfigurasyonu
└── tsconfig.json          # Root TypeScript konfigurasyonu
```

## Paketler

### `@hono-telescope/types` (packages/types)

Tüm paketler tarafından kullanılan paylaşılan type tanımları içerir.

- Interfaces: `TelescopeEntry`, `TelescopeConfig`, `TelescopeStorage` vb.
- Enums: `EntryType`

### `@hono-telescope/core` (apps/core)

Hono Telescope'un ana kütüphanesi. Monitoring, debugging ve veri depolaması işlevlerini sağlar.

- Interceptors (HTTP ve Database)
- Middleware
- Watchers (Exception, Log, Query)
- Routes
- Context Manager

### `@hono-telescope/example` (apps/example)

Core kütüphanesinin nasıl kullanılacağını gösteren örnek uygulama.

### `@hono-telescope/dashboard` (apps/dashboard)

React tabanlı web arayüzü. Monitored verileri görselleştirmek için kullanılır.

- Built with Vite + React 18
- Ant Design UI components
- Redux for state management

## Komutlar

### Root Level

```bash
# Tüm paketleri build et
npm run build

# Belirli paketi build et
npm run build:core
npm run build:dashboard

# Geliştirme modu (tüm paketler)
npm run dev

# Belirli paketi dev modunda çalıştır
npm run dev:example
npm run dev:dashboard

# Test çalıştır
npm run test
npm run test:ui

# Type check
npm run type-check

# Temizle
npm run clean
```

### Workspace Level

Her paket kendi package.json'ında spesifik scriptlere sahiptir:

```bash
# Core paketinde
cd apps/core
npm run build
npm run dev
npm run test

# Dashboard paketinde
cd apps/dashboard
npm run dev      # Vite dev server
npm run build    # Production build
npm run preview  # Preview mode

# Example paketinde
cd apps/example
npm run dev      # Watch mode
npm run build    # Build with bun
npm run start    # Start built app
```

## Dependency Yönetimi

- **Shared dependencies**: Root `package.json`'da tanımlanır
- **Package-specific dependencies**: Her paketin `package.json`'ında tanımlanır
- **Internal dependencies**: Paketler arasındaki bağımlılıklar `*` versiyonu ile tanımlanır (örn. `"@hono-telescope/types": "*"`)

## Hızlı Başlangıç

### 1. Kurulum

```bash
cd hono-telescope-3
npm install
# veya
bun install
```

### 2. Development

```bash
# Tüm paketleri dev modunda çalıştır
npm run dev

# Veya sadece example'ı çalıştır
npm run dev:example
```

### 3. Build

```bash
# Tüm paketleri build et
npm run build

# Kontrol et
ls -la apps/core/dist
ls -la apps/dashboard/dist
```

## Turborepo Pipeline

`turbo.json` dosyası pipeline konfigurasyonunu tanımlar:

- **build**: Dependler build edildikten sonra çalışır
- **dev**: Cache yoktur ve persistent modda çalışır
- **test**: Test komutları sırasında cache kullanılmaz
- **type-check**: Cache kullanılmaz

## Publishing

Paketleri npm'e publish etmek için:

```bash
# apps/core paketini publish et
cd apps/core
npm publish

# @hono-telescope/dashboard paketini publish et
cd apps/dashboard
npm publish
```

## Notlar

- Tüm paketler TypeScript 5.0+ ile yazılmıştır
- Node.js 18+ ve Bun 1.0+ desteklenmektedir
- ESNext modülü kullanılmaktadır
- Strict TypeScript mode etkindir
