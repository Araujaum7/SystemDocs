/**
 * Componentes globais de interface. Mantem as APIs publicas usadas pelas telas.
 */

const TOAST_ICONS = {
    success: 'ph-check-circle',
    error: 'ph-warning-circle',
    warning: 'ph-warning',
    info: 'ph-info',
};

window.showToast = function(message, type = 'success', duration = 3000) {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        container.setAttribute('aria-label', 'Notificacoes');
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const isAlert = type === 'error';
    toast.className = `toast ${type}`;
    toast.setAttribute('role', isAlert ? 'alert' : 'status');
    toast.setAttribute('aria-live', isAlert ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');

    const icon = document.createElement('span');
    icon.className = 'toast__icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = `<i class="ph ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i>`;

    const copy = document.createElement('span');
    copy.className = 'toast__message';
    copy.textContent = String(message);

    const progress = document.createElement('div');
    progress.className = 'toast-progress';
    progress.setAttribute('aria-hidden', 'true');

    toast.append(icon, copy, progress);
    container.appendChild(toast);

    progress.style.width = '100%';
    progress.style.transition = `width ${duration}ms linear`;
    requestAnimationFrame(() => {
        requestAnimationFrame(() => { progress.style.width = '0%'; });
    });

    setTimeout(() => {
        toast.classList.add('toast--leaving');
        setTimeout(() => {
            toast.remove();
            if (!container.children.length) container.remove();
        }, 180);
    }, duration);

    return toast;
};

window.showNotification = window.showToast;
