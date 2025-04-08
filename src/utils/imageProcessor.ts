import { createWorker } from 'tesseract.js';

// Improved preprocessing with noise reduction and contrast enhancement
export async function preprocessImage(canvas: HTMLCanvasElement): Promise<void> {
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gray;
    }

    // Apply adaptive thresholding (improved)
    const width = canvas.width;
    const height = canvas.height;
    const blockSize = Math.floor(Math.min(width, height) / 15); // Smaller block size for better adaptation
    const C = 1.5; // Reduced constant for better thresholding

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
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
            const value = data[i] < threshold ? 0 : 255;
            data[i] = data[i + 1] = data[i + 2] = value;
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

export async function processImage(imageFile: File, numScans: number = 3): Promise<(number | null)[][]> {
    const worker = await createWorker({
        logger: (m) => console.log(m),
    });

    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '123456789',
        tessedit_pageseg_mode: '10', // Treat as single character
        tessedit_ocr_engine_mode: '2', // Use neural net mode
        tessjs_create_pdf: '0',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0'
    });

    const img = new Image();
    img.src = URL.createObjectURL(imageFile);
    await new Promise((resolve) => img.onload = resolve);

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);

    let results: (number | null)[][] = [];
    for (let i = 0; i < numScans; i++) {
        await preprocessImage(canvas);
        const result = await worker.recognize(canvas);
        const recognizedGrid = parseRecognizedText(result.data.text);
        results.push(recognizedGrid);
    }

    await worker.terminate();
    return aggregateResults(results);
}

function parseRecognizedText(text: string): (number | null)[][] {
    const lines = text.trim().split('\n').filter(line => line.trim() !== '');
    const grid: (number | null)[][] = [];
    for (let i = 0; i < 9; i++) {
        const row = [];
        if (lines[i]) {
            const nums = lines[i].trim().split(/\s+/).map(num => parseInt(num));
            for (let j = 0; j < 9; j++) {
                row.push(nums[j] || null);
            }
        } else {
            row.push(...Array(9).fill(null));
        }
        grid.push(row);
    }
    return grid;
}

function aggregateResults(results: ((number | null)[][])[]): (number | null)[][] {
    const finalGrid: (number | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null));
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            const values = results.map((result) => result[i][j]);
            const nonNullValues = values.filter((value) => value !== null);
            finalGrid[i][j] = nonNullValues.length > 0 ? mostFrequent(nonNullValues) : null;
        }
    }
    return finalGrid;
}

function mostFrequent(arr: number[]): number {
    const counts = {};
    for (const num of arr) {
        counts[num] = (counts[num] || 0) + 1;
    }
    let maxCount = 0;
    let mostFrequentNum = arr[0];
    for (const num in counts) {
        if (counts[num] > maxCount) {
            maxCount = counts[num];
            mostFrequentNum = parseInt(num);
        }
    }
    return mostFrequentNum;
}