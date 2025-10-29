// --- DOM Elements ---
const boardElement = document.getElementById('game-board');
const moveCountElement = document.getElementById('move-count');
const timerElement = document.getElementById('timer');
const shuffleButton = document.getElementById('shuffle-button');
const setupButton = document.getElementById('setup-button'); // New button
const messageElement = document.getElementById('message');

// --- Game State ---
const SOLVED_STATE = [1, 2, 3, 4, 5, 6, 7, 8, 0]; // 0 represents the empty tile
let boardState = [...SOLVED_STATE];
let emptyTileIndex = 8;
let moveCount = 0;
let gameActive = false;
let timerInterval = null;
let seconds = 0;

// --- New Editor Mode State ---
let isEditorMode = false;
let firstSelectedTile = null;

// --- Functions ---

// 1. Initialize the board
function init() {
    // Create tile elements in the DOM
    boardState.forEach((val, i) => {
        const tile = document.createElement('div');
        tile.classList.add('tile');
        tile.textContent = val;
        tile.dataset.index = i; // Store index for click handling

        if (val === 0) {
            tile.classList.add('tile-empty');
            tile.textContent = ''; // Empty tile is invisible
        }

        tile.addEventListener('click', () => handleTileClick(i));
        boardElement.appendChild(tile);
    });

    renderBoard();
}

// 2. Render the board based on boardState
function renderBoard() {
    const tiles = boardElement.children;
    boardState.forEach((val, i) => {
        const tile = tiles[i];
        tile.textContent = val === 0 ? '' : val;
        
        // Update classes
        if (val === 0) {
            tile.classList.add('tile-empty');
        } else {
            tile.classList.remove('tile-empty');
        }
        
        // Update empty tile index
        if (val === 0) {
            emptyTileIndex = i;
        }
    });
    moveCountElement.textContent = moveCount;
}

// 3. Handle a tile click (UPDATED FOR EDITOR MODE)
function handleTileClick(clickedIndex) {
    if (isEditorMode) {
        handleEditorClick(clickedIndex);
    } else {
        handleGameClick(clickedIndex);
    }
}

// 4. Handle click during active gameplay
function handleGameClick(clickedIndex) {
    if (!gameActive) return;

    // Check if the clicked tile is adjacent to the empty tile
    if (isValidMove(clickedIndex, emptyTileIndex)) {
        // Swap tiles in the state
        boardState[emptyTileIndex] = boardState[clickedIndex];
        boardState[clickedIndex] = 0;
        emptyTileIndex = clickedIndex; // Update the new empty tile index

        moveCount++;
        renderBoard();

        // Check for win
        if (checkWin()) {
            endGame();
        }
    }
}

// 5. Handle click during editor mode (NEW)
function handleEditorClick(clickedIndex) {
    const tiles = boardElement.children;
    
    if (firstSelectedTile === null) {
        // This is the first tile clicked
        firstSelectedTile = clickedIndex;
        tiles[clickedIndex].classList.add('tile-selected');
    } else {
        // This is the second tile clicked
        
        // Swap tiles in the state
        const tempVal = boardState[firstSelectedTile];
        boardState[firstSelectedTile] = boardState[clickedIndex];
        boardState[clickedIndex] = tempVal;
        
        // Update UI
        renderBoard();
        
        // Reset selection
        tiles[firstSelectedTile].classList.remove('tile-selected');
        firstSelectedTile = null;
    }
}

// 6. Check if a move is valid
function isValidMove(clickedIndex, emptyIndex) {
    const [row, col] = [Math.floor(clickedIndex / 3), clickedIndex % 3];
    const [emptyRow, emptyCol] = [Math.floor(emptyIndex / 3), emptyIndex % 3];
    
    // Check for adjacent tiles (not diagonal)
    const isAdjacent = (Math.abs(row - emptyRow) + Math.abs(col - emptyCol)) === 1;
    return isAdjacent;
}

// 7. Shuffle the board
function shuffleBoard() {
    // To guarantee a solvable puzzle, we start from a solved state
    // and make a large number of random, valid moves.
    boardState = [...SOLVED_STATE];
    emptyTileIndex = 8;
    
    let shuffleMoves = 100;
    for (let i = 0; i < shuffleMoves; i++) {
        const validMoves = getValidMoves(emptyTileIndex);
        const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
        
        // Swap tiles
        boardState[emptyTileIndex] = boardState[randomMove];
        boardState[randomMove] = 0;
        emptyTileIndex = randomMove;
    }
    
    if (isEditorMode) {
        toggleEditorMode(); // Exit editor mode if active
    }
    startGame();
}

// 8. Get all valid moves for a given tile (used by shuffle)
function getValidMoves(emptyIndex) {
    const moves = [];
    const [row, col] = [Math.floor(emptyIndex / 3), emptyIndex % 3];
    
    if (row > 0) moves.push(emptyIndex - 3); // Up
    if (row < 2) moves.push(emptyIndex + 3); // Down
    if (col > 0) moves.push(emptyIndex - 1); // Left
    if (col < 2) moves.push(emptyIndex + 1); // Right
    
    return moves;
}

// 9. Start the game (resets timer/moves)
function startGame() {
    gameActive = true;
    moveCount = 0;
    seconds = 0;
    messageElement.textContent = "Solve the puzzle!";
    
    if (timerInterval) clearInterval(timerInterval);
    timerElement.textContent = "00:00";
    timerInterval = setInterval(updateTimer, 1000);
    
    renderBoard();
}

// 10. End the game (win)
function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    messageElement.textContent = `Solved in ${moveCount} moves! (${timerElement.textContent})`;
}

// 11. Check if the board is solved
function checkWin() {
    return JSON.stringify(boardState) === JSON.stringify(SOLVED_STATE);
}

// 12. Update the timer
function updateTimer() {
    seconds++;
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timerElement.textContent = `${mins}:${secs}`;
}

// --- New Editor Mode Functions ---

// 13. Toggle Editor Mode (NEW)
function toggleEditorMode() {
    isEditorMode = !isEditorMode;
    
    if (isEditorMode) {
        // Enter editor mode
        gameActive = false;
        if (timerInterval) clearInterval(timerInterval);
        
        messageElement.textContent = "Editor Mode: Click two tiles to swap.";
        setupButton.textContent = "Cancel Setup";
        shuffleButton.textContent = "Start Puzzle";
        
    } else {
        // Exit editor mode
        messageElement.textContent = "Click 'Shuffle' or 'Set Up' to begin!";
        setupButton.textContent = "Set Up Board";
        shuffleButton.textContent = "Shuffle";
        
        // Clear any lingering selection
        if (firstSelectedTile !== null) {
            boardElement.children[firstSelectedTile].classList.remove('tile-selected');
            firstSelectedTile = null;
        }
    }
}

// 14. Start Custom Puzzle (NEW)
function startCustomPuzzle() {
    if (!checkSolvability(boardState)) {
        messageElement.textContent = "This puzzle is UNSOLVABLE! Please re-arrange or shuffle.";
        return;
    }
    
    // Puzzle is solvable, start the game
    toggleEditorMode(); // This will exit editor mode
    startGame();
}

// 15. Check Solvability (NEW)
function checkSolvability(board) {
    let inversions = 0;
    // Create a copy of the board without the empty tile (0)
    const boardWithoutEmpty = board.filter(val => val !== 0);
    
    for (let i = 0; i < boardWithoutEmpty.length - 1; i++) {
        for (let j = i + 1; j < boardWithoutEmpty.length; j++) {
            if (boardWithoutEmpty[i] > boardWithoutEmpty[j]) {
                inversions++;
            }
        }
    }
    
    // For a 3x3 grid, the puzzle is solvable if and only if
    // the number of inversions is even.
    return inversions % 2 === 0;
}

// --- Event Listeners ---
shuffleButton.addEventListener('click', () => {
    if (isEditorMode) {
        startCustomPuzzle();
    } else {
        shuffleBoard();
    }
});

setupButton.addEventListener('click', toggleEditorMode);

// --- Initial Call ---
init();