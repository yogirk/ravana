document.addEventListener('DOMContentLoaded', async () => {
    const serviceListContainer = document.getElementById('settings-service-list');
    const saveButton = document.getElementById('save-settings-btn');

    async function applyInitialTheme() {
        const savedTheme = await window.electronAPI.getStoreData('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    applyInitialTheme();

    const allServices = {
        gemini: { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', logo: '../../assets/logos/gemini.svg' },
        chatgpt: { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', logo: '../../assets/logos/openai.svg' },
        claude: { id: 'claude', name: 'Claude', url: 'https://claude.ai/', logo: '../../assets/logos/claude.svg' },
        perplexity: { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', logo: '../../assets/logos/perplexity.svg' },
        'meta-ai': { id: 'meta-ai', name: 'Meta AI', url: 'https://www.meta.ai/', logo: '../../assets/logos/meta-ai.svg' },
        'notebook-lm': { id: 'notebook-lm', name: 'NotebookLM', url: 'https://notebooklm.google.com/', logo: '../../assets/logos/notebook-lm.svg' }
    };

    const selectedServices = await window.electronAPI.getStoreData('selectedServices') || [];
    const selectedIds = new Set(selectedServices.map(s => s.id));

    Object.values(allServices).forEach(service => {
        const isChecked = selectedIds.has(service.id);
        const serviceItem = document.createElement('div');
        serviceItem.className = 'settings-service-item';
        serviceItem.innerHTML = `
            <input type="checkbox" id="${service.id}" name="${service.id}" ${isChecked ? 'checked' : ''}>
            <label for="${service.id}">
                <img src="${service.logo}" alt="${service.name} logo">
                <span>${service.name}</span>
            </label>
        `;
        serviceListContainer.appendChild(serviceItem);
    });

    saveButton.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#settings-service-list input[type="checkbox"]');
        const newSelectedServices = [];
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) newSelectedServices.push(allServices[checkbox.id]);
        });
        
        window.electronAPI.settingsUpdated(newSelectedServices);
        window.electronAPI.closeSettingsWindow();
    });
});
