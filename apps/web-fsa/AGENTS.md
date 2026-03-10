# FSA APP KNOWLEDGE BASE

**Generated:** 2026-03-10  
**Parent:** /frontend/AGENTS.md

## OVERVIEW
Family Sales Assistant (FSA) — Vue 3 admin app for automated shopping task management on Loreal, Estée Lauder, and L'Occitane websites. Real-time task updates via Socket.io, Ant Design Vue UI.

## STRUCTURE
```
web-fsa/
├── src/
│   ├── api/              # API layer
│   │   ├── core/         # Domain APIs (auth, account, task, activity, user, menu, lorealDatabase)
│   │   ├── index.ts      # Barrel export
│   │   └── request.ts    # Axios HTTP client
│   ├── views/            # Page components
│   │   ├── home/         # Feature pages (account, activity, task, user, loreal-database, workspace)
│   │   └── _core/        # Core pages (auth, fallback, about)
│   ├── router/           # Vue Router
│   │   ├── routes/       # Route definitions (core + modules)
│   │   ├── guard.ts      # Route guards
│   │   ├── access.ts     # Permission filtering
│   │   └── index.ts      # Router instance
│   ├── store/            # Pinia stores
│   │   ├── auth.ts       # Authentication store
│   │   └── index.ts      # Barrel export
│   ├── locales/          # i18n
│   │   └── langs/        # zh-CN, en-US
│   ├── adapter/          # Component adapters (Ant Design Vue)
│   ├── components/       # Custom components (BlindWatermark)
│   ├── composables/      # Vue composables (useBlindWatermark)
│   ├── layouts/          # Layout components
│   ├── types/            # TypeScript types
│   ├── main.ts           # Entry point
│   ├── bootstrap.ts      # App initialization
│   ├── app.vue           # Root component
│   └── preferences.ts    # App configuration
├── public/               # Static assets
├── dist/                 # Build output
├── vite.config.mts       # Vite configuration
├── tsconfig.json         # TypeScript configuration
├── tailwind.config.mjs   # Tailwind CSS
└── package.json          # Dependencies + scripts
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Entry point | `src/main.ts` → `src/bootstrap.ts` | App initialization |
| Root component | `src/app.vue` | Wraps RouterView with theme provider |
| API calls | `src/api/core/{domain}.ts` | auth, account, task, activity, user, menu, lorealDatabase |
| HTTP client | `src/api/request.ts` | Axios with interceptors |
| Routing | `src/router/routes/modules/home.ts` | Feature routes |
| Route guards | `src/router/guard.ts` | Permission checks |
| State management | `src/store/auth.ts` | Login, user info, access codes |
| Pages | `src/views/home/{feature}/` | Account, activity, task, user, loreal-database |
| i18n | `src/locales/langs/zh-CN/page.json` | Chinese translations |
| Config | `src/preferences.ts` | Theme, layout, widgets |
| Socket.io | `src/bootstrap.ts` → `useSocket()` | Real-time updates |

## CONVENTIONS

- **Import Alias**: `#/*` for src imports (e.g., `import { $t } from '#/locales'`)
- **API Format**: All responses follow `{ code, data, error, message }` format
- **HTTP Method**: POST for all endpoints (backend convention)
- **Routing**: Hash mode (default) or history mode
- **State**: Pinia stores (Composition API)
- **i18n**: Chinese (zh-CN) primary, English (en-US) secondary
- **Components**: Ant Design Vue + custom Vben components
- **Styling**: Tailwind CSS + Ant Design tokens
- **Real-time**: Socket.io client connects to backend on bootstrap

## ANTI-PATTERNS (THIS PROJECT)

**NEVER:**
- Use `@/` import alias — use `#/` instead
- Use `console.log()` — use proper logging
- Use `@ts-ignore` or `as any` — maintain strict typing
- Modify framework code outside `src/` — only edit project-specific code
- Hardcode API URLs — use `VITE_GLOB_API_URL` env var
- Skip i18n — all user-facing strings must be translatable

**INCOMPLETE:**
- Historical task log loading (task-log-modal.vue) — marked TODO

## BOOTSTRAP FLOW

1. `main.ts` initializes preferences (namespace, theme)
2. `bootstrap.ts` creates Vue app
3. Registers directives, i18n, Pinia stores
4. Initializes Socket.io client
5. Registers router with guards
6. Mounts app to `#app`
7. `app.vue` wraps RouterView with Ant Design ConfigProvider

## API LAYER

**Structure**: `api/core/{domain}.ts` → `api/index.ts` (barrel export)

**Domains:**
- `auth.ts` — login, logout, getUserInfo, getAccessCodes
- `account.ts` — Account management
- `task.ts` — Task CRUD, execution control
- `activity.ts` — Activity management
- `user.ts` — User management
- `menu.ts` — Navigation menu
- `account-info.ts` — Account info management
- `lorealDatabase.ts` — Loreal product database

**HTTP Client**: `request.ts` (Axios wrapper with interceptors)

## ROUTING

**Structure**: `router/routes/index.ts` aggregates core + modules

**Core Routes** (`routes/core.ts`):
- `/login` — Authentication
- `/403`, `/404`, `/500` — Error pages

**Feature Routes** (`routes/modules/home.ts`):
- `/home/account` — Account management
- `/home/activity` — Activity management
- `/home/account-info` — Account info
- `/home/user` — User management
- `/home/loreal-database` — Loreal products
- `/home/workspace` — Dashboard

**Guards**: `guard.ts` checks permissions before navigation

## ENVIRONMENT VARIABLES

**Base** (`.env`):
- `VITE_APP_TITLE` — App title
- `VITE_APP_NAMESPACE` — Storage namespace
- `VITE_APP_STORE_SECURE_KEY` — Encryption key

**Development** (`.env.development`):
- `VITE_PORT` — Dev server port
- `VITE_GLOB_API_URL` — API base URL (http://localhost:3000/api)
- `VITE_GLOB_SOCKET_URL` — Socket.io URL (http://localhost:3000)
- `VITE_DEVTOOLS` — Enable Vue DevTools

**Production** (`.env.production`):
- `VITE_GLOB_API_URL` — Production API URL
- `VITE_GLOB_SOCKET_URL` — Production Socket.io URL
- `VITE_COMPRESS` — Enable compression
- `VITE_PWA` — Enable PWA

## NOTES

- Dev proxy configured for `/api` and `/socket.io` to localhost:3000
- Socket.io connects on bootstrap for real-time task updates
- Uses Vben Admin component library (workspace packages)
- Blind watermark feature for security
- No tests yet (infrastructure ready)
- Chinese comments throughout
