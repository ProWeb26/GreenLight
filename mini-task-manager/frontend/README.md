# Mini Task Manager (laboratorio)

Aplicación de práctica del curso Programación Web II: gestor de tareas con
autenticación JWT y dashboard. Implementación original en **Node.js / Express**
(backend) y **React + Vite** (frontend).

> Este módulo es la versión de laboratorio que se entregó en la sesión previa.
> El proyecto principal de la materia es **GreenLight** (reporte de quemas),
> ubicado en `../backend` y `../frontend`; el backend definitivo de la materia
> es Flask en `../taskflow`.

## Estructura

- `backend/`: API Express (`src/app.js`) con login JWT, CRUD de tareas y
  estadísticas para el dashboard.
- `frontend/`: UI React (login, lista de tareas, dashboard con Chart.js).

## Puesta en marcha

Backend:

```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

Frontend:

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Base de datos

Por defecto el backend usa PostgreSQL vía variable `DATABASE_URL`. Para
desarrollo se puede cambiar a SQLite editando `backend/src/db.js` o el
`package.json` de scripts.