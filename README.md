# GreenLight — Panel Comunitario

Aplicación web para el **registro y gestión de reportes comunitarios**, desarrollada para **Programación Web II – UPDS** con una **arquitectura de 5 responsabilidades** (capa de API, lógica de negocio, acceso a datos, base de datos y cliente web).

## 🛠️ Tecnologías

* Backend: Node.js, Express 5, PostgreSQL (Supabase), jsonwebtoken, pg, cors, dotenv, nodemon
* Frontend: React 19, Vite, chart.js
* Autenticación: JWT con **API simulada** (usuarios mock)
* Infraestructura: Git, GitHub, VS Code

---

## 📁 Estructura del proyecto

```text
greenlight/
│
├── backend/                    # API Node/Express
│   ├── src/
│   │   ├── app.js              # Punto de entrada + middlewares
│   │   ├── config/db.js        # Conexión a PostgreSQL (Supabase)
│   │   ├── controllers/        # Capa API (valida formato/HTTP) — auth, reportes
│   │   ├── services/           # Capa de lógica de negocio
│   │   ├── repositories/       # Capa de acceso a datos (SQL parametrizado)
│   │   ├── routes/             # Definición de rutas REST
│   │   ├── middleware/         # authMiddleware y requireRole
│   │   └── data/mockUsers.js   # Usuarios de la API simulada
│   └── package.json
│
├── frontend/                   # Cliente React + Vite
│   ├── src/
│   │   ├── App.jsx             # Shell: login, header, sidebar, navegación
│   │   ├── Reportes.jsx        # Registro y listado de reportes
│   │   ├── Dashboard.jsx       # Panel del administrador (estadísticas)
│   │   ├── App.css / index.css # Tema visual (estilo Alcasa)
│   │   └── main.jsx
│   └── package.json
│
├── docs/
│   ├── schema.sql              # DDL de la tabla reporte
│   └── TEST_CASES.md           # Casos de prueba documentados
│
├── .env.example
├── .gitignore
└── README.md
```

> `node_modules/`, `.env` y `__pycache__/` están excluidos mediante `.gitignore`.

---

## ⚙️ Requisitos

* Node.js 18 o superior
* Cuenta en [Supabase](https://supabase.com) (PostgreSQL) — o un PostgreSQL local
* Git, VS Code

---

## 🚀 Configuración inicial

### 1. Clonar el repositorio

```powershell
git clone https://github.com/ProWeb26/GreenLight.git
cd GreenLight
```

### 2. Base de datos (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En **Connect**, copia la cadena de conexión **Session pooler**.
3. Ejecuta `docs\schema.sql` en el **SQL Editor** de Supabase para crear la tabla `reporte`.

### 3. Variables de entorno

Copia `backend\.env` desde `.env.example` y completa tus credenciales:

```dotenv
PORT=3000
DATABASE_URL=postgresql://usuario:contraseña@host:5432/postgres
JWT_SECRET=cambia-este-secreto
JWT_EXPIRES_IN=2h
```

---

## 🔧 Backend

```powershell
cd backend
npm install
npm run dev        # nodemon src/app.js
```

El servidor queda en:

```text
http://localhost:3000
```

Para producción: `npm start`.

---

## 🎨 Frontend

```powershell
cd frontend
npm install
npm run dev
```

Vite mostrará una dirección como:

```text
http://localhost:5173/
```

---

## 🔐 Autenticación (API simulada)

El sistema emite **tokens JWT** desde una API simulada de autenticación. Usuarios de prueba definidos en `backend/src/data/mockUsers.js`:

| Username | Password     | Rol    | Permisos                          |
|----------|--------------|--------|-----------------------------------|
| `admin`  | `Admin123!`  | admin  | Acceso total y **Dashboard**      |
| `vecino` | `Vecino123!` | vecino | Consulta y registro de reportes   |

Toda petición a `/api/reportes` debe incluir:

```text
Authorization: Bearer <token>
```

El Dashboard del administrador **solo se muestra** cuando se inicia sesión como `admin`.

---

## 📡 Endpoints

| Método | Ruta                  | Autenticación | Rol    | Descripción                          |
|--------|-----------------------|---------------|--------|--------------------------------------|
| POST   | `/api/auth/login`     | No            | —      | Iniciar sesión y obtener token JWT   |
| GET    | `/api/reportes`       | Sí            | ambos  | Listar reportes                      |
| POST   | `/api/reportes`       | Sí            | ambos  | Registrar un reporte                 |
| GET    | `/api/reportes/stats` | Sí            | admin  | Estadísticas del dashboard           |
| DELETE | `/api/reportes/:id`   | Sí            | admin  | Eliminar un reporte                  |

Códigos de respuesta semánticos: `200/201` éxito, `400` error de formato (con `field`), `401` no autenticado, `403` sin rol permitido, `404` no encontrado, `422` regla de negocio.

---

## ✅ Verificación

Los **casos de prueba** (12 escenarios documentados paso a paso) están en:

```text
docs/TEST_CASES.md
```

Ejemplo rápido:

```powershell
$BASE = "http://localhost:3000/api"
$login = Invoke-RestMethod -Uri "$BASE/auth/login" -Method Post `
  -ContentType "application/json" -Body '{"username":"admin","password":"Admin123!"}'
$token = $login.token
Invoke-RestMethod -Uri "$BASE/reportes" -Headers @{ Authorization = "Bearer $token" }
```

---

## 🌿 Git — Ramas

```text
main   → rama estable
dev    → rama de desarrollo (actual)
```

```powershell
git checkout dev
git status
git add .
git commit -m "Descripción del cambio"
git push
```

---

## 🔒 `.gitignore`

Excluye los archivos sensibles o innecesarios:

```gitignore
node_modules/
.env
backend/.env
__pycache__/
dist/
```

> El archivo `backend\.env` contiene las credenciales de la base de datos y el `JWT_SECRET`; **nunca** debe subirse al repositorio.

---

## 📌 Estado del proyecto

**En desarrollo — MVP**

Completado: registro/listado/eliminación de reportes, autenticación JWT con API simulada, dashboard con estadísticas y gráficas solo para administradores, interfaz tipo Alcasa con responsividad, y casos de prueba documentados.