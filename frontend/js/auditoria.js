class AuditoriaManager {
    constructor() {
        this.init();
    }

    async init() {
        await this.carregarLogs();
    }

    async carregarLogs() {
        const tbody = document.getElementById('logsTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Carregando...</td></tr>';
        
        try {
            const response = await window.auth.fetchWithAuth('/api/auditoria');
            if (!response.ok) throw new Error('Erro ao carregar auditoria');
            
            const logs = await response.json();
            
            const countEl = document.getElementById('totalLogsCount');
            if (countEl) countEl.textContent = logs.length;

            if (logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-[var(--text-muted)]">Nenhum registro encontrado.</td></tr>';
                return;
            }

            tbody.innerHTML = logs.map(log => {
                const data = new Date(log.created_at).toLocaleString('pt-BR');
                const user = log.usuario_nome || 'Sistema';
                let tagClass = 'bg-[var(--bg-panel-hover)] text-[var(--text-main)]';
                
                // Definir cores das tags de ação
                if (log.acao.includes('CRIADO')) tagClass = 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30';
                else if (log.acao.includes('EXCLUIDO')) tagClass = 'bg-red-500/20 text-red-500 border border-red-500/30';
                else if (log.acao.includes('LOGIN')) tagClass = 'bg-blue-500/20 text-blue-500 border border-blue-500/30';
                else if (log.acao.includes('GERADO')) tagClass = 'bg-[var(--primary-100)] text-[var(--primary-700)] border border-[var(--primary-300)]';
                
                const detalheHtml = typeof log.detalhe === 'object' 
                    ? `<pre class="text-xs p-2 bg-[var(--bg-panel-muted)] rounded border border-[var(--border-subtle)] overflow-x-auto m-0">${JSON.stringify(log.detalhe, null, 2)}</pre>`
                    : `<span>${this.escapeHtml(log.detalhe || '')}</span>`;

                return `
                <tr class="hover:bg-[var(--bg-panel-hover)] transition-colors">
                    <td class="text-xs text-[var(--text-muted)]">${data}</td>
                    <td class="font-medium">${this.escapeHtml(user)}</td>
                    <td><span class="px-2 py-1 rounded text-xs font-bold ${tagClass}">${this.escapeHtml(log.acao)}</span></td>
                    <td class="text-sm max-w-xs">${detalheHtml}</td>
                    <td class="text-xs text-[var(--text-muted)]">${this.escapeHtml(log.ip || '-')}</td>
                </tr>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Erro:', error);
            tbody.innerHTML = '<tr><td colspan="5" class="text-center text-red-500">Falha ao carregar logs.</td></tr>';
        }
    }

    escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.auditoria = new AuditoriaManager();
});
