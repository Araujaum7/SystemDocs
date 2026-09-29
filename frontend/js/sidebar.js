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
    let mobileSidebarToggle = document.querySelector('.mobile-sidebar-toggle');

    const storedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    sidebar.classList.toggle('collapsed', storedCollapsed);

    document.querySelectorAll('.nav-item').forEach((item) => {
        if (item.classList.contains('active')) item.setAttribute('aria-current', 'page');
        else item.removeAttribute('aria-current');
    });

    const companyContext = createCompanyContext();
    if (companyContext && topbarActions && !topbarActions.querySelector('.topbar-company-context')) {
        topbarActions.appendChild(companyContext);
    }

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

    const closeDrawer = () => {
        sidebar.classList.remove('active');
        sidebarOverlay?.classList.remove('active');
        document.body.classList.remove('sidebar-open');
        syncMobileToggle(false);
    };

    const openDrawer = () => {
        sidebar.classList.add('active');
        sidebarOverlay?.classList.add('active');
        document.body.classList.add('sidebar-open');
        syncMobileToggle(true);
    };

    sidebarToggle?.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        localStorage.setItem('sidebarCollapsed', String(sidebar.classList.contains('collapsed')));
        syncDesktopToggle();
    });

    mobileSidebarToggle?.addEventListener('click', () => {
        if (sidebar.classList.contains('active')) closeDrawer();
        else openDrawer();
    });

    sidebarOverlay?.addEventListener('click', closeDrawer);
    document.querySelectorAll('.nav-item').forEach((item) => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) closeDrawer();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && sidebar.classList.contains('active')) closeDrawer();
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) closeDrawer();
    });

    const storedDark = localStorage.getItem('darkTheme');
    const isDark = storedDark === null ? true : storedDark === 'true';
    document.body.classList.toggle('dark-theme', isDark);
    if (topbarActions && !topbarActions.querySelector('.theme-toggle')) {
        const themeToggle = createThemeToggle(isDark);
        const userProfile = topbarActions.querySelector('.topbar-user');
        topbarActions.insertBefore(themeToggle, userProfile);
    }

    syncDesktopToggle();
    syncMobileToggle(false);
});

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}
