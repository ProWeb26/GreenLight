import { execFileSync, spawn } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const PUBLICO = join(RAIZ, 'public')
const DESTINO = join(PUBLICO, 'lighthouse.json')
const URL_AUDITADA = process.env.AUDITAR_URL || 'http://localhost:4173'
const SALIDA = join(RAIZ, 'lighthouse-report.json')

function correr(args) {
  return execFileSync('npx.cmd', args, { cwd: RAIZ, stdio: 'inherit' })
}

console.log(`[auditar] levantando preview en ${URL_AUDITADA}`)
const preview = spawn('npx.cmd', ['vite', 'preview', '--port', '4173'], {
  cwd: RAIZ,
  stdio: 'ignore',
  shell: true,
})

const esperar = (ms) => new Promise((r) => setTimeout(r, ms))

try {
  await esperar(3000)
  console.log(`[auditar] ejecutando lighthouse sobre ${URL_AUDITADA}`)
  correr([
    '-y',
    'lighthouse',
    URL_AUDITADA,
    '--chrome-flags=--headless --no-sandbox',
    '--only-categories=performance,accessibility,best-practices,seo',
    '--output=json',
    `--output-path=${SALIDA}`,
    '--quiet',
  ])

  if (!existsSync(SALIDA)) throw new Error('lighthouse no generó informe')
  mkdirSync(PUBLICO, { recursive: true })
  copyFileSync(SALIDA, DESTINO)
  console.log(`[auditar] informe copiado a public/lighthouse.json`)
  console.log('[auditar] ejecuta "npm run build" para volcar las métricas al tablero')
} catch (error) {
  console.error(`[auditar] falló: ${error.message}`)
  console.error('[auditar] requiere Google Chrome instalado. El tablero funciona sin este informe.')
  process.exitCode = 1
} finally {
  preview.kill()
  if (process.platform === 'win32' && preview.pid) {
    try {
      execFileSync('taskkill', ['/pid', String(preview.pid), '/T', '/F'], { stdio: 'ignore' })
    } catch {
      /* el proceso ya terminó */
    }
  }
  if (existsSync(SALIDA)) rmSync(SALIDA, { force: true })
}
