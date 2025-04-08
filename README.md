# Web-based Sudoku Solver with Image Processing

This project implements a web application that allows users to solve Sudoku puzzles using both manual input and image processing.

## Features

- **Image Recognition:** Upload an image of a Sudoku puzzle, and the application will attempt to recognize the numbers and populate the board.
- **Manual Input:**  Enter numbers directly into the Sudoku board using your keyboard.
- **Sudoku Solver:**  Solve the puzzle with a built-in backtracking algorithm.
- **User-Friendly Interface:**  A simple and intuitive interface for interacting with the Sudoku solver.

## Technologies Used

- **React:**  A JavaScript library for building user interfaces.
- **TypeScript:**  A superset of JavaScript that adds static typing.
- **Vite:**  A fast development server and build tool.
- **Tailwind CSS:**  A utility-first CSS framework for rapid styling.
- **Tesseract.js:**  A JavaScript library for optical character recognition (OCR).
- **Lucide React:**  A collection of icons for React applications.

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com//sudoku-solver.git
   ```

2. **Install dependencies:**
   ```bash
   cd sudoku-solver
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the application in your browser:**
   The application will be accessible at `http://localhost:5173/`.

## Usage

1. **Upload an image:**
   - Click the "Upload Image" button.
   - Select a clear image of a Sudoku puzzle from your computer.
   - The application will attempt to recognize the numbers and populate the board.

2. **Enter numbers manually:**
   - Click on a cell in the board to select it.
   - Type the number (1-9) you want to enter.
   - Use the Tab key to navigate between cells.

3. **Solve the puzzle:**
   - Click the "Solve" button to find a solution.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License.

## Acknowledgements

- [Tesseract.js](https://tesseract.projectnaptha.com/)
- [Lucide React](https://lucide.dev/)
