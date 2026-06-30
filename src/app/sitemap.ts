import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

const BASE_URL = 'https://www.montevida.pe'

const staticPages: MetadataRoute.Sitemap = [
  { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
  { url: `${BASE_URL}/tienda`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  { url: `${BASE_URL}/politica-de-envios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/politica-de-garantia`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/politica-de-privacidad`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  { url: `${BASE_URL}/terminos-y-condiciones`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()

  type ProductRow = { slug: string; updated_at: string }
  const { data } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('activo', true)
    .eq('visible_web', true)
    .not('slug', 'is', null)

  const products = (data ?? []) as unknown as ProductRow[]

  const productPages: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/producto/${p.slug}`,
    lastModified: new Date(p.updated_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  return [...staticPages, ...productPages]
}
