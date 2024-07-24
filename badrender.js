
window.addEventListener('DOMContentLoaded', () => {
    window.electronAPI.on("load", (data) => {
        console.log(data);
        console.log('sdf');
    })

});