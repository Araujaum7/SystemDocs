function setThemeToggleState(button, isDark) {
    button.setAttribute('aria-label', isDark ? 'Ativar tema claro' : 'Ativar tema escuro');
    button.title = isDark ? 'Ativar tema claro' : 'Ativar tema escuro';
    button.innerHTML = isDark
        ? '<i class="ph ph-sun" aria-hidden="true"></i>'
        : '<i class="ph ph-moon" aria-hidden="true"></i>';
}

function createThemeToggle(isDark) {
    const themeButton = document.createElement('button');
    themeButton.type = 'button';
    themeButton.className = 'theme-toggle';
    setThemeToggleState(themeButton, isDark);

    themeButton.addEventListener('click', () => {
        const nextDark = !document.body.classList.contains('dark-theme');
        document.body.classList.toggle('dark-theme', nextDark);
        localStorage.setItem('darkTheme', String(nextDark));
        setThemeToggleState(themeButton, nextDark);

        if (window.auth && typeof window.auth.applyThemeColor === 'function') {
            window.auth.applyThemeColor();
        }
    });

    return themeButton;
}

function createCompanyContext() {
    const companyName = localStorage.getItem('empresaContextoNome');
    if (!companyName) return null;

    const context = document.createElement('div');
    context.className = 'company-context topbar-company-context';
    context.setAttribute('aria-label', `Empresa ativa: ${companyName}`);
    context.innerHTML = `
        <span class="company-context__icon" aria-hidden="true"><i class="ph ph-buildings"></i></span>
        <span class="company-context__copy">
            <span class="company-context__eyebrow">Empresa ativa</span>
            <strong class="company-context__name"></strong>
        </span>`;
    context.querySelector('.company-context__name').textContent = companyName;
    return context;
}

document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const headerLeft = document.querySelector('.header-left');
    const topbarActions = document.querySelector('.topbar-actions');
    const sidebarFooter = sidebar.querySelector('.sidebar-footer');
    let mobileSidebarToggle = document.querySelector('.mobile-sidebar-toggle');
    const mobileTools = document.createElement('div');
    mobileTools.className = 'sidebar-mobile-tools';
    mobileTools.setAttribute('aria-label', 'Preferências e empresa ativa');
    sidebar.insertBefore(mobileTools, sidebarFooter);

    const storedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    sidebar.classList.toggle('collapsed', storedCollapsed);

    document.querySelectorAll('.nav-item').forEach((item) => {
        if (item.classList.contains('active')) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });

    const companyContext = createCompanyContext();

    const userInfo = document.getElementById('userInfo');
    if (userInfo && topbarActions) {
        userInfo.classList.add('topbar-user');
        topbarActions.appendChild(userInfo);
    }

    if (!mobileSidebarToggle && headerLeft) {
        mobileSidebarToggle = document.createElement('button');
        mobileSidebarToggle.className = 'mobile-sidebar-toggle';
        mobileSidebarToggle.type = 'button';
        headerLeft.insertBefore(mobileSidebarToggle, headerLeft.firstChild);
    }

    const syncDesktopToggle = () => {
        if (!sidebarToggle) return;
        const expanded = !sidebar.classList.contains('collapsed');
        sidebarToggle.type = 'button';
        sidebarToggle.setAttribute('aria-label', expanded ? 'Recolher menu lateral' : 'Expandir menu lateral');
        sidebarToggle.setAttribute('aria-expanded', String(expanded));
        sidebarToggle.innerHTML = expanded
            ? '<i class="ph ph-caret-left" aria-hidden="true"></i>'
            : '<i class="ph ph-caret-right" aria-hidden="true"></i>';
    };

    const syncMobileToggle = (expanded) => {
        if (!mobileSidebarToggle) return;
        mobileSidebarToggle.setAttribute('aria-label', expanded ? 'Fechar menu' : 'Abrir menu');
        mobileSidebarToggle.setAttribute('aria-expanded', String(expanded));
        mobileSidebarToggle.innerHTML = expanded
            ? '<i class="ph ph-x" aria-hidden="true"></i>'
            : '<i class="ph ph-list" aria-hidden="true"></i>';
    };

    const getDrawerFocusableElements = () => Array.from(sidebar.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.offsetParent !== null);

    const closeDrawer = ({ restoreFocus = false } = {}) => {
        sidebar.classList.remove('active');
        sidebarOverlay?.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        syncMobileToggle(false);
        if (restoreFocus) mobileSidebarToggle?.focus();
    };

    const openDrawer = () => {
        sidebar.classList.add('active');
        sidebarOverlay?.classList.add('active');
        document.body.classList.add('sidebar-open');
        syncMobileToggle(true);
        getDrawerFocusableElements()[0]?.focus();
    };

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', String(sidebar.classList.contains('collapsed')));
        syncDesktopToggle();
    });

    mobileSidebarToggle?.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) closeDrawer({ restoreFocus: true });
        else openDrawer();
    });

    sidebarOverlay?.addEventListener('click', () => closeDrawer({ restoreFocus: true }));
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.addEventListener('click', () => {
            if (window.innerWidth < 960) closeDrawer();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (!sidebar.classList.contains('active')) return;

        if (event.key === 'Escape') {
            closeDrawer({ restoreFocus: true });
            return;
        }

        if (event.key !== 'Tab') return;
        const focusable = getDrawerFocusableElements();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });

    const storedDark = localStorage.getItem('darkTheme');
    const isDark = storedDark === null ? true : storedDark === 'true';
    document.body.classList.toggle('dark-theme', isDark);
    let themeToggle = topbarActions?.querySelector('.theme-toggle');
    if (topbarActions && !topbarActions.querySelector('.theme-toggle')) {
        themeToggle = createThemeToggle(isDark);
        const userProfile = topbarActions.querySelector('.topbar-user');
        topbarActions.insertBefore(themeToggle, userProfile);
    }

    const syncResponsiveControls = () => {
        const isMobileShell = window.innerWidth < 960;
        if (isMobileShell) {
            if (companyContext) mobileTools.appendChild(companyContext);
            if (themeToggle) mobileTools.appendChild(themeToggle);
            return;
        }

        if (companyContext && topbarActions) {
            topbarActions.insertBefore(companyContext, themeToggle || topbarActions.firstChild);
        }
        if (themeToggle && topbarActions) {
            const userProfile = topbarActions.querySelector('.topbar-user');
            topbarActions.insertBefore(themeToggle, userProfile);
        }
    };

    window.addEventListener('resize', () => {
        if (window.innerWidth >= 960) closeDrawer();
        syncResponsiveControls();
    });

    syncDesktopToggle();
    syncMobileToggle(false);
    syncResponsiveControls();
});

window.openModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
};

window.closeModal = function(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};
