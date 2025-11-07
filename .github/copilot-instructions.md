## BLGFXIII_Directory — AI Agent Guide

**Domain**: BLGF XIII (Bureau of Local Government Finance Region XIII/Caraga) monitoring system for LGU compliance and assessment processes.

**Stack**: MERN (MongoDB + Express + React/Vite + Node.js) with DaisyUI theming and Upstash Redis rate limiting.

### Architecture & Key Entry Points

**Backend** (`backend/src/`):
- Server: `blgfServer.js` — Express app mounting `/api` routes, global error handling, static file serving for `/uploads/*`, SPA fallback in production
- Routes → Controllers → Models flow (strict convention): e.g., `lguRoutes.js` → `lguController.js` → `LGU.js`
- Middleware: `authMiddleware.js` (JWT verification), `rateLimiter.js` (Upstash Redis, stricter on auth endpoints)
- Models: 7 Mongoose schemas — `LGU`, `User`, `Assessors`, `QRRPAMonitoring`, `SMVMonitoring`, `LAOEMonitoring`, `Directory`

**Frontend** (`frontend/src/`):
- API client: `services/axios.js` — centralized API hooks (e.g., `getAllLgus()`, `updateSMVTimeline()`), baseURL config, JWT interceptor
- Auth: `contexts/AuthContext.jsx` — global login state, `updateUser()` for profile sync, localStorage persistence
- Pages: 10 pages including 3 monitoring systems (SMV, QRRPA, LAOE) with complex filtering and timeline tracking
- Components: organized by domain (`lgu/`, `smv/`, `qrrpa/`, `modals/`, `common/`)

**Data Flow**: Frontend axios hooks → Backend routes (with rate limiting) → Controllers → Mongoose models → MongoDB

### Critical Project Conventions (DO NOT DEVIATE)

**1. API Change Workflow** (mandatory order):
```
1. Add route in `backend/src/routes/*.js` (e.g., `router.post("/timeline", auth, controller.updateTimeline)`)
2. Implement controller in `backend/src/controllers/*.js` with error handling
3. Update/add Mongoose model fields in `backend/src/models/*.js` if needed
4. Export axios hook in `frontend/src/services/axios.js` (e.g., `updateSMVTimeline: (id, data) => api.put(...)`)
5. Import and use hook in page/component via `const { updateSMVTimeline } = useApi()`
```

**2. Rate Limiting Defense** (Upstash Redis):
- **Problem**: API endpoints have strict rate limits (10 req/10s general, 5 req/10s for auth)
- **Solution**: ALWAYS use `enqueueRequest()` pattern for list operations (see `LGUPage.jsx` lines 64-101):
  ```jsx
  const enqueueRequest = useCallback((fn, context) => {
    // Serial queue with exponential backoff, auto-retries 429s
    // Enforces 250ms min interval between requests
  });
  const res = await enqueueRequest(() => getAllLgus(), "LGU list");
  ```
- Use with `normalizeListResponse()` and `listCache` (5min TTL) to prevent refetch storms
- Entity caches: `lguCache`, `assessorsCache`, `smvCache` (useRef Maps) for detail lookups

**3. File Uploads**:
- Frontend: multipart/form-data, e.g., `uploadProfilePicture(formData)` in axios.js
- Backend: Multer middleware in routes, saves to `uploads/{type}/` (profile, qrrpa), serves via `/uploads/*`
- Dev URLs: `http://localhost:5001/uploads/profile/filename.jpg`
- Production: backend serves from same path (static middleware)

**4. DaisyUI Theming** (STRICT RULE):
- ❌ NEVER hardcode colors: `bg-white`, `text-gray-900`, `bg-blue-500`
- ✅ ALWAYS use semantic classes: `bg-base-100`, `text-base-content`, `btn-primary`, `bg-base-200`
- Default theme: `synthwave` (set via `data-theme` on `<html>`)
- Test contrast in 3+ themes (see `docs/THEME_GUIDELINES.md`)
- Theme switching: user preference in `Sidebar.jsx` with useRef click-outside detection

**5. Toast Notifications**:
- Centralized in `frontend/src/main.jsx` via `react-hot-toast`
- Use: `toast.success("Saved")`, `toast.error("Failed")`, `toast.dismiss("retry-toast")`
- Custom retry toasts in `enqueueRequest` with IDs for dismissal

### Domain-Specific Models (Core Business Logic)

**SMV Monitoring** (`backend/src/models/SMVMonitoring.js`):
- Standard Market Value assessment tracking (RA 12001/RPVARA compliance)
- 4-tab progress system: Timeline (10%), Development (60%), Proposed (20%), Review (10%)
- Timeline fields: `blgfNoticeDate` (Day 0), `firstPublicationDate`, `secondPublicationDate`, consultation deadlines, RO/BLGF/DOF review cascades
- 10 activity categories with `status` (Not Started/In Progress/Completed) and `dueDate`
- Auto-calculated: `complianceStatus` (On Track/At Risk/Delayed/Overdue), `daysElapsed`, `daysRemaining`
- Tab locking: Development/Proposed/Review tabs locked until `blgfNoticeDate` is set
- See `docs/SMV_4TAB_QUICK_REFERENCE.md` for progress calculation formulas

**QRRPA Monitoring** (`backend/src/models/QRRPAMonitoring.js`):
- Quarterly Real Property Assessment Reports
- Fields: `lguId`, `period` (format: YYYY-QQ), `status` (Submitted/Not Submitted/Late Submission), `dateSubmitted`, `attachmentUrl`
- Unique index: one report per LGU per period

**LAOE Monitoring** (`backend/src/models/LAOEMonitoring.js`):
- List of Accounts and Other Entitlements tracking
- Status: Compliant/Non-Compliant/Pending

**LGU Model** (`backend/src/models/LGU.js`):
- Geographic hierarchy: region → province → city/municipality
- Used as reference in all monitoring systems via `lguId` foreign key

### Icons & UI Libraries
- **Icon Policy**: DO NOT add new `lucide-react` imports. Use `react-icons` (already installed) or reuse existing icon components.
- Current `lucide-react` usage (legacy, do not expand): 6 files in `frontend/src/components/lgu/` and `LGUPage.jsx`
- For new icons: prefer `react-icons` (e.g., `import { FaCheck } from 'react-icons/fa'`)

### Development Commands

**Local Development**:
```powershell
# Install all dependencies
npm run build

# Run backend (http://localhost:5001)
npm run dev --prefix backend

# Run frontend (http://localhost:5173)
npm run dev --prefix frontend

# Lint frontend
npm run lint --prefix frontend
```

**Production Build**:
```powershell
# Build frontend assets + install deps
npm run build

# Start production server (serves frontend + API)
npm run start
```

### Integration & Environment

**API Configuration**:
- Backend: `process.env.PORT || 5001`, mounts all routes under `/api`
- Frontend dev: axios baseURL = `http://localhost:5001/api`
- Frontend prod: axios baseURL = `/api` (same origin, served by Express)
- CORS: dev only, allows localhost:5173/5174/3000 + `VITE_CLIENT_API_URL_LOCAL`

**Required Environment Variables**:
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret (min 32 chars recommended)
- `JWT_EXPIRES_IN` — optional, defaults to `7d`
- `UPSTASH_REDIS_REST_URL` — for rate limiting
- `UPSTASH_REDIS_REST_TOKEN` — for rate limiting
- `PORT` — optional, defaults to 5001 (Render sets automatically)
- `VITE_CLIENT_API_URL_LOCAL` — optional, for dev CORS whitelist

**Proxy Configuration**:
- `app.set('trust proxy', 1)` in blgfServer.js
- Rate limiter uses real client IP (behind NGINX/proxies)
- Critical for accurate rate limiting in production

### Deployment (Render)

**Node Version**: Requires Node 18+ (recommend >=18 <21)
- React 19.1.1 + Vite 7.x + @vitejs/plugin-react 5.x
- Check for `react-refresh` conflicts if seeing Hot Refresh errors: `npm ls react-refresh --prefix frontend`

**Recommended Setup** (Single Web Service):
1. Connect repo to Render Web Service
2. Build command: `npm run build` (installs deps + builds frontend)
3. Start command: `npm run start` (runs `npm run start --prefix backend`)
4. Add all required env vars (see above)
5. Health check: `/api/health`
6. Static files: backend serves `frontend/dist` in production

**Alternative** (Separate Services):
- Frontend: Static Site, build `npm run build --prefix frontend`, publish `frontend/dist`
- Backend: Web Service, start `npm run start --prefix backend`

**Troubleshooting**:
- Test build locally first: `npm run build` from root
- React refresh errors: `npm dedupe --prefix frontend`
- Static files not found: verify `../frontend/dist` path relative to backend working dir
- Rate limit issues: confirm Upstash Redis env vars are set

### Quick PR Checklist

**API Changes**:
1. Add route in `backend/src/routes/*.js` with auth middleware
2. Implement controller in `backend/src/controllers/*.js` with try-catch
3. Update model in `backend/src/models/*.js` if schema changes
4. Export hook in `frontend/src/services/axios.js`
5. Use hook in page/component via `const { hookName } = useApi()`

**UI Changes**:
1. Use DaisyUI semantic classes only (no hardcoded colors)
2. Test in synthwave + 2 other themes
3. For lists: use `enqueueRequest`, `normalizeListResponse`, entity caches
4. For errors: display via `<ErrorDisplay />` and `toast.error()`
5. For modals: follow sticky footer + tab patterns (see `docs/MODAL_REDESIGN_DOCUMENTATION.md`)

**Testing**:
1. Run backend: `npm run dev --prefix backend`
2. Run frontend: `npm run dev --prefix frontend`
3. Verify JWT flows (login → token → protected routes)
4. Test file uploads if modified (check `/uploads` paths)
5. Check browser console for errors (should be clean)
6. Test rate limiting doesn't trigger on normal use

**Pre-merge**:
1. `npm run lint --prefix frontend` (should pass)
2. `npm run build` (should succeed)
3. Check `docs/` for relevant documentation to update
4. If SMV system: verify timeline calculations, tab locking, progress formulas
### Common Dev Patterns

**1. Response Normalization** (see `LGUPage.jsx` lines 101-109):
```jsx
const normalizeListResponse = (res) => {
  // Handles: res.data.lgus, res.data (array), or single object
  if (res.data?.lgus) return res.data.lgus;
  if (Array.isArray(res.data)) return res.data;
  return [res.data].filter(Boolean);
};
```

**2. Entity Caching Pattern** (prevents duplicate API calls):
```jsx
const lguCache = useRef(new Map()); // key: lguId, value: LGU object
// Check cache before API call:
if (lguCache.current.has(lguId)) return lguCache.current.get(lguId);
```

**3. SMV Timeline Auto-Calculation** (see `docs/SMV_TIMELINE_IMPLEMENTATION.md`):
- `blgfNoticeDate` (Day 0) triggers cascade: publication → consultation → RO deadline → BLGF CO → DOF
- Frontend NEVER calculates deadlines — backend auto-sets on save
- Frontend only displays and allows manual edits

**4. Status Mapping** (UI ↔ Backend):
```jsx
const statusMap = {
  "Not Started": "not_started",  // Frontend → Backend
  "In Progress": "in_progress",
  "Completed": "completed"
};
```

### Debugging & Documentation

**Extensive Docs** (40+ MD files in `docs/`):
- SMV system: `SMV_4TAB_QUICK_REFERENCE.md`, `SMV_TIMELINE_IMPLEMENTATION.md`, `SMV_ACTIVITY_MONITORING_GUIDE.md`
- Modal redesigns: `MODAL_REDESIGN_DOCUMENTATION.md`, `MODAL_3TAB_DOCUMENTATION.md`
- Fixes: `SMV_SAVE_CRITICAL_FIX.md`, `TOAST_DUPLICATE_FIX.md`, `USEMEMO_FIX_SUMMARY.md`
- Always check docs/ before implementing complex features

**Error Handling Patterns**:
- Backend: try-catch in controllers, return `{ message: "...", error: "..." }` with proper HTTP status
- Frontend: catch blocks with `toast.error()`, update error state for `<ErrorDisplay />`
- Rate limit 429s: auto-retry in `enqueueRequest` with exponential backoff

### Component Organization

**Frontend Structure**:
- `pages/`: 10 main pages (HomePage, LGUPage, SMVMonitoringPage, QRRPAMonitoringPage, AssessorsPage, DirectoryPage, etc.)
- `components/lgu/`: LGU-specific UI (QuickStats, ProvinceLGUCard, ProvinceDetail, SearchFilter)
- `components/smv/`: SMV monitoring (SMVStatsCards, SMVTimelineAlerts, SMVFilters, SMVSummaryTable, SMVActivityTimeline)
- `components/qrrpa/`: QRRPA monitoring forms and tables
- `components/modals/`: Complex modals (SetTimelineModal with 4-tab system, edit modals)
- `components/common/`: Reusables (LoadingSpinner, ErrorDisplay, ProtectedRoute)
- `contexts/`: AuthContext (login state, updateUser), others as needed
- `hooks/`: Custom hooks (useQrrpa, etc.)
- `utils/`: Helper functions

**Modals Pattern** (see `docs/MODAL_REDESIGN_DOCUMENTATION.md`):
- Use DaisyUI modal classes: `modal modal-open`, `modal-box`, `modal-action`
- Sticky footer with actions: `sticky bottom-0 bg-base-200 p-4`
- Tab system for complex forms: Development/Proposed/Review tabs in SMV modal
- Tab locking: disable tabs until prerequisites met (e.g., BLGF Notice Date)

### Backend Structure

**Controllers** (8 total):
- `authController.js`: login, register, JWT generation
- `userController.js`: profile CRUD, status updates, profile picture uploads
- `lguController.js`: LGU CRUD, region/province filtering
- `assessorController.js`: assessor CRUD
- `smvMonitoringController.js`: SMV process tracking, timeline updates, activity status
- `qrrpaMonitoringController.js`: QRRPA report submission tracking
- `laoeMonitoringController.js`: LAOE compliance tracking
- `directoryController.js`: directory/contact management

**Routes Convention**:
- Mount with auth middleware: `router.get("/", auth, controller.getAll)`
- Use descriptive paths: `/api/smv-processes/timeline/:id`, `/api/qrrpa-monitoring/period/:period`
- Multer for uploads: `upload.single('file')` or `upload.single('profilePicture')`

**Models** (7 Mongoose schemas):
- Indexing: unique constraints (e.g., `{ lguId: 1, period: 1 }` for QRRPA)
- Refs: `lguId` references `LGU` model (population in controllers)
- Enums: strict validation for status fields (Submitted/Not Submitted, On Track/At Risk/Delayed/Overdue)
- Timestamps: `{ timestamps: true }` for all schemas