document.addEventListener('DOMContentLoaded', () => {
    const serviceSelection = document.getElementById('service-selection');
    const finishOnboardingBtn = document.getElementById('finish-onboarding-btn');

    const services = [
        { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/', logo: '../../assets/logos/gemini.svg' },
        { id: 'chatgpt', name: 'ChatGPT', url: 'https://chat.openai.com/', logo: '../../assets/logos/openai.svg' },
        { id: 'claude', name: 'Claude', url: 'https://claude.ai/', logo: '../../assets/logos/claude.svg' },
        { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/', logo: '../../assets/logos/perplexity.svg' },
        { id: 'meta-ai', name: 'Meta AI', url: 'https://www.meta.ai/', logo: '../../assets/logos/meta-ai.svg' },
        { id: 'notebook-lm', name: 'NotebookLM', url: 'https://notebooklm.google.com/', logo: '../../assets/logos/notebook-lm.svg' }
    ];

    // Create a card for each service
    services.forEach(service => {
        const card = document.createElement('div');
        card.className = 'service-card';
        card.dataset.serviceId = service.id;
        card.innerHTML = `
            <img src="${service.logo}" alt="${service.name} Logo">
            <span>${service.name}</span>
            <div class="checkmark">✔</div>
        `;
        serviceSelection.appendChild(card);

        // Add click listener to toggle selection
        card.addEventListener('click', () => {
            card.classList.toggle('selected');
        });
    });

    // Handle the finish button click
    finishOnboardingBtn.addEventListener('click', () => {
        const selectedCards = document.querySelectorAll('.service-card.selected');
        const selectedServices = Array.from(selectedCards).map(card => {
            const serviceId = card.dataset.serviceId;
            return services.find(s => s.id === serviceId);
        });

        if (selectedServices.length > 0) {
            // Send selected services to the main process
            window.electronAPI.onboardingComplete(selectedServices);
        } else {
            // Maybe show a message to select at least one service
            alert('Please select at least one service to continue.');
        }
    });
});
