

document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();
    const error = document.getElementById('error')
    error.textContent = '';
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    window.electronAPI.login(username, password);
});

window.electronAPI.on('login_failed', (errorMessage) => {
    const error = document.getElementById('error')
    error.textContent = errorMessage;
    console.log(errorMessage);

});
