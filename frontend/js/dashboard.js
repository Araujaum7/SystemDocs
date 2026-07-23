class DashboardManager {
    constructor() {
        this.usuario = window.auth.getUsuario();
        this.state = {
            clientes: [],
            templates: [],
            usuarios: [],
            empresas: [],
            health: null,
        };

        if (!this.usuario) {
            window.location.href = '/';
            return;
        }

        this.start();
    }

    async start() {
        this.startClock();
        this.applyBaseIdentity();

        if (this.usuario.role === 'master' && !window.auth.ensureEmpresaContexto()) {
            await this.loadMasterWithoutContext();
            return;
        }

        await this.loadContextDashboard();
    }

    startClock() {
        const el = document.getElementById('currentTime');
        if (!el) return;

        const update = () => {
            el.textContent = new Date().toLocaleString('pt-BR');
        };

        update();
        setInterval(update, 1000);
    }

    applyBaseIdentity() {
        const empresaNome = window.auth.getEmpresaContextoNome() || this.usuario.empresa_nome || 'Sem empresa';
        const role = this.usuario.role === 'master' ? 'Master' : 'Usuário';

        document.getElementById('metaRole').textContent = `Perfil: ${role}`;
        document.getElementById('metaEmpresa').textContent = `Empresa: ${empresaNome}`;

        if (this.usuario.role === 'master') {
            document.getElementById('heroTitle').textContent = 'Painel de gestão multiempresa';
            document.getElementById('heroSubtitle').textContent = 'Acompanhe contexto ativo, operação por empresa e ações administrativas em um único lugar.';
        } else {
            document.getElementById('heroTitle').textContent = `Olá, ${this.usuario.nome}`;
            document.getElementById('heroSubtitle').textContent = 'Seu painel traz o status da empresa ativa e atalhos para produção de documentos.';
        }
    }

    async fetchJson(url) {
        const response = await window.auth.fetchWithAuth(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `Falha em ${url}`);
        }

        return data;
    }

    setContextBanner(type, title, description, actionHtml = '') {
        const banner = document.getElementById('contextBanner');
        banner.classList.remove('warning', 'success');
        banner.classList.add(type);

        document.getElementById('contextTitle').textContent = title;
        document.getElementById('contextDescription').textContent = description;
        document.getElementById('contextAction').innerHTML = actionHtml;
    }

    setHealthStatus(ok) {
        const value = ok ? 'API: Online' : 'API: Instável';
        document.getElementById('metaHealth').textContent = value;
    }

    async loadMasterWithoutContext() {
        try {
            const [empresas, health] = await Promise.all([
                this.fetchJson('/api/empresas'),
                this.fetchJson('/api/health').catch(() => null),
            ]);

            this.state.empresas = empresas;
            this.state.health = health;

            this.setHealthStatus(!!health?.ok);
            this.setContextBanner(
                'warning',
                'Contexto de empresa não selecionado',
                'Como master, escolha uma empresa para habilitar clientes, templates e geração de documentos.',
                '<a href="/empresas" class="btn btn-primary">Selecionar Empresa</a>'
            );

            this.renderKpis({
                clientes: 0,
                templates: 0,
                usuarios: 0,
                capacidade: 0,
            });

            this.renderOperationalInsights([
                `Empresas cadastradas: <strong>${empresas.length}</strong>`,
                'Sem empresa ativa no momento: operações de cliente/template ficam bloqueadas.',
                'Recomendação: entre em uma empresa e siga para o fluxo de geração.',
            ]);

            this.renderRecentActivity([], 'Selecione uma empresa para visualizar atividade local.');
            this.renderMasterInsights(empresas, null);
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async loadContextDashboard() {
        try {
            const requests = [
                this.fetchJson('/api/clientes'),
                this.fetchJson('/api/templates'),
                this.fetchJson('/api/health').catch(() => null),
                this.fetchJson('/api/dashboard/stats').catch(() => null),
            ];

            if (this.usuario.role === 'master') {
                requests.push(this.fetchJson('/api/usuarios'));
                requests.push(this.fetchJson('/api/empresas'));
            }

            const results = await Promise.all(requests);

            this.state.clientes = results[0] || [];
            this.state.templates = results[1] || [];
            this.state.health = results[2] || null;
            this.state.stats = results[3] || null;
            this.state.usuarios = this.usuario.role === 'master' ? (results[4] || []) : [];
            this.state.empresas = this.usuario.role === 'master' ? (results[5] || []) : [];

            this.setHealthStatus(!!this.state.health?.ok);

            const empresaNome = window.auth.getEmpresaContextoNome() || this.usuario.empresa_nome || 'Empresa ativa';
            this.setContextBanner(
                'success',
                `Contexto ativo: ${empresaNome}`,
                'Tudo pronto para operar. Seus dados já estão filtrados por empresa.'
            );

            const capacidade = this.state.clientes.length * this.state.templates.length;
            this.renderKpis({
                clientes: this.state.clientes.length,
                templates: this.state.templates.length,
                usuarios: this.usuario.role === 'master' ? this.state.usuarios.length : 1,
                capacidade,
            });

            this.renderOperationalInsights(this.buildOperationalInsights(capacidade));
            this.renderRecentActivity(this.state.clientes);
            this.renderChart(this.state.stats);

            if (this.usuario.role === 'master') {
                this.renderMasterInsights(this.state.empresas, this.state.usuarios);
            }
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    buildOperationalInsights(capacidade) {
        const clientes = this.state.clientes;
        const templates = this.state.templates;

        const clientesComCpf = clientes.filter((c) => String(c?.dados?.cpf || '').trim() !== '').length;
        const clientesComEmail = clientes.filter((c) => String(c?.dados?.email || '').trim() !== '').length;

        const coberturaCpf = clientes.length ? Math.round((clientesComCpf / clientes.length) * 100) : 0;
        const coberturaEmail = clientes.length ? Math.round((clientesComEmail / clientes.length) * 100) : 0;

        const mediaCampos = templates.length
            ? Math.round(templates.reduce((sum, t) => sum + (Array.isArray(t.campos) ? t.campos.length : 0), 0) / templates.length)
            : 0;

        return [
            `Cobertura de CPF: <strong>${coberturaCpf}%</strong> da base de clientes.`,
            `Cobertura de e-mail: <strong>${coberturaEmail}%</strong> da base de clientes.`,
            `Média de campos por template: <strong>${mediaCampos}</strong>.`,
            `Capacidade imediata de geração: <strong>${capacidade}</strong> documentos por rodada.`,
        ];
    }

    renderKpis({ clientes, templates, usuarios, capacidade }) {
        document.getElementById('kpiClientes').textContent = clientes;
        document.getElementById('kpiTemplates').textContent = templates;
        document.getElementById('kpiUsuarios').textContent = usuarios;
        document.getElementById('kpiCapacidade').textContent = capacidade;

        document.getElementById('kpiClientesTrend').textContent = clientes === 0
            ? 'Cadastre clientes para iniciar operações'
            : 'Base de clientes da empresa ativa';

        document.getElementById('kpiTemplatesTrend').textContent = templates === 0
            ? 'Crie templates para liberar geração'
            : 'Modelos disponíveis para produção';

        document.getElementById('kpiUsuariosTrend').textContent = this.usuario.role === 'master'
            ? 'Usuários vinculados ao contexto atual'
            : 'Seu acesso está ativo nesta empresa';

        document.getElementById('kpiCapacidadeTrend').textContent = capacidade === 0
            ? 'Sem combinação suficiente para gerar documentos'
            : 'Estimativa de documentos por seleção total';
    }

    renderOperationalInsights(items) {
        const container = document.getElementById('operationalInsights');
        container.innerHTML = items.map((item) => `
            <li class="insight-item">
                <div class="item-title">${item}</div>
            </li>
        `).join('');
    }

    renderRecentActivity(clientes, emptyMessage = 'Ainda não há atividade para exibir.') {
        const container = document.getElementById('recentActivity');

        if (!Array.isArray(clientes) || clientes.length === 0) {
            container.innerHTML = `
                <li class="activity-item">
                    <div class="item-title">Sem registros recentes</div>
                    <div class="item-sub">${emptyMessage}</div>
                </li>
            `;
            return;
        }

        const sorted = [...clientes]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

        container.innerHTML = sorted.map((cliente) => {
            const nome = this.escapeHtml(cliente?.dados?.nome || 'Cliente sem nome');
            const cpf = this.escapeHtml(cliente?.dados?.cpf || 'CPF não informado');
            const created = cliente?.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : '-';
            return `
                <li class="activity-item">
                    <div class="item-title">${nome}</div>
                    <div class="item-sub">CPF: ${cpf} • cadastrado em ${created}</div>
                </li>
            `;
        }).join('');
    }

    renderMasterInsights(empresas, usuarios) {
        const container = document.getElementById('masterInsights');
        if (!container) return;

        const totalEmpresas = Array.isArray(empresas) ? empresas.length : 0;
        const totalUsuariosContexto = Array.isArray(usuarios) ? usuarios.length : 0;
        const empresaNome = window.auth.getEmpresaContextoNome() || 'Sem contexto';

        const items = [
            {
                title: `Empresas cadastradas: ${totalEmpresas}`,
                sub: 'Use Empresas para trocar contexto e gerenciar isolamento dos dados.',
                status: 'info',
            },
            {
                title: `Usuários no contexto atual: ${totalUsuariosContexto}`,
                sub: `Contexto ativo: ${this.escapeHtml(empresaNome)}.`,
                status: totalUsuariosContexto > 0 ? 'success' : 'warning',
            },
            {
                title: 'Boas práticas de governança',
                sub: 'Mantenha templates específicos por empresa e revise permissões periodicamente.',
                status: 'warning',
            },
        ];

        container.innerHTML = items.map((item) => `
            <li class="insight-item">
                <div class="item-title">${item.title}</div>
                <div class="item-sub">${item.sub}</div>
                <span class="status-chip ${item.status}">${this.statusLabel(item.status)}</span>
            </li>
        `).join('');
    }

    statusLabel(status) {
        if (status === 'success') return 'OK';
        if (status === 'warning') return 'Atenção';
        return 'Info';
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe).replace(/[&<"'>]/g, (m) => {
            switch (m) {
                case '&': return '&amp;';
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '"': return '&quot;';
                case "'": return '&#039;';
                default: return m;
            }
        });
    }

    renderChart(stats) {
        const ctx = document.getElementById('mainChart');
        if (!ctx) return;
        
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        const isDark = document.body.classList.contains('dark-theme');
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        const textColor = isDark ? '#cbd5e1' : '#475569';
        
        const rootStyle = getComputedStyle(document.body);
        const primaryColorHex = rootStyle.getPropertyValue('--primary-500').trim() || '#7c3aed';
        const secondaryColorHex = rootStyle.getPropertyValue('--secondary-500').trim() || '#3b82f6';
        
        // Converte hex para rgba para o background
        const hexToRgb = (hex) => {
            let h = hex.replace('#', '');
            if(h.length === 3) h = h.split('').map(c => c+c).join('');
            return parseInt(h, 16);
        };
        const num = hexToRgb(primaryColorHex);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        const primaryBg = `rgba(${r}, ${g}, ${b}, 0.2)`;

        const labels = stats?.graficos?.docsPorDia?.map(d => d.data.split('-').reverse().join('/')) || ['Sem dados'];
        const data = stats?.graficos?.docsPorDia?.map(d => d.quantidade) || [0];

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Documentos Gerados',
                    data: data,
                    backgroundColor: primaryBg,
                    borderColor: primaryColorHex,
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 2000,
                    easing: 'easeOutQuart'
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: gridColor },
                        ticks: { color: textColor, stepSize: 1 }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: textColor }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { mode: 'index', intersect: false }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
