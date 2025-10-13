# BLGFXIII_Directory — Quick AI onboarding

This repo is a MERN-style app split into `frontend/` (React + Vite + DaisyUI) and `backend/` (Express + Mongoose). The guidance below highlights project-specific patterns, integration points, and dev commands so an AI agent can be productive quickly.

## Big picture
- Frontend calls backend APIs under `/api/*` via centralized `useApi()` hooks in `frontend/src/services/axios.js`
- Backend entry: `backend/src/blgfServer.js` - In production serves `../frontend/dist` and mounts API routers under `/api`
- **DaisyUI themes with dynamic switching** via `data-theme` attribute on `<html>` element - **DEFAULT: synthwave**
- JWT auth with localStorage persistence and axios request interceptors
- Rate limiting on all routes (50 req/min) via Upstash Redis, with stricter limits for auth endpoints
- React Router for SPA navigation with protected routes using `ProtectedRoute.jsx`

## High-value files to inspect
- Backend: `backend/src/routes/*`, `controllers/*`, `models/*` - example LGU flows in `lguRoutes.js`, `lguController.js`, `LGU.js`
- Middleware: `backend/src/middleware/authMiddleware.js` (JWT), `rateLimiter.js` (Upstash Redis rate limits)
- Frontend services: `frontend/src/services/axios.js` (central API client), `frontend/src/contexts/AuthContext.jsx` (auth state)
- Key pages: `LGUPage.jsx` (caching + normalization patterns), `QRRPAMonitoringPage.jsx` (form handling), `DirectoryPage.jsx` (filtering)
- Navigation: `Sidebar.jsx` (hierarchical nav + themes), `Navbar.jsx` (responsive + mobile menu)

## Project-specific patterns & examples
- API additions: Always add route → controller → model on backend. Mirror new endpoints in `frontend/src/services/axios.js` using `useApi()` hook shape (e.g., `getAllLgus`, `createAssessor`)
- Rate-sensitive UI: `LGUPage.jsx` implements `enqueueRequest(fn, context)` which serializes requests, enforces MIN_INTERVAL_MS, and retries 429/5xx with exponential backoff. Reuse for list operations
- Response normalization: Client code expects different list shapes. Use `normalizeListResponse` from `LGUPage.jsx` (handles `res.data.lgus`, `res.data`, single objects)
- Client caching: Use established listCache (useRef with TTL) and entity Maps (`lguCache`, `assessorsCache`, `smvCache`) pattern in `LGUPage.jsx` for frequently-read lists
- Custom hooks: Domain-specific hooks like `useQrrpa` encapsulate API calls + state management; follow this pattern for new features
- Error handling: Backend uses global error middleware in `blgfServer.js`. Frontend displays toasts via react-hot-toast, see `AssessorsPage.jsx`
- File uploads: Backend handles in `uploads/` dir with type-specific subfolders (e.g., `qrrpa/`, `profile/`). Frontend sends multipart/form-data. Multer configured in routes (see `qrrpaMonitoringRoutes.js`, `usersRoutes.js`)
- Profile pictures: User model has `profilePicture` field; uploads to `uploads/profile/` with validation (5MB, images only). See `PROFILE_PICTURE_IMPLEMENTATION.md` for full flow
- Mobile-first UI: Components like `QRRPAMonitoringPage.jsx` use responsive design with iPhone 12 optimization - flex layouts, collapsible tabs, touch-friendly sizing
- Status mapping: Components like `QRRPAMonitoringPage.jsx` map UI display values to backend enum values using lookup objects
- Cascading filters: Use `getRegions()`, `getProvinces(region)` from axios.js for location-based filtering
- **Theme system & Readability (CRITICAL)**: 
  - Default theme: **synthwave** (set in App.jsx useState)
  - Available themes: corporate, emerald, sunset, synthwave, retro, cyberpunk, valentine, aqua
  - **ALWAYS use DaisyUI semantic classes** for theme compatibility:
    - Backgrounds: `bg-base-100`, `bg-base-200`, `bg-base-300` (never fixed colors like `bg-blue-500`)
    - Text: `text-base-content`, `text-primary-content`, `text-secondary-content` (auto-adjusts for readability)
    - Borders: `border-base-300`, `border-primary` (theme-aware)
    - Cards: `bg-primary`, `bg-secondary`, `bg-accent` with `text-primary-content` etc.
    - Gradients: Use `bg-gradient-to-r from-primary to-primary-focus` (DaisyUI vars adapt to theme)
  - **NEVER hardcode colors** (e.g., `text-gray-900`, `bg-white`) - they break on dark themes
  - **Test readability**: Ensure sufficient contrast (text vs background) across all themes
  - **Buttons**: Use `btn-primary`, `btn-secondary`, `btn-accent` (not `bg-blue-500`)
  - **Alerts**: Use `alert-info`, `alert-success`, `alert-warning`, `alert-error` (theme-aware)
- Hierarchical navigation: `Sidebar.jsx` supports sub-items with expand/collapse behavior; use `subItems` array for nested menus
- Auth updates: AuthContext has `updateUser()` function to sync user data changes (profile edits, picture uploads) across app and localStorage

## Dev & debug commands
- Root build (installs + builds frontend): `npm run build`
- Backend dev (hot reload): `npm run dev --prefix backend` OR `cd backend && npm run dev`
- Frontend dev (Vite): `npm run dev --prefix frontend` OR `cd frontend && npm run dev` 
- Start backend (production): `npm run start --prefix backend` OR `npm run start`
- Lint frontend: `npm run lint --prefix frontend`

## Integration gotchas
- Keep axios `baseURL` and Vite envs in sync with backend `/api` base path
- Backend has rate limiting; client-side `enqueueRequest` is tuned for it - prefer serialized retries vs parallel bursts
- Backend sets `app.set('trust proxy', 1)` - be mindful when testing behind proxies/containers
- File upload routes expect multipart/form-data with files in `uploads/` subfolders by type
- Toast notifications use react-hot-toast globally configured in `main.jsx` - prefer `toast.success()`/`toast.error()` over console logs
- DaisyUI themes applied via `data-theme` attribute on html element (see `Theme.jsx` context)
- Navigation state: Both `Sidebar.jsx` and `Navbar.jsx` manage their own theme dropdowns with useRef patterns for click-outside behavior
- Auth context: User state persisted in localStorage; logout forces `window.location.replace("/")` to clear all state; use `updateUser()` to sync profile changes
- Image paths: Backend serves static files from `uploads/` at `/uploads/*`; frontend accesses via `http://localhost:5001/uploads/{type}/{filename}` in dev mode

## Quick PR checklist
1. Update backend route → controller → model, test route with backend dev server
2. Add/modify frontend API helper in `frontend/src/services/axios.js`; follow `useApi()` naming
3. For list endpoints reuse `enqueueRequest`, `normalizeListResponse`, client cache patterns 
4. Verify JWT flows (localStorage + axios interceptor + `authMiddleware`)
5. **Theme readability check**: Test component in synthwave theme (default) and at least 2 other themes - verify text is readable, sufficient contrast, no hardcoded colors
6. Smoke-test: run frontend dev + backend dev, verify UI loads without console errors