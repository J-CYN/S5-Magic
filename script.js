//Finds the node which is closest to mouse click
function nearestNode(sel_x, sel_y) {
    for (let node_ind = 0; node_ind < 9; node_ind++) { //runs for each node
        let pos = nodePos(node_ind);
        let dist = Math.sqrt((sel_x - pos.x) ** 2 + (sel_y - pos.y) ** 2);
        if (dist < 40)  // half of an 80px node diameter
            return node_ind;
    }
    return -1;
}

//Used to create help nodes
function usedNodes() {
    let used = {};
    for (let l = 0; l < lines.length; l++) {
        for (let n = 0; n < lines[l].length; n++) {
            used[lines[l][n]] = l;  // sets the value of used for a certain node index to a specific line
        }
    }
    return used;
}

//Finds the node position itself
function nodePos(node_ind) {
    let col = node_ind % 3; // Sets column
    let row = Math.floor(node_ind / 3); // Sets row
    return {
        x: 65 + col * 130, // padding and spacing between
        y: 65 + row * 130 
    };
}

//Clears the current selection
function clearAll() {
    lines = [];
    currentLine = [];
    dragging = false;
    hoveredNode = -1;
    table.redraw();
}

//Draw the lines with arrows to denote direction
function drawArrow(p, posA, posB) {
    let angle = Math.atan2(posB.y - posA.y, posB.x - posA.x);
    let midX = (posA.x + posB.x) / 2;
    let midY = (posA.y + posB.y) / 2;
    let size = 8;

    p.push();
    p.translate(midX, midY);
    p.rotate(angle);
    p.fill('#88733d');
    p.noStroke();
    p.triangle(size, 0, -size, -size * 0.6, -size, size * 0.6);
    p.pop();
}

//Init variables
let lines = [];
let currentLine = [];
let dragging = false;
let hoveredNode = -1;

//Color list
const lineColors = ['rgb(2, 194, 140)', '#c084fc', '#f97316'];

let table = new p5(function(p) { // Use p to access p5 functions directly
   
    // A setup function that runs ones
    p.setup = function() {
        p.createCanvas(390, 390); // Defines size
        p.noLoop(); // Doesn't redraw
    };

    //Redefine drawing
    p.draw = function() {
        // draw background
        p.background('#efdcc1');
    
        // Actual line drawing
        for (let l = 0; l < lines.length; l++) {
            for (let i = 0; i < lines[l].length - 1; i++) {
                let posA = nodePos(lines[l][i]);
                let posB = nodePos(lines[l][i + 1]);
                p.stroke('#88733d');
                p.strokeWeight(3);
                p.line(posA.x, posA.y, posB.x, posB.y);
                drawArrow(p, posA, posB);
            }
        }

        for (let i = 0; i < currentLine.length - 1; i++) {
            let posA = nodePos(currentLine[i]);
            let posB = nodePos(currentLine[i + 1]);
            p.stroke('#88733d');
            p.strokeWeight(3);
            p.line(posA.x, posA.y, posB.x, posB.y);
            drawArrow(p, posA, posB);
        }

        // draw nodes
        for (let node_ind = 0; node_ind < 9; node_ind++) {
            let pos = nodePos(node_ind);

            // draw lines
            let used = usedNodes();

            if (currentLine.includes(node_ind)) {
                p.fill(lineColors[lines.length]);      // if currently selected
            } else if (used[node_ind] !== undefined) {
                p.fill(lineColors[used[node_ind]]);    // color of the line depending on when selected previously
            } else if (node_ind === hoveredNode) {
                p.fill('#88733d');
            } else {
                p.fill('#deb887');
            }

            p.noStroke();
            p.ellipse(pos.x, pos.y, 80, 80);
        }
    };

    p.mouseMoved = function() {
        hoveredNode = nearestNode(p.mouseX, p.mouseY);
        p.redraw();
    };

    p.mousePressed = function() {
        if (lines.length >= 3) // Can only draw three lines before it stops you
            return;

        let n = nearestNode(p.mouseX, p.mouseY);
        if (n !== -1 && usedNodes()[n] === undefined) {
            dragging = true;
            currentLine = [n];
            p.redraw();
        }
    };


    p.mouseDragged = function() {
        let n = nearestNode(p.mouseX, p.mouseY);
        if (n !== -1 && !currentLine.includes(n) && usedNodes()[n] === undefined) {
            currentLine.push(n);
        }
        p.redraw();
    };

    p.mouseReleased = function() {
        if (dragging && currentLine.length > 0) {
            lines.push([...currentLine]); // save a copy of the current line
        }
        dragging = false; 
        currentLine = []; // empty the line
        p.redraw();
    };

}, 'node-canvas'); // Location of injection
