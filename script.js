// Function meant to record new spells
// This will probably be removed later on
function submitSpell(){
    if(lines.length >= 2){
        let payload = {
            // grab values from text boxes and lines variable
            spell_name: document.getElementById('name-input').value, // Although, this might have to change 
            mana_cost: document.getElementById('mana-input').value, // And this could be done through calculation?
            lines: lines
        };
        fetch('/api/insert', { //connects to flask api
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, //json formatting
            body: JSON.stringify(payload)
        })
        .then(res => res.json()) // output sent back, converts to js object from original json 
        .then(data => console.log(data)); // This is how the javascript reacts to the output returned
    }
}

function retrieveSpell(){
    if(lines.length >= 2){
        fetch(`/api/retrieve?${JSON.stringify(lines)}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('name-input').value = data.spell_name;
            document.getElementById('mod-input').value = ;
            document.getElementById('mana-input').value = data.mana_cost;
            //table.redraw();
        });
    }
}

//Finds the node which is closest to mouse click when on the canvas
function nearestNode(sel_x, sel_y) { 
    for (let node_ind = 0; node_ind < 9; node_ind++) { //runs for each node index 
        let pos = nodePos(node_ind); // pos is equal to the node position gotten from the nodePos function
        let dist = Math.sqrt((sel_x - pos.x) ** 2 + (sel_y - pos.y) ** 2); //Calculates euclidean distance
        if (dist < 40)  // half of an 80px node to node distance
            return node_ind;
    }
    return -1; // value for no node found
}

//Used to create help nodes
function usedNodes() {
    let used = {}; // creates a list of used nodes
    for (let l = 0; l < lines.length; l++) { // runs a loop for each line
        for (let n = 0; n < lines[l].length; n++) { // and an inner loop for each point in each individual line.
            used[lines[l][n]] = l;  // used now maps, the input = ___ , and output = which line it belongs to
        }
    }
    return used;
}

//Finds and defines the node position itself
function nodePos(node_ind) {
    let col = node_ind % 3; // Sets column
    let row = Math.floor(node_ind / 3); // Sets row
    return {
        x: 65 + col * 130, // padding(65) and spacing between(130)
        y: 65 + row * 130 
    };
}

//Clears the current selection
function clearAll() {
    lines = []; // empties lines
    currentLine = []; // empties current lines
    dragging = false; //ends dragging
    hoveredNode = -1; // stops hovering
    table.redraw(); // resets the drawing as well
}

//Draw the lines with arrows to denote direction
function drawArrow(p, posA, posB) {
    let angle = Math.atan2(posB.y - posA.y, posB.x - posA.x); // calculates angle between x-axis and the x and y displacement between the two points selected.
    let midX = (posA.x + posB.x) / 2;
    let midY = (posA.y + posB.y) / 2;
    let size = 8; // determines size of the arrow and triangle/arrow

    p.push(); // Saves the state and rotation of the arrow

    p.translate(midX, midY); // Move to the middle point
    p.rotate(angle); // Rotates based on earlier calculated angle to position arrow
    p.fill('#88733d'); 
    p.noStroke();
    p.triangle(size, 0, -size, -size * 0.6, -size, size * 0.6); // Create the arrow triangle

    p.pop(); // Restores to previous version
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
        p.background('#efdcc1'); // Color of the background of the board
    
        // Actual line drawing
        for (let l = 0; l < lines.length; l++) { // Draws each line(in lines so the past ones, not the current)
            for (let i = 0; i < lines[l].length - 1; i++) { // and the connection between each node in these lines
                let posA = nodePos(lines[l][i]); // Grabs positions
                let posB = nodePos(lines[l][i + 1]);
                p.stroke('#88733d'); //line color
                p.strokeWeight(3); //line width
                p.line(posA.x, posA.y, posB.x, posB.y); //start and end point of the line drawing
                drawArrow(p, posA, posB); //draws the arrow.
            }
        }

        for (let i = 0; i < currentLine.length - 1; i++) { //Stops 1 early
            let posA = nodePos(currentLine[i]); //Grabs position
            let posB = nodePos(currentLine[i + 1]);

            p.stroke('#88733d');
            p.strokeWeight(3);
            p.line(posA.x, posA.y, posB.x, posB.y); // Draws the line from one node to the next

            drawArrow(p, posA, posB);
        }

        // draw nodes
        for (let node_ind = 0; node_ind < 9; node_ind++) {
            let pos = nodePos(node_ind);

            // draw lines
            let used = usedNodes();
            if (currentLine.includes(node_ind) && lines.length < lineColors.length) { // This statement prevents color changes after the three lines are placed
                p.fill(lineColors[lines.length]);      // if currently selected
            } else if (used[node_ind] !== undefined) {
                p.fill(lineColors[used[node_ind]]);    // if selected before
            } else if (node_ind === hoveredNode) {
                p.fill('#88733d'); // If hovered
            } else {
                p.fill('#deb887'); // If idle
            }

            p.noStroke();
            p.ellipse(pos.x, pos.y, 80, 80); // Draw the circle over the node with the correct color to denote its state
        }
    };

    p.mouseMoved = function() {
        if (lines.length >= 3) {
            hoveredNode = -1; //If lines are already selected, don't hover
        } else {
            hoveredNode = nearestNode(p.mouseX, p.mouseY); //Otherwise hover
        }
        p.redraw();
    };

    p.mousePressed = function() {
        if (lines.length >= 3){ // If three lines are selected, pressing is disabled
            return;
        }

        let n = nearestNode(p.mouseX, p.mouseY);

        if (n !== -1 && usedNodes()[n] === undefined) { //if near a node and it is unused
            dragging = true;
            currentLine = [n];
            p.redraw();
        }
    };

    p.mouseDragged = function() {
        if (lines.length >= 3) { // dragging is disabled if three lines are already selected
            return;
        }
        let n = nearestNode(p.mouseX, p.mouseY);

        if (n !== -1 && !currentLine.includes(n) && usedNodes()[n] === undefined) {//if near a node and it is not in the current line and it is unused
            dragging = true; // Needed so you don't have to click at a specific node to begin drawing
            currentLine.push(n);
        }

        p.redraw();
    };

    p.mouseReleased = function() {
        if (dragging && currentLine.length > 0) { //If you are currently dragging and have selected a node before letting go
            lines.push([...currentLine]); // save a copy of the current line, ... breaks the line down into its components so the list added is a list of lists 
        }
        dragging = false; 
        currentLine = []; // empty the line
        p.redraw();
    };

}, 'node-canvas'); // Location of injection
