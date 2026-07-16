// Controle do sidebar retrátil
document.addEventListener('DOMContentLoaded', function() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mobileSidebarToggle = document.querySelector('.mobile-sidebar-toggle');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    
    // Toggle do sidebar no desktop
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            sidebar.classList.toggle('collapsed');
            // Salvar estado no localStorage
            localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }
    
    // Toggle do sidebar no mobile
    if (mobileSidebarToggle) {
        mobileSidebarToggle.addEventListener('click', function() {
            sidebar.classList.add('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.add('active');
            }
        });
    }
    
    // Fechar sidebar no mobile ao clicar no overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        });
    }
    
    // Fechar sidebar no mobile ao clicar em um link
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
                if (sidebarOverlay) {
                    sidebarOverlay.classList.remove('active');
                }
            }
        });
    });
    
    // Restaurar estado do sidebar
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed && sidebar) {
        sidebar.classList.add('collapsed');
    }
    
    // Fechar sidebar ao redimensionar a janela para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('active');
            if (sidebarOverlay) {
                sidebarOverlay.classList.remove('active');
            }
        }
    });

    // Tema Escuro
    const isDark = localStorage.getItem('darkTheme') === 'true';
    if (isDark) {
        document.body.classList.add('dark-theme');
    }

    const headerActions = document.querySelector('.header-actions');
    if (headerActions) {
        const themeBtn = document.createElement('button');
        themeBtn.className = 'btn btn-secondary';
        themeBtn.innerHTML = isDark ? '<span class="emoji">☀️</span> Modo Claro' : '<span class="emoji">🌙</span> Modo Escuro';
        themeBtn.title = 'Alternar Tema';
        themeBtn.style.marginRight = '8px';

        themeBtn.addEventListener('click', () => {
            const isCurrentlyDark = document.body.classList.contains('dark-theme');
            if (isCurrentlyDark) {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('darkTheme', 'false');
                themeBtn.innerHTML = '<span class="emoji">🌙</span> Modo Escuro';
            } else {
                document.body.classList.add('dark-theme');
                localStorage.setItem('darkTheme', 'true');
                themeBtn.innerHTML = '<span class="emoji">☀️</span> Modo Claro';
            }
        });

        headerActions.insertBefore(themeBtn, headerActions.firstChild);
    }
});

// Funções auxiliares para modais
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}
