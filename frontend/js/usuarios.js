class UsuariosManager {
    constructor() {
        this.usuarios = [];
        const usuario = window.auth.getUsuario();
        if (!usuario || (usuario.role !== 'master' && usuario.role !== 'admin')) {
            window.location.href = '/dashboard';
            return;
        }

        if (!window.auth.ensureEmpresaContexto()) {
            this.renderNeedContext();
            return;
        }

        this.init();
    }

    renderNeedContext() {
        const container = document.getElementById('usuariosList');
        if (!container) return;
        container.innerHTML = `
            <div class="no-data">
                <h3>Selecione uma empresa primeiro</h3>
                <p>Vá em Empresas, entre em uma empresa e volte para gerenciar usuários.</p>
                <a href="/empresas" class="btn btn-primary">Ir para Empresas</a>
            </div>
        `;
        const addBtn = document.getElementById('addUsuarioBtn');
        if (addBtn) addBtn.disabled = true;
    }

    init() {
        this.setupEventListeners();
        this.loadUsuarios();
    }

    setupEventListeners() {
        const addBtn = document.getElementById('addUsuarioBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => this.abrirModalUsuario());
        }

        const form = document.getElementById('usuarioForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.criarUsuario();
            });
        }

        const resetForm = document.getElementById('resetSenhaForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarNovaSenha();
            });
        }

        const roleForm = document.getElementById('alterarCargoForm');
        if (roleForm) {
            roleForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarNovoCargo();
            });
        }
    }

    async loadUsuarios() {
        try {
            const response = await window.auth.fetchWithAuth('/api/usuarios');
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao carregar usuários');
            }
            this.usuarios = data;
            this.renderUsuarios();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    renderUsuarios() {
        const container = document.getElementById('usuariosList');
        if (!container) return;

        if (!this.usuarios.length) {
            container.innerHTML = `
                <div class="no-data">
                    <h3>Nenhum usuário cadastrado</h3>
                    <p>Crie usuários para esta empresa.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.usuarios.map((usuario) => `
            <div class="card usuario-card">
                <div class="card-header">
                    <h3>${this.escapeHtml(usuario.nome)}</h3>
                    <span class="badge">${this.escapeHtml(usuario.role)}</span>
                </div>
                <div class="card-body">
                    <p><strong>Email:</strong> ${this.escapeHtml(usuario.email)}</p>
                    <p><strong>ID:</strong> ${usuario.id}</p>
                    <small>Criado em: ${new Date(usuario.created_at).toLocaleDateString('pt-BR')}</small>
                </div>
                <div class="card-footer">
                    <button class="btn btn-primary" onclick="usuariosManager.abrirModalAlterarCargo(${usuario.id}, '${this.escapeHtml(usuario.nome)}', '${this.escapeHtml(usuario.role)}')">Alterar Cargo</button>
                    <button class="btn btn-warning" onclick="usuariosManager.abrirModalResetSenha(${usuario.id}, '${this.escapeHtml(usuario.nome)}')">Alterar Senha</button>
                    <button class="btn btn-danger" onclick="usuariosManager.deletarUsuario(${usuario.id})">Excluir</button>
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

    abrirModalUsuario() {
        const form = document.getElementById('usuarioForm');
        if (form) form.reset();
        openModal('modalUsuario');
    }

    async criarUsuario() {
        const nome = document.getElementById('usuarioNome')?.value?.trim();
        const email = document.getElementById('usuarioEmail')?.value?.trim();
        const senha = document.getElementById('usuarioSenha')?.value || '';
        const role = document.getElementById('usuarioCargo')?.value || 'user';

        if (!nome || !email || !senha) {
            window.auth.showNotification('Preencha todos os campos', 'error');
            return;
        }

        try {
            const response = await window.auth.fetchWithAuth('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nome, email, senha, role })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao criar usuário');
            }

            closeModal('modalUsuario');
            window.auth.showNotification('Usuário criado com sucesso');
            await this.loadUsuarios();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async deletarUsuario(id) {
        if (!confirm('Excluir este usuário?')) return;

        try {
            const response = await window.auth.fetchWithAuth(`/api/usuarios/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao excluir usuário');
            }

            window.auth.showNotification('Usuário excluído com sucesso');
            await this.loadUsuarios();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    abrirModalResetSenha(id, nome) {
        document.getElementById('resetSenhaUsuarioId').value = id;
        document.getElementById('resetSenhaUsuarioNome').textContent = nome;
        
        const form = document.getElementById('resetSenhaForm');
        if (form) form.reset();
        
        openModal('modalRedefinirSenha');
    }

    async salvarNovaSenha() {
        const id = document.getElementById('resetSenhaUsuarioId').value;
        const senha = document.getElementById('novaSenha').value;

        if (!senha || senha.length < 6) {
            window.auth.showNotification('A nova senha deve ter pelo menos 6 caracteres', 'error');
            return;
        }

        try {
            const response = await window.auth.fetchWithAuth(`/api/usuarios/${id}/senha`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ senha })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao redefinir senha');
            }

            closeModal('modalRedefinirSenha');
            window.auth.showNotification('Senha redefinida com sucesso!', 'success');
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    abrirModalAlterarCargo(id, nome, cargo) {
        document.getElementById('alterarCargoUsuarioId').value = id;
        document.getElementById('alterarCargoUsuarioNome').textContent = nome;
        document.getElementById('novoCargo').value = cargo;
        
        openModal('modalAlterarCargo');
    }

    async salvarNovoCargo() {
        const id = document.getElementById('alterarCargoUsuarioId').value;
        const role = document.getElementById('novoCargo').value;

        try {
            const response = await window.auth.fetchWithAuth(`/api/usuarios/${id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
            
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Erro ao alterar cargo');
            }

            closeModal('modalAlterarCargo');
            window.auth.showNotification('Cargo atualizado com sucesso!', 'success');
            await this.loadUsuarios();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.usuariosManager = new UsuariosManager();
});

function closeUsuarioModal() {
    closeModal('modalUsuario');
}
