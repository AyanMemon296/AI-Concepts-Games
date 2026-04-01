// --- DOM Elements ---
const bankLeft = document.getElementById('bank-left');
const bankRight = document.getElementById('bank-right');
const boatElement = document.getElementById('boat');
const crossRiverButton = document.getElementById('cross-river-button');
const restartButton = document.getElementById('restart-button');
const message = document.getElementById('message');
const dropzones = document.querySelectorAll('.dropzone');
let characters = []; // Will be populated by JS

// --- Game State ---
let boatPosition = 'left'; // 'left' or 'right'
let gameActive = true;
let draggedItem = null;

// --- Initialization ---
function init() {
    // Create and place characters
    bankLeft.innerHTML = '';
    bankRight.innerHTML = '';
    boatElement.innerHTML = '';
    
    characters = [];
    for (let i = 0; i < 3; i++) {
        createCharacter('missionary', bankLeft, i);
        createCharacter('cannibal', bankLeft, i + 3);
    }
    
    // Reset state
    boatPosition = 'left';
    boatElement.classList.remove('on-right-bank');
    gameActive = true;
    crossRiverButton.disabled = false;
    
    // Setup event listeners
    setupDragAndDrop();
    
    // Reset messages
    message.textContent = "Move all 3 Missionaries and 3 Cannibals to the right bank.";
    message.className = '';
}

// function createCharacter(type, location, id) {
//     const char = document.createElement('div');
//     char.classList.add('character', type);
//     char.draggable = true;
//     char.id = `char-${id}`;
//     char.textContent = type.charAt(0).toUpperCase();
//     location.appendChild(char);
//     characters.push(char);
// }

//newer version with images instead of text
function createCharacter(type, location, id) {
    const char = document.createElement('img');
    char.classList.add('character', type);
    char.draggable = true;
    char.id = `char-${id}`;
    char.src = `./assets/${type}.svg`;
    char.alt = type;
    location.appendChild(char);
    characters.push(char);
}

// --- Drag and Drop Logic ---
function setupDragAndDrop() {
    // Add drag listeners to characters
    characters.forEach(char => {
        char.addEventListener('dragstart', handleDragStart);
        char.addEventListener('dragend', handleDragEnd);
    });
    
    // Add drop listeners to dropzones
    dropzones.forEach(zone => {
        zone.addEventListener('dragover', handleDragOver);
        zone.addEventListener('dragleave', handleDragLeave);
        zone.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    if (!gameActive) return;
    draggedItem = e.target;
    setTimeout(() => e.target.classList.add('dragging'), 0);
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedItem = null;
}

function handleDragOver(e) {
    e.preventDefault();
    if (!gameActive) return;
    e.target.closest('.dropzone').classList.add('drag-over');
}

function handleDragLeave(e) {
    e.target.closest('.dropzone').classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    if (!gameActive || !draggedItem) return;
    
    const dropZone = e.target.closest('.dropzone');
    dropZone.classList.remove('drag-over');
    
    // --- Move Validation Logic ---
    const sourceZone = draggedItem.parentElement;
    
    // 1. Check if boat is full
    if (dropZone.id === 'boat' && boatElement.children.length >= 2) {
        flashMessage("The boat can only hold 2 people!");
        return;
    }
    
    // 2. Check if moving from the correct bank to the boat
    if (sourceZone.id.includes('bank') && dropZone.id === 'boat') {
        if (sourceZone.id !== `bank-${boatPosition}`) {
            flashMessage("The boat is on the other side!");
            return;
        }
    }
    
    // 3. Check if moving from the boat to the correct bank
    if (sourceZone.id === 'boat' && dropZone.id.includes('bank')) {
        if (dropZone.id !== `bank-${boatPosition}`) {
            flashMessage("You can't get off on the wrong bank!");
            return;
        }
    }
    
    // 4. Prevent bank-to-bank transfers
    if (sourceZone.id.includes('bank') && dropZone.id.includes('bank')) {
        flashMessage("Move people to the boat first.");
        return;
    }
    
    // Valid move
    dropZone.appendChild(draggedItem);
}

// --- Game Rule Logic ---
function crossRiver() {
    if (!gameActive) return;

    // 1. Check if boat is empty
    if (boatElement.children.length === 0) {
        flashMessage("Someone must row the boat!");
        return;
    }
    
    // 2. Move the boat
    boatPosition = (boatPosition === 'left') ? 'right' : 'left';
    boatElement.classList.toggle('on-right-bank');
    
    // 3. Check game state AFTER the move
    checkGameState();
}

function checkGameState() {
    // Get counts for all 3 zones
    const leftCounts = getCounts(bankLeft);
    const rightCounts = getCounts(bankRight);
    const boatCounts = getCounts(boatElement);

    // Determine total counts on each bank (boat counts for its current side)
    let totalLeftM = leftCounts.M;
    let totalLeftC = leftCounts.C;
    let totalRightM = rightCounts.M;
    let totalRightC = rightCounts.C;

    if (boatPosition === 'left') {
        totalLeftM += boatCounts.M;
        totalLeftC += boatCounts.C;
    } else {
        totalRightM += boatCounts.M;
        totalRightC += boatCounts.C;
    }

    // --- Check for Lose Condition ---
    // (If M > 0 and C > M, they get eaten)
    const leftBankFails = (totalLeftM > 0 && totalLeftC > totalLeftM);
    const rightBankFails = (totalRightM > 0 && totalRightC > totalRightM);

    if (leftBankFails || rightBankFails) {
        endGame(false); // You Lose
        return;
    }

    // --- Check for Win Condition ---
    if (totalRightM === 3 && totalRightC === 3) {
        endGame(true); // You Win
        return;
    }
    
    // If no win/lose, game continues
    message.textContent = `...Safe... (Boat is on the ${boatPosition})`;
    message.className = '';
}

function getCounts(element) {
    const missionaries = element.getElementsByClassName('missionary').length;
    const cannibals = element.getElementsByClassName('cannibal').length;
    return { M: missionaries, C: cannibals };
}

function endGame(isWin) {
    gameActive = false;
    crossRiverButton.disabled = true;
    
    if (isWin) {
        message.textContent = "You Win! Everyone is safe.";
        message.className = 'win';
    } else {
        message.textContent = "You Lose! Cannibals outnumbered Missionaries.";
        message.className = 'lose';
    }
}

// --- Utility Functions ---
function flashMessage(msg) {
    const originalMsg = message.textContent;
    const originalClass = message.className;
    
    message.textContent = msg;
    message.className = 'lose'; // Use 'lose' style for errors
    
    setTimeout(() => {
        message.textContent = originalMsg;
        message.className = originalClass;
    }, 2000);
}

// --- Event Listeners ---
crossRiverButton.addEventListener('click', crossRiver);
restartButton.addEventListener('click', init);

// --- Initial Game Start ---
init();