import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const PUBLICO = join(RAIZ, 'public')
const DESTINO = join(PUBLICO, 'lighthouse.json')
const INFORME_COMPLETO = join(RAIZ, 'lighthouse-report.json')
const ORIGEN = process.env.AUDITAR_ORIGEN || 'http://localhost:4173'
const BASE = baseDelBuild()
const URL_AUDITADA = process.env.AUDITAR_URL || `${ORIGEN.replace(/\/+$/, '')}${BASE}`

const NAVEGADORES = [
  { nombre: 'Chrome', ruta: join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe') },
  { nombre: 'Chrome (x86)', ruta: join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Google\\Chrome\\Application\\chrome.exe') },
  { nombre: 'Chrome (perfil local)', ruta: join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe') },
  { nombre: 'Edge', ruta: join(process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe') },
  { nombre: 'Edge (64 bits)', ruta: join(process.env.PROGRAMFILES || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe') },
]

function detectarNavegador() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return { nombre: process.env.CHROME_PATH, ruta: process.env.CHROME_PATH }
  }
  return NAVEGADORES.find((n) => n.ruta && existsSync(n.ruta)) || null
}

// El informe se pide por stdout a proposito: asi ninguna ruta de disco (que en este
// equipo tiene espacios) pasa por la linea de comandos de cmd.exe.
// En Windows chrome-launcher suele fallar con EPERM al borrar el perfil temporal
// DESPUES de imprimir el informe, asi que tambien se acepta el stdout del fallo.
function correrLighthouse() {
  const opciones = {
    cwd: RAIZ,
    encoding: 'utf8',
    shell: true,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024,
  }
  const argumentos = [
    '-y',
    'lighthouse',
    URL_AUDITADA,
    '--chrome-flags=--headless=new --no-sandbox --disable-gpu',
    '--max-wait-for-load=45000',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    '--quiet',
  ]

  let salida
  try {
    salida = execFileSync('npx.cmd', argumentos, opciones)
  } catch (error) {
    if (!error.stdout || !String(error.stdout).includes('"categories"')) throw error
    console.warn('[auditar] aviso: lighthouse termino con error al limpiar el perfil temporal de Edge')
    salida = error.stdout
  }

  const informe = JSON.parse(salida)
  if (!informe.categories) throw new Error('el informe no trae categorías')
  return informe
}

// Un build con VITE_BASE=/GreenLight/ publica sus assets bajo /GreenLight/. Si se
// audita la raiz del preview, el HTML responde 200 pero ningun asset carga, la pagina
// no pinta nada y lighthouse aborta con NO_FCP. Por eso la URL se deduce del build.
function baseDelBuild() {
  if (process.env.VITE_BASE) return process.env.VITE_BASE
  try {
    const html = readFileSync(join(RAIZ, 'dist', 'index.html'), 'utf8')
    const src = html.match(/(?:src|href)="(\/[^"]*assets\/)/)?.[1]
    return src ? src.replace(/assets\/$/, '') : '/'
  } catch {
    return '/'
  }
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

// public/ se copia a dist/, asi que el informe completo (cientos de kB) no puede
// publisharse: se deja solo lo que necesita medir.mjs para el tablero.
function resumir(informe) {
  const auditorias = informe.audits || {}
  const categorias = {}
  for (const [clave, categoria] of Object.entries(informe.categories || {})) {
    categorias[clave] = { score: categoria.score ?? 0 }
  }
  return {
    fetchTime: informe.fetchTime || null,
    lighthouseVersion: informe.lighthouseVersion || null,
    requestedUrl: informe.requestedUrl || URL_AUDITADA,
    categories: categorias,
    audits: {
      'largest-contentful-paint': { numericValue: auditorias['largest-contentful-paint']?.numericValue ?? 0 },
      'total-blocking-time': { numericValue: auditorias['total-blocking-time']?.numericValue ?? 0 },
      'cumulative-layout-shift': { numericValue: auditorias['cumulative-layout-shift']?.numericValue ?? 0 },
    },
  }
}

async function esperarPreview(intentos = 60) {
  for (let i = 0; i < intentos; i += 1) {
    try {
      const respuesta = await fetch(URL_AUDITADA, { redirect: 'follow' })
      if (respuesta.ok) return
    } catch {
      /* el preview todavia no responde */
    }
    await esperar(500)
  }
  throw new Error(`el preview no respondio en ${URL_AUDITADA}`)
}

// Si el HTML responde pero los assets no, lighthouse falla con NO_FCP sin explicar
// nada: se comprueba aqui el status Y el content-type, porque el fallback de la SPA
// devuelve index.html con 200 para cualquier ruta.
const TIPOS_ESPERADOS = { '.js': 'javascript', '.css': 'css', '.svg': 'svg', '.json': 'json', '.html': 'html' }

async function verificarAssets() {
  const html = await (await fetch(URL_AUDITADA)).text()
  const rutas = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)].map((m) => m[1])
  if (!rutas.length) throw new Error('el HTML no referencia ningun asset')
  for (const ruta of rutas) {
    const respuesta = await fetch(new URL(ruta, URL_AUDITADA))
    if (!respuesta.ok) throw new Error(`${ruta} devuelve ${respuesta.status} (revisa VITE_BASE)`)
    const tipo = respuesta.headers.get('content-type') || ''
    const extension = ruta.slice(ruta.lastIndexOf('.'))
    const esperado = TIPOS_ESPERADOS[extension]
    if (esperado && !tipo.includes(esperado)) {
      throw new Error(`${ruta} devuelve "${tipo}" en vez de ${esperado}: el preview no esta sirviendo el build (VITE_BASE=${BASE})`)
    }
  }
}

console.log(`[auditar] levantando preview en ${URL_AUDITADA}`)
// El preview debe usar la misma base que el build: con VITE_BASE distinto, vite
// sirve el fallback index.html para /GreenLight/assets/* y la pagina no monta nada.
const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4173'], {
  cwd: RAIZ,
  stdio: 'ignore',
  shell: true,
  windowsHide: true,
  env: { ...process.env, VITE_BASE: BASE },
})

try {
  const navegador = detectarNavegador()
  if (!navegador) throw new Error('no se encontro Chrome ni Edge en el sistema')
  console.log(`[auditar] navegador: ${navegador.nombre}`)
  process.env.CHROME_PATH = navegador.ruta

  await esperarPreview()
  await verificarAssets()
  console.log('[auditar] ejecutando lighthouse (la primera vez descarga el paquete)')

  // El headless de Edge a veces arranca sin pintar (NO_FCP): se reintenta en vez de
  // publicar un informe de ceros.
  const REINTENTOS = 3
  let informe = null
  for (let intento = 1; intento <= REINTENTOS; intento += 1) {
    try {
      const candidato = correrLighthouse()
      if (candidato.runtimeError) throw new Error(candidato.runtimeError.code || 'runtimeError')
      if (Object.values(candidato.categories || {}).some((c) => c.score == null)) {
        throw new Error('categorias sin puntuar')
      }
      informe = candidato
      break
    } catch (error) {
      console.warn(`[auditar] intento ${intento}/${REINTENTOS} no sirve: ${error.message}`)
      if (intento < REINTENTOS) await esperar(2000)
    }
  }
  if (!informe) throw new Error('ningun intento produjo un informe valido')

  writeFileSync(INFORME_COMPLETO, JSON.stringify(informe, null, 2), 'utf8')
  mkdirSync(PUBLICO, { recursive: true })
  writeFileSync(DESTINO, `${JSON.stringify(resumir(informe), null, 2)}\n`, 'utf8')

  for (const [categoria, valor] of Object.entries(informe.categories)) {
    console.log(`[auditar] ${categoria}: ${Math.round(valor.score * 100)}`)
  }
  console.log('[auditar] informe completo en lighthouse-report.json (no se publica)')
  console.log('[auditar] resumen en public/lighthouse.json -> lo lee el tablero')
  console.log('[auditar] ejecuta "npm run build" para volcar las metricas al tablero')
} catch (error) {
  console.error(`[auditar] fallo: ${error.message}`)
  console.error('[auditar] requiere Google Chrome o Microsoft Edge. El tablero funciona sin este informe.')
  process.exitCode = 1
} finally {
  if (preview.pid) {
    try {
      execFileSync('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    } catch {
      /* el proceso ya termino */
    }
  } else {
    preview.kill()
  }
}
