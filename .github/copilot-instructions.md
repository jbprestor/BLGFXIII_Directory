# Frontend Build Optimization: Large Chunk Handling

If you see warnings about chunks larger than 500 kB after minification:

- Use dynamic imports (React.lazy + import()) for large components/pages to enable code-splitting:
  ```js
  const MyComponent = React.lazy(() => import('./MyComponent'));
  ```
- In `vite.config.js`, use manual chunking to split vendor libraries or large dependencies:
  ```js
  export default {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'axios']
          }
        }
      }
    }
  }
  ```
- To silence the warning, increase the chunk size limit in `vite.config.js`:
  ```js
  build: {
    chunkSizeWarningLimit: 1000 // (in kB)
  }
  ```

Optimizing chunk size improves load performance for users. Use code-splitting and manual chunking for best results.

# BLGFXIII_Directory — AI Agent Coding Guide

This repo is a MERN-style app with React (Vite + DaisyUI) frontend and Express/Mongoose backend. Use this guide for immediate productivity as an AI coding agent.

## Architecture Overview
- **Frontend**: React SPA in `frontend/` using DaisyUI themes. API calls centralized via `useApi()` hooks in `src/services/axios.js`.
- **Backend**: Express server in `backend/src/blgfServer.js` serves static frontend and mounts API routers under `/api`. Data models in `backend/src/models/`.
- **Auth**: JWT-based, persisted in localStorage. Axios interceptors handle tokens. Protected routes via `ProtectedRoute.jsx`.
- **Rate Limiting**: All backend routes use Upstash Redis (see `rateLimiter.js`). Auth endpoints have stricter limits.
- **Themes**: DaisyUI themes switch via `data-theme` on `<html>`. Default: synthwave. Always use DaisyUI semantic classes for colors/contrast.

## Key Files & Patterns
- **Backend**:
  - API: `routes/*`, `controllers/*`, `models/*` (e.g., LGU: `lguRoutes.js`, `lguController.js`, `LGU.js`)
  - Middleware: `authMiddleware.js` (JWT), `rateLimiter.js` (Upstash)
  - Error handling: global middleware in `blgfServer.js`
- **Frontend**:
  - API client: `src/services/axios.js` (all endpoints via hooks)
  - Auth: `src/contexts/AuthContext.jsx` (state, updateUser)
  - Pages: `LGUPage.jsx` (caching, normalization), `QRRPAMonitoringPage.jsx` (forms), `DirectoryPage.jsx` (filters)
  - Navigation: `Sidebar.jsx` (hierarchy, theme), `Navbar.jsx` (responsive)

## Project-Specific Conventions
- **API Additions**: Always update backend route → controller → model. Mirror in frontend `axios.js` as a hook (e.g., `getAllLgus`).
- **Rate-sensitive UI**: Use `enqueueRequest(fn, context)` (see `LGUPage.jsx`) for list ops; handles retries, backoff, and serialization.
- **Response Normalization**: Use `normalizeListResponse` (see `LGUPage.jsx`) for list shapes (`res.data.lgus`, `res.data`, single obj).
- **Client Caching**: Use `listCache` (TTL via useRef) and entity Maps (`lguCache`, etc.) for frequent lists.
- **Custom Hooks**: Encapsulate domain logic (e.g., `useQrrpa`).
- **File Uploads**: Backend stores in `uploads/{type}/`; frontend sends multipart/form-data. Multer config in routes.
- **Profile Pictures**: See `PROFILE_PICTURE_IMPLEMENTATION.md` for flow. User model has `profilePicture` field.
- **Mobile-first UI**: Use DaisyUI flex layouts, collapsible tabs, touch sizing (see `QRRPAMonitoringPage.jsx`).
- **Status Mapping**: Map UI values to backend enums via lookup objects.
- **Cascading Filters**: Use `getRegions()`, `getProvinces(region)` from `axios.js` for location filters.
- **Theme System**: Only use DaisyUI semantic classes (`bg-base-100`, `text-base-content`, etc.). Never hardcode colors. Test contrast in synthwave + 2 other themes.
- **Navigation**: Use `subItems` for nested menus in `Sidebar.jsx`. Theme dropdowns use useRef for click-outside.
- **Auth Updates**: Use `updateUser()` in AuthContext to sync profile changes.

## Dev & Debug Commands
- Install & build all: `npm run build`
- Backend dev: `npm run dev --prefix backend` or `cd backend && npm run dev`
- Frontend dev: `npm run dev --prefix frontend` or `cd frontend && npm run dev`
- Backend prod: `npm run start --prefix backend`
- Lint frontend: `npm run lint --prefix frontend`

## Integration Notes
- Keep axios `baseURL` and Vite envs in sync with backend `/api` path.
- Backend rate limits: use serialized requests, not parallel bursts.
- Backend sets `app.set('trust proxy', 1)` for proxy/container support.
- File uploads: multipart/form-data, files in `uploads/{type}/`.
- Toasts: Use `toast.success()`/`toast.error()` (see `main.jsx`).
- Auth: localStorage persistence, logout triggers `window.location.replace('/')`.
- Static files: Backend serves `/uploads/*`; frontend uses `http://localhost:5001/uploads/{type}/{filename}` in dev.

## PR Checklist
1. Update backend route → controller → model; test with backend dev server
2. Add/modify frontend API hook in `axios.js`
3. For lists, reuse `enqueueRequest`, `normalizeListResponse`, and cache patterns
4. Verify JWT flows (localStorage, axios interceptor, `authMiddleware`)
5. Theme readability: test in synthwave + 2 other themes, no hardcoded colors
6. Smoke-test: run frontend + backend dev, verify UI loads without errors