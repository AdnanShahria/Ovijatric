const API_URL = ''

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('auth_token')
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

export async function apiGet<T = any>(path: string): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, { headers: getAuthHeaders() })
  const json = await res.json()
  if (res.status === 401) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    window.location.href = '/auth'
  }
  return json
}

export async function apiPost<T = any>(path: string, body: any): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiPut<T = any>(path: string, body: any): Promise<{ success: boolean; data: T; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body),
  })
  return res.json()
}

export async function apiDelete(path: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  return res.json()
}

interface DynamicQueryOptions {
  eq?: Record<string, string | number>
  neq?: Record<string, string | number>
  ilike?: Record<string, string>
  order?: string
  dir?: 'asc' | 'desc'
  limit?: number
}

export async function dynamicGet<T = any>(table: string, options: DynamicQueryOptions = {}): Promise<T[]> {
  const params = new URLSearchParams()
  if (options.eq) Object.entries(options.eq).forEach(([k, v]) => params.append(`eq_${k}`, String(v)))
  if (options.neq) Object.entries(options.neq).forEach(([k, v]) => params.append(`neq_${k}`, String(v)))
  if (options.ilike) Object.entries(options.ilike).forEach(([k, v]) => params.append(`ilike_${k}`, v))
  if (options.order) params.append('order', options.order)
  if (options.dir) params.append('dir', options.dir)
  if (options.limit) params.append('limit', String(options.limit))

  const qs = params.toString()
  const res = await apiGet<T[]>(`/api/dynamic/${table}${qs ? '?' + qs : ''}`)
  return res.data || []
}

export async function dynamicInsert<T = any>(table: string, data: Partial<T>): Promise<T> {
  const res = await apiPost<T>(`/api/dynamic/${table}`, data)
  return res.data
}

export async function dynamicUpdate<T = any>(table: string, data: Partial<T> & { id: string }): Promise<T> {
  const res = await apiPut<T>(`/api/dynamic/${table}`, data)
  return res.data
}

export async function dynamicDelete(table: string, filters: Record<string, string>): Promise<void> {
  const params = new URLSearchParams()
  Object.entries(filters).forEach(([k, v]) => params.append(`eq_${k}`, v))
  await apiDelete(`/api/dynamic/${table}?${params.toString()}`)
}

import imageCompression from 'browser-image-compression';

async function cropToAspectRatio(file: File, aspectRatio: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas not supported'));

      let { width, height } = img;
      const currentRatio = width / height;

      let newWidth = width;
      let newHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (currentRatio > aspectRatio) {
        newWidth = height * aspectRatio;
        offsetX = (width - newWidth) / 2;
      } else if (currentRatio < aspectRatio) {
        newHeight = width / aspectRatio;
        offsetY = (height - newHeight) / 2;
      }

      console.log(`Image Ratio Fixation: Original: ${width}x${height} (Ratio: ${currentRatio.toFixed(2)}) -> Fixed: ${newWidth}x${newHeight} (Ratio: ${(newWidth/newHeight).toFixed(2)}, Target: ${aspectRatio.toFixed(2)})`);

      canvas.width = newWidth;
      canvas.height = newHeight;
      ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight, 0, 0, newWidth, newHeight);

      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error('Canvas to blob failed'));
        const croppedFile = new File([blob], file.name, { type: file.type });
        resolve(croppedFile);
      }, file.type);
    };
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadImage(file: File, aspectRatio?: number): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    let processedFile = file;
    console.log(`Image size before processing: ${(file.size / 1024).toFixed(2)} KB`);

    if (aspectRatio) {
      processedFile = await cropToAspectRatio(processedFile, aspectRatio);
    }

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    };
    processedFile = await imageCompression(processedFile, options);
    console.log(`Image size after processing: ${(processedFile.size / 1024).toFixed(2)} KB`);

    const formData = new FormData()
    formData.append('image', processedFile)
    const token = localStorage.getItem('auth_token')
    const headers: Record<string, string> = {}
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers,
      body: formData
    })

    const json = await res.json()
    if (res.ok && json.success) {
      return { success: true, url: json.url }
    }
    return { success: false, error: json.error || 'Failed to upload image' }
  } catch (error: any) {
    return { success: false, error: error.message || 'Image processing failed' }
  }
}
