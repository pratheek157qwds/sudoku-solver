import React, { useState, useRef } from 'react';
import { Camera, RefreshCw, Upload } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { SudokuBoard } from './components/SudokuBoard';
import { createEmptyGrid, createEmptyOriginalFlags, solveSudoku } from './utils/sudokuSolver';
import { preprocessImage } from './utils/imageProcessor';

function App() {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [isOriginal, setIsOriginal] = useState(createEmptyOriginalFlags());
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCellChange = (row: number, col: number, value: number | null) => {
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = value;
    setGrid(newGrid);

    const newIsOriginal = isOriginal.map((r) => [...r]);
    newIsOriginal[row][col] = value !== null;
    setIsOriginal(newIsOriginal);
  };

  const handleSolve = () => {
    const newGrid = grid.map((row) => [...row]);
    if (solveSudoku(newGrid)) {
      setGrid(newGrid);
    } else {
      setError('No solution exists for this puzzle!');
    }
  };

  const handleReset = () => {
    setGrid(createEmptyGrid());
    setIsOriginal(createEmptyOriginalFlags());
    setError(null);
  };

  const processImage = async (imageFile: File) => {
    setProcessing(true);
    setError(null);
    try {
      const worker = await createWorker('eng');

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
      
      // Load and process image
      const img = new Image();
      img.src = URL.createObjectURL(imageFile);
      await new Promise((resolve) => (img.onload = resolve));

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      // Set canvas size to be proportional to image
      const maxSize = 800; // Reduced for better processing
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Draw and preprocess image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      await preprocessImage(canvas);

      // Calculate cell dimensions with padding
      const cellWidth = Math.floor(canvas.width / 9);
      const cellHeight = Math.floor(canvas.height / 9);
      const padding = Math.floor(Math.min(cellWidth, cellHeight) * 0.1); // 10% padding
      
      const newGrid = createEmptyGrid();
      const newIsOriginal = createEmptyOriginalFlags();
      
      // Process each cell individually
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cellCanvas = document.createElement('canvas');
          cellCanvas.width = cellWidth - (padding * 2);
          cellCanvas.height = cellHeight - (padding * 2);
          const cellCtx = cellCanvas.getContext('2d')!;
          
          // Extract cell image with padding
          cellCtx.drawImage(
            canvas,
            col * cellWidth + padding,
            row * cellHeight + padding,
            cellWidth - (padding * 2),
            cellHeight - (padding * 2),
            0,
            0,
            cellWidth - (padding * 2),
            cellHeight - (padding * 2)
          );

          // Recognize digit in cell
          const result = await worker.recognize(cellCanvas);
          const text = result.data.text.trim();
          
          // Check if recognized text is a valid digit
          if (/^[1-9]$/.test(text)) {
            const value = parseInt(text);
            newGrid[row][col] = value;
            newIsOriginal[row][col] = true;
          }
        }
      }

      setGrid(newGrid);
      setIsOriginal(newIsOriginal);
      
      await worker.terminate();
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Error processing image. Please try again with a clearer image.');
    }
    setProcessing(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        processImage(file);
      } else {
        setError('Please upload an image file.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
            Sudoku Solver
          </h1>

          <div className="mb-8">
            <SudokuBoard
              grid={grid}
              onCellChange={handleCellChange}
              isOriginal={isOriginal}
            />
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              <Upload size={20} />
              Upload Image
            </button>

            <button
              onClick={handleSolve}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              <Camera size={20} />
              Solve
            </button>

            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              <RefreshCw size={20} />
              Reset
            </button>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          <canvas ref={canvasRef} className="hidden" />

          {processing && (
            <div className="mt-4 text-center text-gray-600">
              Processing image... Please wait.
            </div>
          )}

          {error && (
            <div className="mt-4 text-center text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;