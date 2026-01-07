document.querySelectorAll('.circular-button').forEach(btn => {
    btn.addEventListener('click', () => {
        btn.classList.toggle('selected');
    });
});

