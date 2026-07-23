class Auth {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuth();
        this.setupEventListeners();
        this.updateUserInfo();
        this.applyRoleVisibility();
        this.applyThemeColor();
    }

    setupEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }

        document.querySelectorAll('.modal-close').forEach((btn) => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
    }

    getCurrentPath() {
        return window.location.pathname.toLowerCase();
    }

    isLoginPage() {
        const path = this.getCurrentPath();
        return path === '/' || path === '/index.html';
    }

    checkAuth() {
        const token = this.getToken();
        const usuario = this.getUsuario();

        if (!this.isLoginPage() && (!token || !usuario)) {
            window.location.href = '/';
            return;
        }

        if (this.isLoginPage() && token && usuario) {
            window.location.href = '/dashboard';
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email')?.value?.trim();
        const senha = document.getElementById('senha')?.value || '';

        if (!email || !senha) {
            this.showNotification('Preencha email e senha', 'error');
            return;
        }

        const submitBtn = e.target.querySelector('button[type="submit"]');
        const oldText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.innerHTML = 'Entrando...';
            submitBtn.disabled = true;
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, senha })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro no login');
            }

            localStorage.setItem('token', data.token);
            localStorage.setItem('usuario', JSON.stringify(data.usuario));
            localStorage.setItem('empresas', JSON.stringify(data.empresas || []));

            // Usuário comum já possui empresa fixa.
            if (data.usuario.role !== 'master' && data.usuario.empresa_id) {
                localStorage.setItem('empresaContextoId', String(data.usuario.empresa_id));
                localStorage.setItem('empresaContextoNome', data.usuario.empresa_nome || '');
            }

            // Master entra no menu de empresas para escolher contexto.
            if (data.usuario.role === 'master') {
                localStorage.removeItem('empresaContextoId');
                localStorage.removeItem('empresaContextoNome');
                window.location.href = '/empresas';
                return;
            }

            window.location.href = '/dashboard';
        } catch (error) {
            this.showNotification(error.message || 'Erro ao conectar com o servidor', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.innerHTML = oldText;
                submitBtn.disabled = false;
            }
        }
    }

    handleLogout() {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        localStorage.removeItem('empresas');
        localStorage.removeItem('empresaContextoId');
        localStorage.removeItem('empresaContextoNome');
        window.location.href = '/';
    }

    getToken() {
        return localStorage.getItem('token');
    }

    getUsuario() {
        const raw = localStorage.getItem('usuario');
        return raw ? JSON.parse(raw) : null;
    }

    getEmpresas() {
        const raw = localStorage.getItem('empresas');
        return raw ? JSON.parse(raw) : [];
    }

    getEmpresaContextoId() {
        const usuario = this.getUsuario();
        if (!usuario) return null;
        if (usuario.role !== 'master') return usuario.empresa_id || null;
        const raw = localStorage.getItem('empresaContextoId');
        if (!raw) return null;
        const id = Number(raw);
        return Number.isInteger(id) && id > 0 ? id : null;
    }

    getEmpresaContextoNome() {
        const usuario = this.getUsuario();
        if (!usuario) return null;
        if (usuario.role !== 'master') return usuario.empresa_nome || null;
        return localStorage.getItem('empresaContextoNome') || null;
    }

    setEmpresaContexto(empresa) {
        localStorage.setItem('empresaContextoId', String(empresa.id));
        localStorage.setItem('empresaContextoNome', empresa.nome);
        this.updateUserInfo();
    }

    clearEmpresaContexto() {
        localStorage.removeItem('empresaContextoId');
        localStorage.removeItem('empresaContextoNome');
        this.updateUserInfo();
    }

    ensureEmpresaContexto() {
        const usuario = this.getUsuario();
        if (!usuario) return false;
        if (usuario.role !== 'master') return true;
        return !!this.getEmpresaContextoId();
    }

    applyRoleVisibility() {
        const usuario = this.getUsuario();
        if (!usuario) return;

        document.body.classList.remove('user-master', 'user-admin');
        if (usuario.role === 'master') {
            document.body.classList.add('user-master');
        } else if (usuario.role === 'admin') {
            document.body.classList.add('user-admin');
        }
    }

    applyThemeColor() {
        try {
            const usuario = this.getUsuario();
            if (!usuario) return;

            let config = null;
            if (usuario.role === 'master') {
                // Para master, tenta pegar a config da empresa selecionada no cache
                const empresaId = this.getEmpresaContextoId();
                const empresas = this.getEmpresas();
                const empresa = empresas.find(e => e.id === empresaId);
                if (empresa && empresa.config) {
                    config = typeof empresa.config === 'string' ? JSON.parse(empresa.config) : empresa.config;
                }
            } else {
                // Usuário comum pega a config direto do seu objeto
                if (usuario.empresa_config) {
                    config = typeof usuario.empresa_config === 'string' ? JSON.parse(usuario.empresa_config) : usuario.empresa_config;
                }
            }

            if (config && config.temaCor) {
                // Injeta no body em vez de root para garantir que sobreponha a classe .dark-theme
                const target = document.body;
                target.style.setProperty('--primary-500', config.temaCor);
                
                // Se estiver no tema escuro, o hover pode ser um pouco mais claro. Se for claro, mais escuro.
                const isDark = document.body.classList.contains('dark-theme');
                target.style.setProperty('--primary-600', this.adjustColor(config.temaCor, isDark ? 20 : -20));
                
                // Também altera os orbs de background
                target.style.setProperty('--primary-700', this.adjustColor(config.temaCor, isDark ? -20 : -40));
            }
        } catch (e) {
            console.error('Erro ao aplicar tema:', e);
        }
    }

    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
    }

    updateUserInfo() {
        const usuario = this.getUsuario();
        if (!usuario) return;

        const userName = document.getElementById('userName');
        const userRole = document.getElementById('userRole');
        const userInfo = document.getElementById('userInfo');

        if (!userInfo) return;

        if (userName) userName.textContent = usuario.nome;

        if (userRole) {
            if (usuario.role === 'master') {
                const empresaNome = this.getEmpresaContextoNome();
                userRole.textContent = empresaNome ? `Master • ${empresaNome}` : 'Master • Sem empresa selecionada';
            } else {
                userRole.textContent = usuario.empresa_nome ? `Usuário • ${usuario.empresa_nome}` : 'Usuário';
            }
        }
    }

    buildAuthHeaders(existingHeaders = {}) {
        const headers = { ...existingHeaders };
        headers['Authorization'] = `Bearer ${this.getToken()}`;

        const usuario = this.getUsuario();
        if (usuario?.role === 'master') {
            const empresaId = this.getEmpresaContextoId();
            if (empresaId) headers['X-Empresa-Id'] = String(empresaId);
        }

        return headers;
    }

    async fetchWithAuth(url, options = {}) {
        const opts = { ...options };
        opts.headers = this.buildAuthHeaders(options.headers || {});

        const response = await fetch(url, opts);
        if (response.status === 401 || response.status === 403) {
            const isLogin = this.isLoginPage();
            if (!isLogin) {
                this.handleLogout();
            }
        }

        return response;
    }

    showNotification(message, type = 'success') {
        document.querySelectorAll('.notification').forEach((n) => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 4000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});

window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
};

window.closeModal = function (modalId) {
    if (!modalId) return;
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};
