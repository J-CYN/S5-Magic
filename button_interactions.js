const buttonGrid = document.getElementById("button-grid");

buttonGrid.addEventListener("click", function(event){
    if (event.target.tagName == "BUTTON"){
        button_pressed(event.target);
    }
});

function button_pressed(button){
    button.style.backgroundColor = "#5f4505";
}