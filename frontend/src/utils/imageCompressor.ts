/**
 * Client-Side Image Compression Utility
 * Prevents mobile memory freeze and upload timeouts by downscaling
 * large mobile camera photos (12MP-48MP, 8MB-25MB) to optimal dimensions.
 */

export interface CompressionResult {
  file: File;
  previewUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  width: number;
  height: number;
}

export async function compressImage(
  file: File,
  maxDimension = 1920,
  quality = 0.82
): Promise<CompressionResult> {
  const originalSizeBytes = file.size;

  // If not an image, return original file with safe object URL
  if (!file.type.startsWith('image/')) {
    const previewUrl = URL.createObjectURL(file);
    return {
      file,
      previewUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      width: 0,
      height: 0,
    };
  }

  // If in a non-browser environment (e.g. Node/SSR test without canvas)
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const previewUrl = URL.createObjectURL ? URL.createObjectURL(file) : '';
    return {
      file,
      previewUrl,
      originalSizeBytes,
      compressedSizeBytes: originalSizeBytes,
      width: 0,
      height: 0,
    };
  }

  return new Promise((resolve) => {
    const tempUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(tempUrl);

      let { width, height } = img;
      let needsResize = false;

      if (width > maxDimension || height > maxDimension) {
        needsResize = true;
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      // If file is already small (< 500KB) and doesn't need resize, avoid re-encoding
      if (!needsResize && file.size < 500 * 1024) {
        const previewUrl = URL.createObjectURL(file);
        resolve({
          file,
          previewUrl,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          width: img.width,
          height: img.height,
        });
        return;
      }

      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          const previewUrl = URL.createObjectURL(file);
          resolve({
            file,
            previewUrl,
            originalSizeBytes,
            compressedSizeBytes: originalSizeBytes,
            width: img.width,
            height: img.height,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              const previewUrl = URL.createObjectURL(file);
              resolve({
                file,
                previewUrl,
                originalSizeBytes,
                compressedSizeBytes: originalSizeBytes,
                width,
                height,
              });
              return;
            }

            const baseName = file.name.replace(/\.[^/.]+$/, '');
            const compressedFile = new File([blob], `${baseName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });

            const previewUrl = URL.createObjectURL(compressedFile);
            resolve({
              file: compressedFile,
              previewUrl,
              originalSizeBytes,
              compressedSizeBytes: compressedFile.size,
              width,
              height,
            });
          },
          'image/jpeg',
          quality
        );
      } catch {
        // Fallback to original file on canvas failure
        const previewUrl = URL.createObjectURL(file);
        resolve({
          file,
          previewUrl,
          originalSizeBytes,
          compressedSizeBytes: originalSizeBytes,
          width: img.width,
          height: img.height,
        });
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(tempUrl);
      const previewUrl = URL.createObjectURL(file);
      resolve({
        file,
        previewUrl,
        originalSizeBytes,
        compressedSizeBytes: originalSizeBytes,
        width: 0,
        height: 0,
      });
    };

    img.src = tempUrl;
  });
}
