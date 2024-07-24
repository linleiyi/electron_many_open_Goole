window.addEventListener('DOMContentLoaded', () => {
    // document.body.style.display = 'none';
    document.getElementById('addCookieForm').addEventListener('submit', (event) => {
        event.preventDefault();
        const cookieName = document.getElementById('cookieName')
        const cookieValue = document.getElementById('cookieValue')
        console.log(cookieName);
        window.electronAPI.navigate_to(cookieName.value, cookieValue.value);
        cookieName.value = '';
        cookieValue.value = '';

    });

    document.getElementById('cookieList').addEventListener('click', (event) => {
        if (event.target.tagName === 'LI' || event.target.tagName === "SPAN") {
            const cookieName = event.target.cname;
            window.electronAPI.navigate_to(cookieName);
            // 获取元素
            const elements = document.getElementById('cookieList').getElementsByTagName('li');;
            // console.log(elements);
            // 清空所有现有的class names
            for (let i = 0; i < elements.length; i++) {
                elements[i].classList.remove('checked');
            }

            if (event.target.tagName === 'SPAN') {
                const parentElement = event.target.parentElement;
                parentElement.classList.add('checked');
            } else {
                event.target.classList.add('checked');
            }

        }
    });
});



window.electronAPI.on("view-added", (cookieName) => {
    const li = document.createElement('li');
    // li.textContent = cookieName;
    li.id = cookieName
    li.cname = cookieName;
    // li.attributes.cname = cookieName;

    const Contenttext = document.createElement('span');
    Contenttext.textContent = cookieName;
    Contenttext.cname = cookieName;
    // Contenttext.id = cookieName
    li.appendChild(Contenttext);

    // 创建修改图标
    const div = document.createElement('div');
    li.appendChild(div);

    const editIcon = document.createElement('i');
    editIcon.className = 'fas fa-edit';
    editIcon.textContent = '编辑'; // 可选，添加工具提示
    editIcon.cname = cookieName;
    // editIcon.title = 'Edit'; // 可选，添加工具提示
    editIcon.addEventListener('click', () => {
        console.log('edit icon clicked');
        console.log(li.cname);
        // 在此处添加处理编辑操作的代码
        // 显示自定义对话框
        const modal = document.getElementById('myModal');
        modal.style.display = "block";

        // 预填充输入框
        const inputField = document.getElementById('inputField');
        inputField.value = li.cname;

        const cookieField = document.getElementById('cookieField');
        // 添加事件监听器以处理保存按钮点击事件
        const saveButton = document.getElementById('saveButton');
        // 定义事件处理器
        saveButtonHandler = () => {
            const newName = inputField.value;
            const newcookie = cookieField.value;
            window.electronAPI.edit_cookie(li.cname, newName, newcookie);
            // 在处理器执行完毕后，删除事件监听器
            saveButton.removeEventListener('click', saveButtonHandler);
            inputField.value = "";
            cookieField.value = "";
            saveButtonHandler = null; // 清除引用，避免内存泄漏
            modal.style.display = "none";
        };
        saveButton.addEventListener('click', saveButtonHandler);
        // 添加事件监听器以处理关闭按钮点击事件
        const closeButton = document.getElementsByClassName("close")[0];
        closeButtonHandler = () => {
            modal.style.display = "none";
            inputField.value = "";
            cookieField.value = "";
            closeButton.removeEventListener('click', closeButtonHandler);
            closeButtonHandler = null;
        }
        closeButton.addEventListener('click', closeButtonHandler);

        // window.electronAPI.edit_cookie(deleteIcon.cname);
    });

    div.appendChild(editIcon);

    // 创建删除图标
    const deleteIcon = document.createElement('i');
    deleteIcon.className = 'fas fa-trash-alt';
    deleteIcon.textContent = '删除'; // 可选，添加工具提示
    // deleteIcon.title = 'Delete'; // 可选，添加工具提示
    deleteIcon.cname = cookieName;

    deleteIcon.addEventListener('click', () => {
        console.log('delete icon clicked');
        console.log(li.cname);

        // 在此处添加处理删除操作的代码
        window.electronAPI.delete_cookie(li.cname);
    })

    div.appendChild(deleteIcon);

    // 添加一些空格使图标与文本之间有间隔
    // li.appendChild(document.createTextNode(' '));

    // document.getElementById('cookieList').appendChild(li);
    document.getElementById('cookieList').prepend(li);
});


document.getElementById('coopy_cookie').addEventListener('click', () => {
    window.electronAPI.copy_cookie();
})

window.electronAPI.on("view-updata", (old_name, newName) => {
    const li = document.getElementById(old_name);
    console.log(old_name);
    li.firstChild.textContent = newName;
    li.id = newName;
    li.cname = newName;
})


window.electronAPI.on("view-delete", (cookieName) => {
    const li = document.getElementById(cookieName);
    li.remove();
})

window.electronAPI.on("error", (data) => {
    const err = document.getElementById("error");
    err.textContent = data;
})


// renderer
window.addEventListener('contextmenu', (e) => {
    e.preventDefault()
    ipcRenderer.send('show-context-menu')
})

ipcRenderer.on('context-menu-command', (e, command) => {
    // ...
})



