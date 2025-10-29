// --- DOM Elements ---
const cells = document.querySelectorAll('[data-cell]');
const gameBoard = document.getElementById('game-board');
const messageElement = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

// --- Game State ---
const PLAYER_X = 'x';
const PLAYER_O = 'o'; // AI
let currentPlayer = PLAYER_X;
let gameActive = true;
// Represents the 3x3 board (0-8)
let boardState = Array(9).fill(null);

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6]  // Diagonals
];

// --- Functions ---

// 1. Start the game
function startGame() {
    gameActive = true;
    currentPlayer = PLAYER_X;
    boardState.fill(null);
    messageElement.textContent = "Your turn (X)";

    // Clear all cells in the DOM
    cells.forEach(cell => {
        cell.classList.remove(PLAYER_X);
        cell.classList.remove(PLAYER_O);
        cell.textContent = '';
        cell.addEventListener('click', handleCellClick, { once: true });
    });
}

// 2. Handle a cell being clicked
function handleCellClick(e) {
    if (!gameActive) return;

    const cell = e.target;
    const cellIndex = Array.from(cells).indexOf(cell);

    // If cell is already taken, do nothing
    if (boardState[cellIndex] !== null) {
        return;
    }

    // Place the player's mark
    placeMark(cellIndex, PLAYER_X);
    
    // Check for win or draw
    if (checkGameEnd(PLAYER_X)) {
        return;
    }

    // Switch to AI's turn
    currentPlayer = PLAYER_O;
    messageElement.textContent = "AI is thinking...";

    // AI's move (with a slight delay to feel real)
    setTimeout(aiMove, 500);
}

// 3. Place a mark on the board (both in state and DOM)
function placeMark(index, player) {
    boardState[index] = player;
    const cell = cells[index];
    cell.textContent = player;
    cell.classList.add(player);
}

// 4. Check for Win or Draw
function checkGameEnd(player) {
    if (checkWin(player)) {
        endGame(false, player);
        return true;
    }
    if (checkDraw()) {
        endGame(true);
        return true;
    }
    return false;
}

// 5. Check if a player has won
function checkWin(player) {
    return WINNING_COMBINATIONS.some(combination => {
        return combination.every(index => {
            return boardState[index] === player;
        });
    });
}

// 6. Check for a draw (all cells filled)
function checkDraw() {
    return boardState.every(cell => cell !== null);
}

// 7. End the game (win or draw)
function endGame(isDraw, player) {
    gameActive = false;
    if (isDraw) {
        messageElement.textContent = "It's a Draw!";
    } else {
        messageElement.textContent = `${player.toUpperCase()} Wins!`;
    }
    
    // Remove all click listeners
    cells.forEach(cell => {
        cell.removeEventListener('click', handleCellClick);
    });
}

// 8. Handle AI's move
function aiMove() {
    if (!gameActive) return;

    // Find the best move using the minimax algorithm
    const bestMove = findBestMove();
    
    placeMark(bestMove.index, PLAYER_O);
    
    if (checkGameEnd(PLAYER_O)) {
        return;
    }

    // Switch back to player's turn
    currentPlayer = PLAYER_X;
    messageElement.textContent = "Your turn (X)";
}

// --- AI (Minimax) Logic ---

function findBestMove() {
    let bestScore = -Infinity;
    let move;

    for (let i = 0; i < boardState.length; i++) {
        // Is the spot available?
        if (boardState[i] === null) {
            boardState[i] = PLAYER_O; // Make the move
            let score = minimax(boardState, 0, false); // Run minimax
            boardState[i] = null; // Undo the move
            
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return { index: move };
}

// Minimax scoring
const scores = {
    [PLAYER_O]: 10,  // AI wins
    [PLAYER_X]: -10, // Player wins
    'draw': 0        // Draw
};

function minimax(board, depth, isMaximizing) {
    // Check for terminal states (win/lose/draw)
    if (checkWin(PLAYER_O)) {
        return scores[PLAYER_O] - depth;
    }
    if (checkWin(PLAYER_X)) {
        return scores[PLAYER_X] + depth;
    }
    if (checkDraw()) {
        return scores['draw'];
    }

    if (isMaximizing) { // AI's turn (wants to maximize score)
        let bestScore = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = PLAYER_O;
                let score = minimax(board, depth + 1, false);
                board[i] = null;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else { // Player's turn (wants to minimize AI's score)
        let bestScore = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === null) {
                board[i] = PLAYER_X;
                let score = minimax(board, depth + 1, true);
                board[i] = null;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// --- Event Listeners ---
restartButton.addEventListener('click', startGame);

// --- Initial Game Start ---
startGame();