import { createAdminClient } from '@/lib/supabase/server'

interface UploadResult {
  publicUrl: string | null
  error: string | null
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File,
): Promise<UploadResult> {
  try {
    const adminClient = await createAdminClient()
    const bytes = await file.arrayBuffer()
    const { data, error } = await adminClient.storage
      .from(bucket)
      .upload(path, Buffer.from(bytes), { contentType: file.type, upsert: true })

    if (error || !data) return { publicUrl: null, error: error?.message ?? 'Error al subir archivo.' }

    const { data: { publicUrl } } = adminClient.storage.from(bucket).getPublicUrl(data.path)
    return { publicUrl, error: null }
  } catch (err) {
    return { publicUrl: null, error: err instanceof Error ? err.message : 'Error inesperado al subir archivo.' }
  }
}

export function getFileExt(filename: string, fallback = 'jpg'): string {
  return filename.split('.').pop()?.toLowerCase() ?? fallback
}
