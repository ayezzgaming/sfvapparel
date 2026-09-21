/**
 * Client-side Canvas Image Compression Utility
 * Resizes images to maximum dimensions and compresses to WebP/JPEG format
 * to ensure fast rendering and optimal storage usage.
 */

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/webp' | 'image/jpeg';
}

export async function compressImageFile(
  file: File,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    format = 'image/webp',
  } = options;

  // SVG or non-image files are returned as raw DataURL
  if (file.type === 'image/svg+xml' || !file.type.startsWith('image/')) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      const img = new Image();

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio scaling
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(rawDataUrl);
          return;
        }

        ctx.clearRect(0, 0, width, height);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        try {
          let compressedUrl = canvas.toDataURL(format, quality);
          // Fallback to jpeg if browser doesn't support webp export canvas
          if (!compressedUrl.startsWith(`data:${format}`)) {
            compressedUrl = canvas.toDataURL('image/jpeg', quality);
          }
          resolve(compressedUrl);
        } catch {
          resolve(rawDataUrl);
        }
      };

      img.onerror = () => resolve(rawDataUrl);
      img.src = rawDataUrl;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
