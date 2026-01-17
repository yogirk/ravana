// src/js/app.js

document.addEventListener('DOMContentLoaded', async () => {
    const appContainer = document.getElementById('app-container');
    const tabNav = document.getElementById('tab-nav');
    const webviewContainer = document.getElementById('webview-container');
    const settingsBtn = document.getElementById('settings-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const layoutSwitchBtn = document.getElementById('layout-switch-btn');
    const htmlElement = document.documentElement;

    // Lucide Icons (SVG strings)
    const icons = window.ravanaIcons;

    settingsBtn.innerHTML = icons.settings;

    const { services, theme, layout, sidebarWidth, lastActiveServiceId } = await window.electronAPI.getInitialData();

    if (theme === 'dark') {
        htmlElement.classList.add('dark-mode');
        themeToggleBtn.innerHTML = icons.moon;
    } else {
        themeToggleBtn.innerHTML = icons.sun;
    }

    appContainer.classList.add(`layout-${layout}`);
    // Fix: Use the new icons object for layout switch initial state
    layoutSwitchBtn.innerHTML = layout === 'top' ? icons.layoutSide : icons.layoutTop;


    const sidebar = document.querySelector('.app-header');
    let currentSidebarWidth = Math.max(72, Math.min(Number(sidebarWidth) || 0, 500)) || 96;
    if (layout === 'side') {
        sidebar.style.width = `${currentSidebarWidth}px`;
    }

    if (!services || services.length === 0) {
        webviewContainer.innerHTML = `<p class="center-message">No AI assistants configured. Go to Settings to select them.</p>`;
    } else {
        const allowedActiveServiceId = services.find((service) => service.id === lastActiveServiceId)?.id || services[0].id;

        services.forEach((service) => {
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

            webview.setAttribute('allowpopups', 'true');
            webview.setAttribute('disableblinkfeatures', 'AutomationControlled');

            webviewContainer.appendChild(webview);

            webview.addEventListener('context-menu', (e) => {
                e.preventDefault();
                window.electronAPI.showWebviewContextMenu(webview.getWebContentsId());
            });

            if (service.id === allowedActiveServiceId) {
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
            window.electronAPI.setActiveService(serviceId);
        }
    });

    // --- SortableJS Initialization ---
    Sortable.create(tabNav, {
        animation: 150,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        onEnd: (evt) => {
            const newServiceIdOrder = [...tabNav.querySelectorAll('.tab-item')].map(tab => tab.dataset.serviceId);
            const originalServices = services;
            const newServiceOrder = newServiceIdOrder.map(id => originalServices.find(s => s.id === id)).filter(Boolean);
            window.electronAPI.saveServiceOrder(newServiceOrder);
        }
    });

    // --- Control Button Event Listeners (Restored) ---
    layoutSwitchBtn.addEventListener('click', () => {
        const isSideLayout = appContainer.classList.contains('layout-side');
        const newLayout = isSideLayout ? 'top' : 'side';
        appContainer.classList.remove('layout-top', 'layout-side');
        appContainer.classList.add(`layout-${newLayout}`);
        layoutSwitchBtn.innerHTML = newLayout === 'top' ? icons.layoutSide : icons.layoutTop;
        if (newLayout === 'side') {
            sidebar.style.width = `${currentSidebarWidth}px`;
        } else {
            sidebar.style.width = '';
        }
        window.electronAPI.setLayout(newLayout);
    });

    settingsBtn.addEventListener('click', () => {
        window.electronAPI.openSettings();
    });

    themeToggleBtn.addEventListener('click', () => {
        const isDark = htmlElement.classList.contains('dark-mode');
        if (isDark) {
            htmlElement.classList.remove('dark-mode');
            themeToggleBtn.innerHTML = icons.sun;
            window.electronAPI.setTheme('light');
        } else {
            htmlElement.classList.add('dark-mode');
            themeToggleBtn.innerHTML = icons.moon;
            window.electronAPI.setTheme('dark');
        }
    });

    // --- Sidebar Resize Logic ---
    const resizeHandle = document.getElementById('resize-handle');
    let isResizing = false;

    resizeHandle.addEventListener('mousedown', (e) => {
        isResizing = true;
        document.body.classList.add('is-resizing');
    });

    window.addEventListener('mousemove', (e) => {
        if (!isResizing) return;
        if (appContainer.classList.contains('layout-side')) {
            const newWidth = Math.max(72, Math.min(e.clientX, 500));
            currentSidebarWidth = newWidth;
            sidebar.style.width = `${newWidth}px`;
        }
    });

    window.addEventListener('mouseup', () => {
        isResizing = false;
        document.body.classList.remove('is-resizing');
        if (appContainer.classList.contains('layout-side')) {
            window.electronAPI.setSidebarWidth(currentSidebarWidth);
        }
    });
});
