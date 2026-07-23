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
                const empresaId = this.getEmpresaContextoId();
                const empresas = this.getEmpresas();
                const empresa = empresas.find(e => e.id === empresaId);
                if (empresa && empresa.config) {
                    config = typeof empresa.config === 'string' ? JSON.parse(empresa.config) : empresa.config;
                }
            } else {
                if (usuario.empresa_config) {
                    config = typeof usuario.empresa_config === 'string' ? JSON.parse(usuario.empresa_config) : usuario.empresa_config;
                }
            }

            if (config) {
                const target = document.body;
                const isDark = target.classList.contains('dark-theme');

                if (config.temaCor) {
                    this.injectPalette(target, 'primary', config.temaCor, isDark);
                }
                
                if (config.temaCorSecundaria) {
                    this.injectPalette(target, 'secondary', config.temaCorSecundaria, isDark);
                }
            }
        } catch (e) {
            console.error('Erro ao aplicar tema:', e);
        }
    }

    injectPalette(target, prefix, baseHex, isDark) {
        const { h, s, l } = this.hexToHsl(baseHex);
        
        // Garante contraste visual agradável
        let baseL = l;
        if (isDark && baseL < 30) baseL = 30; // Se a cor base for escura demais no dark mode, clareia
        if (!isDark && baseL > 80) baseL = 80; // Se a cor base for clara demais no light mode, escurece

        let shades = {};
        
        if (isDark) {
            shades = {
                '50':  this.hslToHex(h, s, 10),
                '100': this.hslToHex(h, s, 15),
                '400': this.hslToHex(h, s, Math.max(0, baseL - 10)),
                '500': this.hslToHex(h, s, baseL),
                '600': this.hslToHex(h, s, Math.min(100, baseL + 10)), // Mais claro no hover escuro
                '700': this.hslToHex(h, s, Math.min(100, baseL + 20)),
            };
        } else {
            shades = {
                '50':  this.hslToHex(h, s, 98),
                '100': this.hslToHex(h, s, 95),
                '400': this.hslToHex(h, s, Math.min(100, baseL + 10)),
                '500': this.hslToHex(h, s, baseL),
                '600': this.hslToHex(h, s, Math.max(0, baseL - 10)), // Mais escuro no hover claro
                '700': this.hslToHex(h, s, Math.max(0, baseL - 20)),
            };
        }

        Object.keys(shades).forEach(weight => {
            target.style.setProperty(`--${prefix}-${weight}`, shades[weight]);
        });
    }

    hexToHsl(hex) {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) {
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        r /= 255; g /= 255; b /= 255;
        let cmax = Math.max(r,g,b), cmin = Math.min(r,g,b);
        let delta = cmax - cmin;
        let h = 0, s = 0, l = (cmax + cmin) / 2;

        if (delta === 0) h = 0;
        else if (cmax === r) h = ((g - b) / delta) % 6;
        else if (cmax === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;

        h = Math.round(h * 60);
        if (h < 0) h += 360;
        s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

        return { h, s: +(s * 100).toFixed(1), l: +(l * 100).toFixed(1) };
    }

    hslToHex(h, s, l) {
        s /= 100; l /= 100;
        let c = (1 - Math.abs(2 * l - 1)) * s;
        let x = c * (1 - Math.abs((h / 60) % 2 - 1));
        let m = l - c/2;
        let r = 0, g = 0, b = 0;

        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

        r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
        g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
        b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
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
