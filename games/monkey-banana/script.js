// --- DOM Elements ---
const monkey = document.getElementById('monkey');
const box = document.getElementById('box');
const bananas = document.getElementById('bananas');
const message = document.getElementById('message');

// Action Buttons
const buttons = {
    walkToBox: document.getElementById('walk-to-box'),
    pushBox: document.getElementById('push-box'),
    climbBox: document.getElementById('climb-box'),
    grabBananas: document.getElementById('grab-bananas'),
    walkToDoor: document.getElementById('walk-to-door'),
    climbOffBox: document.getElementById('climb-off-box'),
    restart: document.getElementById('restart-button')
};

// --- World State ---
// Define the locations (using % 'left' property from CSS)
const LOCATIONS = {
    door: '5%',
    boxStart: '40%',
    underBananas: '75%'
};

let state = {
    monkeyAt: LOCATIONS.door,
    boxAt: LOCATIONS.boxStart,
    monkeyOnBox: false,
    hasBananas: false,
    gameActive: true
};

// --- Functions ---

// 1. Start/Restart Game
function init() {
    state.monkeyAt = LOCATIONS.door;
    state.boxAt = LOCATIONS.boxStart;
    state.monkeyOnBox = false;
    state.hasBananas = false;
    state.gameActive = true;
    
    updateUI();
    
    // Enable all action buttons
    Object.values(buttons).forEach(button => button.disabled = false);
    
    // Changed 'flex' to 'block' for the img tag
    bananas.style.display = 'block'; 
    message.textContent = "Goal: Help the monkey get the bananas!";
    message.className = '';
}

// 2. Update UI (Animate elements based on state)
function updateUI() {
    // Move monkey
    monkey.style.left = state.monkeyAt;
    
    // Check if monkey is on the box
    if (state.monkeyOnBox) {
        monkey.style.bottom = '80px'; // Height of the box
    } else {
        monkey.style.bottom = '0'; // On the floor
    }
    
    // Move box
    box.style.left = state.boxAt;
    
    // If monkey is pushing, move monkey with box
    if (state.monkeyAt === state.boxAt && !state.monkeyOnBox) {
        monkey.style.left = state.boxAt;
    }
}

// 3. Set a message (can be 'win', 'fail', or 'info')
function setMessage(msg, type = 'info') {
    message.textContent = msg;
    message.className = type;
}

// 4. End the game
function endGame() {
    state.gameActive = false;
    Object.values(buttons).forEach(button => {
        if (button.id !== 'restart-button') {
            button.disabled = true;
        }
    });
}

// --- Action Functions (Operators) ---

// Walk to Door
function walkToDoor() {
    if (!state.gameActive) return;

    if (state.monkeyOnBox) {
        setMessage("Precondition failed: Monkey must climb off the box first.", 'fail');
        return;
    }
    
    state.monkeyAt = LOCATIONS.door;
    updateUI();
    setMessage("Monkey walked to the door.");
}

// Walk to Box
function walkToBox() {
    if (!state.gameActive) return;

    if (state.monkeyOnBox) {
        setMessage("Precondition failed: Monkey is on the box.", 'fail');
        return;
    }
    
    state.monkeyAt = state.boxAt; // Walk to wherever the box currently is
    updateUI();
    setMessage("Monkey walked to the box.");
}

// Push Box
function pushBox() {
    if (!state.gameActive) return;

    // Preconditions
    if (state.monkeyAt !== state.boxAt) {
        setMessage("Precondition failed: Monkey must be at the box to push it.", 'fail');
        return;
    }
    if (state.monkeyOnBox) {
        setMessage("Precondition failed: Monkey is on the box.", 'fail');
        return;
    }
    if (state.boxAt === LOCATIONS.underBananas) {
        setMessage("Info: The box is already under the bananas.", 'info');
        return;
    }
    
    // Action (Effect)
    state.boxAt = LOCATIONS.underBananas;
    state.monkeyAt = LOCATIONS.underBananas;
    updateUI();
    setMessage("Monkey pushed the box under the bananas.");
}

// Climb on Box
function climbBox() {
    if (!state.gameActive) return;

    // Preconditions
    if (state.monkeyAt !== state.boxAt) {
        setMessage("Precondition failed: Monkey must be at the box to climb it.", 'fail');
        return;
    }
    
    // Action (Effect)
    state.monkeyOnBox = true;
    updateUI();
    setMessage("Monkey climbed on the box.");
}

// Climb off Box
function climbOffBox() {
    if (!state.gameActive) return;
    
    // Preconditions
    if (!state.monkeyOnBox) {
        setMessage("Precondition failed: Monkey is not on the box.", 'fail');
        return;
    }
    
    // Action (Effect)
    state.monkeyOnBox = false;
    updateUI();
    setMessage("Monkey climbed off the box.");
}

// Grab Bananas
function grabBananas() {
    if (!state.gameActive) return;

    // Preconditions
    if (state.boxAt !== LOCATIONS.underBananas) {
        setMessage("Precondition failed: The box is not under the bananas.", 'fail');
        return;
    }
    if (!state.monkeyOnBox) {
        setMessage("Precondition failed: The monkey is not on the box.", 'fail');
        return;
    }
    
    // Action (Effect)
    state.hasBananas = true;
    bananas.style.display = 'none'; // Hide bananas
    setMessage("YOU WIN! Monkey got the bananas!", 'win');
    endGame();
}

// --- Event Listenles ---
buttons.walkToDoor.addEventListener('click', walkToDoor);
buttons.walkToBox.addEventListener('click', walkToBox);
buttons.pushBox.addEventListener('click', pushBox);
buttons.climbBox.addEventListener('click', climbBox);
buttons.climbOffBox.addEventListener('click', climbOffBox);
buttons.grabBananas.addEventListener('click', grabBananas);
buttons.restart.addEventListener('click', init);

// --- Initial Game Start ---
init();