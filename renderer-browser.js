
document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('submit').addEventListener('click', () => {
        const name = document.getElementById('cookie-name').value.trim();
        const cookieStr = document.getElementById('cookie').value.trim();

        if (name && cookieStr) {
            window.electronAPI.saveCookie(name, cookieStr);
            alert('添加成功');
        } else {
            alert('请输入 name and cookie.');
        }

    });


    window.electronAPI.on('cookie-saved', (cookieNames) => {
        const cookieTabs = document.getElementById('cookie-tabs');
        cookieTabs.innerHTML = '';

        cookieNames.forEach(name => {
            const tab = document.createElement('button');
            tab.textContent = name;
            tab.addEventListener('click', () => {
                window.electronAPI.loadUrlWithCookie(name);
            });
            cookieTabs.appendChild(tab);
        });
    });

    window.electronAPI.on('error', (errorMessage) => {
        alert(`Error: ${errorMessage}`);
    });


    document.getElementById("exit").addEventListener('click', () => {
        window.electronAPI.exit();

    })

});