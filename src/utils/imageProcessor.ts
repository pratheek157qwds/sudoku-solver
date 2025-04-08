export async function preprocessImage(canvas: HTMLCanvasElement): Promise<void> {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Convert to grayscale and apply adaptive thresholding
  const width = canvas.width;
  const height = canvas.height;
  const blockSize = Math.floor(Math.min(width, height) / 20); // Adaptive block size
  const C = 2.5; // Constant subtracted from mean

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Convert to grayscale using luminance weights
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      
      // Calculate local mean
      let sum = 0;
      let count = 0;
      
      const halfBlock = Math.floor(blockSize / 2);
      for (let by = -halfBlock; by <= halfBlock; by++) {
        for (let bx = -halfBlock; bx <= halfBlock; bx++) {
          const ny = y + by;
          const nx = x + bx;
          
          if (ny >= 0 && ny < height && nx >= 0 && nx < width) {
            const ni = (ny * width + nx) * 4;
            sum += data[ni];
            count++;
          }
        }
      }
      
      const mean = sum / count;
      const threshold = mean - C;
      
      // Apply threshold
      const value = gray < threshold ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = value;
    }
  }

  // Apply the processed image data back to the canvas
  ctx.putImageData(imageData, 0, 0);

  // Enhance digit visibility
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  const tempCtx = tempCanvas.getContext('2d')!;
  
  // Draw current image to temp canvas
  tempCtx.drawImage(canvas, 0, 0);
  
  // Clear original canvas and apply sharpening
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = 'contrast(1.4) brightness(1.1)';
  ctx.drawImage(tempCanvas, 0, 0);
  ctx.filter = 'none';
}