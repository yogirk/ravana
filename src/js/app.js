// src/js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app-container');
    const tabNav = document.getElementById('tab-nav');
    const webviewContainer = document.getElementById('webview-container');
    const settingsBtn = document.getElementById('settings-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const layoutSwitchBtn = document.getElementById('layout-switch-btn');
    const htmlElement = document.documentElement;

    const layoutIcons = {
        side: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM9 5V19H5V5H9ZM19 5H11V19H19V5Z"></path></svg>`,
        top: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M21 4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4ZM19 5V9H5V5H19ZM19 11V19H5V11H19Z"></path></svg>`
    };

    settingsBtn.innerHTML = `<svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 1L13.8485 3.32403L16.6533 3.52621L18.5284 5.89227L19.9999 8.33355L20.488 11.25H21V12.75H20.488L19.9999 15.6665L18.5284 18.1077L16.6533 20.4738L13.8485 20.676L12 23L10.1515 20.676L7.34673 20.4738L5.47162 18.1077L4.00006 15.6665L3.51198 12.75H3V11.25H3.51198L4.00006 8.33355L5.47162 5.89227L7.34673 3.52621L10.1515 3.32403L12 1ZM12 15.75C14.0711 15.75 15.75 14.0711 15.75 12C15.75 9.92893 14.0711 8.25 12 8.25C9.92893 8.25 8.25 9.92893 8.25 12C8.25 14.0711 9.92893 15.75 12 15.75Z"></path></svg><span>Settings</span>`;

    const { services, theme, layout } = await window.electronAPI.getInitialData();

    if (theme === 'dark') {
        htmlElement.classList.add('dark-mode');
        themeToggle.checked = true;
    }
    appContainer.classList.add(`layout-${layout}`);
    layoutSwitchBtn.innerHTML = layout === 'top' ? layoutIcons.side : layoutIcons.top;

    if (!services || services.length === 0) {
        webviewContainer.innerHTML = `<p class="center-message">No AI assistants configured. Go to Settings to select them.</p>`;
    } else {
        services.forEach((service, index) => {
            const tab = document.createElement('button');
            tab.className = 'tab-item';
            tab.dataset.serviceId = service.id;
            tab.draggable = true;
            tab.innerHTML = `<img src="${service.logo}" class="tab-logo" alt="${service.name} logo"><span>${service.name}</span>`;
            tabNav.appendChild(tab);

            const webview = document.createElement('webview');
            webview.className = 'service-webview';
            webview.id = `webview-${service.id}`;
            webview.src = service.url;
            webview.partition = `persist:${service.id}`;
            webviewContainer.appendChild(webview);

            webview.addEventListener('context-menu', (e) => {
                e.preventDefault();
                window.electronAPI.showWebviewContextMenu(webview.getWebContentsId());
            });

            if (index === 0) {
                tab.classList.add('active');
                webview.classList.add('active');
            }
        });
    }

    // --- Tab Click Handler ---
    tabNav.addEventListener('click', (e) => {
        const tab = e.target.closest('.tab-item');
        if (tab) {
            const serviceId = tab.dataset.serviceId;
            document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.service-webview').forEach(wv => {
                wv.classList.remove('active');
                if (wv.id === `webview-${serviceId}`) {
                    wv.classList.add('active');
                }
            });
        }
    });

    // --- Tab Drag and Drop Logic (Corrected) ---
    let draggedTab = null;

    tabNav.addEventListener('dragstart', (e) => {
        if (e.target.matches('.tab-item')) {
            draggedTab = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    tabNav.addEventListener('dragend', (e) => {
        if (draggedTab) {
            draggedTab.classList.remove('dragging');
            draggedTab = null;
        }
    });

    tabNav.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(tabNav, e.clientX, e.clientY);
        const currentDragged = document.querySelector('.dragging');
        if (currentDragged) {
            if (afterElement == null) {
                tabNav.appendChild(currentDragged);
            } else {
                tabNav.insertBefore(currentDragged, afterElement);
            }
        }
    });

    tabNav.addEventListener('drop', (e) => {
        e.preventDefault();
        const newServiceIdOrder = [...tabNav.querySelectorAll('.tab-item')].map(tab => tab.dataset.serviceId);
        const originalServices = services;
        const newServiceOrder = newServiceIdOrder.map(id => originalServices.find(s => s.id === id)).filter(Boolean);
        window.electronAPI.saveServiceOrder(newServiceOrder);
    });

    function getDragAfterElement(container, clientX, clientY) {
        const draggableElements = [...container.querySelectorAll('.tab-item:not(.dragging)')];
        const isSideLayout = appContainer.classList.contains('layout-side');

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = isSideLayout ? (clientY - box.top - box.height / 2) : (clientX - box.left - box.width / 2);
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    // --- Control Button Event Listeners (Restored) ---
    layoutSwitchBtn.addEventListener('click', () => {
        const isSideLayout = appContainer.classList.contains('layout-side');
        const newLayout = isSideLayout ? 'top' : 'side';
        appContainer.classList.remove('layout-top', 'layout-side');
        appContainer.classList.add(`layout-${newLayout}`);
        layoutSwitchBtn.innerHTML = newLayout === 'top' ? layoutIcons.side : layoutIcons.top;
        window.electronAPI.setLayout(newLayout);
    });

    settingsBtn.addEventListener('click', () => {
        window.electronAPI.openSettings();
    });

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            htmlElement.classList.add('dark-mode');
            window.electronAPI.setTheme('dark');
        } else {
            htmlElement.classList.remove('dark-mode');
            window.electronAPI.setTheme('light');
        }
    });

    // --- Sidebar Resize Logic ---
    const resizeHandle = document.getElementById('resize-handle');
    const sidebar = document.querySelector('.app-header');
    let isResizing = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.classList.add('is-resizing');
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        if (appContainer.classList.contains('layout-side')) {
            const newWidth = Math.max(72, Math.min(e.clientX, 500));
            sidebar.style.width = `${newWidth}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.classList.remove('is-resizing');
    });
});
