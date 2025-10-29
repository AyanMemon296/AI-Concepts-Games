// --- DOM Elements ---
const canvas = document.getElementById('tree-canvas');
const ctx = canvas.getContext('2d');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');
const bfsButton = document.getElementById('bfs-button');
const dfsButton = document.getElementById('dfs-button');

// --- Colors (Use direct hex values from theme) ---
const COLORS = {
    background: '#050a14',
    node: '#00ffff',
    edge: 'rgba(0, 255, 255, 0.5)',
    visited: '#ffa64d', // Orange/Yellow highlight
    current: '#ff4d4d', // Red for current node
    text: '#ffffff',
    path: '#4dff4d'
};

// --- Tree Data Structure (Matches the user's image structure) ---
const TREE_NODES = {
    'a': ['b', 'c'],
    'b': ['d', 'e'],
    'c': ['f', 'g'],
    'd': ['h'],
    'e': ['i', 'j'],
    'f': ['k'],
    'g': [],
    'h': [],
    'i': [],
    'j': [],
    'k': []
};

// --- State and Layout ---
let nodesMap = {};
let animationQueue = [];
let animationTimeout = null;
let isAnimating = false;
const NODE_RADIUS = 15;
const ANIMATION_DELAY = 400; // milliseconds per step

// ===============================================
// *** UTILITY FUNCTIONS (MOVED TO TOP FOR SCOPE) ***
// ===============================================

function setMessage(msg, type = 'info') {
    if (message) {
        message.textContent = msg;
        message.className = '';
        if(type === 'win' || type === 'fail') {
             message.classList.add(type);
        }
    } else {
        console.error("Message element not found!");
    }
}

function disableButtons(disabled) {
    if (bfsButton) {
        bfsButton.disabled = disabled;
        dfsButton.disabled = disabled;
        restartButton.disabled = disabled;
    }
}

// Helper function to draw an arrowhead
function drawArrowhead(fromX, fromY, toX, toY, context) {
    const headLength = 10; 
    const angle = Math.atan2(toY - fromY, toX - fromX);
    context.strokeStyle = context.strokeStyle;
    context.beginPath();
    context.moveTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    context.moveTo(toX, toY);
    context.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    context.stroke();
}


// --- Setup ---
function setup() {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    
    // Clear and reset state
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    isAnimating = false;
    if (animationTimeout) clearTimeout(animationTimeout);
    animationQueue = [];
    nodesMap = {};
    
    // 1. Calculate Node Coordinates (Now correctly scales)
    calculateLayout();
    
    // 2. Draw initial static tree
    drawTree(nodesMap);
    
    setMessage("Select a search type to begin visualization.");
    disableButtons(false);
}

// --- Layout Calculation (FIXED: Forces full horizontal spread) ---
function calculateLayout() {
    const width = canvas.width;
    const height = canvas.height;
    
    let maxDepth = 0;
    let nodesAtDepth = {};
    
    function traverse(nodeLabel, depth) {
        if (!nodesAtDepth[depth]) nodesAtDepth[depth] = [];
        nodesAtDepth[depth].push(nodeLabel);
        maxDepth = Math.max(maxDepth, depth);
        TREE_NODES[nodeLabel].forEach(child => traverse(child, depth + 1));
    }
    traverse('a', 0); // Start traversal from root

    // Calculate Y spacing
    const yStep = height / (maxDepth + 2);
    
    // Determine widest level for X scaling (Total 7 nodes on the deepest level)
    const maxNodesAtLevel = 7; 
    
    // --- Assign X and Y ---
    const xUnit = width / (maxNodesAtLevel + 1); // Unit width based on the widest level
    
    for (let depth = 0; depth <= maxDepth; depth++) {
        const nodes = nodesAtDepth[depth];
        const y = yStep * (depth + 1);
        
        // Determine the horizontal offset needed to center this specific row
        const rowNodes = nodes.length;
        const rowWidthUsed = (rowNodes - 1) * xUnit;
        const xOffset = (width - rowWidthUsed) / 2; // Center offset

        nodes.forEach((label, index) => {
             nodesMap[label] = { x: 0, y: 0, status: 'unvisited', parent: null };
             
             // X position: Start offset + (index * fixed unit width)
             nodesMap[label].x = xOffset + (index * xUnit); 
             nodesMap[label].y = y;
        });
    }
}

// --- Drawing Functions ---
function drawTree(map) {
    // Clear canvas
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Edges first (Correctly drawing lines from circle center to center)
    ctx.lineWidth = 2;
    Object.keys(TREE_NODES).forEach(parentLabel => {
        const parent = map[parentLabel];
        TREE_NODES[parentLabel].forEach(childLabel => {
            const child = map[childLabel];
            
            ctx.strokeStyle = (child.status === 'visited' || child.status === 'path') ? COLORS.visited : COLORS.edge;
            
            // --- Line Drawing ---
            // Calculate start and end points on the node circles for clean drawing
            const dx = child.x - parent.x;
            const dy = child.y - parent.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Start point (Edge of parent node)
            const startX = parent.x + (dx / distance) * NODE_RADIUS;
            const startY = parent.y + (dy / distance) * NODE_RADIUS;
            
            // End point (Edge of child node)
            const endX = child.x - (dx / distance) * NODE_RADIUS;
            const endY = child.y - (dy / distance) * NODE_RADIUS;

            // Draw line from edge to edge
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
            
            // Draw Arrowhead
            drawArrowhead(startX, startY, endX, endY, ctx);
        });
    });
    
    // Draw Nodes over edges
    Object.keys(map).forEach(label => {
        const node = map[label];
        
        // Determine fill and stroke color based on status
        let fillColor = COLORS.background;
        let strokeColor = COLORS.node;
        
        if (node.status === 'visited' || node.status === 'path') {
            fillColor = COLORS.visited;
            strokeColor = COLORS.visited;
        } else if (node.status === 'current') {
            fillColor = COLORS.current;
            strokeColor = COLORS.current;
        }
        
        // Draw Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.stroke();
        
        // Draw Label
        ctx.fillStyle = (node.status === 'visited' || node.status === 'path' || node.status === 'current') ? COLORS.background : COLORS.text;
        ctx.font = "12px Arial";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label.toUpperCase(), node.x, node.y);
    });
}

// --- Search Logic (Generic) ---
function runSearch(type) {
    if (isAnimating) return;
    
    setup(); // Reset state
    isAnimating = true;
    disableButtons(true);
    
    // 1. Core Algorithm Setup
    let frontier = [];
    let visited = new Set();
    animationQueue = [];
    
    const startNode = 'a';
    frontier.push(startNode);
    visited.add(startNode);
    
    // 2. Populate Animation Queue
    while (frontier.length > 0) {
        let currentLabel;
        if (type === 'BFS') {
            currentLabel = frontier.shift(); // Queue: FIFO
        } else {
            currentLabel = frontier.pop(); // Stack: LIFO
        }

        // Add current node to be processed/visited
        animationQueue.push({ label: currentLabel, status: 'current' }); 
        
        // Add neighbors to the frontier
        const neighbors = TREE_NODES[currentLabel];
        
        // Important: Reverse neighbors for DFS (stack) to ensure left branch is explored first
        if (type === 'DFS') neighbors.reverse(); 
        
        neighbors.forEach(neighborLabel => {
            if (!visited.has(neighborLabel)) {
                visited.add(neighborLabel);
                frontier.push(neighborLabel);
                nodesMap[neighborLabel].parent = currentLabel; // Track parent for potential path
            }
        });
        
        // Mark node as finished visiting in visualization (visited)
        animationQueue.push({ label: currentLabel, status: 'visited' });
    }
    
    // 3. Start the animation
    startAnimation();
}

// --- Animation (Using setTimeout for reliable steps) ---
function startAnimation() {
    if (animationTimeout) clearTimeout(animationTimeout);
    
    let i = 0;
    setMessage("Starting search...");

    function animateStep() {
        if (!isAnimating || i >= animationQueue.length) {
            stopAnimation();
            return;
        }

        // 1. Apply new status
        const step = animationQueue[i];
        nodesMap[step.label].status = step.status;
        
        // 2. Re-draw scene and update message
        drawTree(nodesMap);
        setMessage(`Step ${i + 1}: Node ${step.label.toUpperCase()} (${step.status.toUpperCase()})`);
        
        i++;
        
        // Set the timer for the next step
        animationTimeout = setTimeout(animateStep, ANIMATION_DELAY);
    }
    
    // Initial call
    animateStep();
}

function stopAnimation() {
    if (animationTimeout) clearTimeout(animationTimeout);
    animationTimeout = null;
    isAnimating = false;
    disableButtons(false);
    setMessage("Visualization complete.", 'win');
    
    // Final state coloring
    Object.keys(nodesMap).forEach(label => {
        if (nodesMap[label].status !== 'unvisited') {
            nodesMap[label].status = 'visited';
        }
    });
    drawTree(nodesMap);
}


// --- Event Listeners ---
restartButton.addEventListener('click', setup);
bfsButton.addEventListener('click', () => runSearch('BFS'));
dfsButton.addEventListener('click', () => runSearch('DFS'));

// --- Initial Call ---
setup();