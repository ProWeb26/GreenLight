# GreenLight Web (React + Vite + Tailwind)

Frontend de **GreenLight**, la red comunitaria offline-first de reporte de
quemas y focos de humo (Programación Web II – UPDS).

## Funcionalidades

- Login / registro con JWT (`POST /api/auth/login` y `/registro`).
- **Feed** con filtros por tipo de incidente y comunidad; confirmación `+1`.
- **Reportar** con cola offline: si no hay conexión, el reporte se guarda en
  `localStorage` y se sincroniza vía `POST /api/sync` al recuperar señal.
- **Mis reportes**: editar y eliminar los propios.
- **Administración** (solo coordinador): comunidades, tipos de incidente,
  usuarios (rol) y estados de reportes.

## Variables de entorno

Copia `frontend/.env.example` como `.env`:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

> En producción (Cloudflare Pages o Render) la variable se define en el panel
> y apunta a la URL del backend Flask desplegado.

## Comandos

```powershell
npm install
npm run dev        # http://localhost:5173
npm run lint
npm run build
```

## Rutas

| Ruta          | Acceso      |
|---------------|-------------|
| `/login`      | público     |
| `/feed`       | usuario     |
| `/reportar`   | usuario     |
| `/mis-reportes`| usuario    |
| `/admin`      | coordinador |

La estructura `dist/` se publica en Cloudflare Pages; el archivo
`public/_redirects` habilita el enrutamiento SPA.