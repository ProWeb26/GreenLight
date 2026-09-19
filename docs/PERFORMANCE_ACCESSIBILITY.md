# Presupuesto de Rendimiento y Accesibilidad (Lighthouse + WCAG)

Metas que **GreenLight** (frontend React + Vite + Tailwind) debe cumplir en cada
auditoría de Lighthouse y en WCAG 2.1 AA. La consigna de la materia exige un
presupuesto de transferencia de **300–500 KB** y un **Lighthouse ≥ 90**.

## 1. Presupuesto de rendimiento (Lighthouse)

| Métrica      | Presupuesto | Estado    |
|-------------:|:-----------:|:---------:|
| Performance  | ≥ 90        | objetivo  |
| LCP          | ≤ 2.5 s     | objetivo  |
| TBT          | ≤ 200 ms    | objetivo  |
| CLS          | ≤ 0.1       | objetivo  |
| Tamaño bundle (gzip) | 300–500 KB | ✅ 87.84 kB (index) |

### Decisiones implementadas

- **Tailwind v4 con solo utilidades usadas**: CSS único pequeño (~19 kB / 4.6 kB gzip).
- **Code-splitting por página**: `React.lazy` + `Suspense` generan chunks para
  `Feed`, `Reportar`, `MisReportes` y `Admin`; no hay `chart.js` ni librerías pesadas.
- **Sin librerías de iconos externas**: iconos SVG inline (`components/Icons.jsx`),
  sin CSS de terceros bloqueante.
- **Fuentes**: Google Fonts con `display=swap` + `preconnect` (no bloquean el render).
- **Formulario React sin re-renders pesados**; listas con `<ul>/<li>`.
- **Scroll suave y layout grid/flexbox**: CLS controlado sin imágenes grandes.

### Cómo medir (local)

```powershell
cd frontend
npm run build
npm run preview -- --port 4173
npx -y lighthouse http://localhost:4173 --chrome-flags="--headless" --output=html --output-path=audit.html --quiet
```

Audita también `npm run build` con `vite build` y revisa el gzip de `dist/`.

## 2. Accesibilidad (WCAG 2.1 AA)

| Pauta | Implementación |
|-------|----------------|
| **1.1 Texto alternativo** | Iconos decorativos con `aria-hidden="true"`; logos con texto visible; emojis de tipo de incidente siempre acompañados de texto. |
| **1.4 Contraste** | Tema oscuro AA: `#f0ede8`/`#b8b2aa` sobre `#0a0a0a`; botones naranja `#f05a00` con texto negro (≈6:1). |
| **1.4.11 Contraste de componentes** | Badges y bordes con opacidad al 10–15% sobre `acero`, texto en tono pleno. |
| **2.1.1 Teclado** | Toda interacción con `<button>`/`<a>`; sin gestos solo de mouse. |
| **2.4.1 Saltos de bloque** | Enlace "Ir al contenido principal" al inicio (visible al enfocarse) en `Layout.jsx`. |
| **2.4.7 Foco visible** | `:focus-visible` global (outline naranja) en `index.css`. |
| **3.3.1 Identificación de errores** | `role="alert"`, borde rojo, `aria-invalid` y `aria-describedby` por campo (`Field.jsx`, `Login.jsx`, `Reportar.jsx`). |
| **3.3.3 Sugerencia de error** | Mensajes en español claros (p. ej. "La contraseña debe tener al menos 8 caracteres."). |
| **4.1.2 Nombre, rol, valor** | `<label for>`, botones con texto/`aria-label`, listas semánticas, `<time dateTime>`, estado offline con `role="status"`. |

## 3. Checklist de verificación final

- [ ] `python -m pytest` pasa en `backend/` (35) y en `taskflow/` (19).
- [ ] `npm run lint` y `npm run build` pasan en `frontend/` sin errores.
- [ ] Bundle gzip < 300 KB y Lighthouse ≥ 90 en las cuatro categorías.
- [ ] Navegación completa con teclado (Tab / Enter) en `/login`, `/feed`, `/reportar`.
- [ ] Formularios de login/reporte muestran errores por campo anunciados por lectores.
- [ ] Ningún estado se comunica solo con color (badges con texto: Activo, Confirmado…).
- [ ] Probar desconexión de red en `/reportar`: cola offline y sincronización manual.