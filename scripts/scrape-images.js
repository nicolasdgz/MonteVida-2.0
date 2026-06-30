const puppeteer = require('puppeteer')

;(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
  await page.goto('https://www.montevida.pe/tienda', { waitUntil: 'networkidle2', timeout: 30000 })

  // Scroll para lazy load
  await page.evaluate(async () => {
    await new Promise(r => {
      let scrollY = 0
      const timer = setInterval(() => {
        scrollY += 400
        window.scrollTo(0, scrollY)
        if (scrollY >= document.body.scrollHeight) { clearInterval(timer); r() }
      }, 150)
    })
  })
  await new Promise(r => setTimeout(r, 2000))

  const products = await page.evaluate(() => {
    // Try to find product cards — each card has name + image
    const results = []

    // Strategy: find all <img> that have sanity CDN src, then walk up to find sibling text (product name)
    const imgs = Array.from(document.querySelectorAll('img'))
    for (const img of imgs) {
      const src = img.src || ''
      if (!src.includes('cdn.sanity.io')) continue

      // Decode the Next.js image proxy URL to get the real Sanity URL
      let sanityUrl = src
      try {
        const parsed = new URL(src)
        const encoded = parsed.searchParams.get('url')
        if (encoded) sanityUrl = decodeURIComponent(encoded)
      } catch {}

      // Walk up the DOM to find a product name (h2, h3, p with product-like text)
      let name = ''
      let el = img.parentElement
      for (let i = 0; i < 8; i++) {
        if (!el) break
        const headings = el.querySelectorAll('h2, h3, h4, [class*="title"], [class*="name"]')
        for (const h of headings) {
          const t = h.textContent.trim()
          if (t.length > 5 && t.length < 200) { name = t; break }
        }
        if (name) break
        el = el.parentElement
      }

      // Fallback: find nearest text node
      if (!name) {
        let el2 = img.parentElement
        for (let i = 0; i < 6; i++) {
          if (!el2) break
          const ps = el2.querySelectorAll('p, span, a')
          for (const p of ps) {
            const t = p.textContent.trim()
            if (t.length > 10 && t.length < 200 && !t.includes('S/.') && !t.includes('★')) {
              name = t; break
            }
          }
          if (name) break
          el2 = el2.parentElement
        }
      }

      results.push({ name: name || '(sin nombre)', sanityUrl })
    }

    return results
  })

  // Deduplicate by sanityUrl
  const seen = new Set()
  const unique = products.filter(p => {
    if (seen.has(p.sanityUrl)) return false
    seen.add(p.sanityUrl)
    return true
  })

  console.log(`\n=== ${unique.length} PRODUCTOS CON IMAGEN ===\n`)
  unique.forEach((p, i) => {
    console.log(`${String(i+1).padStart(2, '0')}. ${p.name}`)
    console.log(`    ${p.sanityUrl}\n`)
  })

  // JSON output para siguiente script
  const fs = require('fs')
  fs.writeFileSync('./scripts/product-images.json', JSON.stringify(unique, null, 2))
  console.log('\n[Guardado en scripts/product-images.json]')

  await browser.close()
})()
