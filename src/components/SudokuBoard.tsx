import React from 'react';

interface SudokuBoardProps {
  grid: (number | null)[][];
  onCellChange: (row: number, col: number, value: number | null) => void;
  isOriginal: boolean[][];
}

export const SudokuBoard: React.FC<SudokuBoardProps> = ({ grid, onCellChange, isOriginal }) => {
  const handleInputChange = (row: number, col: number, value: string) => {
    const numValue = value === '' ? null : parseInt(value);
    if (numValue === null || (numValue >= 1 && numValue <= 9)) {
      onCellChange(row, col, numValue);
    }
  };

  return (
    <div className="grid grid-cols-9 gap-0.5 bg-gray-300 p-0.5 max-w-2xl mx-auto">
      {grid.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`
              relative aspect-square bg-white
              ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-gray-400' : ''}
              ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-gray-400' : ''}
            `}
          >
            <input
              type="number"
              min="1"
              max="9"
              value={cell || ''}
              onChange={(e) => handleInputChange(rowIndex, colIndex, e.target.value)}
              className={`
                w-full h-full text-center text-2xl focus:outline-none
                ${isOriginal[rowIndex][colIndex] ? 'font-bold text-blue-600' : 'text-gray-700'}
              `}
            />
          </div>
        ))
      )}
    </div>
  );
};