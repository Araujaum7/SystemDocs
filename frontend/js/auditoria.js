class AuditoriaManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.carregarLogs();
    }

    async carregarLogs() {
        const tbody = document.getElementById('logsTableBody');
        tbody.dataset.state = 'loading';
        tbody.innerHTML = '<tr><td colspan="5" class="table-state"><span role="status">Carregando logs...</span></td></tr>';
        
        try {
            const response = await window.auth.fetchWithAuth('/api/auditoria');
            const logs = await response.json();
            if (!response.ok) throw new Error(logs.error || 'Erro ao carregar auditoria');
            
            const countEl = document.getElementById('totalLogsCount');
            if (countEl) countEl.textContent = logs.length;

            if (logs.length === 0) {
                tbody.dataset.state = 'empty';
                tbody.innerHTML = '<tr><td colspan="5" class="table-state">Nenhum registro encontrado.</td></tr>';
                return;
            }

            tbody.dataset.state = 'ready';
            tbody.innerHTML = logs.map(log => {
                const data = new Date(log.created_at).toLocaleString('pt-BR');
                const user = log.usuario_nome || 'Sistema';
                let tagClass = 'info';
                
                // Definir cores das tags de ação
                if (log.acao.includes('CRIADO')) tagClass = 'success';
                else if (log.acao.includes('EXCLUIDO')) tagClass = 'danger';
                else if (log.acao.includes('LOGIN')) tagClass = 'info';
                else if (log.acao.includes('GERADO')) tagClass = 'brand';
                
                const detalheHtml = typeof log.detalhe === 'object' 
                    ? `<pre class="audit-detail-json">${this.escapeHtml(JSON.stringify(log.detalhe, null, 2))}</pre>`
                    : `<span>${this.escapeHtml(log.detalhe || '')}</span>`;

                return `
                <tr>
                    <td class="audit-muted">${data}</td>
                    <td class="audit-user">${this.escapeHtml(user)}</td>
                    <td><span class="audit-action-badge ${tagClass}">${this.escapeHtml(log.acao)}</span></td>
                    <td class="audit-details">${detalheHtml}</td>
                    <td class="audit-muted">${this.escapeHtml(log.ip || '-')}</td>
                </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Erro:', error);
            const countEl = document.getElementById('totalLogsCount');
            if (countEl) countEl.textContent = '-';
            tbody.dataset.state = 'error';
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="table-state error">
                        <div class="table-state__content" role="alert">
                            <strong>N&atilde;o foi poss&iacute;vel carregar os logs.</strong>
                            <span>${this.escapeHtml(error.message)}</span>
                            <button class="btn btn-secondary" id="retryAuditBtn" type="button">Tentar novamente</button>
                        </div>
                    </td>
                </tr>
            `;
            document.getElementById('retryAuditBtn')?.addEventListener('click', () => this.carregarLogs());
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.auditoria = new AuditoriaManager();
});
