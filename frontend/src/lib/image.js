/**
 * Shrinks a photo from the phone camera (often 3-8 MB) to a small JPEG data URL before uploading,
 * so pages load fast even on slow mobile data.
 *   maxSize: longest side in pixels
 *   square:  crop the middle into a square (for logos)
 */
export function resizeImage(file, { maxSize = 800, quality = 0.82, square = false } = {}) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose a photo (JPG or PNG)'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      // Source area to use (the whole photo, or its centre square)
      const side = Math.min(img.width, img.height);
      const sx = square ? (img.width - side) / 2 : 0;
      const sy = square ? (img.height - side) / 2 : 0;
      const sw = square ? side : img.width;
      const sh = square ? side : img.height;

      const scale = Math.min(1, maxSize / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(sw * scale);
      canvas.height = Math.round(sh * scale);
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff'; // transparent PNGs become white instead of black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this photo. Please try another one.'));
    };
    img.src = url;
  });
}
