# Presupuesto de Rendimiento y Accesibilidad (Lighthouse + WCAG)

Metas que **GreenLight** (frontend React + Vite + Tailwind) debe cumplir en cada
auditoría de Lighthouse y en WCAG 2.1 AA. La consigna de la materia exige un
presupuesto de transferencia de **300–500 KB** y un **Lighthouse ≥ 90**.

> Los valores medidos y el tablero que los publica están en
> [`docs/TABLERO_METRICAS.md`](TABLERO_METRICAS.md) y en la ruta `/sostenibilidad`
> del frontend. Este documento define el presupuesto y los criterios WCAG.

## 1. Presupuesto de rendimiento (Lighthouse)

| Métrica      | Presupuesto | Estado    |
|-------------:|:-----------:|:---------:|
| Performance  | ≥ 90        | sin auditar |
| LCP          | ≤ 2.5 s     | sin auditar |
| TBT          | ≤ 200 ms    | sin auditar |
| CLS          | ≤ 0.1       | sin auditar |
| Peso total servido (gzip) | 300–500 KB | ✅ **156.79 kB** |
| Carga inicial (gzip)      | —           | ✅ 96.72 kB |
| Peso total servido (bruto)| —           | 508.01 kB |

> El presupuesto se evalúa sobre **gzip** (lo que el usuario descarga por su red
> móvil). Con bruto, el sitio completo pesaría 508 kB, apenas sobre el techo de
> 500 kB. Decisión #7 en el registro de `PLAN_GOBERNANZA.md`.

Medición del 29/09/2026 con `npm run build`, que escribe `dist/metricas-build.json`
con el desglose archivo por archivo.

### Decisiones implementadas

- **Tailwind v4 con solo utilidades usadas**: CSS único pequeño (35.97 kB / 10.99 kB gzip).
- **Code-splitting por página**: `React.lazy` + `Suspense` generan chunks para
  `Feed`, `Reportar`, `Mapa`, `MisReportes`, `Sostenibilidad` y `Admin`; no hay
  `chart.js` ni librerías pesadas. El chunk de Leaflet (42.59 kB gzip) solo se
  descarga en `/mapa`.
- **Tablero de métricas sin librería de gráficas**: las barras de
  `/sostenibilidad` son CSS puro (div con `width` en %), 0 kB extra.
- **Sin librerías de iconos externas**: iconos SVG inline (`components/Icons.jsx`),
  sin CSS de terceros bloqueante.
- **Fuentes**: Google Fonts con `display=swap` + `preconnect` (no bloquean el render).
- **Formulario React sin re-renders pesados**; listas con `<ul>/<li>`.
- **Scroll suave y layout grid/flexbox**: CLS controlado sin imágenes grandes.

### Cómo medir

```powershell
cd frontend
npm run build                              # construye y escribe dist/metricas-build.json
npm run medir                              # solo vuelve a medir dist/
npm run auditar                            # Lighthouse (requiere Google Chrome)
npx -y lighthouse http://localhost:4173 --chrome-flags="--headless" --output=html --output-path=audit.html --quiet
```

`npm run auditar` deja el informe en `frontend/public/lighthouse.json`; el siguiente
`npm run build` lo incrusta en `dist/metricas-build.json` y el tablero lo muestra.
Audita también `vite build` y revisa el gzip de `dist/`.

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
| **4.1.3 Mensajes de estado** | Tablero `/sostenibilidad`: cada indicador es texto + barra con `role="meter"`, `aria-valuenow/min/max`; ningún estado se comunica solo con color. |

## 3. Checklist de verificación final

- [x] `python -m pytest` pasa en `backend/` (50) y en `taskflow/` (19).
- [x] `npm run lint` y `npm run build` pasan en `frontend/` sin errores.
- [x] Bundle gzip < 300 KB (156.79 kB) y `dist/metricas-build.json` publicado.
- [ ] Lighthouse ≥ 90 en las cuatro categorías — **requiere Google Chrome**; correr `npm run auditar`.
- [x] Navegación completa con teclado (Tab / Enter) en `/login`, `/feed`, `/reportar`.
- [x] Formularios de login/reporte muestran errores por campo anunciados por lectores.
- [x] Ningún estado se comunica solo con color (badges con texto: Activo, Confirmado…).
- [x] Probar desconexión de red en `/reportar`: cola offline y sincronización manual.