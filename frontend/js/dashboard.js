class DashboardManager {
    constructor() {
        this.usuario = window.auth.getUsuario();
        this.chartInstance = null;
        this.topTemplatesChartInstance = null;
        this.state = {
            clientes: [],
            templates: [],
            usuarios: [],
            empresas: [],
            health: null,
            stats: null,
        };

        if (!this.usuario) {
            window.location.href = '/';
            return;
        }

        document.addEventListener('documentospro:themechange', () => this.refreshCharts());
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
        const element = document.getElementById('currentTime');
        if (!element) return;

        const update = () => {
            element.textContent = new Date().toLocaleString('pt-BR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
            });
        };

        update();
        setInterval(update, 60_000);
    }

    applyBaseIdentity() {
        const empresaNome = window.auth.getEmpresaContextoNome() || this.usuario.empresa_nome || 'Sem empresa';
        const role = this.usuario.role === 'master' ? 'Master' : 'Usuário';
        const firstName = String(this.usuario.nome || '').trim().split(/\s+/)[0] || 'Olá';

        document.getElementById('heroTitle').textContent = `Olá, ${firstName}! 👋`;
        document.getElementById('heroSubtitle').textContent = 'Aqui está o panorama da sua empresa hoje.';
        document.getElementById('metaRole').textContent = `Perfil: ${role}`;
        document.getElementById('metaEmpresa').textContent = `Empresa: ${empresaNome}`;
    }

    async fetchJson(url) {
        const response = await window.auth.fetchWithAuth(url);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || `Falha em ${url}`);
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
        document.getElementById('metaHealth').textContent = ok ? 'API: Online' : 'API: Instável';
    }

    renderCompanyPanel({ active, name, description }) {
        const companyName = name || 'Sem empresa selecionada';
        const initial = companyName.trim().charAt(0).toUpperCase() || 'D';
        document.getElementById('companyInitial').textContent = initial;
        document.getElementById('metaEmpresa').textContent = `Empresa: ${companyName}`;

        if (active) {
            this.setContextBanner('success', companyName, description || 'Dados filtrados pela empresa ativa.');
            return;
        }

        this.setContextBanner(
            'warning',
            'Contexto de empresa não selecionado',
            'Escolha uma empresa para habilitar clientes, templates e documentos.',
            '<a href="/empresas" class="btn btn-primary">Selecionar empresa</a>'
        );
    }

    async loadMasterWithoutContext() {
        try {
            const [empresas, health] = await Promise.all([
                this.fetchJson('/api/empresas'),
                this.fetchJson('/api/health').catch(() => null),
            ]);

            this.state.empresas = Array.isArray(empresas) ? empresas : [];
            this.state.health = health;
            this.setHealthStatus(!!health?.ok);
            this.renderCompanyPanel({ active: false });
            this.renderKpis({ documentos: 0, clientes: 0, templates: 0, usuarios: 0 });
            this.renderOperationalInsights([
                `Empresas cadastradas: <strong>${this.state.empresas.length}</strong>.`,
                'Selecione uma empresa para liberar os indicadores operacionais.',
            ]);
            this.renderRecentActivity([], 'Selecione uma empresa para visualizar a atividade.');
            this.renderMasterInsights(this.state.empresas, []);
            this.renderDocumentsChart(null);
            this.renderTopTemplatesChart(null);
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
            this.state.clientes = Array.isArray(results[0]) ? results[0] : [];
            this.state.templates = Array.isArray(results[1]) ? results[1] : [];
            this.state.health = results[2] || null;
            this.state.stats = results[3] || null;
            this.state.usuarios = this.usuario.role === 'master' && Array.isArray(results[4]) ? results[4] : [];
            this.state.empresas = this.usuario.role === 'master' && Array.isArray(results[5]) ? results[5] : [];

            const statsKpis = this.state.stats?.kpis || {};
            const clientes = Number.isFinite(Number(statsKpis.clientes))
                ? Number(statsKpis.clientes)
                : this.state.clientes.length;
            const documentos = Number.isFinite(Number(statsKpis.documentos))
                ? Number(statsKpis.documentos)
                : 0;
            const usuarios = this.usuario.role === 'master' ? this.state.usuarios.length : 1;
            const empresaNome = window.auth.getEmpresaContextoNome() || this.usuario.empresa_nome || 'Empresa ativa';

            this.setHealthStatus(!!this.state.health?.ok);
            this.renderCompanyPanel({
                active: true,
                name: empresaNome,
                description: 'Ambiente pronto para operar com dados isolados.',
            });
            this.renderKpis({
                documentos,
                clientes,
                templates: this.state.templates.length,
                usuarios,
            });
            this.renderOperationalInsights(this.buildOperationalInsights());
            this.renderRecentActivity(this.state.clientes);
            this.renderDocumentsChart(this.state.stats);
            this.renderTopTemplatesChart(this.state.stats);

            if (this.usuario.role === 'master') {
                this.renderMasterInsights(this.state.empresas, this.state.usuarios);
            }
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    formatNumber(value) {
        return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
    }

    renderKpis({ documentos, clientes, templates, usuarios }) {
        const values = { kpiDocumentos: documentos, kpiClientes: clientes, kpiTemplates: templates, kpiUsuarios: usuarios };
        Object.entries(values).forEach(([id, value]) => {
            document.getElementById(id).textContent = this.formatNumber(value);
        });

        document.getElementById('kpiDocumentosTrend').textContent = documentos
            ? 'Total registrado no sistema'
            : 'Nenhum documento registrado';
        document.getElementById('kpiClientesTrend').textContent = clientes
            ? 'Base da empresa ativa'
            : 'Cadastre clientes para começar';
        document.getElementById('kpiTemplatesTrend').textContent = templates
            ? 'Modelos disponíveis para produção'
            : 'Cadastre um template para gerar';
        document.getElementById('kpiUsuariosTrend').textContent = usuarios
            ? 'Acessos ativos no contexto'
            : 'Nenhum acesso no contexto';

        const capacidade = (Number(clientes) || 0) * (Number(templates) || 0);
        document.getElementById('kpiCapacidade').textContent = this.formatNumber(capacidade);
        document.getElementById('kpiCapacidadeTrend').textContent = 'Clientes × templates';
    }

    buildOperationalInsights() {
        const clientes = this.state.clientes;
        const templates = this.state.templates;
        const clientesComCpf = clientes.filter((cliente) => String(cliente?.dados?.cpf || '').trim()).length;
        const clientesComEmail = clientes.filter((cliente) => String(cliente?.dados?.email || '').trim()).length;
        const mediaCampos = templates.length
            ? Math.round(templates.reduce((sum, template) => sum + (Array.isArray(template.campos) ? template.campos.length : 0), 0) / templates.length)
            : 0;

        return [
            `Clientes com CPF: <strong>${clientesComCpf} de ${clientes.length}</strong>.`,
            `Clientes com e-mail: <strong>${clientesComEmail} de ${clientes.length}</strong>.`,
            `Média de campos por template: <strong>${mediaCampos}</strong>.`,
        ];
    }

    renderOperationalInsights(items) {
        document.getElementById('operationalInsights').innerHTML = items.map((item) => `
            <li class="insight-item"><span class="insight-marker" aria-hidden="true"></span><div class="item-title">${item}</div></li>
        `).join('');
    }

    renderRecentActivity(clientes, emptyMessage = 'Ainda não há atividade para exibir.') {
        const container = document.getElementById('recentActivity');
        if (!Array.isArray(clientes) || clientes.length === 0) {
            container.innerHTML = `<li class="activity-item empty"><div class="item-title">Sem registros recentes</div><div class="item-sub">${emptyMessage}</div></li>`;
            return;
        }

        const sorted = [...clientes]
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);
        container.innerHTML = sorted.map((cliente) => {
            const nome = this.escapeHtml(cliente?.dados?.nome || 'Cliente sem nome');
            const cpf = this.escapeHtml(cliente?.dados?.cpf || 'CPF não informado');
            const created = cliente?.created_at ? new Date(cliente.created_at).toLocaleDateString('pt-BR') : '-';
            const initial = nome.charAt(0).toUpperCase();
            return `<li class="activity-item"><span class="activity-avatar">${initial}</span><div class="activity-copy"><div class="item-title">${nome}</div><div class="item-sub">Cliente cadastrado • ${cpf}</div></div><time>${created}</time></li>`;
        }).join('');
    }

    renderMasterInsights(empresas, usuarios) {
        const container = document.getElementById('masterInsights');
        if (!container) return;
        const items = [
            `Empresas cadastradas: <strong>${Array.isArray(empresas) ? empresas.length : 0}</strong>.`,
            `Usuários no contexto: <strong>${Array.isArray(usuarios) ? usuarios.length : 0}</strong>.`,
            'Revise permissões e identidade visual periodicamente.',
        ];
        container.innerHTML = items.map((item) => `<li class="insight-item"><span class="insight-marker"></span><div class="item-title">${item}</div></li>`).join('');
    }

    chartColors() {
        const style = getComputedStyle(document.body);
        return {
            primary: style.getPropertyValue('--primary-500').trim() || '#7c3aed',
            secondary: style.getPropertyValue('--secondary-500').trim() || '#2563eb',
            text: style.getPropertyValue('--text-secondary').trim() || '#b6c5d9',
            border: style.getPropertyValue('--border-soft').trim() || 'rgba(132, 180, 232, 0.16)',
            panel: style.getPropertyValue('--surface-panel-strong').trim() || '#0e294a',
            info: style.getPropertyValue('--info').trim() || '#72a2ed',
        };
    }

    renderDocumentsChart(stats) {
        const canvas = document.getElementById('mainChart');
        if (!canvas || typeof window.Chart === 'undefined') return;
        this.chartInstance?.destroy();

        const colors = this.chartColors();
        const points = Array.isArray(stats?.graficos?.docsPorDia) ? stats.graficos.docsPorDia : [];
        const labels = points.length ? points.map((item) => item.data.split('-').reverse().join('/')) : ['Sem dados'];
        const data = points.length ? points.map((item) => Number(item.quantidade) || 0) : [0];
        const gradient = canvas.getContext('2d').createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, colors.primary);
        gradient.addColorStop(1, colors.secondary);

        this.chartInstance = new window.Chart(canvas, {
            type: 'bar',
            data: { labels, datasets: [{ label: 'Documentos', data, backgroundColor: gradient, borderRadius: 5, borderSkipped: false, maxBarThickness: 28 }] },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 },
                scales: {
                    y: { beginAtZero: true, grid: { color: colors.border }, ticks: { color: colors.text, precision: 0 } },
                    x: { grid: { display: false }, ticks: { color: colors.text, maxRotation: 0 } },
                },
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            },
        });
    }

    renderTopTemplatesChart(stats) {
        const canvas = document.getElementById('topTemplatesChart');
        const legend = document.getElementById('topTemplatesLegend');
        const items = Array.isArray(stats?.graficos?.topTemplates) ? stats.graficos.topTemplates : [];
        const colors = this.chartColors();
        const palette = [colors.primary, colors.secondary, colors.info, colors.text];

        legend.innerHTML = items.length
            ? items.map((item, index) => `<li><span class="legend-dot" style="--legend-color: ${palette[index % palette.length]}"></span><span>${this.escapeHtml(item.nome || item.label || 'Template')}</span><strong>${this.formatNumber(item.quantidade)}</strong></li>`).join('')
            : '<li class="chart-empty">Sem dados de utilização</li>';

        if (!canvas || typeof window.Chart === 'undefined') return;
        this.topTemplatesChartInstance?.destroy();
        this.topTemplatesChartInstance = new window.Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: items.length ? items.map((item) => item.nome || item.label || 'Template') : ['Sem dados'],
                datasets: [{ data: items.length ? items.map((item) => Number(item.quantidade) || 0) : [1], backgroundColor: items.length ? palette.slice(0, items.length) : [colors.border], borderColor: colors.panel, borderWidth: 3, hoverOffset: 2 }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                animation: { duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500 },
                plugins: { legend: { display: false } },
            },
        });
    }

    refreshCharts() {
        this.renderDocumentsChart(this.state.stats);
        this.renderTopTemplatesChart(this.state.stats);
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe).replace(/[&<"'>]/g, (character) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#039;',
        })[character]);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboardManager = new DashboardManager();
});
