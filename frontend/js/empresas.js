class EmpresasManager {
    constructor() {
        this.empresas = [];
        const usuario = window.auth.getUsuario();

        if (!usuario || usuario.role !== 'master') {
            window.location.href = '/dashboard';
            return;
        }

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadEmpresas();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addEmpresaBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.criarEmpresaPrompt());
        }
    }

    async loadEmpresas() {
        try {
            const response = await window.auth.fetchWithAuth('/api/empresas');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar empresas');
            }

            this.empresas = data;
            localStorage.setItem('empresas', JSON.stringify(data.map((e) => ({
                id: e.id,
                nome: e.nome,
                slug: e.slug,
                config: this.parseConfig(e.config),
            }))));
            this.renderEmpresas();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    parseConfig(config) {
        if (config && typeof config === 'object') return config;
        if (typeof config !== 'string') return {};
        try {
            return JSON.parse(config || '{}');
        } catch {
            return {};
        }
    }

    safeColor(value, fallback) {
        const color = String(value || '').trim();
        return /^#[0-9a-f]{6}$/i.test(color) ? color.toUpperCase() : fallback;
    }

    renderEmpresas() {
        const container = document.getElementById('empresasList');
        if (!container) return;

        if (!this.empresas.length) {
            container.innerHTML = `
                <div class="no-data">
                    <h3>Nenhuma empresa cadastrada</h3>
                    <p>Crie a primeira empresa para iniciar o sistema.</p>
                </div>
            `;
            return;
        }

        const contextoId = window.auth.getEmpresaContextoId();

        container.innerHTML = this.empresas.map((empresa) => {
            const config = this.parseConfig(empresa.config);
            const primary = this.safeColor(config.temaCor, '#7C3AED');
            const secondary = this.safeColor(config.temaCorSecundaria, '#2563EB');
            const isActive = Number(contextoId) === Number(empresa.id);
            const monogram = this.escapeHtml(String(empresa.nome || 'E').trim().charAt(0).toUpperCase() || 'E');
            return `
            <article class="card empresa-card aurora-data-card${isActive ? ' is-active' : ''}">
                <div class="card-header">
                    <div class="company-card-identity">
                        <span class="company-monogram">${monogram}</span>
                        <div><span class="data-card-eyebrow">Empresa</span><h3>${this.escapeHtml(empresa.nome)}</h3><small>${this.escapeHtml(empresa.slug || '-')}</small></div>
                    </div>
                    <span class="badge${isActive ? ' active' : ''}">${isActive ? 'Ativa' : `ID ${empresa.id}`}</span>
                </div>
                <div class="card-body">
                    <div class="company-metrics">
                        <div><strong>${empresa.total_usuarios || 0}</strong><span>Usuários</span></div>
                        <div><strong>${empresa.total_clientes || 0}</strong><span>Clientes</span></div>
                        <div><strong>${empresa.total_templates || 0}</strong><span>Templates</span></div>
                    </div>
                    <div class="company-palette" aria-label="Paleta da empresa">
                        <div><span class="company-palette-swatch" style="--swatch-color: ${primary}" title="Cor primária"></span><code class="company-palette-code">${primary}</code></div>
                        <div><span class="company-palette-swatch" style="--swatch-color: ${secondary}" title="Cor secundária"></span><code class="company-palette-code">${secondary}</code></div>
                    </div>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" onclick="empresasManager.entrarEmpresa(${empresa.id})">
                        <i class="ph ph-sign-in"></i>${isActive ? 'Empresa Ativa' : 'Entrar na Empresa'}
                    </button>
                    <button class="btn btn-secondary" onclick="empresasManager.editarEmpresa(${empresa.id})"><i class="ph ph-pencil-simple"></i>Editar</button>
                    <button class="btn btn-danger" onclick="empresasManager.excluirEmpresa(${empresa.id})"><i class="ph ph-trash"></i>Excluir</button>
                </div>
            </article>
        `;
        }).join('');
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async entrarEmpresa(id) {
        try {
            const response = await window.auth.fetchWithAuth(`/api/empresas/${id}/entrar`, {
                method: 'POST'
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Não foi possível entrar na empresa');
            }

            window.auth.setEmpresaContexto(data.empresa);
            window.auth.showNotification(`Contexto ativo: ${data.empresa.nome}`);
            window.location.href = '/dashboard';
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async criarEmpresaPrompt() {
        const nome = prompt('Nome da empresa:');
        if (!nome || !nome.trim()) return;
        
        const corHex = prompt('Cor Primária (Hex, ex: #7c3aed):', '#7c3aed');
        const corSecHex = prompt('Cor Secundária (Hex, ex: #3b82f6):', '#3b82f6');
        const config = { 
            temaCor: corHex || '#7c3aed',
            temaCorSecundaria: corSecHex || '#3b82f6'
        };

        try {
            const response = await window.auth.fetchWithAuth('/api/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome.trim(), config })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar empresa');
            }

            window.auth.showNotification('Empresa criada com sucesso');
            await this.loadEmpresas();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async editarEmpresa(id) {
        const empresa = this.empresas.find((e) => e.id === id);
        if (!empresa) return;

        const nome = prompt('Novo nome da empresa:', empresa.nome);
        if (!nome || !nome.trim()) return;
        
        const currentConfig = typeof empresa.config === 'string' ? JSON.parse(empresa.config || '{}') : (empresa.config || {});
        const corAtual = currentConfig.temaCor || '#7c3aed';
        const corSecAtual = currentConfig.temaCorSecundaria || '#3b82f6';
        
        const corHex = prompt('Nova Cor Primária (Hex, ex: #7c3aed):', corAtual);
        const corSecHex = prompt('Nova Cor Secundária (Hex, ex: #3b82f6):', corSecAtual);
        
        const newConfig = { 
            ...currentConfig, 
            temaCor: corHex || corAtual,
            temaCorSecundaria: corSecHex || corSecAtual
        };

        try {
            const response = await window.auth.fetchWithAuth(`/api/empresas/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome: nome.trim(), config: newConfig })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao editar empresa');
            }

            window.auth.showNotification('Empresa atualizada com sucesso');
            await this.loadEmpresas();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async excluirEmpresa(id) {
        const empresa = this.empresas.find((e) => e.id === id);
        if (!empresa) return;

        const ok = confirm(`Excluir empresa "${empresa.nome}"?`);
        if (!ok) return;

        try {
            const response = await window.auth.fetchWithAuth(`/api/empresas/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir empresa');
            }

            if (window.auth.getEmpresaContextoId() === id) {
                window.auth.clearEmpresaContexto();
            }

            window.auth.showNotification('Empresa desativada com sucesso');
            await this.loadEmpresas();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.empresasManager = new EmpresasManager();
});
