# TaskFlow

Aplicación web desarrollada para **Programación Web II – UPDS**.

## 🛠️ Tecnologías

* Python 3.14+
* Flask
* React
* Vite
* Tailwind CSS
* Git
* GitHub
* Visual Studio Code

---

# 📁 Estructura del proyecto

```text
taskflow/
│
├── venv/                  # Entorno virtual de Python
│
├── backend/               # API Flask
│   ├── app/
│   │   ├── __init__.py
│   │   └── routes.py
│   └── requirements.txt
│
├── frontend/              # Aplicación React + Vite
│   ├── src/
│   ├── public/
│   └── package.json
│
├── docs/                  # Documentación del proyecto
│
├── .gitignore
└── README.md
```

> `venv/` y `node_modules/` son directorios locales y están excluidos mediante `.gitignore`.

---

# ⚙️ Requisitos

Antes de ejecutar el proyecto se necesita:

* Git 2.x o superior
* Node.js 18.x o superior
* Python 3.11 o superior
* Visual Studio Code

Versiones utilizadas durante la configuración:

```text
Git     2.49.0
Node    v24.18.1
Python  3.14.6
```

---

# 🚀 Configuración inicial

## 1. Clonar el repositorio

```powershell
git clone https://github.com/TU-USUARIO/taskflow.git
cd taskflow
```

---

## 2. Activar el entorno virtual

El entorno virtual `venv` se encuentra en la **raíz del proyecto**.

Desde:

```text
taskflow/
```

ejecutar:

```powershell
.\venv\Scripts\Activate.ps1
```

Si se activó correctamente, aparecerá:

```text
(venv) PS C:\Users\Dell\Documents\taskflow>
```

### Verificar Python

```powershell
python --version
```

También se puede comprobar qué Python se está utilizando:

```powershell
where.exe python
```

La primera ruta debería apuntar a:

```text
taskflow\venv\Scripts\python.exe
```

---

# 🔧 Backend — Flask

## Instalar dependencias

Con el entorno virtual activado:

```powershell
pip install -r backend\requirements.txt
```

Si se está configurando el proyecto por primera vez y todavía no existe `requirements.txt`:

```powershell
pip install Flask
```

Luego:

```powershell
pip freeze > backend\requirements.txt
```

---

## Ejecutar el backend

Desde la raíz:

```powershell
.\venv\Scripts\Activate.ps1
cd backend
$env:FLASK_APP="app:create_app"
flask run
```

El backend estará disponible en:

```text
http://127.0.0.1:5000
```

La API inicial responde:

```json
{
    "message": "TaskFlow API funcionando"
}
```

Para detener el servidor:

```text
Ctrl + C
```

---

# 🎨 Frontend — React + Vite

## Instalar dependencias

Desde la carpeta del frontend:

```powershell
cd frontend
npm install
```

---

## Ejecutar el frontend

```powershell
npm run dev
```

Vite mostrará una dirección similar a:

```text
http://localhost:5173/
```

Abrir esa dirección en el navegador.

Para detener el servidor:

```text
Ctrl + C
```

---

# 🖥️ Ejecutar Backend y Frontend simultáneamente

Se recomienda utilizar **dos terminales de VS Code**.

### Terminal 1 — Backend

```powershell
cd C:\Users\Dell\Documents\taskflow
.\venv\Scripts\Activate.ps1
cd backend
$env:FLASK_APP="app:create_app"
flask run
```

Backend:

```text
http://127.0.0.1:5000
```

### Terminal 2 — Frontend

```powershell
cd C:\Users\Dell\Documents\taskflow
cd frontend
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

---

# 🌿 Git — Ramas

El proyecto utiliza dos ramas principales:

```text
main
 │
 └── dev
```

### `main`

Rama principal y estable del proyecto.

### `dev`

Rama utilizada para desarrollar nuevas funcionalidades, realizar cambios y pruebas.

Actualmente el desarrollo se realiza principalmente en:

```text
dev
```

---

# 🔀 Crear o cambiar a `dev`

Para crear la rama por primera vez:

```powershell
git checkout -b dev
```

Para cambiar a una rama que ya existe:

```powershell
git checkout dev
```

Verificar la rama actual:

```powershell
git branch
```

La rama activa aparece con:

```text
* dev
```

---

# 📤 Subir cambios a GitHub

Después de realizar cambios:

```powershell
git status
git add .
git commit -m "Descripción del cambio"
git push
```

Si es la primera vez que se sube `dev`:

```powershell
git push -u origin dev
```

---

# 🧹 Entorno virtual

Para salir del entorno virtual:

```powershell
deactivate
```

Para volver a activarlo:

```powershell
.\venv\Scripts\Activate.ps1
```

---

# 🔒 `.gitignore`

El proyecto utiliza `.gitignore` para evitar subir archivos innecesarios o sensibles.

```gitignore
# Python
venv/
__pycache__/
*.py[cod]

# Environment variables
.env
.env.*

# Node
node_modules/
dist/

# VS Code
.vscode/

# Logs
*.log

# Operating system
.DS_Store
Thumbs.db
```

No se deben subir al repositorio:

```text
venv/
node_modules/
.env
__pycache__/
```

---

# 🏗️ Arquitectura

```text
                  TASKFLOW
                     │
          ┌──────────┴──────────┐
          │                     │
      FRONTEND                BACKEND
          │                     │
   React + Vite               Flask
          │                     │
     Tailwind CSS              API
          │                     │
          └──────── API ────────┘
```

## Frontend

Responsable de:

* Interfaz de usuario.
* Componentes React.
* Diseño con Tailwind CSS.
* Consumo de la API.

## Backend

Responsable de:

* API.
* Lógica de negocio.
* Rutas.
* Procesamiento de solicitudes.

---

# 📚 Documentación

La documentación adicional se encuentra en:

```text
docs/
```

Archivos previstos:

```text
docs/
├── alcance.md
├── arquitectura.md
├── sostenibilidad.md
├── backlog.md
└── acta-mob.md
```

---

# 🌱 Criterios de sostenibilidad

El proyecto considera los siguientes objetivos:

| Criterio      | Objetivo |
| ------------- | -------- |
| Peso          | ≤ 500 KB |
| Lighthouse    | ≥ 90     |
| Accesibilidad | WCAG AA  |
| Costo         | 0 Bs     |

Herramientas de evaluación:

* Lighthouse
* Chrome DevTools
* Website Carbon / CO₂.js

Las pruebas de rendimiento consideran **throttling 3G**.

---

# ✅ Comandos rápidos

## Activar entorno

```powershell
.\venv\Scripts\Activate.ps1
```

## Backend

```powershell
cd backend
$env:FLASK_APP="app:create_app"
flask run
```

## Frontend

```powershell
cd frontend
npm run dev
```

## Git

```powershell
git status
git add .
git commit -m "Descripción del cambio"
git push
```

## Cambiar a desarrollo

```powershell
git checkout dev
```

---

# 📌 Estado del proyecto

**En desarrollo — MVP**

La configuración inicial del entorno, backend Flask, frontend React/Vite, Git, GitHub y rama `dev` se encuentra establecida.
