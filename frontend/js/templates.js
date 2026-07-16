class TemplatesManager {
    constructor() {
        this.templates = [];
        this.usuario = window.auth.getUsuario();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.applyPermissions();
        this.loadTemplates();
    }

    setupEventListeners() {
        const addTemplateBtn = document.getElementById('addTemplateBtn');
        if (addTemplateBtn) {
            addTemplateBtn.addEventListener('click', () => this.openTemplateModal());
        }

        const form = document.getElementById('templateForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.uploadTemplate();
            });
        }
    }

    applyPermissions() {
        const isMasterOrAdmin = this.usuario?.role === 'master' || this.usuario?.role === 'admin';
        const addTemplateBtn = document.getElementById('addTemplateBtn');
        const userMessage = document.getElementById('userMessage');

        if (this.usuario?.role === 'master' && !window.auth.ensureEmpresaContexto()) {
            if (userMessage) {
                userMessage.style.display = 'block';
                userMessage.innerHTML = `
                    <h3>Selecione uma empresa primeiro</h3>
                    <p>Vá para o menu Empresas e entre em uma empresa.</p>
                    <a href="/empresas" class="btn btn-primary">Ir para Empresas</a>
                `;
            }
            if (addTemplateBtn) addTemplateBtn.style.display = 'none';
            return;
        }

        if (!isMasterOrAdmin) {
            if (addTemplateBtn) addTemplateBtn.style.display = 'none';
        }
    }

    async loadTemplates() {
        if (this.usuario?.role === 'master' && !window.auth.ensureEmpresaContexto()) {
            this.renderTemplates([]);
            return;
        }

        try {
            const response = await window.auth.fetchWithAuth('/api/templates');
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar templates');
            }

            this.templates = data;
            this.renderTemplates(this.templates);
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    renderTemplates(list) {
        const container = document.getElementById('templatesList');
        if (!container) return;

        if (!list.length) {
            container.innerHTML = `
                <div class="no-data">
                    <h3>Nenhum template disponível</h3>
                    <p>Cadastre templates para começar a gerar documentos.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map((template) => `
            <div class="card template-card">
                <div class="card-header">
                    <h3>${this.escapeHtml(template.nome)}</h3>
                    <span class="badge">${Array.isArray(template.campos) ? template.campos.length : 0} campos</span>
                </div>
                <div class="card-body">
                    <p><strong>Arquivo:</strong> ${this.escapeHtml(template.arquivo)}</p>
                    <p><strong>Campos:</strong> ${this.escapeHtml((template.campos || []).join(', '))}</p>
                    <small>Criado em: ${new Date(template.created_at).toLocaleDateString('pt-BR')}</small>
                </div>
                <div class="card-footer">
                    ${(this.usuario?.role === 'master' || this.usuario?.role === 'admin')
                        ? `<button class="btn btn-danger" onclick="templatesManager.deletarTemplate(${template.id})">Excluir</button>`
                        : ''
                    }
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

    openTemplateModal() {
        if (this.usuario?.role !== 'master' && this.usuario?.role !== 'admin') {
            window.auth.showNotification('Apenas master ou admin podem criar templates', 'error');
            return;
        }
        if (!window.auth.ensureEmpresaContexto()) {
            window.auth.showNotification('Selecione uma empresa no menu Empresas', 'error');
            return;
        }
        openModal('modalTemplate');
    }

    async uploadTemplate() {
        if (this.usuario?.role !== 'master' && this.usuario?.role !== 'admin') return;

        const nome = document.getElementById('templateNome')?.value?.trim();
        const arquivo = document.getElementById('templateArquivo')?.files?.[0];
        const camposTxt = document.getElementById('templateCampos')?.value?.trim();

        if (!nome || !arquivo || !camposTxt) {
            window.auth.showNotification('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        const campos = camposTxt
            .split(',')
            .map((v) => v.trim())
            .filter(Boolean);

        if (!campos.length) {
            window.auth.showNotification('Informe ao menos um campo', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('nome', nome);
            formData.append('arquivo', arquivo);
            formData.append('campos', JSON.stringify(campos));

            const response = await window.auth.fetchWithAuth('/api/templates', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro no upload do template');
            }

            closeModal('modalTemplate');
            document.getElementById('templateForm')?.reset();
            window.auth.showNotification('Template cadastrado com sucesso');
            await this.loadTemplates();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async deletarTemplate(id) {
        if (!confirm('Deseja excluir este template?')) return;

        try {
            const response = await window.auth.fetchWithAuth(`/api/templates/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir template');
            }

            window.auth.showNotification('Template excluído com sucesso');
            await this.loadTemplates();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.templatesManager = new TemplatesManager();
});
