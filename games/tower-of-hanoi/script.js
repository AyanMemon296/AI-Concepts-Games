// --- DOM Elements ---
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
let draggedDisk = null; // Used for desktop drag-and-drop API
let touchTargetDisk = null; // Used for custom touch drag logic
let animationFrameId = null;
let gameContainer = null; // Stored reference to the main container

// --- Disk Colors (from CSS variables) ---
const DISK_COLORS = [
    '#ff4d4d', '#ffa64d', '#fcf300', '#4dff4d', 
    '#4d4dff', '#a64dff', '#ff4dff', '#4dffff'
];

// ===============================================
// *** UTILITY FUNCTIONS ***
// ===============================================

// Helper function to display messages
function setMessage(msg, type = 'info') {
    if (message) {
        message.textContent = msg;
        message.className = type;
    }
}

// Helper function to flash short error messages
function flashMessage(msg, type = 'fail') {
    const originalMsg = message.textContent;
    const originalClass = message.className;
    
    message.textContent = msg;
    message.className = type;
    
    setTimeout(() => {
        message.textContent = originalMsg;
        message.className = originalClass;
    }, 2000);
}

// 1. Start/Restart Game
function init() {
    // CRITICAL FIX: Ensure gameContainer is set on init
    gameContainer = document.querySelector('.game-container'); 
    
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
    setMessage("Move all disks from Rod A to Rod C.", 'info');
    
    // Add event listeners
    addDragListeners();
}


// 2. Create a single disk
function createDisk(size, rod) {
    const disk = document.createElement('div');
    disk.classList.add('disk');
    disk.draggable = true;
    disk.dataset.size = size;
    
    // Final wider width calculation
    const minWidth = 40;
    const maxWidth = 95;
    const maxDisks = 8;
    const totalSteps = maxDisks - 1; 
    const widthIncreasePerStep = (maxWidth - minWidth) / totalSteps; 
    
    disk.style.width = `${minWidth + (size - 1) * widthIncreasePerStep}%`; 
    disk.style.backgroundColor = DISK_COLORS[size - 1 % DISK_COLORS.length];
    
    rod.appendChild(disk);
}

// 3. Add all drag-and-drop listeners (Includes Touch Events)
function addDragListeners() {
    const disks = document.querySelectorAll('.disk');
    
    disks.forEach(disk => {
        // Desktop Listeners
        disk.addEventListener('dragstart', handleDragStart);
        disk.addEventListener('dragend', handleDragEnd);

        // Mobile Touch Listeners
        disk.addEventListener('touchstart', handleTouchStart);
    });
    
    // Add universal touch/move listeners to the document for drag tracking
    // These listeners must be global due to the nature of drag events
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Desktop Listeners for dropzones
    rods.forEach(rod => {
        rod.addEventListener('dragover', handleDragOver);
        rod.addEventListener('dragleave', handleDragLeave);
        rod.addEventListener('drop', handleDrop);
    });
}

// --- TOUCH/MOBILE HANDLERS (FIXED SCOPE ERROR) ---

function handleTouchStart(e) {
    if (!gameActive || e.touches.length !== 1) return;

    const target = e.target.closest('.disk');
    if (!target) return;

    // Rule 1: Can only move the top disk.
    if (target === target.parentElement.lastChild) {
        touchTargetDisk = target;
        touchTargetDisk.classList.add('dragging');
        
        // CRITICAL: Set element to follow finger
        touchTargetDisk.style.position = 'absolute';
        touchTargetDisk.style.zIndex = 100;
        
        e.preventDefault(); 
    } else {
        flashMessage("Can only move the top disk!", 'fail');
    }
}

function handleTouchMove(e) {
    // FIX: Removed 'canvas' reference. Uses document for screen coordinates.
    if (!touchTargetDisk || !gameActive) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const diskRect = touchTargetDisk.getBoundingClientRect();
    
    // Reposition the disk to the touch point
    touchTargetDisk.style.left = `${touch.clientX - (diskRect.width / 2)}px`;
    touchTargetDisk.style.top = `${touch.clientY - (diskRect.height / 2)}px`;
}

function handleTouchEnd(e) {
    if (!touchTargetDisk) return;
    
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const sourceRod = touchTargetDisk.parentElement;
    
    // Identify the element currently under the finger/mouse
    let targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    let targetRod = targetElement ? targetElement.closest('.rod') : null;

    let moveSuccessful = false;

    if (targetRod && targetRod !== sourceRod) {
        if (isValidMove(targetRod)) {
            // SUCCESSFUL MOVE
            targetRod.appendChild(touchTargetDisk); 
            moveCount++;
            updateMoveCount();
            checkWin();
            moveSuccessful = true;
        } else {
            flashMessage("Cannot place a larger disk on a smaller one!", 'fail');
        }
    }
    
    // --- Final Visual Reset ---
    // If the move failed or was not attempted on a new rod, re-attach the disk to the source 
    // to guarantee it's in the correct flex position before resetting styles.
    if (!moveSuccessful && sourceRod) {
        sourceRod.appendChild(touchTargetDisk); 
    }

    // Reset visual styles to return control to the CSS flex layout
    touchTargetDisk.classList.remove('dragging');
    touchTargetDisk.style.position = ''; // Remove position:absolute entirely
    touchTargetDisk.style.left = ''; 
    touchTargetDisk.style.top = ''; 
    touchTargetDisk.style.zIndex = '';
    touchTargetDisk = null;
}

// --- DESKTOP DRAG HANDLERS ---

function handleDragStart(e) {
    if (!gameActive) {
        e.preventDefault();
        return;
    }
    
    if (e.target !== e.target.parentElement.lastChild) {
        e.preventDefault();
        return;
    }

    draggedDisk = e.target;
    draggedDisk.classList.add('dragging');
    e.dataTransfer.setData('text/plain', e.target.dataset.size);
    e.dataTransfer.effectAllowed = 'move';
}

function handleDragEnd(e) {
    if (draggedDisk) {
        draggedDisk.classList.remove('dragging');
        draggedDisk = null;
    }
}

function handleDragOver(e) {
    e.preventDefault();
    if (!gameActive || !draggedDisk) return;
    
    const rod = e.target.closest('.rod');
    if (rod && isValidMove(rod)) {
        e.dataTransfer.dropEffect = 'move';
        rod.classList.add('drag-over');
    } else {
        e.dataTransfer.dropEffect = 'none';
    }
}

function handleDragLeave(e) {
    e.target.closest('.rod')?.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    const targetRod = e.target.closest('.rod');

    if (targetRod && isValidMove(targetRod)) {
        targetRod.appendChild(draggedDisk);
        moveCount++;
        updateMoveCount();
        checkWin();
    }
    targetRod?.classList.remove('drag-over');
}

// --- CORE GAME LOGIC ---

// 9. Rule 2 Check: Is the move valid?
function isValidMove(targetRod) {
    const diskToMove = touchTargetDisk || draggedDisk; 
    if (!diskToMove) return false;

    const topDisk = targetRod.lastChild;
    
    // If rod is empty, any move is valid
    if (!topDisk || topDisk === diskToMove) {
        return true;
    }
    
    const topDiskSize = parseInt(topDisk.dataset.size);
    const draggedDiskSize = parseInt(diskToMove.dataset.size);
    
    // Rule: Dragged disk must be smaller than the one it's placed on
    return (draggedDiskSize < topDiskSize);
}

// 10. Update Move Count
function updateMoveCount() {
    moveCountElement.textContent = moveCount;
}

// 11. Check for Win
function checkWin() {
    if (rodC.children.length === diskCount) {
        setMessage("You Win!", 'win');
        gameActive = false;
        
        const minMoves = Math.pow(2, diskCount) - 1;
        if (moveCount === minMoves) {
            setMessage(`You Win! (Perfect ${minMoves} moves!)`, 'win');
        }
    }
}


// --- Event Listeners ---
restartButton.addEventListener('click', init);
diskSlider.addEventListener('input', () => {
    diskLabel.textContent = diskSlider.value;
});
diskSlider.addEventListener('change', init);

// --- Initial Game Start ---
init();
