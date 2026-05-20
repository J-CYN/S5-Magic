// Function meant to record new spells and modifiers
function submitSpell(){
    if(lines.length >= 2){
        let payload = {
            // grab values from text boxes and lines variable
            element_lines: lines[0],
            element_name: document.getElementById('element-input').value,
            spell_lines: lines[1],
            spell_name: document.getElementById('spell-name-input').value,
            spell_mana_cost: document.getElementById('mana-spell-input').value,
            modifier_lines: lines.length >= 3 ? lines[2] : null, // lines[2] if length is greater than 3
            modifier_name: document.getElementById('modifier-name-input').value,
            modifier_mana_cost: document.getElementById('mana-modifier-input').value
        };
        fetch('/api/insert', { //connects to flask api
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, //json formatting
            body: JSON.stringify(payload)
        })
        .then(res => res.json()) // output sent back, converts to js object from original json 
        .then(data => console.log(data)); // This is how the javascript reacts to the output returned
        clearPartial() // Clear the input columns just to keep it clear and not force the user to clear every time manually
    }
}

// Retrieves the spell and updates the surrounding texts
function retrieveSpell(){
    if(lines.length >= 3){
        fetch(`/api/retrieve?lines=${JSON.stringify(lines)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "not found" || data.status === "modifier not found") { //Invalid input handling
                console.log(data)
                document.getElementById('fullSpellName').textContent = "Invalid Spell";
                document.getElementById('manaCostTotal').textContent = "Invalid Spell Mana Cost";
                document.getElementById('nexusCostTotal').textContent = "Invalid Nexus Cost";
            }else{
                document.getElementById('element-input').value = data.element_name;
                document.getElementById('spell-name-input').value = data.spell_name;
                document.getElementById('modifier-name-input').value = data.modifier_name;

                if (data.mana_cost >= 50){ // Mana cost can't be below 50
                    document.getElementById('manaCostTotal').textContent = data.mana_cost;
                }else {
                    document.getElementById('manaCostTotal').textContent = 50; 
                }
                document.getElementById('mana-spell-input').value = data.spell_mana_cost;
                document.getElementById('mana-modifier-input').value = data.modifier_mana_cost;

                document.getElementById('fullSpellName').textContent = data.full_spell_name;
                document.getElementById('nexusCostTotal').textContent = nexusCost();
            }
        });
    }else if(lines.length >= 2){
        fetch(`/api/retrieve?lines=${JSON.stringify(lines)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "not found") { //Invalid input handling but for no modifier
                document.getElementById('fullSpellName').textContent = "Invalid Spell";
                document.getElementById('manaCostTotal').textContent = "Invalid Spell Mana Cost";
                document.getElementById('nexusCostTotal').textContent = "Invalid Nexus Cost";
            }else{
                document.getElementById('element-input').value = data.element_name;
                document.getElementById('spell-name-input').value = data.spell_name;

                document.getElementById('mana-spell-input').value = data.spell_mana_cost;

                document.getElementById('manaCostTotal').textContent = data.mana_cost; 
                document.getElementById('fullSpellName').textContent = data.full_spell_name;
                document.getElementById('nexusCostTotal').textContent = nexusCost();
            }
        });
    }
}

//Finds total amount of nodes selected
function nexusCost(){
    return Object.keys(usedNodes()).length // Total amount of nodes selected
}

//Finds the node which is closest to mouse click when on the canvas
function nearestNode(sel_x, sel_y) { 
    for (let node_ind = 0; node_ind < (table_width ** 2); node_ind++) { //runs for each node index 
        let pos = nodePos(node_ind); // pos is equal to the node position gotten from the nodePos function
        let dist = Math.sqrt((sel_x - pos.x) ** 2 + (sel_y - pos.y) ** 2); //Calculates euclidean distance
        let threshold = (nodeSize / 2);
        if (dist < threshold)  // half of an 80px node to node distance
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
    let canvasSize = Math.min(130 * table_width, 520);
    let spacing = canvasSize / table_width;
    let col = node_ind % table_width; // Sets column
    let row = Math.floor(node_ind / table_width); // Sets row
    return {
        x: spacing / 2 + col * spacing, // Padding and spacing
        y: spacing / 2 + row * spacing
    };
}

//Clears after submitting the text boxes after submitting spell
function clearPartial(){
    document.getElementById('element-input').value = "";
    document.getElementById('spell-name-input').value = "";
    document.getElementById('mana-spell-input').value = "";
    document.getElementById('modifier-name-input').value = "";
    document.getElementById('mana-modifier-input').value = "";
  
    dragging = false;
    hoveredNode = -1;
    table.redraw();
}

//Clears the current selection
function clearAll() {
    // Clear text
    document.getElementById('spell-name-input').value = "";
    document.getElementById('mana-spell-input').value = "";
    document.getElementById('mana-modifier-input').value = "";
    document.getElementById('manaCostTotal').textContent = "Mana Cost";
    document.getElementById('element-input').value = "";
    document.getElementById('modifier-name-input').value = "";
    document.getElementById('fullSpellName').textContent = "???";
    document.getElementById('nexusCostTotal').textContent = "Nexus Cost";
    lines = []; // empties lines
    currentLine = []; // empties current lines
    dragging = false; //ends dragging
    hoveredNode = -1; // stops hovering
    table.redraw(); // resets the drawing as well
}

//Draw the lines with arrows to denote direction
function drawArrow(p, posA, posB, color) {
    let angle = Math.atan2(posB.y - posA.y, posB.x - posA.x); // calculates angle between x-axis and the x and y displacement between the two points selected.
    let midX = (posA.x + posB.x) / 2;
    let midY = (posA.y + posB.y) / 2;
    let size = 8; // determines size of the arrow and triangle/arrow

    p.push(); // Saves the state and rotation of the arrow

    p.translate(midX, midY); // Move to the middle point
    p.rotate(angle); // Rotates based on earlier calculated angle to position arrow
    p.fill(color); 
    p.noStroke();
    p.triangle(size, 0, -size, -size * 0.6, -size, size * 0.6); // Create the arrow triangle

    p.pop(); // Restores to previous version
}

//Update width functions
function largerTable(){
    table_width = table_width + 2
    //make left button visible
    document.getElementById("smallerTableButton").style.visibility = "visible";
    clearAll()
    table.resizeTable();
    if (table_width == 9){
        //Make right button invisible
        document.getElementById("largerTableButton").style.visibility = "hidden";
    }
}
function smallerTable(){
    table_width = table_width - 2
    //make right button visible
    document.getElementById("largerTableButton").style.visibility = "visible";
    clearAll()
    table.resizeTable();
    if (table_width == 3){
        //Make left button invisible
        document.getElementById("smallerTableButton").style.visibility = "hidden";
    }
}

//Init variables
let lines = [];
let currentLine = [];
let dragging = false;
let hoveredNode = -1;
let table_width = 3
let nodeSize = 80 * (3 / table_width);

//Smaller table option should stay hidden at first
document.getElementById("smallerTableButton").style.visibility = "hidden";

//Color list
const nodeColors = ['rgb(2, 194, 140)', '#c084fc', '#f97316'];
const lineColors = ['rgb(2, 123, 89)', '#7e40bc', 'rgb(164, 73, 8)'];

let table = new p5(function(p) { // Use p to access p5 functions directly
    // A setup function that runs ones
    p.setup = function() {
        let canvasSize = Math.min(130 * table_width, 520);
        p.createCanvas(canvasSize, canvasSize); // Defines size 
        p.noLoop(); // Doesn't redraw
    };

    p.resizeTable = function() { 
        let canvasSize = Math.min(130 * table_width, 520);
        p.resizeCanvas(canvasSize, canvasSize);
        nodeSize = 80 * (3 / table_width);
        p.redraw(); // Does redraw
    };

    //Redefine drawing
    p.draw = function() {
        // draw background
        p.background('#efdcc1'); // Color of the background of the board
    
        // Previous line drawing
        for (let l = 0; l < lines.length; l++) { // Draws each line(in lines so the past ones, not the current)
            for (let i = 0; i < lines[l].length - 1; i++) { // and the connection between each node in these lines
                let posA = nodePos(lines[l][i]); // Grabs positions
                let posB = nodePos(lines[l][i + 1]);
                p.stroke(lineColors[l]); //line color
                p.strokeWeight(3); //line width
                p.line(posA.x, posA.y, posB.x, posB.y); //start and end point of the line drawing
                drawArrow(p, posA, posB, lineColors[l]); //draws the arrow.
            }
        }

        // Current line drawing
        for (let i = 0; i < currentLine.length - 1; i++) { //Stops 1 early
            let posA = nodePos(currentLine[i]); //Grabs position
            let posB = nodePos(currentLine[i + 1]);

            p.stroke(lineColors[lines.length]); //sets lineColors depending on which line it is drawing
            p.strokeWeight(3);
            p.line(posA.x, posA.y, posB.x, posB.y); // Draws the line from one node to the next

            drawArrow(p, posA, posB, lineColors[lines.length]);
        }

        // draw nodes
        for (let node_ind = 0; node_ind < (table_width ** 2); node_ind++) {
            let pos = nodePos(node_ind);

            // draw lines
            let used = usedNodes();
            
            //p.drawingContext.shadowBlur = 40; These lines represent a possible future shading attempt to add a little glow to each button
            //p.drawingContext.shadowColor = "rgba(30, 205, 173, 0.8)";

            if (currentLine.includes(node_ind) && lines.length < nodeColors.length) { // This statement prevents color changes after the three lines are placed
                p.fill(nodeColors[lines.length]);      // if currently selected
            } else if (used[node_ind] !== undefined) {
                p.fill(nodeColors[used[node_ind]]);    // if selected before
            } else if (node_ind === hoveredNode) {
                p.fill('#88733d'); // If hovered
            } else {
                p.fill('#deb887'); // If idle
            }

            p.noStroke();
            let nodeSize = 80 * (3 / table_width);
            p.ellipse(pos.x, pos.y, nodeSize, nodeSize); // Draw the circle over the node with the correct color to denote its state
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
