import { gzipSync } from 'node:zlib'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const DIST = join(RAIZ, 'dist')

const PRESUPUESTO_KB = 500

function listar(dir, acc = []) {
  for (const entrada of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, entrada.name)
    if (entrada.isDirectory()) listar(ruta, acc)
    else acc.push(ruta)
  }
  return acc
}

function kb(bytes) {
  return Math.round((bytes / 1024) * 100) / 100
}

function leerLighthouse() {
  try {
    const bruto = readFileSync(join(RAIZ, 'public', 'lighthouse.json'), 'utf8')
    const informe = JSON.parse(bruto)
    const categorias = {}
    for (const [clave, cat] of Object.entries(informe.categories || {})) {
      categorias[clave] = Math.round((cat.score ?? 0) * 100)
    }
    const audits = informe.audits || {}
    return {
      disponible: true,
      generado: informe.fetchTime || null,
      categorias,
      lcp_ms: Math.round(audits['largest-contentful-paint']?.numericValue || 0),
      tbt_ms: Math.round(audits['total-blocking-time']?.numericValue || 0),
      cls: Math.round((audits['cumulative-layout-shift']?.numericValue || 0) * 1000) / 1000,
    }
  } catch {
    return { disponible: false, categorias: {}, lcp_ms: 0, tbt_ms: 0, cls: 0 }
  }
}

const archivos = listar(DIST)
const medidos = archivos
  .map((ruta) => {
    const buffer = readFileSync(ruta)
    const nombre = relative(DIST, ruta).split(sep).join('/')
    return {
      archivo: nombre,
      bruto: buffer.length,
      gzip: gzipSync(buffer).length,
    }
  })
  .sort((a, b) => b.gzip - a.gzip)

const totalBruto = medidos.reduce((suma, a) => suma + a.bruto, 0)
const totalGzip = medidos.reduce((suma, a) => suma + a.gzip, 0)

const inicial = medidos
  .filter((a) => /^(index\.html|assets\/index-.*\.(js|css))$/.test(a.archivo))
  .reduce(
    (suma, a) => ({ bruto: suma.bruto + a.bruto, gzip: suma.gzip + a.gzip }),
    { bruto: 0, gzip: 0 },
  )

const mapa = medidos.filter((a) => a.archivo.startsWith('assets/mapa-'))
const hojaDeRuta = medidos.filter((a) => a.archivo.startsWith('assets/'))

const reporte = {
  generado: new Date().toISOString(),
  presupuesto_kb: PRESUPUESTO_KB,
  totales: { archivos: medidos.length, bruto_kb: kb(totalBruto), gzip_kb: kb(totalGzip) },
  carga_inicial: { bruto_kb: kb(inicial.bruto), gzip_kb: kb(inicial.gzip) },
  diferido: {
    hojas_de_ruta_kb: kb(hojaDeRuta.reduce((s, a) => s + a.gzip, 0)),
    mapa_kb: kb(mapa.reduce((s, a) => s + a.gzip, 0)),
  },
  cumple_peso: totalGzip <= PRESUPUESTO_KB * 1024,
  lighthouse: leerLighthouse(),
  archivos: medidos.map((a) => ({ archivo: a.archivo, bruto_kb: kb(a.bruto), gzip_kb: kb(a.gzip) })),
}

writeFileSync(join(DIST, 'metricas-build.json'), `${JSON.stringify(reporte, null, 2)}\n`)

const marca = reporte.cumple_peso ? 'OK ' : 'NO '
console.log(`[metricas] carga inicial (gzip): ${reporte.carga_inicial.gzip_kb} kB`)
console.log(`[metricas] total servido (gzip): ${reporte.totales.gzip_kb} kB`)
console.log(`[metricas] total servido (bruto): ${reporte.totales.bruto_kb} kB`)
console.log(`[metricas] mapa Leaflet diferido: ${reporte.diferido.mapa_kb} kB`)
for (const [clave, valor] of Object.entries(reporte.lighthouse.categorias)) {
  console.log(`[metricas] lighthouse ${clave}: ${valor}`)
}
console.log(`[metricas] presupuesto ${PRESUPUESTO_KB} kB gzip -> ${marca}${reporte.cumple_peso ? 'cumple' : 'excede'}`)
console.log(`[metricas] escrito dist/metricas-build.json (${statSync(join(DIST, 'metricas-build.json')).size} bytes)`)
