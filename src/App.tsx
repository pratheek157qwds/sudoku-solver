import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Upload } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { SudokuBoard } from './components/SudokuBoard';
import { createEmptyGrid, createEmptyOriginalFlags, solveSudoku } from './utils/sudokuSolver';
import { preprocessImage } from './utils/imageProcessor';
import { useSpring, animated } from 'react-spring';
import { adSenseConfig } from './adsenseConfig'; // Import AdSense config

function App() {
  const [grid, setGrid] = useState(createEmptyGrid());
  const [isOriginal, setIsOriginal] = useState(createEmptyOriginalFlags());
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  const titleAnimation = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: { duration: 500 },
    delay: 200,
  });

  const buttonAnimation = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { duration: 300 },
    delay: 300,
  });

  const processingAnimation = useSpring({
    from: { opacity: 0, transform: 'scale(0.8)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: { duration: 300 },
    delay: 300,
  });

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
        tessedit_pageseg_mode: '10',
        tessedit_ocr_engine_mode: '2',
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

      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      
      const maxSize = 800;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      await preprocessImage(canvas);

      const cellWidth = Math.floor(canvas.width / 9);
      const cellHeight = Math.floor(canvas.height / 9);
      const padding = Math.floor(Math.min(cellWidth, cellHeight) * 0.1);
      
      const newGrid = createEmptyGrid();
      const newIsOriginal = createEmptyOriginalFlags();
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          const cellCanvas = document.createElement('canvas');
          cellCanvas.width = cellWidth - (padding * 2);
          cellCanvas.height = cellHeight - (padding * 2);
          const cellCtx = cellCanvas.getContext('2d')!;
          
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

          const result = await worker.recognize(cellCanvas);
          const text = result.data.text.trim();
          
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
    <div className="min-h-screen bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <animated.h1 style={titleAnimation} className="text-3xl font-bold text-center mb-8 text-green-600">
            Sudoku Solver
          </animated.h1>

          <div className="mb-4">
            <button onClick={() => setShowTutorial(!showTutorial)} className="text-blue-500 hover:text-blue-700">
              How to Use
            </button>
          </div>

          {showTutorial && (
            <div className="bg-gray-100 border border-gray-300 rounded-md p-4 mb-8">
              <h2 className="text-lg font-bold mb-2 text-green-600">Tutorial</h2>
              <p>
                This Sudoku solver allows you to solve puzzles in two ways:
              </p>
              <ul>
                <li>
                  <b className="text-red-600">Upload Image:</b>
                  <ol>
                    <li>Click the "Upload Image" button.</li>
                    <li>Select a clear image of a Sudoku puzzle from your computer.</li>
                    <li>The solver will attempt to recognize the numbers and populate the board.</li>
                  </ol>
                </li>
                <li>
                  <b className="text-red-600">Manual Input:</b>
                  <ol>
                    <li>Click on a cell in the board to select it.</li>
                    <li>Type the number (1-9) you want to enter.</li>
                    <li>You can use the Tab key to navigate between cells.</li>
                  </ol>
                </li>
              </ul>
              <p>
                Once you have entered the puzzle, click the "Solve" button to find a solution.
              </p>
            </div>
          )}

          <div className="mb-8">
            <SudokuBoard
              grid={grid}
              onCellChange={handleCellChange}
              isOriginal={isOriginal}
            />
          </div>

          <div className="flex flex-wrap gap-4 justify-center">
            <animated.button
              style={buttonAnimation}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              <Upload size={20} />
              Upload Image
            </animated.button>

            <animated.button
              style={buttonAnimation}
              onClick={handleSolve}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              <Camera size={20} />
              Solve
            </animated.button>

            <animated.button
              style={buttonAnimation}
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
              disabled={processing}
            >
              <RefreshCw size={20} />
              Reset
            </animated.button>
          </div>

          <div className="mt-4">
            <ins className="adsbygoogle"
              style={{ display: 'block' }}
              data-ad-client={adSenseConfig.client}
              data-ad-slot={adSenseConfig.slot}
              data-ad-format="auto"
              data-full-width-responsive="true"></ins>
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
            <animated.div style={processingAnimation} className="mt-4 text-center text-gray-600">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-t-4 border-green-500" />
              Processing image... Please wait.
            </animated.div>
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
