// Auto-generated from Supabase — DO NOT EDIT the Database interface manually.
// Regenerate with: npx supabase gen types typescript --project-id pvurmbrdifngjytkkcwu
// Convenience types at the bottom are manually maintained.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
        }
        Relationships: []
      }
      cierres_caja: {
        Row: {
          created_at: string | null
          diferencia: number
          efectivo_esperado: number
          efectivo_real: number
          fecha: string
          id: string
          notas: string | null
          staff_id: string
        }
        Insert: {
          created_at?: string | null
          diferencia?: number
          efectivo_esperado?: number
          efectivo_real?: number
          fecha: string
          id?: string
          notas?: string | null
          staff_id: string
        }
        Update: {
          created_at?: string | null
          diferencia?: number
          efectivo_esperado?: number
          efectivo_real?: number
          fecha?: string
          id?: string
          notas?: string | null
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cierres_caja_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          email: string | null
          es_anonimo: boolean
          id: string
          nombre: string
          numero_documento: string | null
          telefono: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          es_anonimo?: boolean
          id?: string
          nombre: string
          numero_documento?: string | null
          telefono?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          es_anonimo?: boolean
          id?: string
          nombre?: string
          numero_documento?: string | null
          telefono?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: []
      }
      compra_gastos: {
        Row: {
          compra_id: string
          concepto: string
          created_at: string | null
          id: string
          monto: number
        }
        Insert: {
          compra_id: string
          concepto: string
          created_at?: string | null
          id?: string
          monto: number
        }
        Update: {
          compra_id?: string
          concepto?: string
          created_at?: string | null
          id?: string
          monto?: number
        }
        Relationships: [
          {
            foreignKeyName: "compra_gastos_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
        ]
      }
      compra_items: {
        Row: {
          cantidad: number
          compra_id: string
          created_at: string | null
          id: string
          precio_costo: number
          product_id: string
          subtotal: number
        }
        Insert: {
          cantidad: number
          compra_id: string
          created_at?: string | null
          id?: string
          precio_costo: number
          product_id: string
          subtotal: number
        }
        Update: {
          cantidad?: number
          compra_id?: string
          created_at?: string | null
          id?: string
          precio_costo?: number
          product_id?: string
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "compra_items_compra_id_fkey"
            columns: ["compra_id"]
            isOneToOne: false
            referencedRelation: "compras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compra_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      compras: {
        Row: {
          admin_id: string
          created_at: string | null
          fecha: string
          id: string
          notas: string | null
          proveedor: string | null
          total: number
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          fecha: string
          id?: string
          notas?: string | null
          proveedor?: string | null
          total?: number
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          fecha?: string
          id?: string
          notas?: string | null
          proveedor?: string | null
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "compras_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      configuracion: {
        Row: {
          banner_url: string | null
          created_at: string
          email_notificaciones: string | null
          id: string
          igv_porcentaje: number
          logo_url: string | null
          moneda: string
          nombre_negocio: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          email_notificaciones?: string | null
          id?: string
          igv_porcentaje?: number
          logo_url?: string | null
          moneda?: string
          nombre_negocio?: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          email_notificaciones?: string | null
          id?: string
          igv_porcentaje?: number
          logo_url?: string | null
          moneda?: string
          nombre_negocio?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          admin_id: string
          categoria: Database["public"]["Enums"]["expense_category"]
          comprobante_url: string | null
          created_at: string
          descripcion: string
          fecha: string
          id: string
          monto: number
          updated_at: string
        }
        Insert: {
          admin_id: string
          categoria?: Database["public"]["Enums"]["expense_category"]
          comprobante_url?: string | null
          created_at?: string
          descripcion: string
          fecha?: string
          id?: string
          monto: number
          updated_at?: string
        }
        Update: {
          admin_id?: string
          categoria?: Database["public"]["Enums"]["expense_category"]
          comprobante_url?: string | null
          created_at?: string
          descripcion?: string
          fecha?: string
          id?: string
          monto?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          activo: boolean
          category_id: string | null
          codigo: string | null
          created_at: string
          descripcion: string | null
          id: string
          imagen_url: string | null
          imagenes: string[] | null
          nombre: string
          precio_costo: number
          precio_oferta: number | null
          precio_venta: number
          slug: string | null
          stock: number
          stock_minimo: number
          unidad: string
          updated_at: string
          visible_web: boolean
        }
        Insert: {
          activo?: boolean
          category_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          imagenes?: string[] | null
          nombre: string
          precio_costo?: number
          precio_oferta?: number | null
          precio_venta: number
          slug?: string | null
          stock?: number
          stock_minimo?: number
          unidad?: string
          updated_at?: string
          visible_web?: boolean
        }
        Update: {
          activo?: boolean
          category_id?: string | null
          codigo?: string | null
          created_at?: string
          descripcion?: string | null
          id?: string
          imagen_url?: string | null
          imagenes?: string[] | null
          nombre?: string
          precio_costo?: number
          precio_oferta?: number | null
          precio_venta?: number
          slug?: string | null
          stock?: number
          stock_minimo?: number
          unidad?: string
          updated_at?: string
          visible_web?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          direccion_envio: string | null
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          telefono: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          direccion_envio?: string | null
          full_name: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          direccion_envio?: string | null
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          cantidad: number
          created_at: string
          id: string
          precio_costo: number
          precio_unitario: number
          product_id: string
          sale_id: string
          subtotal: number | null
        }
        Insert: {
          cantidad: number
          created_at?: string
          id?: string
          precio_costo: number
          precio_unitario: number
          product_id: string
          sale_id: string
          subtotal?: number | null
        }
        Update: {
          cantidad?: number
          created_at?: string
          id?: string
          precio_costo?: number
          precio_unitario?: number
          product_id?: string
          sale_id?: string
          subtotal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          titulo: string | null
          contenido: string
          estado: 'pendiente' | 'aprobada' | 'rechazada'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          titulo?: string | null
          contenido: string
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          titulo?: string | null
          contenido?: string
          estado?: 'pendiente' | 'aprobada' | 'rechazada'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          cliente_id: string | null
          created_at: string
          descuento: number | null
          estado_envio: Database["public"]["Enums"]["estado_envio_type"] | null
          estado_lead: Database["public"]["Enums"]["estado_lead"]
          fecha_venta: string
          id: string
          igv_monto: number
          metodo_pago: Database["public"]["Enums"]["payment_method"]
          notas: string | null
          notas_lead: string | null
          numero_venta: number
          origen: Database["public"]["Enums"]["sale_origen"]
          staff_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          subtotal: number
          total: number
          updated_at: string
          voucher_url: string | null
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          descuento?: number | null
          estado_envio?: Database["public"]["Enums"]["estado_envio_type"] | null
          estado_lead?: Database["public"]["Enums"]["estado_lead"]
          fecha_venta?: string
          id?: string
          igv_monto?: number
          metodo_pago?: Database["public"]["Enums"]["payment_method"]
          notas?: string | null
          notas_lead?: string | null
          numero_venta?: number
          origen?: Database["public"]["Enums"]["sale_origen"]
          staff_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          voucher_url?: string | null
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          descuento?: number | null
          estado_envio?: Database["public"]["Enums"]["estado_envio_type"] | null
          estado_lead?: Database["public"]["Enums"]["estado_lead"]
          fecha_venta?: string
          id?: string
          igv_monto?: number
          metodo_pago?: Database["public"]["Enums"]["payment_method"]
          notas?: string | null
          notas_lead?: string | null
          numero_venta?: number
          origen?: Database["public"]["Enums"]["sale_origen"]
          staff_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          voucher_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      restaurar_stock_venta: { Args: { p_sale_id: string }; Returns: undefined }
      resumen_financiero: {
        Args: { p_desde: string; p_hasta: string }
        Returns: {
          cantidad_ventas: number
          igv_recaudado: number
          total_costo: number
          total_gastos: number
          total_ventas: number
          utilidad_bruta: number
          utilidad_neta: number
        }[]
      }
    }
    Enums: {
      estado_envio_type: "pendiente" | "preparando" | "enviado" | "entregado"
      estado_lead: "nuevo" | "contactado" | "convertido" | "perdido"
      expense_category:
        | "alquiler"
        | "servicios"
        | "personal"
        | "marketing"
        | "logistica"
        | "mantenimiento"
        | "impuestos"
        | "otros"
        | "mercaderia"
      payment_method:
        | "efectivo"
        | "tarjeta"
        | "transferencia"
        | "yape"
        | "plin"
        | "whatsapp"
      sale_origen: "pos" | "web"
      sale_status: "pendiente" | "completada" | "anulada"
      user_role: "admin" | "staff" | "customer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> =
  DefaultSchema["Tables"][T]["Update"]

export type Enums<T extends keyof DefaultSchema["Enums"]> =
  DefaultSchema["Enums"][T]

// Runtime enum values for use in UI (arrays, not just types)
export const Constants = {
  public: {
    Enums: {
      estado_envio_type: ["pendiente", "preparando", "enviado", "entregado"],
      expense_category: [
        "alquiler", "servicios", "personal", "marketing", "logistica",
        "mantenimiento", "impuestos", "otros", "mercaderia",
      ],
      payment_method: ["efectivo", "tarjeta", "transferencia", "yape", "plin", "whatsapp"],
      sale_origen: ["pos", "web"],
      sale_status: ["pendiente", "completada", "anulada"],
      user_role: ["admin", "staff", "customer"],
    },
  },
} as const

// ─── Enum string types (derived from DB, not manually maintained) ───────────
export type UserRole      = Enums<"user_role">
export type SaleStatus    = Enums<"sale_status">
export type PaymentMethod = Enums<"payment_method">
export type SaleOrigen    = Enums<"sale_origen">
export type EstadoEnvio   = Enums<"estado_envio_type">
export type ExpenseCategory = Enums<"expense_category">

// ─── Row convenience types ───────────────────────────────────────────────────
export type Profile      = Tables<"profiles">
export type Configuracion = Tables<"configuracion">
export type Category     = Tables<"categories">
export type Product      = Tables<"products">
export type Sale         = Tables<"sales">
export type SaleItem     = Tables<"sale_items">
export type Expense      = Tables<"expenses">
export type Cliente      = Tables<"clientes">
export type Compra       = Tables<"compras">
export type CompraItem   = Tables<"compra_items">
export type CompraGasto  = Tables<"compra_gastos">
export type CierreCaja   = Tables<"cierres_caja">

// ─── Composite / join types ──────────────────────────────────────────────────
export type SaleWithItems = Sale & {
  sale_items: (SaleItem & { products: Product })[]
  profiles: Pick<Profile, "full_name">
  clientes: Pick<Cliente, "nombre" | "es_anonimo"> | null
}

export type ProductWithCategory = Product & {
  categories: Category | null
}

export type ResumenFinanciero =
  Database["public"]["Functions"]["resumen_financiero"]["Returns"][0]

// ─── product_reviews (tabla manual, no generada aún) ────────────────────────
export type ReviewStatus = 'pendiente' | 'aprobada' | 'rechazada'

export interface ProductReview {
  id: string
  product_id: string
  user_id: string
  rating: number
  titulo: string | null
  contenido: string
  estado: ReviewStatus
  created_at: string
  updated_at: string
  profiles?: Pick<Profile, 'full_name'> | null
}
