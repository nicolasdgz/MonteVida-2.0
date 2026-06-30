/**
 * import-product.js
 * Usage: node import-product.js
 *
 * Full pipeline for one product:
 *   1. Scrape PDP from old site
 *   2. Download image from Sanity CDN
 *   3. Upload to Supabase Storage bucket "product-images"
 *   4. UPDATE products row: imagen_url, descripcion, slug, precio_oferta, visible_web=true
 */

const puppeteer = require('puppeteer')
const https = require('https')
const http = require('http')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// ── Config ────────────────────────────────────────────────────────────────────

const SUPABASE_URL = 'https://pvurmbrdifngjytkkcwu.supabase.co'
const SERVICE_ROLE_KEY = 'REMOVED'
const STORAGE_BUCKET = 'product-images'

// Product to import
const TARGET = {
  // DB product name (for matching)
  dbNombre: 'Gomitas Sottcor - BBL - Aguaje y Maca Roja (130 Gomitas)',
  // Old site PDP URL
  oldSiteUrl: 'https://www.montevida.pe/producto/bbl-gomitas-sottcor-aguaje-y-maca-roja-130-gomitas',
  // Slug to assign in our DB
  newSlug: 'bbl-aguaje-maca-roja-gomitas-sottcor-130',
}

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

// ── Main ─────────────────────────────────────────────────────────────────────

;(async () => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  // ── 1. Scrape PDP ──────────────────────────────────────────────────────────
  console.log('\n[1/4] Scraping PDP:', TARGET.oldSiteUrl)
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  await page.goto(TARGET.oldSiteUrl, { waitUntil: 'networkidle2', timeout: 30000 })
  await new Promise(r => setTimeout(r, 2000))

  const scraped = await page.evaluate(() => {
    // Title
    const titulo = document.querySelector('h2')?.textContent?.trim() || ''

    // Descripción: get the "Detalles del Producto" section content
    let descripcion = ''
    const allText = []
    const mainContent = document.querySelector('main, [class*="product"], [class*="detail"], article')
    const root = mainContent || document.body

    // Find h2 "Detalles del Producto" and grab everything until next h2
    const allEls = Array.from(root.querySelectorAll('h2, p, ul, li'))
    let capturing = false
    for (const el of allEls) {
      const text = el.textContent.trim()
      if (!text) continue
      if (el.tagName === 'H2' && text === 'Detalles del Producto') { capturing = true; continue }
      if (el.tagName === 'H2' && capturing) break
      if (capturing && el.tagName !== 'UL') {
        if (el.tagName === 'LI') allText.push('• ' + text)
        else allText.push(text)
      }
    }
    descripcion = allText.join('\n')

    // Precio regular + oferta
    const bodyText = document.body.innerText
    const precioRegMatch = bodyText.match(/Precio Regular[:\s]*S\/\.\s*([\d.]+)/)
    const precioPromoMatch = bodyText.match(/Precio Promocional[:\s]*S\/\.\s*([\d.]+)/)
    const precioRegular = precioRegMatch ? parseFloat(precioRegMatch[1]) : null
    const precioOferta = precioPromoMatch ? parseFloat(precioPromoMatch[1]) : null

    // Imagen Sanity CDN
    const imgs = Array.from(document.querySelectorAll('img'))
    let sanityUrl = null
    for (const img of imgs) {
      const src = img.src || ''
      if (!src.includes('cdn.sanity.io') && !src.includes('sanity.io')) continue
      try {
        const parsed = new URL(src)
        const encoded = parsed.searchParams.get('url')
        if (encoded) { sanityUrl = decodeURIComponent(encoded); break }
      } catch {}
    }

    // Categoría
    const catMatch = bodyText.match(/Categoría[s]?\s*\n([^\n]+)/)
    const categoria = catMatch ? catMatch[1].trim() : ''

    return { titulo, descripcion, precioRegular, precioOferta, sanityUrl, categoria }
  })

  await browser.close()

  console.log('\n── Scraped data ──────────────────────────────────────')
  console.log('Título:', scraped.titulo)
  console.log('Precio regular:', scraped.precioRegular)
  console.log('Precio oferta:', scraped.precioOferta)
  console.log('Categoría:', scraped.categoria)
  console.log('Imagen Sanity:', scraped.sanityUrl)
  console.log('\nDescripción:\n' + scraped.descripcion)
  console.log('─────────────────────────────────────────────────────\n')

  if (!scraped.sanityUrl) { console.error('ERROR: no se encontró imagen Sanity'); process.exit(1) }

  // ── 2. Download image ──────────────────────────────────────────────────────
  console.log('[2/4] Descargando imagen desde Sanity CDN...')
  const { buffer: imgBuffer, contentType } = await downloadBuffer(scraped.sanityUrl)
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const filename = `${TARGET.newSlug}.${ext}`
  console.log(`      ${imgBuffer.length} bytes (${contentType}) → ${filename}`)

  // ── 3. Upload to Supabase Storage ──────────────────────────────────────────
  console.log('[3/4] Subiendo a Supabase Storage bucket:', STORAGE_BUCKET)
  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, imgBuffer, {
      contentType,
      upsert: true,
    })

  if (uploadError) { console.error('Upload error:', uploadError); process.exit(1) }

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename)
  const publicUrl = urlData.publicUrl
  console.log('      Public URL:', publicUrl)

  // ── 4. Update DB ───────────────────────────────────────────────────────────
  console.log('[4/4] Actualizando DB para:', TARGET.dbNombre)
  const { data: updated, error: updateError } = await supabase
    .from('products')
    .update({
      imagen_url: publicUrl,
      descripcion: scraped.descripcion,
      slug: TARGET.newSlug,
      precio_oferta: scraped.precioOferta,
      visible_web: true,
    })
    .eq('nombre', TARGET.dbNombre)
    .select('id, nombre, slug, imagen_url, precio_oferta, visible_web')

  if (updateError) { console.error('DB update error:', updateError); process.exit(1) }

  console.log('\n✓ Producto actualizado:')
  console.log(JSON.stringify(updated, null, 2))
  console.log('\n¡Listo! Verificá en http://localhost:3000/tienda')
})()
