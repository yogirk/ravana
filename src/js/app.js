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
    const icons = {
        sun: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41-1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
        moon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`,
        settings: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
        layoutSide: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`,
        layoutTop: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/></svg>`
    };

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

            if (service.id === 'gemini') {
                webview.setAttribute('allowpopups', 'true');
                webview.setAttribute('disableblinkfeatures', 'AutomationControlled');
            }

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
