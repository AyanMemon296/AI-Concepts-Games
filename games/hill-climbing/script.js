// --- DOM Elements ---
const canvas = document.getElementById('landscape-canvas');
const ctx = canvas.getContext('2d');
const startButton = document.getElementById('start-button');
const message = document.getElementById('message');

// --- Canvas Sizing ---
canvas.width = 800;
canvas.height = 400;

// --- State ---
let agent = { x: 0, isClimbing: false, stuck: false };
let climbInterval = null;
let animationFrameId = null;

// --- Colors ---
const COLORS = {
    background: '#050a14',
    terrain: '#00ffff',
    agent: '#ff4d4d',
    globalMax: '#4dff4d',
    localMax: '#ffa64d',
    plateau: '#aaa',
    ridge: '#aaa',
    text: '#ffffff'
};

// --- *** THE MANUALLY-DEFINED LANDSCAPE *** ---
// This is an array of Y-values. Lower Y = higher peak.
const landscape = [];
// This function creates the terrain
function createLandscape() {
    for (let x = 0; x < canvas.width; x++) {
        let y;
        if (x < 150) {
            // 1. Starting slope
            y = 350 - x * 0.5;
        } else if (x < 250) {
            // 2. Local Maximum (Peak 1)
            y = 275 - Math.sin((x - 150) / 100 * Math.PI) * 80;
        } else if (x < 350) {
            // 3. Valley
            y = 355 + Math.sin((x - 250) / 100 * Math.PI) * 40;
        } else if (x < 450) {
            // 4. Plateau (flat section)
            y = 315;
        } else if (x < 550) {
            // 5. Ridge (small bump)
            y = 315 - Math.sin((x - 450) / 100 * Math.PI) * 30;
        } else if (x < 700) {
            // 6. Slope to Global Max
            y = 285 - (x - 550) * 1.5;
        } else {
            // 7. Global Maximum (Peak 2)
            y = 60 + Math.sin((x - 700) / 100 * Math.PI) * 50;
        }
        landscape[x] = y;
    }
}

// --- Drawing Functions ---

// 1. Draw the entire scene
function draw() {
    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw landscape line
    ctx.strokeStyle = COLORS.terrain;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, landscape[0]);
    for (let x = 1; x < canvas.width; x++) {
        ctx.lineTo(x, landscape[x]);
    }
    ctx.stroke();

    // Draw labels for features
    drawLabel("Local Maximum", 200, COLORS.localMax);
    drawLabel("Plateau", 400, COLORS.plateau);
    drawLabel("Ridge", 500, COLORS.ridge);
    drawLabel("Global Maximum", 700, COLORS.globalMax);

    // Draw Agent
    if (agent.x > 0) {
        ctx.fillStyle = agent.stuck ? COLORS.localMax : COLORS.agent;
        ctx.beginPath();
        // 10px above ground
        ctx.arc(agent.x, landscape[agent.x] - 10, 8, 0, Math.PI * 2); 
        ctx.fill();
    }

    // Loop animation if climbing
    if (agent.isClimbing) {
        animationFrameId = requestAnimationFrame(draw);
    }
}

// 2. Helper to draw text labels (FIXED)
function drawLabel(text, x, color) {
    // Get the y-coordinate from the landscape
    const y = landscape[x]; 
    
    ctx.font = "14px 'Consolas', monospace";
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    // Draw text 10px above the peak
    ctx.fillText(text, x, y - 10); 
    
    // Draw dot on the peak
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
}

// --- Algorithm Logic ---

// 1. Start/Restart the agent (FIXED)
function startAgent() {
    // Stop any previous animation
    if (climbInterval) clearInterval(climbInterval);
    if (animationFrameId) cancelAnimationFrame(animationFrameId);

    // Place agent at a random X on the left side
    agent.x = Math.floor(Math.random() * 100) + 20; // Start near x=20 to x=120
    agent.isClimbing = true;
    agent.stuck = false;
    
    setMessage("Agent started... climbing...", 'info');
    
    // Start the algorithm loop
    climbInterval = setInterval(climbStep, 50);
    
    // Start the animation loop
    // This call is what starts requestAnimationFrame
    animationFrameId = requestAnimationFrame(draw); 
}

// 2. One step of the Hill Climbing algorithm
function climbStep() {
    if (!agent.isClimbing) return;

    const currentX = agent.x;
    
    // Fix for edge case where agent.x might be undefined
    if (typeof currentX === 'undefined' || landscape[currentX] === 'undefined') {
        return; 
    }
    
    const currentY = landscape[currentX];
    
    // Look at neighbors (move 1 pixel at a time)
    const leftX = Math.max(0, currentX - 1);
    const rightX = Math.min(canvas.width - 1, currentX + 1);
    
    const leftY = landscape[leftX];
    const rightY = landscape[rightX];

    // Check which neighbor is higher (lower 'y' value)
    if (leftY < currentY && leftY <= rightY) {
        // Move left
        agent.x = leftX;
    } else if (rightY < currentY && rightY < leftY) {
        // Move right
        agent.x = rightX;
    } else {
        // STUCK: No neighbor is higher
        agent.isClimbing = false;
        agent.stuck = true;
        clearInterval(climbInterval);
        
        // Analyze where it got stuck
        analyzeResult(currentX);
    }
}

// 3. Analyze the final position
function analyzeResult(x) {
    if (x > 650) {
        setMessage(`Success! Agent found the Global Maximum!`, 'win');
    } else if (x > 470 && x < 530) {
        setMessage(`Agent is stuck on a Ridge.`, 'fail');
    } else if (x > 340 && x < 460) {
        setMessage(`Agent is stuck on a Plateau.`, 'fail');
    } else if (x > 170 && x < 230) {
        setMessage(`Agent is stuck at a Local Maximum.`, 'fail');
    } else {
        setMessage(`Agent is stuck on a slope.`, 'fail');
    }
}

// 4. Utility function for messages
function setMessage(msg, type = 'info') {
    message.textContent = msg;
    message.className = type;
}

// --- Event Listeners ---
startButton.addEventListener('click', startAgent);

// --- Initial Call ---
createLandscape(); // Create the terrain
draw(); // Draw it once