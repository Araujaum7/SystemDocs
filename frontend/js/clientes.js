class ClientesManager {
    constructor() {
        this.clientes = [];
        this.selectedClientes = new Set();
        this.usuario = window.auth.getUsuario();

        if (this.usuario?.role === 'master' && !window.auth.ensureEmpresaContexto()) {
            this.renderNeedContext();
            return;
        }

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadClientes();
    }

    renderNeedContext() {
        const container = document.getElementById('clientesList');
        if (!container) return;

        container.innerHTML = `
            <div class="no-data">
                <h3>Selecione uma empresa primeiro</h3>
                <p>Vá para Empresas e entre em uma empresa para gerenciar clientes.</p>
                <a href="/empresas" class="btn btn-primary">Ir para Empresas</a>
            </div>
        `;
    }

    setupEventListeners() {
        document.getElementById('addClienteBtn')?.addEventListener('click', () => this.openClienteModal());
        document.getElementById('importClientesBtn')?.addEventListener('click', () => this.openImportModal());
        document.getElementById('searchClientes')?.addEventListener('input', (e) => this.filterClientes(e.target.value));
        document.getElementById('deleteMultipleBtn')?.addEventListener('click', () => this.deleteMultipleClientes());
        document.getElementById('duplicateMultipleBtn')?.addEventListener('click', () => this.duplicateMultipleClientes());
        document.getElementById('cpf')?.addEventListener('input', (e) => {
            e.target.value = this.formatCpf(e.target.value);
        });

        document.getElementById('clienteForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCliente();
        });

        document.getElementById('importForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.importClientes();
        });
    }

    onlyDigits(value) {
        return String(value || '').replace(/\D/g, '');
    }

    formatCpf(value) {
        const digits = this.onlyDigits(value).slice(0, 11);
        if (!digits) return '';

        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    async loadClientes() {
        try {
            this.clientes = await window.api.get('/api/clientes');
            this.renderClientes(this.clientes);
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    renderClientes(clientesArray) {
        const container = document.getElementById('clientesList');
        if (!container) return;

        if (!clientesArray.length) {
            container.innerHTML = `
                <div class="no-data">
                    <h3>Nenhum cliente cadastrado</h3>
                    <p>Adicione o primeiro cliente desta empresa.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = clientesArray.map((cliente) => {
            const dados = cliente.dados || {};
            return `
                <div class="card cliente-card" data-id="${cliente.id}">
                    <div class="card-header">
                        <h3>${this.escapeHtml(dados.nome || 'Sem nome')}</h3>
                        <label class="checkbox">
                            <input type="checkbox" value="${cliente.id}" onchange="clientesManager.toggleClienteSelection(${cliente.id}, this.checked)">
                            <span class="checkmark"></span>
                        </label>
                    </div>
                    <div class="card-body">
                        <div class="cliente-info">
                            ${dados.cpf ? `<p><strong>CPF:</strong> ${this.escapeHtml(this.formatCpf(dados.cpf))}</p>` : ''}
                            ${dados.email ? `<p><strong>Email:</strong> ${this.escapeHtml(dados.email)}</p>` : ''}
                            ${dados.telefone ? `<p><strong>Telefone:</strong> ${this.escapeHtml(dados.telefone)}</p>` : ''}
                            ${dados.endereco ? `<p><strong>Endereço:</strong> ${this.escapeHtml(dados.endereco)}</p>` : ''}
                        </div>
                        <small>Cadastrado em: ${new Date(cliente.created_at).toLocaleDateString('pt-BR')}</small>
                    </div>
                    <div class="card-footer">
                        <button class="btn btn-secondary" onclick="clientesManager.editarCliente(${cliente.id})">Editar</button>
                        <button class="btn btn-success" onclick="clientesManager.duplicarCliente(${cliente.id})">Duplicar</button>
                        <button class="btn btn-danger" onclick="clientesManager.deletarCliente(${cliente.id})">Excluir</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    filterClientes(termo) {
        const search = String(termo || '').toLowerCase();
        const filtrados = this.clientes.filter((cliente) => JSON.stringify(cliente.dados || {}).toLowerCase().includes(search));
        this.renderClientes(filtrados);
    }

    toggleClienteSelection(clienteId, isSelected) {
        if (isSelected) this.selectedClientes.add(clienteId);
        else this.selectedClientes.delete(clienteId);
        this.updateActionsState();
    }

    updateActionsState() {
        const hasSelection = this.selectedClientes.size > 0;
        const deleteBtn = document.getElementById('deleteMultipleBtn');
        const duplicateBtn = document.getElementById('duplicateMultipleBtn');
        if (deleteBtn) deleteBtn.disabled = !hasSelection;
        if (duplicateBtn) duplicateBtn.disabled = !hasSelection;
    }

    openClienteModal(cliente = null) {
        const form = document.getElementById('clienteForm');
        const title = document.getElementById('modalClienteTitle');

        if (title) title.textContent = cliente ? 'Editar Cliente' : 'Novo Cliente';
        if (!form) return;

        if (cliente) {
            form.dataset.editId = String(cliente.id);
            document.getElementById('nome').value = cliente.dados?.nome || '';
            document.getElementById('cpf').value = this.formatCpf(cliente.dados?.cpf || '');
            document.getElementById('email').value = cliente.dados?.email || '';
            document.getElementById('telefone').value = cliente.dados?.telefone || '';
            document.getElementById('endereco').value = cliente.dados?.endereco || '';
        } else {
            form.reset();
            delete form.dataset.editId;
        }

        openModal('modalCliente');
    }

    async saveCliente() {
        const form = document.getElementById('clienteForm');
        if (!form) return;

        const formData = new FormData(form);
        const dados = Object.fromEntries(formData.entries());
        dados.cpf = this.formatCpf(dados.cpf);

        if (!dados.nome || !dados.cpf) {
            window.auth.showNotification('Nome e CPF são obrigatórios', 'error');
            return;
        }

        try {
            if (form.dataset.editId) {
                await window.api.put(`/api/clientes/${form.dataset.editId}`, dados);
            } else {
                await window.api.post('/api/clientes', dados);
            }

            closeModal('modalCliente');
            window.auth.showNotification('Cliente salvo com sucesso');
            await this.loadClientes();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    editarCliente(id) {
        const cliente = this.clientes.find((c) => c.id === id);
        if (cliente) this.openClienteModal(cliente);
    }

    async duplicarCliente(id) {
        if (!confirm('Deseja duplicar este cliente?')) return;

        try {
            await window.api.post(`/api/clientes/${id}/duplicate`);

            window.auth.showNotification('Cliente duplicado com sucesso');
            await this.loadClientes();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async deletarCliente(id) {
        if (!confirm('Excluir este cliente?')) return;

        try {
            await window.api.delete(`/api/clientes/${id}`);

            window.auth.showNotification('Cliente excluído com sucesso');
            await this.loadClientes();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async deleteMultipleClientes() {
        if (!this.selectedClientes.size) return;
        if (!confirm(`Excluir ${this.selectedClientes.size} cliente(s)?`)) return;

        try {
            for (const id of this.selectedClientes) {
                await window.api.delete(`/api/clientes/${id}`);
            }

            this.selectedClientes.clear();
            this.updateActionsState();
            await this.loadClientes();
            window.auth.showNotification('Clientes excluídos com sucesso');
        } catch (error) {
            window.auth.showNotification(error.message || 'Erro ao excluir clientes', 'error');
        }
    }

    async duplicateMultipleClientes() {
        if (!this.selectedClientes.size) return;

        try {
            for (const id of this.selectedClientes) {
                await window.api.post(`/api/clientes/${id}/duplicate`);
            }

            this.selectedClientes.clear();
            this.updateActionsState();
            await this.loadClientes();
            window.auth.showNotification('Clientes duplicados com sucesso');
        } catch (error) {
            window.auth.showNotification(error.message || 'Erro ao duplicar clientes', 'error');
        }
    }

    openImportModal() {
        document.getElementById('importForm')?.reset();
        const progress = document.getElementById('importProgress');
        if (progress) progress.style.display = 'none';
        openModal('modalImport');
    }

    async importClientes() {
        const file = document.getElementById('csvFile')?.files?.[0];
        if (!file) {
            window.auth.showNotification('Selecione um arquivo CSV', 'error');
            return;
        }

        const progress = document.getElementById('importProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        if (progress) progress.style.display = 'block';
        if (progressFill) progressFill.style.width = '20%';
        if (progressText) progressText.textContent = 'Enviando arquivo...';

        try {
            const formData = new FormData();
            formData.append('arquivo', file);

            const data = await window.api.post('/api/clientes/importar', formData, true);

            if (progressFill) progressFill.style.width = '100%';
            if (progressText) progressText.textContent = 'Concluído';

            window.auth.showNotification(data.message || 'Importação concluída');
            closeModal('modalImport');
            await this.loadClientes();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        } finally {
            setTimeout(() => {
                if (progress) progress.style.display = 'none';
            }, 1000);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.clientesManager = new ClientesManager();
});
