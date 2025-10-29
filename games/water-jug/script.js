// --- DOM Elements ---
// Setup Area
const jugACapInput = document.getElementById('jug-a-cap');
const jugBCapInput = document.getElementById('jug-b-cap');
const goalAmountInput = document.getElementById('goal-amount');
const goalJugAInput = document.getElementById('goal-jug-a');
const goalJugBInput = document.getElementById('goal-jug-b');
const startButton = document.getElementById('start-button');
const errorMessage = document.getElementById('setup-error');

// Simulation Area
const jugA = document.getElementById('water-a');
const jugB = document.getElementById('water-b');
const labelA = document.getElementById('label-a');
const labelB = document.getElementById('label-b');
const jugAName = document.getElementById('jug-a-name');
const jugBName = document.getElementById('jug-b-name');
const jugAContainer = document.getElementById('jug-container-a');
const jugBContainer = document.getElementById('jug-container-b');
const goalText = document.getElementById('goal-text');
const winMessage = document.getElementById('win-message');
const logContent = document.getElementById('log-content');

// Action Buttons
const buttons = {
    fillA: document.getElementById('fill-a'),
    fillB: document.getElementById('fill-b'),
    emptyA: document.getElementById('empty-a'),
    emptyB: document.getElementById('empty-b'),
    pourAtoB: document.getElementById('pour-a-to-b'),
    pourBtoA: document.getElementById('pour-b-to-a'),
};

// --- Game State (now dynamic) ---
let jugACapacity = 5;
let jugBCapacity = 4;
let goalAmount = 2;
let goalJug = 'b'; // 'a' or 'b'

let state = {
    jugA: 0,
    jugB: 0
};
let gameActive = false;
let stepCount = 0;
const JUG_BASE_HEIGHT = 250; // Base height in pixels for scaling

// --- Functions ---

// 1. Start/Restart Game (NOW reads from inputs)
function startGame() {
    // Read and Validate Inputs
    const capA = parseInt(jugACapInput.value);
    const capB = parseInt(jugBCapInput.value);
    const goal = parseInt(goalAmountInput.value);
    
    errorMessage.textContent = ""; // Clear old errors
    
    if (isNaN(capA) || isNaN(capB) || isNaN(goal) || capA <= 0 || capB <= 0 || goal < 0) {
        errorMessage.textContent = "Error: Capacities and goal must be positive numbers.";
        return;
    }
    
    goalJug = goalJugAInput.checked ? 'a' : 'b';
    
    if (goal > (goalJug === 'a' ? capA : capB)) {
        errorMessage.textContent = `Error: Goal (${goal}L) is larger than capacity of ${goalJug === 'a' ? 'Jug A' : 'Jug B'} (${goalJug === 'a' ? capA : capB}L).`;
        return;
    }
    
    // Set global state
    jugACapacity = capA;
    jugBCapacity = capB;
    goalAmount = goal;
    
    // Reset simulation
    state.jugA = 0;
    state.jugB = 0;
    stepCount = 0;
    gameActive = true;
    
    winMessage.textContent = "";
    logContent.innerHTML = "";
    
    // Enable all action buttons
    Object.values(buttons).forEach(button => button.disabled = false);
    
    // Update dynamic UI text and styles
    goalText.textContent = `Goal: Get exactly ${goalAmount}L in ${goalJug === 'a' ? 'Jug A' : 'Jug B'}.`;
    jugAName.textContent = `Jug A (${jugACapacity}L)`;
    jugBName.textContent = `Jug B (${jugBCapacity}L)`;
    
    // Update jug container heights for visual representation
    // We'll scale Jug B relative to Jug A
    const maxCap = Math.max(jugACapacity, jugBCapacity);
    jugAContainer.style.height = `${(jugACapacity / maxCap) * JUG_BASE_HEIGHT}px`;
    jugBContainer.style.height = `${(jugBCapacity / maxCap) * JUG_BASE_HEIGHT}px`;
    
    addToHistory("Start");
    updateUI();
}

// 2. Update UI (Water levels and labels)
function updateUI() {
    // Update water levels (as a percentage of max height)
    jugA.style.height = `${(state.jugA / jugACapacity) * 100}%`;
    jugB.style.height = `${(state.jugB / jugBCapacity) * 100}%`;
    
    // Update labels
    labelA.textContent = `${state.jugA}L / ${jugACapacity}L`;
    labelB.textContent = `${state.jugB}L / ${jugBCapacity}L`;
    
    // Update button text to be more specific
    buttons.fillA.textContent = `Fill Jug A (${jugACapacity}L)`;
    buttons.fillB.textContent = `Fill Jug B (${jugBCapacity}L)`;
    
    // Check for win
    checkWin();
}

// 3. Add to History Log
function addToHistory(action) {
    stepCount++;
    const logEntry = document.createElement('p');
    logEntry.textContent = `Step ${stepCount}: ${action} -> State: (${state.jugA}, ${state.jugB})`;
    logContent.appendChild(logEntry);
    
    // Auto-scroll to bottom
    logContent.scrollTop = logContent.scrollHeight;
}

// 4. Check for Win Condition (now dynamic)
function checkWin() {
    const isWin = (goalJug === 'a' && state.jugA === goalAmount) || 
                  (goalJug === 'b' && state.jugB === goalAmount);
    
    if (isWin) {
        winMessage.textContent = `Goal Reached in ${stepCount - 1} moves!`;
        gameActive = false;
        
        // Disable all action buttons
        Object.values(buttons).forEach(button => button.disabled = true);
    }
}

// --- Action Functions (Operators) ---
// All functions now use the global capacity variables

function performAction(fn, actionName) {
    if (!gameActive) return;
    
    fn(); // Execute the specific action
    addToHistory(actionName);
    updateUI();
}

// Fill Jug A
function fillA() {
    state.jugA = jugACapacity;
}

// Fill Jug B
function fillB() {
    state.jugB = jugBCapacity;
}

// Empty Jug A
function emptyA() {
    state.jugA = 0;
}

// Empty Jug B
function emptyB() {
    state.jugB = 0;
}

// Pour A to B
function pourAtoB() {
    const spaceInB = jugBCapacity - state.jugB;
    const amountToTransfer = Math.min(state.jugA, spaceInB);
    
    state.jugA -= amountToTransfer;
    state.jugB += amountToTransfer;
}

// Pour B to A
function pourBtoA() {
    const spaceInA = jugACapacity - state.jugA;
    const amountToTransfer = Math.min(state.jugB, spaceInA);
    
    state.jugB -= amountToTransfer;
    state.jugA += amountToTransfer;
}

// --- Event Listeners ---
buttons.fillA.addEventListener('click', () => performAction(fillA, `Fill Jug A`));
buttons.fillB.addEventListener('click', () => performAction(fillB, `Fill Jug B`));
buttons.emptyA.addEventListener('click', () => performAction(emptyA, "Empty Jug A"));
buttons.emptyB.addEventListener('click', () => performAction(emptyB, "Empty Jug B"));
buttons.pourAtoB.addEventListener('click', () => performAction(pourAtoB, "Pour A -> B"));
buttons.pourBtoA.addEventListener('click', () => performAction(pourBtoA, "Pour B -> A"));

// The main start button
startButton.addEventListener('click', startGame);

// --- Initial Game Start ---
// Run once on page load with the default values
startGame();