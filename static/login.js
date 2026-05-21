function login(){
    user = document.getElementById('username-input').value
    pass = document.getElementById('password-input').value

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({user, pass})
    })
    .then(res => res.json())
    .then(data => {
        if (data.status !== "not found"){
            window.location.href = "/table";
        }
    })
}

function register(){
    user = document.getElementById('username-input').value
    pass = document.getElementById('password-input').value

    fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === "created"){
            document.getElementById('username-input').value = ""
            document.getElementById('password-input').value = ""
            window.location.href = "/table";
        } else {
            // print or show error message later
        }
    })
}

function guestLogIn(){
    window.location.href = "/table";
}