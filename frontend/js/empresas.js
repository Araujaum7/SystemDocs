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
            localStorage.setItem('empresas', JSON.stringify(data.map((e) => ({ id: e.id, nome: e.nome, slug: e.slug }))));
            this.renderEmpresas();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
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

        container.innerHTML = this.empresas.map((empresa) => `
            <div class="card empresa-card">
                <div class="card-header">
                    <h3>${this.escapeHtml(empresa.nome)}</h3>
                    <span class="badge">ID ${empresa.id}</span>
                </div>
                <div class="card-body">
                    <p><strong>Usuários:</strong> ${empresa.total_usuarios || 0}</p>
                    <p><strong>Clientes:</strong> ${empresa.total_clientes || 0}</p>
                    <p><strong>Templates:</strong> ${empresa.total_templates || 0}</p>
                    <p><strong>Cor do Tema:</strong> <span style="display:inline-block; width:15px; height:15px; background-color:${(typeof empresa.config === 'string' ? JSON.parse(empresa.config || '{}') : (empresa.config || {})).temaCor || '#7c3aed'}; border-radius:50%; vertical-align:middle;"></span></p>
                    <small>Slug: ${this.escapeHtml(empresa.slug || '-')}</small>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" onclick="empresasManager.entrarEmpresa(${empresa.id})">
                        ${contextoId === empresa.id ? 'Empresa Ativa' : 'Entrar na Empresa'}
                    </button>
                    <button class="btn btn-secondary" onclick="empresasManager.editarEmpresa(${empresa.id})">Editar</button>
                    <button class="btn btn-danger" onclick="empresasManager.excluirEmpresa(${empresa.id})">Excluir</button>
                </div>
            </div>
        `).join('');
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
        
        const corHex = prompt('Cor do tema (Hex, ex: #7c3aed):', '#7c3aed');
        const config = { temaCor: corHex || '#7c3aed' };

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
        
        const corHex = prompt('Nova cor do tema (Hex, ex: #7c3aed):', corAtual);
        const newConfig = { ...currentConfig, temaCor: corHex || corAtual };

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
