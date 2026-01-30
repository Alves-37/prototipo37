# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Backend configuration (env)

This project reads the API base URL from Vite environment variables. We already created environment files:

- `.env.development` → used by `npm run dev`
- `.env.production` → used by `npm run build` and `npm run preview`

Both files define `VITE_API_BASE_URL`.

Default values we configured:

```
# .env.development
VITE_API_BASE_URL=http://localhost:5000/api

# .env.production
VITE_API_BASE_URL=https://prototipo-production-7dde.up.railway.app/api
```

If you need to change the API URL, edit the respective file above. Note: the frontend expects the base URL to include the `/api` suffix, because service calls use relative paths like `/mensagens/...`.

## How the base URL is used

The Axios client in `src/services/api.js` uses:

```
import.meta.env.VITE_API_BASE_URL
```

with a fallback to `http://localhost:5000/api` in development and `https://prototipo-production-7dde.up.railway.app/api` in production when the variable is not set.

## Run scripts

- `npm install`
- `npm run dev` → development mode (uses `.env.development`)
- `npm run build` → production build (uses `.env.production`)
- `npm run preview` → serve built app locally

## Notes

- Environment files are ignored by Git via `.gitignore` (patterns: `.env`, `.env.*`).
- If you want an example, copy the snippet above into a local `.env.development` / `.env.production` as needed.
