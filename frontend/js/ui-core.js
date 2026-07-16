/**
 * UI Core - Gerenciamento de Animações, Toasts e Efeitos Premium
 */

document.addEventListener('DOMContentLoaded', () => {
    initRipples();
    initStaggerAnimations();
});

// ==========================================
// 1. Ripple Effect (Botões)
// ==========================================
function initRipples() {
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', function(e) {
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripple = document.createElement('span');
            ripple.style.position = 'absolute';
            ripple.style.background = 'rgba(255, 255, 255, 0.3)';
            ripple.style.borderRadius = '50%';
            ripple.style.transform = 'translate(-50%, -50%) scale(0)';
            ripple.style.animation = 'ripple-effect 0.6s linear';
            ripple.style.left = `${x}px`;
            ripple.style.top = `${y}px`;
            ripple.style.width = '100px';
            ripple.style.height = '100px';
            ripple.style.pointerEvents = 'none';
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
}

// Injetar @keyframes do ripple via JS (para não poluir o CSS principal)
const style = document.createElement('style');
style.innerHTML = `
@keyframes ripple-effect {
    to { transform: translate(-50%, -50%) scale(4); opacity: 0; }
}`;
document.head.appendChild(style);

// ==========================================
// 2. Stagger Animations (Cards de Listagem)
// ==========================================
function initStaggerAnimations() {
    // Pegar todos os itens de lista ou cards e adicionar classes stagger
    const cards = document.querySelectorAll('.card, .stat-card, .document-item');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeInUp 0.5s ease forwards ${index * 0.08}s`;
    });
}

// ==========================================
// 3. Sistema de Toasts Premium
// ==========================================
window.showToast = function(message, type = 'success', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Ícone baseado no tipo
    let icon = '✨';
    if(type === 'success') icon = '✅';
    if(type === 'error') icon = '❌';
    if(type === 'warning') icon = '⚠️';

    toast.innerHTML = `
        <span class="emoji">${icon}</span>
        <span>${message}</span>
        <div class="toast-progress"></div>
    `;

    container.appendChild(toast);

    // Animação da barra de progresso
    const progress = toast.querySelector('.toast-progress');
    progress.style.width = '100%';
    progress.style.transition = `width ${duration}ms linear`;
    
    // Iniciar a redução da barra
    setTimeout(() => {
        progress.style.width = '0%';
    }, 10);

    // Remover toast
    setTimeout(() => {
        toast.style.animation = 'toastEnter 0.4s ease reverse forwards';
        setTimeout(() => toast.remove(), 400);
    }, duration);
};

// Sobrescrever função antiga de notificação global, se existir no html/scripts
window.showNotification = window.showToast;
