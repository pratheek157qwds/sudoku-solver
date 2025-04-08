export function isValid(board: (number | null)[][], row: number, col: number, num: number): boolean {
  
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num) return false;
  }

  
  for (let x = 0; x < 9; x++) {
    if (board[x][col] === num) return false;
  }

  
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

export function solveSudoku(board: (number | null)[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === null) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) {
              return true;
            }
            board[row][col] = null;
          }
        }
        return false;
      }
    }
  }
  return true;
}

export function createEmptyGrid(): (number | null)[][] {
  return Array(9).fill(null).map(() => Array(9).fill(null));
}

export function createEmptyOriginalFlags(): boolean[][] {
  return Array(9).fill(false).map(() => Array(9).fill(false));
}
