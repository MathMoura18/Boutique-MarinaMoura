import { CATALOG_BUCKET, supabase } from './supabase'

const MAX_SIZE = 1800

/** Redimensiona a foto no navegador (lado maior até 1800px) e converte para WebP */
async function optimize(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_SIZE / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.86))
  return blob && blob.size < file.size ? blob : file
}

export async function uploadImage(file: File, folder: string) {
  const body = await optimize(file)
  const ext = body.type === 'image/webp' ? 'webp' : (file.name.split('.').pop() ?? 'jpg')
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(path, body, {
    contentType: body.type || file.type,
    cacheControl: '31536000',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from(CATALOG_BUCKET).getPublicUrl(path)
  return { path, url: data.publicUrl }
}

export async function removeImages(paths: (string | null | undefined)[]) {
  const valid = paths.filter((p): p is string => !!p)
  if (!valid.length) return
  await supabase.storage.from(CATALOG_BUCKET).remove(valid)
}
