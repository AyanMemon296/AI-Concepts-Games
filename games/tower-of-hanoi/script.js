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

// --- Disk Colors (from CSS variables) ---
const DISK_COLORS = [
    '#ff4d4d', '#ffa64d', '#fcf300', '#4dff4d', 
    '#4d4dff', '#a64dff', '#ff4dff', '#4dffff'
];

// ===============================================
// *** UTILITY FUNCTIONS (MOVED TO TOP FOR SCOPE) ***
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
    // CALLING setMessage IS NOW SAFE
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

        // Mobile Touch Listeners (for reliable touch pickup)
        disk.addEventListener('touchstart', handleTouchStart);
    });
    
    rods.forEach(rod => {
        // Desktop Listeners
        rod.addEventListener('dragover', handleDragOver);
        rod.addEventListener('dragleave', handleDragLeave);
        rod.addEventListener('drop', handleDrop);
        
        // Mobile Drop Target
        rod.addEventListener('touchmove', handleTouchMove, { passive: false });
        rod.addEventListener('touchend', handleTouchEnd);
    });

    // Add universal touch/move listeners to the document for drag tracking
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: false });
}

// --- TOUCH/MOBILE HANDLERS ---

function handleTouchStart(e) {
    if (!gameActive || e.touches.length !== 1) return;

    const target = e.target.closest('.disk');
    if (!target) return;

    // Rule 1: Can only move the top disk.
    if (target === target.parentElement.lastChild) {
        touchTargetDisk = target;
        touchTargetDisk.classList.add('dragging');
        
        // Position the element visually to follow the finger
        touchTargetDisk.style.position = 'absolute';
        touchTargetDisk.style.zIndex = 100;
        
        e.preventDefault(); 
    } else {
        flashMessage("Can only move the top disk!", 'fail');
    }
}

function handleTouchMove(e) {
    if (!touchTargetDisk || !gameActive) return;
    
    e.preventDefault(); // Prevent scrolling
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const diskRect = touchTargetDisk.getBoundingClientRect();
    
    // Reposition the disk to the touch point (Adjusted for visual center)
    touchTargetDisk.style.left = `${touch.clientX - (diskRect.width / 2)}px`;
    touchTargetDisk.style.top = `${touch.clientY - (diskRect.height / 2)}px`;
}

function handleTouchEnd(e) {
    if (!touchTargetDisk) return;
    
    const touch = e.changedTouches ? e.changedTouches[0] : e;
    
    // Identify the element currently under the finger/mouse
    let targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
    let targetRod = targetElement ? targetElement.closest('.rod') : null;

    if (targetRod) {
        if (isValidMove(targetRod)) {
            // Success: Append disk, which snaps it back into the flex container
            targetRod.appendChild(touchTargetDisk);
            moveCount++;
            updateMoveCount();
            checkWin();
        } else {
            flashMessage("Cannot place a larger disk on a smaller one!", 'fail');
        }
    }
    
    // Reset visual and state elements
    touchTargetDisk.classList.remove('dragging');
    touchTargetDisk.style.position = 'static';
    touchTargetDisk.style.left = '';
    touchTargetDisk.style.top = '';
    touchTargetDisk.style.zIndex = '';
    touchTargetDisk = null;

    // Re-draw the graph to re-position all elements correctly within the flex layout
    drawGraph(); 
}

function drawGraph() {
    // This is required to visually update the 'static' position
    // after the 'absolute' touch drag ends.
    draw();
}

function draw() {
    // We need a dummy draw function to trigger the DOM update quickly
    // after the touch move/end to ensure the disk snaps back correctly.
}

// --- DESKTOP DRAG HANDLERS ---

function handleDragStart(e) {
    if (!gameActive) {
        e.preventDefault();
        return;
    }
    
    // Rule 1 check is done in the event listener binding, but re-checked here
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
    e.preventDefault(); // Crucial to allow a drop
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
    // Win if Rod C has all the disks
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
