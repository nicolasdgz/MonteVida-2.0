/**
 * import-bulk.js — Importa 19 productos restantes en secuencia.
 * Para cada producto: scrape PDP → descarga imagen → upload Storage → UPDATE DB.
 */

const puppeteer = require('puppeteer')
const https = require('https')
const http = require('http')
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const STORAGE_BUCKET = 'product-images'
const BASE_OLD = 'https://www.montevida.pe/producto/'

// ── Mapping: 19 productos restantes ──────────────────────────────────────────
// dbNombre: nombre exacto en la tabla products
// oldSlug:  slug del PDP en el sitio viejo
// newSlug:  slug que se asignará en nuestra DB
const PRODUCTS = [
  {
    dbNombre: 'Gomitas Sottcor - Colágeno con Biotina (130 Gomitas)',
    oldSlug:  'colageno-con-biotina-gomitas-sottcor-130-gomitas',
    newSlug:  'colageno-con-biotina-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor - Maca Negra + Huanarpo Macho (130 Gomitas)',
    oldSlug:  'gomitas-maca-negra-huanarpo-macho-sottcor-130-gomitas',
    newSlug:  'maca-negra-huanarpo-macho-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor - Omega 3, 6 y 9 - DHA, EPA y Colina (130 Gomitas)',
    oldSlug:  'gomitas-omega-3-6-y-9-sottcor-dha-epa-y-colina-130-gomitas',
    newSlug:  'omega-3-6-9-dha-epa-colina-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor - Orégano - Beneficio Natural (130 Gomitas)',
    oldSlug:  'gomitas-de-oregano-sottcor-beneficio-natural-130-gomitas',
    newSlug:  'oregano-beneficio-natural-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor - RE.NA.C. - Resveratrol y Vitamina B3 (130 Gomitas)',
    oldSlug:  'gomitas-re-na-c-sottcor-resveratrol-y-vitamina-b3',
    newSlug:  're-na-c-resveratrol-vitamina-b3-gomitas-sottcor-130',
  },
  // ── 150g — reusan imagen/desc del equivalente 130g ─────────────────────────
  {
    dbNombre: 'Gomitas de Citrato de Magnesio Sottcor (150 Gomitas)',
    oldSlug:  'gomitas-de-citrato-de-magnesio-sottcor-130-gomitas',
    newSlug:  'citrato-de-magnesio-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas de Colágeno con Biotina SOTTCOR (150 Gomitas)',
    oldSlug:  'colageno-con-biotina-gomitas-sottcor-130-gomitas',
    newSlug:  'colageno-con-biotina-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas de Cúrcuma + Pimienta Negra Sottcor (150 Gomitas)',
    oldSlug:  'gomitas-de-curcuma-pimienta-negra-sottcor-130-gomitas',
    newSlug:  'curcuma-pimienta-negra-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas de Vinagre de Manzana Sottcor + Garcinia Cambogia (150 Gomitas)',
    oldSlug:  'gomitas-de-vinagre-de-manzana-sottcor-garcinia-cambogia-130-gomitas',
    newSlug:  'vinagre-de-manzana-garcinia-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas DULCE SUEÑOS Sottcor (150 Gomitas)',
    oldSlug:  'gomitas-dulce-suenos-sottcor-valeriana-manzanilla-y-toronjil-130-gomitas',
    newSlug:  'dulce-suenos-valeriana-manzanilla-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas HEPA DETOX Sottcor (150 Gomitas)',
    oldSlug:  'gomitas-hepa-detox-sottcor-purificacion-y-cuidado-hepatico-130-gomitas',
    newSlug:  'hepa-detox-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas LIPOGOM CIDER PLUS Sottcor (150 Gomitas)',
    oldSlug:  'gomitas-lipogom-cider-plus-sottcor-130-gomitas',
    newSlug:  'lipogom-cider-plus-gomitas-sottcor-150',
  },
  // ── Kids ──────────────────────────────────────────────────────────────────
  {
    dbNombre: 'Gomitas Sottcor Kids - Buenas Noches (150 Gomitas)',
    oldSlug:  'gomitas-buenas-noches-kids-sottcor-dulces-suenos-130-gomitas',
    newSlug:  'buenas-noches-kids-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas Sottcor Kids - Citrato de Magnesio (150 Gomitas)',
    oldSlug:  'gomitas-sottcor-kids-citrato-de-magnesio-130-gomitas',
    newSlug:  'citrato-de-magnesio-kids-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas Sottcor Kids - Hierro + Moringa y Vitamina C (130 Gomitas)',
    oldSlug:  'gomitas-sottcor-kids-hierro-moringa-y-vitamina-c-130-gomitas',
    newSlug:  'hierro-moringa-vitamina-c-kids-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor Kids - Multivitamínico Completo (130 Gomitas)',
    oldSlug:  'gomitas-sottcor-kids-multivitaminico-completo-130-gomitas',
    newSlug:  'multivitaminico-completo-kids-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor Kids - Omega 3 + DHA + EPA + ARA (150 Gomitas)',
    oldSlug:  'gomitas-sottcor-kids-omega-3-dha-epa-ara-130-gomitas',
    newSlug:  'omega-3-dha-epa-ara-kids-gomitas-sottcor-150',
  },
  {
    dbNombre: 'Gomitas Sottcor Kids - Zinc Quelado + Magnesio y Selenio (130 Gomitas)',
    oldSlug:  'gomitas-sottcor-kids-zinc-quelado-magnesio-y-selenio-130-gomitas',
    newSlug:  'zinc-quelado-magnesio-selenio-kids-gomitas-sottcor-130',
  },
  {
    dbNombre: 'Gomitas Sottcor Kids - Zinc Quelado + Magnesio y Selenio (150 Gomitas)',
    oldSlug:  'gomitas-sottcor-kids-zinc-quelado-magnesio-y-selenio-130-gomitas',
    newSlug:  'zinc-quelado-magnesio-selenio-kids-gomitas-sottcor-150',
  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] || 'image/png' }))
      res.on('error', reject)
    }).on('error', reject)
  })
}

async function scrapePDP(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 1500))

  return page.evaluate(() => {
    const bodyText = document.body.innerText

    // Descripción
    const allText = []
    const allEls = Array.from(document.querySelectorAll('h2, p, ul, li'))
    let capturing = false
    for (const el of allEls) {
      const text = el.textContent.trim()
      if (!text) continue
      if (el.tagName === 'H2' && text === 'Detalles del Producto') { capturing = true; continue }
      if (el.tagName === 'H2' && capturing) break
      if (capturing && el.tagName !== 'UL') {
        allText.push(el.tagName === 'LI' ? '• ' + text : text)
      }
    }

    // Precio oferta
    const promoMatch = bodyText.match(/Precio Promocional[:\s]*S\/\.\s*([\d.]+)/)
    const precioOferta = promoMatch ? parseFloat(promoMatch[1]) : null

    // Imagen Sanity
    let sanityUrl = null
    for (const img of document.querySelectorAll('img')) {
      const src = img.src || ''
      if (!src.includes('sanity.io')) continue
      try {
        const u = new URL(src)
        const enc = u.searchParams.get('url')
        if (enc) { sanityUrl = decodeURIComponent(enc); break }
      } catch {}
    }

    return { descripcion: allText.join('\n'), precioOferta, sanityUrl }
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

  // Cache de imágenes ya descargadas (sanityUrl → buffer) para no repetir downloads
  const imgCache = new Map()

  const results = []

  for (let i = 0; i < PRODUCTS.length; i++) {
    const prod = PRODUCTS[i]
    const label = `[${i + 1}/${PRODUCTS.length}] ${prod.dbNombre}`
    console.log('\n' + '─'.repeat(60))
    console.log(label)

    try {
      // 1. Scrape
      const pdpUrl = BASE_OLD + prod.oldSlug
      const scraped = await scrapePDP(page, pdpUrl)
      console.log(`  ↳ desc: ${scraped.descripcion.length} chars | oferta: S/.${scraped.precioOferta} | img: ${scraped.sanityUrl ? 'OK' : 'MISSING'}`)

      if (!scraped.sanityUrl) throw new Error('No se encontró imagen Sanity')

      // 2. Download (con cache)
      let imgData = imgCache.get(scraped.sanityUrl)
      if (!imgData) {
        imgData = await downloadBuffer(scraped.sanityUrl)
        imgCache.set(scraped.sanityUrl, imgData)
        console.log(`  ↳ imagen descargada: ${imgData.buffer.length} bytes`)
      } else {
        console.log(`  ↳ imagen desde cache (${imgData.buffer.length} bytes)`)
      }

      // 3. Upload
      const ext = imgData.contentType.includes('png') ? 'png' : imgData.contentType.includes('webp') ? 'webp' : 'jpg'
      const filename = `${prod.newSlug}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filename, imgData.buffer, { contentType: imgData.contentType, upsert: true })
      if (uploadErr) throw new Error(`Upload: ${uploadErr.message}`)
      const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
      console.log(`  ↳ storage: ${urlData.publicUrl}`)

      // 4. DB update
      const { error: dbErr } = await supabase
        .from('products')
        .update({
          imagen_url:   urlData.publicUrl,
          descripcion:  scraped.descripcion,
          slug:         prod.newSlug,
          precio_oferta: scraped.precioOferta,
          visible_web:  true,
        })
        .eq('nombre', prod.dbNombre)
      if (dbErr) throw new Error(`DB: ${dbErr.message}`)

      console.log(`  ✓ OK`)
      results.push({ nombre: prod.dbNombre, status: 'OK' })

    } catch (err) {
      console.error(`  ✗ ERROR: ${err.message}`)
      results.push({ nombre: prod.dbNombre, status: 'ERROR', error: err.message })
    }
  }

  await browser.close()

  console.log('\n' + '═'.repeat(60))
  console.log('RESUMEN FINAL')
  console.log('═'.repeat(60))
  const ok = results.filter(r => r.status === 'OK')
  const err = results.filter(r => r.status === 'ERROR')
  console.log(`✓ OK:    ${ok.length}`)
  console.log(`✗ Error: ${err.length}`)
  if (err.length) err.forEach(r => console.log(`  - ${r.nombre}: ${r.error}`))
  console.log('\n¡Listo! Verificá en http://localhost:3000/tienda')
})()
