import { createWorker } from 'tesseract.js';

export async function preprocessImage(canvas: HTMLCanvasElement): Promise<void> {
    // ... (Previous preprocessImage function remains unchanged)
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
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const maxSize = 800; // Reduced for better processing
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    let results: (number | null)[][] = [];
    for (let i = 0; i < numScans; i++) {
        await preprocessImage(canvas);
        const result = await worker.recognize(canvas);
        const recognizedGrid = parseRecognizedText(result.data.text);
        results.push(recognizedGrid);
    }

    await worker.terminate();
    return refineResults(aggregateResults(results));
}

function parseRecognizedText(text: string): (number | null)[][] {
    // ... (Previous parseRecognizedText function remains unchanged)
}

function aggregateResults(results: ((number | null)[][])[]): (number | null)[][] {
    // ... (Previous aggregateResults function remains unchanged)
}

function mostFrequent(arr: number[]): number {
    // ... (Previous mostFrequent function remains unchanged)
}

function refineResults(grid: (number | null)[][]): (number | null)[][] {
    const refinedGrid = grid.map(row => row.map(cell => cell)); // Create a copy

    // Check for inconsistencies and potential errors
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (refinedGrid[i][j] === null) {
                // Attempt to infer missing values from neighbors if possible
                refinedGrid[i][j] = inferMissingValue(refinedGrid, i, j);
            }
        }
    }
    return refinedGrid;
}

function inferMissingValue(grid: (number | null)[][], row: number, col: number): number | null {
    // Simple inference logic: check for unique values in row, column, and 3x3 box
    const rowValues = new Set(grid[row].filter(val => val !== null));
    const colValues = new Set(grid.map(r => r[col]).filter(val => val !== null));
    const boxValues = new Set();

    const boxRowStart = Math.floor(row / 3) * 3;
    const boxColStart = Math.floor(col / 3) * 3;
    for (let i = boxRowStart; i < boxRowStart + 3; i++) {
        for (let j = boxColStart; j < boxColStart + 3; j++) {
            if (grid[i][j] !== null) {
                boxValues.add(grid[i][j]);
            }
        }
    }

    for (let num = 1; num <= 9; num++) {
        if (!rowValues.has(num) && !colValues.has(num) && !boxValues.has(num)) {
            return num;
        }
    }
    return null; // No inference possible
}
