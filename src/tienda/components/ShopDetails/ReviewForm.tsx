'use client'
import { useState, useTransition } from 'react'
import { Star } from 'lucide-react'
import { crearResena } from '@/app/(site)/producto/[slug]/actions'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: string
  productSlug: string
  isLoggedIn: boolean
}

export default function ReviewForm({ productId, productSlug, isLoggedIn }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoggedIn) { toast.error('Inicia sesión para dejar una reseña'); return }
    if (rating === 0) { toast.error('Selecciona una calificación'); return }
    if (!contenido.trim()) { toast.error('Escribe un comentario'); return }

    startTransition(async () => {
      const result = await crearResena({ productId, productSlug, rating, titulo, contenido })
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Reseña enviada — será publicada tras revisión')
        setRating(0); setTitulo(''); setContenido('')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-medium text-2xl text-dark mb-3.5">Dejar una reseña</h2>
      <p className="mb-6 text-dark-4 text-sm">Tu reseña será publicada tras revisión del equipo.</p>

      {/* Stars */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-dark">Tu calificación*</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              aria-label={`${star} estrella${star > 1 ? 's' : ''}`}
            >
              <Star
                size={22}
                className="transition-colors duration-100"
                fill={(hovered || rating) >= star ? '#FBB040' : 'none'}
                stroke={(hovered || rating) >= star ? '#FBB040' : '#9CA3AF'}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-surface shadow-neu p-4 sm:p-6 flex flex-col gap-4">
        <div>
          <label htmlFor="rv-titulo" className="block mb-2 text-sm font-medium text-dark">
            Título (opcional)
          </label>
          <input
            id="rv-titulo"
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Resumen de tu experiencia"
            maxLength={120}
            className="rounded-xl border-0 bg-surface shadow-neu-inset placeholder:text-dark-5 w-full py-2.5 px-5 outline-none duration-200 focus:ring-2 focus:ring-primary/30 text-sm"
          />
        </div>

        <div>
          <label htmlFor="rv-contenido" className="block mb-2 text-sm font-medium text-dark">
            Comentario*
          </label>
          <textarea
            id="rv-contenido"
            rows={4}
            value={contenido}
            onChange={(e) => setContenido(e.target.value.slice(0, 500))}
            placeholder="Cuéntanos sobre el producto..."
            className="rounded-xl border-0 bg-surface shadow-neu-inset placeholder:text-dark-5 w-full p-5 outline-none duration-200 focus:ring-2 focus:ring-primary/30 text-sm resize-none"
          />
          <span className="text-xs text-dark-4 text-right block mt-1">{contenido.length}/500</span>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="inline-flex font-medium text-white bg-accent py-3 px-7 rounded-xl shadow-neu-sm ease-out duration-200 hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed self-start"
        >
          {isPending ? 'Enviando...' : 'Enviar reseña'}
        </button>
      </div>
    </form>
  )
}
