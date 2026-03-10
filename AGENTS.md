# VUE VBEN ADMIN FRONTEND KNOWLEDGE BASE

**Generated:** 2026-03-10  
**Commit:** 6cfa3a83  
**Branch:** fsa

## OVERVIEW
Vue Vben Admin 5.5.6 monorepo — modern admin template with Vue 3, Vite, TypeScript, and Ant Design Vue. Includes FSA (Family Sales Assistant) app for automated shopping task management.

## STRUCTURE
```
frontend/
├── apps/
│   ├── web-fsa/          # FSA project (Family Sales Assistant)
│   ├── web-antd/         # Ant Design demo
│   ├── web-ele/          # Element Plus demo
│   ├── web-naive/        # Naive UI demo
│   └── backend-mock/     # Mock API server
├── packages/             # Shared workspace packages
│   ├── @core/            # Core UI components, form, table
│   ├── stores/           # Pinia stores
│   ├── locales/          # i18n
│   ├── hooks/            # Composables
│   └── utils/            # Utilities
├── internal/             # Build tooling (vite-config, tsconfig, lint configs)
├── docs/                 # Documentation site
└── playground/           # E2E test playground
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| FSA app | `apps/web-fsa/` | Family Sales Assistant project |
| Shared components | `packages/@core/ui-kit/` | Reusable UI components |
| Vite config | `internal/vite-config/` | Shared Vite configuration |
| TypeScript config | `internal/tsconfig/` | Shared tsconfig presets |
| Lint configs | `internal/lint-configs/` | ESLint, Prettier, Stylelint |
| Pinia stores | `packages/stores/` | Shared state management |
| i18n | `packages/locales/` | Internationalization |
| Hooks | `packages/hooks/` | Vue composables |

## CONVENTIONS

- **Monorepo**: pnpm workspaces + Turbo orchestration
- **Node Version**: 22.1.0 required (see `.node-version`)
- **Package Manager**: pnpm >=9.12.0
- **Import Alias**: `#/*` for src imports (not `@/`)
- **Line Endings**: LF (not CRLF)
- **Indentation**: 2 spaces
- **Quotes**: Single quotes
- **Max Line Length**: 100 characters
- **Module System**: ES modules (`"type": "module"`)
- **Configs**: All extend shared @vben packages (ESLint, Prettier, Stylelint, Commitlint)
- **Registry**: npmmirror (China mirror)

## ANTI-PATTERNS (THIS PROJECT)

**NEVER:**
- Modify framework code outside `apps/web-fsa/src/` — only edit project-specific code
- Use `@/` import alias — use `#/` instead
- Use `console.log()` — use proper logging framework
- Use `@ts-ignore` or `as any` — maintain strict TypeScript typing
- Use `window.URL`, `localStorage`, `sessionStorage` directly — use Vben abstractions
- Use `eval()`, `Function()`, `innerHTML` — security risk

## COMMANDS

```bash
# Development
cd frontend
pnpm install              # Install dependencies
pnpm dev:fsa              # Start FSA app dev server
pnpm dev                  # Start all apps

# Build
pnpm build:fsa            # Build FSA app only
pnpm build                # Build all apps
pnpm build:analyze        # Build with bundle analysis

# Quality
pnpm typecheck            # Type-check all packages
pnpm lint                 # Lint all code
pnpm format               # Format code
pnpm check                # Full quality check

# Testing
pnpm test:unit            # Run unit tests (Vitest)
pnpm test:e2e             # Run E2E tests (Playwright)

# Preview
pnpm preview              # Preview production build
```

## TECH STACK

**Core:**
- Vue 3.5.13 (Composition API)
- Vite 6.3.4 (build tool)
- TypeScript 5.8.3
- Ant Design Vue 4.2.6
- Pinia (state management)
- Vue Router (routing)

**Testing:**
- Vitest 3.1.2 (unit tests, happy-dom)
- Playwright 1.52.0 (E2E tests)
- @vue/test-utils 2.4.6

**Build:**
- Turbo 2.5.2 (monorepo orchestration)
- pnpm 10.10.0 (package manager)
- ESLint 9.26.0, Prettier 3.5.3, Stylelint 16.19.1

**FSA-Specific:**
- Socket.io Client 4.8.1 (real-time updates)
- Watermark.js Plus (blind watermark)

## NOTES

- Monorepo with 4 demo apps + FSA project
- Shared packages via workspace dependencies
- Turbo caching for fast builds
- Catalog versioning for centralized dependency management
- Dev proxy configured for `/api` and `/socket.io` to localhost:3000
- Tests use colocated pattern (`__tests__/` or `.test.ts`)
- E2E tests in `playground/__tests__/e2e/`
- Git hooks via lefthook (currently disabled)
- Browser support: last 2 versions, >1% market share, no IE11
