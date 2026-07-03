# Deployment Architecture & Environment Configuration

Fintell is deployed as a high-performance progressive web application (PWA).

---

## 1. PWA Service Worker & Precaching
Fintell uses `vite-plugin-pwa` to enable seamless offline capabilities:
- **Build Generation:** Generates a custom Service Worker (`sw.js`) during the production build.
- **Auditing/Precaching:** Caches key assets (HTML, CSS, JS, icons) upon initial load. Subsequent visits pull directly from the browser cache, slashing loading times to sub-second durations.
- **Auto Update:** Implements `registerType: 'autoUpdate'`, which checks for changes and replaces outdated assets in the background, keeping pages live.

---

## 2. Environment Variables
To prevent leakage of keys and configure staging/production targets:
- **`VITE_GA_MEASUREMENT_ID`**: The Google Analytics 4 tracking ID (e.g. `G-EB04P029LF`). If empty, the analytics module falls back to developer console logging.
- **`VITE_API_URL`**: Declares the FastAPI backend URL (e.g. `https://api.expencetracker.com`).

---

## 3. Vercel Configuration
The frontend deploys onto the **Vercel** platform:
- **Build Settings:**
  - Build Command: `npm run build` (runs `tsc -b && vite build` under the hood to ensure strict type compliance before outputting static code).
  - Output Directory: `dist`
- **Routing Fallback:** Since Fintell is a Single Page Application (SPA), Vercel is configured with a rewrites block in `vercel.json` to route all page requests (like `/expenses` or `/settings`) to `/index.html`, allowing React Router to handle nested page transitions.

---

## 4. Production Build Splits
Vite builds the static assets into isolated modules to guarantee that downloading heavy files doesn't stall rendering:
- **`chunk-motion.js`**: Framer-motion libraries.
- **`chunk-charts.js`**: Recharts and SVG layouts.
- **`chunk-vendor.js`**: React core, Axios, and TanStack Query dependencies.
- **`index-*.js`**: Core page routing and styling logic.
