// --- DOM Elements (Renamed 'peg' to 'rod') ---
const rodA = document.getElementById('rod-a');
const rodB = document.getElementById('rod-b');
const rodC = document.getElementById('rod-c');
const rods = document.querySelectorAll('.rod');
const restartButton = document.getElementById('restart-button');
const message = document.getElementById('message');
const moveCountElement = document.getElementById('move-count');
const minMovesElement = document.getElementById('min-moves');
const diskSlider = document.getElementById('disk-count');
const diskLabel = document.getElementById('disk-count-label');

// --- Game State ---
let diskCount = 3;
let moveCount = 0;
let gameActive = true;
let draggedDisk = null;

// --- Disk Colors (from CSS variables) ---
const DISK_COLORS = [
    '#ff4d4d', '#ffa64d', '#fcf300', '#4dff4d', 
    '#4d4dff', '#a64dff', '#ff4dff', '#4dffff'
];

// --- Functions ---

// 1. Start/Restart Game
function init() {
    // Read disk count from slider
    diskCount = parseInt(diskSlider.value);
    
    // Reset state
    moveCount = 0;
    gameActive = true;
    
    // Clear rods
    rods.forEach(rod => rod.innerHTML = '');
    
    // Create disks on Rod A
    for (let i = diskCount; i > 0; i--) {
        createDisk(i, rodA);
    }
    
    // Reset UI
    updateMoveCount();
    minMovesElement.textContent = Math.pow(2, diskCount) - 1;
    diskLabel.textContent = diskCount;
    message.textContent = "Move all disks from Rod A to Rod C.";
    message.className = '';
    
    // Add event listeners
    addDragListeners();
}

// 2. Create a single disk (UPDATED)
function createDisk(size, rod) {
    const disk = document.createElement('div');
    disk.classList.add('disk');
    disk.draggable = true;
    disk.dataset.size = size;
    
    // *** UPDATED WIDTH CALCULATION ***
    // Calculates width from 20% (size 1) to 90% (size 8)
    const minWidth = 20;
    const maxWidth = 90;
    const maxDisks = 8; // Max disks allowed by slider
    const widthStep = (maxWidth - minWidth) / (maxDisks - 1);
    disk.style.width = `${minWidth + (size - 1) * widthStep}%`;
    
    disk.style.backgroundColor = DISK_COLORS[size - 1 % DISK_COLORS.length];
    
    rod.appendChild(disk);
}

// 3. Add all drag-and-drop listeners
function addDragListeners() {
    const disks = document.querySelectorAll('.disk');
    
    disks.forEach(disk => {
        disk.addEventListener('dragstart', handleDragStart);
        disk.addEventListener('dragend', handleDragEnd);
    });
    
    rods.forEach(rod => {
        rod.addEventListener('dragover', handleDragOver);
        rod.addEventListener('dragleave', handleDragLeave);
        rod.addEventListener('drop', handleDrop);
    });
}

// 4. Handle Drag Start
function handleDragStart(e) {
    if (!gameActive) return;

    // Rule 1: Can only move the top disk.
    // In flex-column-reverse, the last child is the top.
    if (e.target === e.target.parentElement.lastChild) {
        draggedDisk = e.target;
        setTimeout(() => e.target.classList.add('dragging'), 0);
    } else {
        // Not the top disk
        e.preventDefault();
        flashMessage("Can only move the top disk!", 'fail');
    }
}

// 5. Handle Drag End
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedDisk = null;
}

// 6. Handle Drag Over
function handleDragOver(e) {
    e.preventDefault();
    if (!gameActive || !draggedDisk) return;
    
    const rod = e.target.closest('.rod');
    
    // Check if the move is valid for highlighting
    if (isValidMove(rod)) {
        rod.classList.add('drag-over');
    }
}

// 7. Handle Drag Leave
function handleDragLeave(e) {
    e.target.closest('.rod').classList.remove('drag-over');
}

// 8. Handle Drop
function handleDrop(e) {
    e.preventDefault();
    if (!gameActive || !draggedDisk) return;
    
    const rod = e.target.closest('.rod');
    rod.classList.remove('drag-over');
    
    if (isValidMove(rod)) {
        // Valid move: Append disk, update state
        rod.appendChild(draggedDisk);
        moveCount++;
        updateMoveCount();
        checkWin();
    } else {
        // Invalid move
        flashMessage("Cannot place a larger disk on a smaller one!", 'fail');
    }
}

// 9. Rule 2 Check: Is the move valid?
function isValidMove(targetRod) {
    const topDisk = targetRod.lastChild;
    
    // If rod is empty, any move is valid
    if (!topDisk) {
        return true;
    }
    
    const topDiskSize = parseInt(topDisk.dataset.size);
    const draggedDiskSize = parseInt(draggedDisk.dataset.size);
    
    // Rule: Dragged disk must be smaller than the one it's placed on
    return (draggedDiskSize < topDiskSize);
}

// 10. Update Move Count
function updateMoveCount() {
    moveCountElement.textContent = moveCount;
}

// 11. Check for Win
function checkWin() {
    // Win if Rod C has all the disks
    if (rodC.children.length === diskCount) {
        message.textContent = "You Win!";
        message.className = 'win';
        gameActive = false;
        
        // Check if optimal
        const minMoves = Math.pow(2, diskCount) - 1;
        if (moveCount === minMoves) {
            message.textContent = `You Win! (Perfect ${minMoves} moves!)`;
        }
    }
}

// 12. Flash Message
function flashMessage(msg, type = 'info') {
    const originalMsg = message.textContent;
    const originalClass = message.className;
    
    message.textContent = msg;
    message.className = type;
    
    setTimeout(() => {
        message.textContent = originalMsg;
        message.className = originalClass;
    }, 2000);
}

// --- Event Listeners ---
restartButton.addEventListener('click', init);
diskSlider.addEventListener('input', () => {
    diskLabel.textContent = diskSlider.value;
});
diskSlider.addEventListener('change', init); // Re-init game on change

// --- Initial Game Start ---
init();