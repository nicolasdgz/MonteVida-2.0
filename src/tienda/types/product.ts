/**
 * UIProduct — shape de presentación del storefront.
 *
 * Este tipo representa un producto transformado para uso en UI.
 * Los campos crudos de DB (precio_costo, category_id, etc.) no están aquí.
 * La transformación DB → UI la realiza `toUIProduct()` en `src/lib/data.ts`.
 *
 * Fuente de verdad de DB: `Database["public"]["Tables"]["products"]["Row"]` en `src/types/database.ts`
 */
export type Product = {
  id: string | number;
  title: string;
  price: number;
  discountedPrice: number;
  reviews: number;
  slug?: string;
  imgs?: {
    thumbnails: string[];
    previews: string[];
  };
  categories?: string[];
  /** Mapeado desde `products.descripcion`. Siempre string (nunca array de bloques Sanity). */
  shortDescription?: string;
  /** Mapeado desde `products.unidad` (ej: "und", "kg", "lt"). */
  presentation?: string;
  stock?: number;
  stockMinimo?: number;
  isHeroCarousel?: boolean;
  isHeroOferta?: boolean;
  isPromoSection?: boolean;
};
