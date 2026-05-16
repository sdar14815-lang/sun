
export const MAX_FILE_SIZE = 250 * 1024; // 250KB
export const ALLOWED_FORMATS = ['image/webp', 'image/jpeg', 'image/jpg'];

/**
 * Validates file size and type
 */
export function validateImage(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FORMATS.includes(file.type)) {
    return { valid: false, error: 'عذراً، يسمح فقط بصيغ WEBP و JPEG و JPG. يرجى تحويل الصورة إلى WEBP يدوياً.' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `حجم الصورة كبير جداً (${(file.size / 1024).toFixed(0)}KB). الحد الأقصى هو 250KB.` };
  }

  return { valid: true };
}

/**
 * Cleans filename: lowercase, no spaces/special chars, adds timestamp
 */
export function cleanFileName(fileName: string): string {
  const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
  const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
  
  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^a-z0-9-]/g, '')     // Remove non-alphanumeric except -
    .substring(0, 50);              // Limit length
    
  return `${cleanName}-${Date.now()}.${fileExt}`;
}

/**
 * Gets thumbnail URL using Supabase Storage transformation
 * Note: Requires Supabase Pro or enabled transformation feature
 */
export function getThumbnailUrl(supabase: any, bucket: string, path: string, width = 300): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path, {
    transform: {
      width,
      quality: 80,
      format: 'webp'
    }
  });
  return data.publicUrl;
}

/**
 * Extracts path from Supabase Public URL
 */
export function getPathFromUrl(url: string, bucket: string): string | null {
  const parts = url.split(`${bucket}/`);
  return parts.length > 1 ? parts[1] : null;
}
