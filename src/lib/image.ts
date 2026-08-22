/**
 * Client-side image normalisation for the card-scanning flow.
 *
 * Phone cameras produce 12MP JPEGs that routinely run 3-8MB. The OCR route
 * rejects anything over 5MB (src/app/api/ocr/route.ts), and even a file that
 * squeaks under the cap is a slow upload from a dealer yard on cellular. So we
 * downscale in the browser before uploading.
 *
 * 2400px on the long edge is chosen to match the server: preprocessImage() in
 * src/lib/ocr.ts resizes to 2400px wide before handing the image to Tesseract,
 * and the vision APIs downsample further still. Sending more pixels than that
 * buys no OCR accuracy.
 */

const MAX_EDGE = 2400;
const JPEG_QUALITY = 0.85;
/** Below this, an image is already small enough that re-encoding is a waste. */
const SKIP_UNDER_BYTES = 1_000_000;

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  // createImageBitmap honours EXIF orientation with imageOrientation set, so
  // cards shot in portrait/upside-down land the right way up for OCR.
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Safari < 15 and some Android WebViews reject the options bag; fall
      // through to the <img> path, which applies orientation by default.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Could not decode image'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

/**
 * Returns a downscaled JPEG copy of `file`, or the original file when it is
 * already small enough or when anything in the pipeline fails. Never throws --
 * a failed downscale should degrade to "upload as-is", not block the scan.
 */
export async function downscaleImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  try {
    const bitmap = await loadBitmap(file);
    const width = bitmap.width;
    const height = bitmap.height;

    if (!width || !height) return file;

    const longEdge = Math.max(width, height);
    // Small file AND modest dimensions: nothing to gain from re-encoding.
    if (file.size < SKIP_UNDER_BYTES && longEdge <= MAX_EDGE) {
      if ('close' in bitmap) bitmap.close();
      return file;
    }

    const scale = Math.min(1, MAX_EDGE / longEdge);
    const targetWidth = Math.round(width * scale);
    const targetHeight = Math.round(height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetWidth, targetHeight);
    if ('close' in bitmap) bitmap.close();

    const blob = await canvasToBlob(canvas, JPEG_QUALITY);
    if (!blob) return file;

    // A re-encode that came out bigger is not worth taking.
    if (blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}
