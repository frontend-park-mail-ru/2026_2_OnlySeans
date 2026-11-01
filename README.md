# OnlySeans frontend (Webpack)

This folder is an isolated Webpack setup built from the frontend sources in `Front/`.

## Install and run locally

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. The Go API should be running on port `8080`.
Set the backend's `server.allowed_origin` to `http://localhost:3000` and restart
the backend after changing its config.

## Production build

```sh
npm run build
```

Webpack writes the static SPA to `dist/`. Serve that directory with SPA fallback,
for example `npx serve -s -l 3000 dist`. The backend must allow the page's exact
origin in `server.allowed_origin`.
