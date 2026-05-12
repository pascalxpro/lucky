/**
 * Client-side image compression utility (減肥功能)
 * Compresses images using Canvas API before uploading to server.
 * Supports: JPEG, PNG, WebP, GIF, BMP, TIFF
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;  // 0-1, default 0.8
  outputType?: 'image/jpeg' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  outputType: 'image/jpeg',
};

/** Formats a byte count to human-readable string */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Check if a file is a valid image type */
export function isValidImageType(file: File): boolean {
  const validTypes = [
    'image/jpeg', 'image/png', 'image/webp', 'image/gif',
    'image/bmp', 'image/tiff', 'image/svg+xml',
  ];
  return validTypes.includes(file.type);
}

/** Load a File into an HTMLImageElement */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Compress an image file using Canvas API
 * Returns a compressed Blob and metadata about the compression
 */
export async function compressImage(
  file: File,
  options?: CompressOptions
): Promise<{
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  ratio: string;  // e.g. "72% smaller"
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const img = await loadImage(file);

  // Calculate new dimensions maintaining aspect ratio
  let { width, height } = img;
  if (width > opts.maxWidth) {
    height = Math.round((height * opts.maxWidth) / width);
    width = opts.maxWidth;
  }
  if (height > opts.maxHeight) {
    width = Math.round((width * opts.maxHeight) / height);
    height = opts.maxHeight;
  }

  // Draw to canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0, width, height);

  // Clean up object URL
  URL.revokeObjectURL(img.src);

  // Export as compressed blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Compression failed'))),
      opts.outputType,
      opts.quality
    );
  });

  const originalSize = file.size;
  const compressedSize = blob.size;
  const savedPercent = Math.round((1 - compressedSize / originalSize) * 100);
  const ratio = savedPercent > 0 ? `${savedPercent}% smaller` : 'no change';

  return { blob, originalSize, compressedSize, width, height, ratio };
}

/**
 * Compress and upload an image file
 * Returns the URL path of the uploaded image
 */
export async function uploadImage(
  file: File,
  options?: CompressOptions
): Promise<{
  url: string;
  originalSize: number;
  compressedSize: number;
  ratio: string;
}> {
  // Compress first
  const result = await compressImage(file, options);

  // Create form data
  const formData = new FormData();
  const ext = result.blob.type === 'image/webp' ? '.webp' : '.jpg';
  const safeName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  formData.append('file', result.blob, `${safeName}${ext}`);

  // Upload to server
  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }

  const data = await res.json();
  return {
    url: data.url,
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    ratio: result.ratio,
  };
}
