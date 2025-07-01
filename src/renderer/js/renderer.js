document.addEventListener('DOMContentLoaded', () => {
    const tabContainer = document.getElementById('tab-container');
    const webviewContainer = document.getElementById('webview-container');
    const themeSwitch = document.getElementById('theme-checkbox');
    const addTabBtn = document.getElementById('add-tab-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const addTabModal = document.getElementById('add-tab-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const modalServiceList = document.getElementById('modal-service-list');

    const allServices = {
        gemini: { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', logo: '../../assets/logos/gemini.svg' },
        chatgpt: { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', logo: '../../assets/logos/openai.svg' },
        claude: { id: 'claude', name: 'Claude', url: 'https://claude.ai/', logo: '../../assets/logos/claude.svg' },
        perplexity: { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', logo: '../../assets/logos/perplexity.svg' },
        'meta-ai': { id: 'meta-ai', name: 'Meta AI', url: 'https://www.meta.ai/', logo: '../../assets/logos/meta-ai.svg' },
        'notebook-lm': { id: 'notebook-lm', name: 'NotebookLM', url: 'https://notebooklm.google.com/', logo: '../../assets/logos/notebook-lm.svg' }
    };

    let activeTabId = null;
    let currentlyDragging = null;

    function createTab(service) {
        if (document.querySelector(`.tab[data-service-id="${service.id}"]`)) return;

        const tab = document.createElement('div');
        tab.className = 'tab';
        tab.dataset.serviceId = service.id;
        tab.draggable = true;
        tab.innerHTML = `
          <div class="tab-inner-content">
            <img src="${service.logo}" class="tab-logo" alt="${service.name} Logo">
            <span class="tab-title">${service.name}</span>
            <div class="tab-close-btn">×</div>
          </div>
        `;
        
        tabContainer.appendChild(tab);
        addDragAndDrop(tab);

        const webview = document.createElement('webview');
        webview.id = `webview-${service.id}`;
        webview.className = 'webview';
        webview.partition = `persist:${service.id}`;
        webview.src = service.url;
        webviewContainer.appendChild(webview);

        tab.addEventListener('click', () => switchTab(service.id));
        tab.querySelector('.tab-close-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            closeTab(service.id);
        });
        
        // UPDATED: Pass params to the context menu handler
        webview.addEventListener('context-menu', (e) => {
            e.preventDefault();
            window.electronAPI.showContextMenu(webview.getWebContentsId(), e.params);
        });

        return { tab, webview };
    }

    function switchTab(serviceId) {
        if (activeTabId === serviceId) return;

        const currentActiveTab = document.querySelector('.tab.active');
        if (currentActiveTab) currentActiveTab.classList.remove('active');
        const currentActiveWebview = document.getElementById(`webview-${activeTabId}`);
        if(currentActiveWebview) currentActiveWebview.classList.remove('active');

        const newActiveTab = document.querySelector(`.tab[data-service-id="${serviceId}"]`);
        const newActiveWebview = document.getElementById(`webview-${serviceId}`);
        if (newActiveTab) newActiveTab.classList.add('active');
        if (newActiveWebview) newActiveWebview.classList.add('active');

        activeTabId = serviceId;
    }

    function closeTab(serviceId) {
        const tabToClose = document.querySelector(`.tab[data-service-id="${serviceId}"]`);
        const webviewToClose = document.getElementById(`webview-${serviceId}`);
        
        if (tabToClose) tabToClose.remove();
        if (webviewToClose) webviewToClose.remove();

        if (activeTabId === serviceId) {
            const remainingTabs = document.querySelectorAll('.tab');
            if (remainingTabs.length > 0) {
                switchTab(remainingTabs[0].dataset.serviceId);
            } else {
                activeTabId = null;
                showPlaceholder();
            }
        }
        
        saveCurrentTabOrder();
    }
    
    function addDragAndDrop(tab) {
        tab.addEventListener('dragstart', (e) => {
            currentlyDragging = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        });

        tab.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
            currentlyDragging = null;
            saveCurrentTabOrder();
        });

        tabContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(tabContainer, e.clientX);
            if (currentlyDragging) {
              if (afterElement == null) {
                  tabContainer.appendChild(currentlyDragging);
              } else {
                  tabContainer.insertBefore(currentlyDragging, afterElement);
              }
            }
        });
    }

    function getDragAfterElement(container, x) {
        const draggableElements = [...container.querySelectorAll('.tab:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    addTabBtn.addEventListener('click', async () => {
        const currentServices = getServicesFromTabs();
        const currentServiceIds = new Set(currentServices.map(s => s.id));
        
        modalServiceList.innerHTML = '';
        
        let availableServices = 0;
        Object.values(allServices).forEach(service => {
            if (!currentServiceIds.has(service.id)) {
                availableServices++;
                const serviceItem = document.createElement('div');
                serviceItem.className = 'modal-service-item';
                serviceItem.innerHTML = `<img src="${service.logo}" alt="${service.name}"><span>${service.name}</span>`;
                serviceItem.addEventListener('click', () => {
                    addNewTab(service);
                    addTabModal.classList.add('hidden');
                });
                modalServiceList.appendChild(serviceItem);
            }
        });

        if (availableServices === 0) {
            modalServiceList.innerHTML = `<p>All available services are already open.</p>`;
        }
        
        addTabModal.classList.remove('hidden');
    });

    closeModalBtn.addEventListener('click', () => addTabModal.classList.add('hidden'));
    addTabModal.addEventListener('click', (e) => {
        if (e.target === addTabModal) addTabModal.classList.add('hidden');
    });
    settingsBtn.addEventListener('click', () => window.electronAPI.openSettingsWindow());

    function addNewTab(service) {
        createTab(service);
        switchTab(service.id);
        saveCurrentTabOrder();
    }

    function getServicesFromTabs() {
        const tabs = document.querySelectorAll('.tab');
        return Array.from(tabs).map(tab => allServices[tab.dataset.serviceId]);
    }

    function saveCurrentTabOrder() {
        const updatedServices = getServicesFromTabs();
        window.electronAPI.updateStoreData({ key: 'selectedServices', value: updatedServices });
    }
    
    function showPlaceholder() {
        webviewContainer.innerHTML = `<div class="placeholder"><h2>No tabs open</h2><p>Click the '+' button to add a new service.</p></div>`;
    }

    async function initializeUI() {
        tabContainer.innerHTML = '';
        webviewContainer.innerHTML = '';
        
        const selectedServices = await window.electronAPI.getStoreData('selectedServices');
        if (selectedServices && selectedServices.length > 0) {
            selectedServices.forEach(service => createTab(service));
            if (selectedServices[0]) switchTab(selectedServices[0].id);
        } else {
            showPlaceholder();
        }
    }

    async function applyInitialTheme() {
        const savedTheme = await window.electronAPI.getStoreData('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSwitch.checked = savedTheme === 'dark';
    }

    themeSwitch.addEventListener('change', () => {
        const theme = themeSwitch.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        window.electronAPI.setTheme(theme);
    });

    applyInitialTheme();
    initializeUI();

    window.electronAPI.onReloadServices(() => initializeUI());
});
