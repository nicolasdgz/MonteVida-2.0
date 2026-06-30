import type { Product as UIProduct } from '@/tienda/types/product'
import type { Product as DBProduct, Category as DBCategory } from '@/types/database'

export type DBProductWithCategory = DBProduct & { categories: DBCategory | null }

export function toUIProduct(p: DBProduct & { categories?: DBCategory | null }): UIProduct {
  const images: string[] = []
  if (p.imagen_url) images.push(p.imagen_url)
  if (p.imagenes) images.push(...p.imagenes)

  return {
    id: p.id,
    title: p.nombre,
    price: p.precio_venta,
    discountedPrice: p.precio_oferta ?? p.precio_venta,
    reviews: 0,
    slug: p.slug ?? p.id,
    categories: p.categories ? [p.categories.nombre] : [],
    shortDescription: p.descripcion ?? '',
    presentation: p.unidad,
    imgs: images.length > 0 ? { thumbnails: images, previews: images } : undefined,
    isHeroCarousel: false,
    isHeroOferta: false,
    isPromoSection: false,
    stock: p.stock,
    stockMinimo: p.stock_minimo,
  }
}
