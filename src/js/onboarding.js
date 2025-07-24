// src/js/onboarding.js

document.addEventListener('DOMContentLoaded', async () => {
    const serviceGrid = document.getElementById('service-grid');
    const continueBtn = document.getElementById('continue-btn');
    const closeBtn = document.getElementById('close-btn');
    const header = document.querySelector('.onboarding-header h1');
    const subheader = document.querySelector('.onboarding-header p');

    const availableServices = [
        { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', logo: 'asset://logos/gemini.svg' },
        { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', logo: 'asset://logos/openai.svg' },
        { id: 'claude', name: 'Claude', url: 'https://claude.ai/', logo: 'asset://logos/claude.svg' },
        { id: 'notebooklm', name: 'NotebookLM', url: 'https://notebooklm.google.com/', logo: 'asset://logos/notebook-lm.svg' },
        { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', logo: 'asset://logos/perplexity.svg' },
        { id: 'metaai', name: 'Meta AI', url: 'https://www.meta.ai/', logo: 'asset://logos/meta-ai.svg' }
    ];

    const initialData = await window.electronAPI.getInitialData();
    const previouslySelectedServices = initialData.services || [];
    const previouslySelectedIds = new Set(previouslySelectedServices.map(s => s.id));

    if (previouslySelectedIds.size > 0) {
        header.textContent = 'Manage Assistants';
        subheader.textContent = 'Add or remove your AI assistants.';
        continueBtn.textContent = 'Save Changes';
    }

    availableServices.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.serviceId = service.id;

        card.innerHTML = `
            <img src="${service.logo}" alt="${service.name} Logo" class="service-logo">
            <span class="service-name">${service.name}</span>
            <div class="checkmark">✓</div>
        `;
        
        if (previouslySelectedIds.has(service.id)) {
            card.classList.add('selected');
        }

        card.addEventListener('click', () => {
            card.classList.toggle('selected');
        });

        serviceGrid.appendChild(card);
    });

    // Handle the "Save" or "Continue" button click
    continueBtn.addEventListener('click', () => {
        const selectedCards = document.querySelectorAll('.service-card.selected');
        
        const selectedServices = Array.from(selectedCards).map(card => {
            const serviceId = card.dataset.serviceId;
            return availableServices.find(s => s.id === serviceId);
        });

        // This single channel handles both initial setup and settings updates
        window.electronAPI.onboardingComplete(selectedServices);
    });

    // Handle the new "Close" button click
    closeBtn.addEventListener('click', () => {
        window.electronAPI.closeSettingsWindow();
    });
});
