class DocumentosManager {
    constructor() {
        this.clientes = [];
        this.templates = [];
        this.selectedClientes = new Set();
        this.selectedTemplates = new Set();
        this.camposNecessarios = [];
        this.usuario = window.auth.getUsuario();
        this.folderHandle = null;

        if (this.usuario?.role === 'master' && !window.auth.ensureEmpresaContexto()) {
            this.renderNeedContext();
            return;
        }

        this.init();
    }

    renderNeedContext() {
        const container = document.querySelector('.documentos-container');
        if (!container) return;
        container.innerHTML = `
            <div class="no-data">
                <h3>Selecione uma empresa primeiro</h3>
                <p>Vá para Empresas, entre em uma empresa e volte para gerar documentos.</p>
                <a href="/empresas" class="btn btn-primary">Ir para Empresas</a>
            </div>
        `;
    }

    init() {
        this.setupEventListeners();
        Promise.all([this.loadClientes(), this.loadTemplates()]).catch(() => {
            window.auth.showNotification('Erro ao carregar dados para geracao', 'error');
        });
    }

    setupEventListeners() {
        document.getElementById('gerarDocumentosBtn')?.addEventListener('click', () => this.gerarDocumentos());
        document.getElementById('editarCamposBtn')?.addEventListener('click', () => this.abrirEdicaoCampos());
        document.getElementById('searchClientesDoc')?.addEventListener('input', (e) => this.filterClientesSelection(e.target.value));
        document.getElementById('searchTemplatesDoc')?.addEventListener('input', (e) => this.filterTemplatesSelection(e.target.value));
        document.getElementById('downloadMode')?.addEventListener('change', () => {
            if (document.getElementById('downloadMode').value !== 'folder') {
                this.folderHandle = null;
            }
        });
    }

    getOutputFormat() {
        const selected = document.querySelector('input[name="outputFormat"]:checked');
        return selected ? selected.value : 'both';
    }

    getDownloadMode() {
        return document.getElementById('downloadMode')?.value || 'browser';
    }

    async loadClientes() {
        const response = await window.auth.fetchWithAuth('/api/clientes');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao carregar clientes');
        this.clientes = data;
        this.renderClientesSelection();
    }

    async loadTemplates() {
        const response = await window.auth.fetchWithAuth('/api/templates');
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Erro ao carregar templates');
        this.templates = data;
        this.renderTemplatesSelection();
    }

    escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    renderClientesSelection() {
        const container = document.getElementById('clientesSelection');
        if (!container) return;

        if (!this.clientes.length) {
            container.innerHTML = '<p class="no-data">Nenhum cliente cadastrado</p>';
            return;
        }

        container.innerHTML = this.clientes.map((cliente) => {
            const d = cliente.dados || {};
            // Função rápida para buscar chave ignorando case e espaços
            const findKey = (...keys) => {
                const searchKeys = keys.map(k => k.toLowerCase().replace(/[^a-z0-9]/g, ''));
                for (const k in d) {
                    const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (searchKeys.includes(normK) && d[k]) return d[k];
                }
                return null;
            };

            const banco = findKey('nomedafinanceira', 'nomefinanceira', 'financeira', 'banco', 'instituicaofinanceira') || 'Banco ñ inf.';
            const contrato = findKey('numerodocontrato', 'numerocontrato', 'contrato') || 'Contrato ñ inf.';
            return `
            <label for="cliente_doc_${cliente.id}">
                <input type="checkbox" id="cliente_doc_${cliente.id}" value="${cliente.id}"
                       onchange="documentosManager.toggleClienteSelection(${cliente.id}, this.checked)"
                       ${this.selectedClientes.has(cliente.id) ? 'checked' : ''}>
                <div class="item-content">
                    <span class="item-title">${this.escapeHtml(cliente.dados?.nome || 'Sem Nome')}</span>
                    <span class="item-subtitle">
                        CPF: ${this.escapeHtml(cliente.dados?.cpf || '')} &bull; 
                        ${this.escapeHtml(banco)} &bull; 
                        Contrato: ${this.escapeHtml(contrato)}
                    </span>
                </div>
            </label>
            `;
        }).join('');
    }

    renderTemplatesSelection() {
        const container = document.getElementById('templatesSelection');
        if (!container) return;

        if (!this.templates.length) {
            container.innerHTML = '<p class="no-data">Nenhum template disponivel</p>';
            return;
        }

        container.innerHTML = this.templates.map((template) => {
            const camposLength = template.campos ? template.campos.length : 0;
            return `
            <label for="template_doc_${template.id}">
                <input type="checkbox" id="template_doc_${template.id}" value="${template.id}"
                       onchange="documentosManager.toggleTemplateSelection(${template.id}, this.checked)"
                       ${this.selectedTemplates.has(template.id) ? 'checked' : ''}>
                <div class="item-content">
                    <span class="item-title">${template.id} - ${this.escapeHtml(template.nome)}</span>
                    <span class="item-subtitle">(${camposLength} campos configuráveis)</span>
                </div>
            </label>
            `;
        }).join('');
    }

    toggleClienteSelection(clienteId, isSelected) {
        if (isSelected) this.selectedClientes.add(clienteId);
        else this.selectedClientes.delete(clienteId);
        this.updateSelectionCounts();
        this.updateCamposNecessarios();
    }

    toggleTemplateSelection(templateId, isSelected) {
        if (isSelected) this.selectedTemplates.add(templateId);
        else this.selectedTemplates.delete(templateId);
        this.updateSelectionCounts();
        this.updateCamposNecessarios();
    }

    updateSelectionCounts() {
        const clientesCount = this.selectedClientes.size;
        const templatesCount = this.selectedTemplates.size;
        const totalDocumentos = clientesCount * templatesCount;

        document.getElementById('clientesSelecionadosCount').textContent = clientesCount;
        document.getElementById('templatesSelecionadosCount').textContent = templatesCount;
        document.getElementById('totalDocumentosCount').textContent = totalDocumentos;

        const hasSelection = clientesCount > 0 && templatesCount > 0;
        document.getElementById('gerarDocumentosBtn').disabled = !hasSelection;
        document.getElementById('editarCamposBtn').disabled = !hasSelection;
    }

    updateCamposNecessarios() {
        const seen = new Set();
        const campos = [];

        this.selectedTemplates.forEach((id) => {
            const template = this.templates.find((t) => t.id === id);
            if (!template || !Array.isArray(template.campos)) return;
            template.campos.forEach((campo) => {
                const key = String(campo).toLowerCase().replace(/\s+/g, '');
                if (seen.has(key)) return;
                seen.add(key);
                campos.push(String(campo).trim());
            });
        });

        this.camposNecessarios = campos;
    }

    filterClientesSelection(termo) {
        const normalized = String(termo || '').toLowerCase();
        document.querySelectorAll('#clientesSelection label').forEach((item) => {
            item.style.display = item.textContent.toLowerCase().includes(normalized) ? 'flex' : 'none';
        });
    }

    filterTemplatesSelection(termo) {
        const normalized = String(termo || '').toLowerCase();
        document.querySelectorAll('#templatesSelection label').forEach((item) => {
            item.style.display = item.textContent.toLowerCase().includes(normalized) ? 'flex' : 'none';
        });
    }

    async abrirEdicaoCampos() {
        if (!this.selectedClientes.size || !this.selectedTemplates.size) {
            window.auth.showNotification('Selecione ao menos um cliente e um template', 'error');
            return;
        }

        const clienteId = Array.from(this.selectedClientes)[0];
        const cliente = this.clientes.find((c) => c.id === clienteId);
        if (!cliente) return;

        const clienteNome = document.getElementById('clienteEditandoNome');
        if (clienteNome) clienteNome.textContent = cliente.dados?.nome || 'Sem nome';

        const container = document.getElementById('camposEspecificos');
        container.innerHTML = '';

        const campos = ['nome', 'cpf', ...this.camposNecessarios.filter((c) => !['nome', 'cpf'].includes(String(c).toLowerCase()))];
        campos.forEach((campo) => {
            const safeId = String(campo).replace(/\s+/g, '_');
            const val = cliente.dados?.[campo] || '';
            const campoLower = String(campo).toLowerCase().replace(/[\s_]+/g, '');
            const div = document.createElement('div');
            div.className = 'form-group';

            if (campoLower === 'produtovendido' || campoLower === 'produto') {
                const produtosList = [
                    'Prestação de Serviços', 'Averbação', 'Defesa de Busca e Apreensão',
                    'Emissão de Documentos (Atualização de Parecer Técnico)',
                    'Emissão de Documentos (Certidão)', 'Emissão de Documentos (Parecer Técnico)',
                    'Emissão de Documentos (Litispendencia)', 'Citação', 'Custas', 'Audiencia',
                    'Distrato', 'Despacho', 'Homologação', 'Solicitação de Consignação de Parcelas',
                    'Consignação de Parcela'
                ];
                const isOutros = val && !produtosList.includes(val);
                
                div.innerHTML = `
                    <label for="select_${safeId}">${this.escapeHtml(String(campo).toUpperCase())}</label>
                    <select id="select_${safeId}" 
                            ${isOutros ? '' : `name="${this.escapeHtml(campo)}"`}
                            onchange="
                                const input = document.getElementById('input_${safeId}');
                                if(this.value === 'Outros') {
                                    input.style.display = 'block';
                                    input.name = '${this.escapeHtml(campo)}';
                                    this.name = '';
                                    input.focus();
                                } else {
                                    input.style.display = 'none';
                                    input.name = '';
                                    this.name = '${this.escapeHtml(campo)}';
                                }
                            ">
                        <option value="">Selecione o produto...</option>
                        ${produtosList.map(p => `<option value="${p}" ${val === p ? 'selected' : ''}>${p}</option>`).join('')}
                        <option value="Outros" ${isOutros ? 'selected' : ''}>Outros (Digitar manualmente)</option>
                    </select>
                    <input type="text" id="input_${safeId}" 
                           ${isOutros ? `name="${this.escapeHtml(campo)}" style="display:block; margin-top:8px;" value="${this.escapeHtml(val)}"` 
                                      : `style="display:none; margin-top:8px;" value=""`} 
                           placeholder="Digite o nome do produto..." 
                           class="form-control" />
                `;
            } else if (campoLower === 'estado' || campoLower === 'uf') {
                div.innerHTML = `
                    <label for="campo_${safeId}">${this.escapeHtml(String(campo).toUpperCase())}</label>
                    <select id="campo_${safeId}" name="${this.escapeHtml(campo)}">
                        <option value="">Selecione o estado...</option>
                        <option value="Acre" ${val === 'Acre' ? 'selected' : ''}>Acre (AC)</option>
                        <option value="Alagoas" ${val === 'Alagoas' ? 'selected' : ''}>Alagoas (AL)</option>
                        <option value="Amapá" ${val === 'Amapá' ? 'selected' : ''}>Amapá (AP)</option>
                        <option value="Amazonas" ${val === 'Amazonas' ? 'selected' : ''}>Amazonas (AM)</option>
                        <option value="Bahia" ${val === 'Bahia' ? 'selected' : ''}>Bahia (BA)</option>
                        <option value="Ceará" ${val === 'Ceará' ? 'selected' : ''}>Ceará (CE)</option>
                        <option value="Distrito Federal" ${val === 'Distrito Federal' ? 'selected' : ''}>Distrito Federal (DF)</option>
                        <option value="Espírito Santo" ${val === 'Espírito Santo' ? 'selected' : ''}>Espírito Santo (ES)</option>
                        <option value="Goiás" ${val === 'Goiás' ? 'selected' : ''}>Goiás (GO)</option>
                        <option value="Maranhão" ${val === 'Maranhão' ? 'selected' : ''}>Maranhão (MA)</option>
                        <option value="Mato Grosso" ${val === 'Mato Grosso' ? 'selected' : ''}>Mato Grosso (MT)</option>
                        <option value="Mato Grosso do Sul" ${val === 'Mato Grosso do Sul' ? 'selected' : ''}>Mato Grosso do Sul (MS)</option>
                        <option value="Minas Gerais" ${val === 'Minas Gerais' ? 'selected' : ''}>Minas Gerais (MG)</option>
                        <option value="Pará" ${val === 'Pará' ? 'selected' : ''}>Pará (PA)</option>
                        <option value="Paraíba" ${val === 'Paraíba' ? 'selected' : ''}>Paraíba (PB)</option>
                        <option value="Paraná" ${val === 'Paraná' ? 'selected' : ''}>Paraná (PR)</option>
                        <option value="Pernambuco" ${val === 'Pernambuco' ? 'selected' : ''}>Pernambuco (PE)</option>
                        <option value="Piauí" ${val === 'Piauí' ? 'selected' : ''}>Piauí (PI)</option>
                        <option value="Rio de Janeiro" ${val === 'Rio de Janeiro' ? 'selected' : ''}>Rio de Janeiro (RJ)</option>
                        <option value="Rio Grande do Norte" ${val === 'Rio Grande do Norte' ? 'selected' : ''}>Rio Grande do Norte (RN)</option>
                        <option value="Rio Grande do Sul" ${val === 'Rio Grande do Sul' ? 'selected' : ''}>Rio Grande do Sul (RS)</option>
                        <option value="Rondônia" ${val === 'Rondônia' ? 'selected' : ''}>Rondônia (RO)</option>
                        <option value="Roraima" ${val === 'Roraima' ? 'selected' : ''}>Roraima (RR)</option>
                        <option value="Santa Catarina" ${val === 'Santa Catarina' ? 'selected' : ''}>Santa Catarina (SC)</option>
                        <option value="São Paulo" ${val === 'São Paulo' ? 'selected' : ''}>São Paulo (SP)</option>
                        <option value="Sergipe" ${val === 'Sergipe' ? 'selected' : ''}>Sergipe (SE)</option>
                        <option value="Tocantins" ${val === 'Tocantins' ? 'selected' : ''}>Tocantins (TO)</option>
                    </select>
                `;
            } else {
                div.innerHTML = `
                    <label for="campo_${safeId}">${this.escapeHtml(String(campo).toUpperCase())}</label>
                    <input type="text" id="campo_${safeId}" name="${this.escapeHtml(campo)}" value="${this.escapeHtml(val)}">
                `;
            }
            container.appendChild(div);
        });

        const form = document.getElementById('formEditarCampos');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.salvarCamposEspecificos(clienteId);
        };

        // Carregar histórico
        await this.carregarHistoricoCliente(clienteId);

        openModal('modalEditarCampos');
    }

    async carregarHistoricoCliente(clienteId) {
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '<div class="history-state">Carregando histórico...</div>';

        try {
            const response = await window.auth.fetchWithAuth(`/api/clientes/${clienteId}/historico`);
            if (!response.ok) throw new Error('Erro ao carregar histórico');
            const historico = await response.json();

            if (!historico || historico.length === 0) {
                historyContainer.innerHTML = '<div class="history-state">Nenhum documento gerado recentemente.</div>';
                return;
            }

            historyContainer.innerHTML = historico.map(doc => {
                const date = new Date(doc.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                const camposHtml = doc.campos_usados && Object.keys(doc.campos_usados).length > 0
                    ? `<div class="history-entry__fields" id="campos-hist-${doc.id}" style="display: none;">
                        <strong>Campos Preenchidos:</strong>
                        <ul>
                            ${Object.entries(doc.campos_usados).map(([k, v]) => `<li><span class="brand-text">${this.escapeHtml(String(k).toUpperCase())}:</span> ${this.escapeHtml(String(v))}</li>`).join('')}
                        </ul>
                       </div>`
                    : `<div class="history-entry__fields" id="campos-hist-${doc.id}" style="display: none;">Nenhum campo registrado.</div>`;

                return `
                <div class="history-entry">
                    <div class="history-entry__header">
                        <strong class="history-entry__filename" title="${this.escapeHtml(doc.nome_arquivo)}">${this.escapeHtml(doc.nome_arquivo)}</strong>
                        <span class="history-entry__date">${date}</span>
                    </div>
                    
                    <div class="history-entry__meta">
                        <span class="history-entry__actor">
                            <i class="ph ph-user"></i> ${this.escapeHtml(doc.usuario_nome || 'Usuário')}
                        </span>
                    </div>
                    
                    <button type="button" 
                        onclick="const el = document.getElementById('campos-hist-${doc.id}'); el.style.display = el.style.display === 'none' ? 'block' : 'none';" 
                        class="history-entry__toggle">
                        <i class="ph ph-caret-down"></i> Ver campos preenchidos
                    </button>
                    ${camposHtml}
                </div>
                `;
            }).join('');
        } catch (error) {
            console.error('History fetch error:', error);
            historyContainer.innerHTML = '<div class="history-state error">Erro ao carregar histórico.</div>';
        }
    }

    async salvarCamposEspecificos(clienteId) {
        const form = document.getElementById('formEditarCampos');
        const formData = new FormData(form);

        try {
            const clienteResponse = await window.auth.fetchWithAuth(`/api/clientes/${clienteId}`);
            const clienteAtual = await clienteResponse.json();
            if (!clienteResponse.ok) {
                throw new Error(clienteAtual.error || 'Cliente nao encontrado');
            }

            const dadosAtualizados = { ...(clienteAtual.dados || {}) };
            for (const [key, value] of formData.entries()) {
                dadosAtualizados[key] = value;
            }

            const updateResponse = await window.auth.fetchWithAuth(`/api/clientes/${clienteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dadosAtualizados)
            });
            const result = await updateResponse.json();
            if (!updateResponse.ok) {
                throw new Error(result.error || 'Erro ao atualizar cliente');
            }

            closeModal('modalEditarCampos');
            window.auth.showNotification('Cliente atualizado com sucesso');
            await this.loadClientes();
        } catch (error) {
            window.auth.showNotification(error.message, 'error');
        }
    }

    async gerarDocumentos() {
        const clienteIds = Array.from(this.selectedClientes);
        const templateIds = Array.from(this.selectedTemplates);
        const outputFormat = this.getOutputFormat();

        if (!clienteIds.length || !templateIds.length) {
            window.auth.showNotification('Selecione clientes e templates', 'error');
            return;
        }

        this.showProgressModal();

        try {
            const response = await window.auth.fetchWithAuth('/api/gerar-documentos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clienteIds, templateIds, outputFormat })
            });
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao iniciar geracao');
            }

            this.monitorProgress(data.generationId);
        } catch (error) {
            this.hideProgressModal();
            window.auth.showNotification(error.message, 'error');
        }
    }

    clearCheckboxes() {
        document.querySelectorAll('#clientesSelection input[type="checkbox"], #templatesSelection input[type="checkbox"]').forEach((input) => {
            input.checked = false;
        });
        this.selectedClientes.clear();
        this.selectedTemplates.clear();
        this.updateSelectionCounts();
    }

    showProgressModal() {
        if (!document.getElementById('progressModal')) {
            const modal = document.createElement('div');
            modal.id = 'progressModal';
            modal.className = 'modal progress-modal';
            modal.innerHTML = `
                <div class="progress-dialog">
                    <div class="progress-dialog__header">
                        <span class="progress-dialog__icon"><i class="ph-fill ph-gear-six"></i></span>
                        <h2>Gerando Documentos</h2>
                    </div>
                    <div class="progress-dialog__body">
                        <div class="progress-container">
                            <div class="progress-meta">
                                <p id="progressStatus">Iniciando...</p>
                                <p id="progressDetails">0 de 0</p>
                            </div>
                            <div class="progress-track">
                                <div id="progressFill" class="progress-fill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div id="progressResults" class="progress-results" style="display:none;">
                            <div class="progress-results__header">
                                <h3>
                                    <i class="ph-fill ph-check-circle"></i> Concluído
                                </h3>
                                <div class="result-actions" id="resultActions"></div>
                            </div>
                            <div id="generatedDocuments" class="generated-documents"></div>
                        </div>
                    </div>
                    <div class="progress-dialog__footer">
                        <button id="closeProgressBtn" class="btn btn-secondary" style="display:none;">Concluir e Fechar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            document.getElementById('closeProgressBtn').addEventListener('click', () => this.hideProgressModal());
        }

        document.getElementById('progressModal').style.display = 'block';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressStatus').textContent = 'Iniciando...';
        document.getElementById('progressDetails').textContent = '0 de 0';
        document.getElementById('progressResults').style.display = 'none';
        document.getElementById('closeProgressBtn').style.display = 'none';
    }

    hideProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) modal.style.display = 'none';
    }

    async monitorProgress(generationId) {
        const poll = setInterval(async () => {
            try {
                const response = await window.auth.fetchWithAuth(`/api/gerar-documentos/progresso/${generationId}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || 'Erro ao acompanhar geracao');
                }

                const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;
                document.getElementById('progressFill').style.width = `${percentage}%`;
                document.getElementById('progressDetails').textContent = `${data.completed} de ${data.total}`;
                document.getElementById('progressStatus').textContent = data.status === 'completed' ? 'Concluido' : 'Gerando...';

                if (data.status === 'completed' || data.status === 'failed') {
                    clearInterval(poll);
                    await this.showGenerationResults(data);
                    document.getElementById('closeProgressBtn').style.display = 'block';
                    this.clearCheckboxes();
                }
            } catch (error) {
                clearInterval(poll);
                this.hideProgressModal();
                window.auth.showNotification(error.message, 'error');
            }
        }, 1000);
    }

    async showGenerationResults(progress) {
        const results = document.getElementById('progressResults');
        const list = document.getElementById('generatedDocuments');
        const resultActions = document.getElementById('resultActions');
        results.style.display = 'block';

        const documentos = Array.isArray(progress.documentos) ? progress.documentos : [];
        if (!documentos.length) {
            list.innerHTML = '<p>Nenhum documento gerado.</p>';
            return;
        }

        resultActions.innerHTML = `<button class="btn btn-primary" id="downloadAllBtn"><i class="ph-fill ph-download-simple"></i> Baixar todos</button>`;
        document.getElementById('downloadAllBtn').addEventListener('click', async () => {
            await this.downloadAllDocuments(documentos);
        });

        list.innerHTML = documentos.map((doc, index) => `
            <div class="generated-document">
                <div class="generated-document__row">
                    <div class="generated-document__copy">
                        <strong title="${this.escapeHtml(doc.nomeArquivo || doc.nome)}">
                            ${this.escapeHtml(doc.nomeArquivo || doc.nome)}
                        </strong>
                        <small>
                            <i class="ph-fill ph-user"></i>${this.escapeHtml(doc.nomeCliente || doc.cliente || '-')}
                        </small>
                    </div>
                    <div class="generated-document__actions">
                        ${doc.docxDownloadUrl ? `<button class="btn btn-secondary" data-type="docx" data-index="${index}"><i class="ph-fill ph-file-doc"></i> Word</button>` : ''}
                        ${doc.pdfDownloadUrl ? `<button class="btn btn-danger" data-type="pdf" data-index="${index}"><i class="ph-fill ph-file-pdf"></i> PDF</button>` : ''}
                    </div>
                </div>
            </div>
        `).join('');

        list.querySelectorAll('button[data-type]').forEach((button) => {
            button.addEventListener('click', async () => {
                const idx = Number(button.getAttribute('data-index'));
                const type = button.getAttribute('data-type');
                const doc = documentos[idx];
                if (!doc) return;

                const url = type === 'pdf' ? doc.pdfDownloadUrl : doc.docxDownloadUrl;
                const fileName = type === 'pdf'
                    ? (doc.pdfFileName || `${doc.nome}.pdf`)
                    : (doc.docxFileName || `${doc.nome}.docx`);

                await this.downloadDocumento(url, fileName, this.getDownloadMode());
            });
        });

        if (progress.erros?.length) {
            list.innerHTML += `
                <div class="generation-errors">
                    <h4>Erros encontrados:</h4>
                    <ul>${progress.erros.map((e) => `<li>${this.escapeHtml(e.error || String(e))}</li>`).join('')}</ul>
                </div>
            `;
        }

        window.auth.showNotification(`${documentos.length} documento(s) gerado(s)`);
        const currentMode = this.getDownloadMode();
        if (currentMode === 'folder' || currentMode === 'auto') {
            try {
                await this.downloadAllDocuments(documentos);
            } catch (_error) {
                // Usuario pode cancelar a selecao de pasta ou download falhar.
            }
        }
    }

    async downloadAllDocuments(documentos) {
        if (!Array.isArray(documentos) || !documentos.length) return;

        const mode = this.getDownloadMode();
        for (const doc of documentos) {
            if (doc.docxDownloadUrl) {
                const fallback = doc.docxFileName || `${doc.nome}.docx`;
                await this.downloadDocumento(doc.docxDownloadUrl, fallback, mode);
            }
            if (doc.pdfDownloadUrl) {
                const fallback = doc.pdfFileName || `${doc.nome}.pdf`;
                await this.downloadDocumento(doc.pdfDownloadUrl, fallback, mode);
            }
        }

        window.auth.showNotification('Download concluido');
    }

    async ensureFolderHandle() {
        if (this.folderHandle) return this.folderHandle;

        if (!window.showDirectoryPicker) {
            throw new Error('Seu navegador nao suporta escolha de pasta. Use Chrome ou Edge atualizados.');
        }

        this.folderHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
        return this.folderHandle;
    }

    extractFilenameFromResponse(response, fallbackName) {
        const contentDisposition = response.headers.get('content-disposition') || '';
        const utfMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        if (utfMatch && utfMatch[1]) {
            try {
                return decodeURIComponent(utfMatch[1]);
            } catch {
                return fallbackName;
            }
        }

        const simpleMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        if (simpleMatch && simpleMatch[1]) return simpleMatch[1];

        return fallbackName;
    }

    async downloadDocumento(url, fallbackName, mode = 'browser') {
        if (!url) return;

        const response = await window.auth.fetchWithAuth(url);
        if (!response.ok) {
            let message = 'Erro ao baixar arquivo';
            try {
                const data = await response.json();
                message = data.error || message;
            } catch {
                // noop
            }
            throw new Error(message);
        }

        const fileName = this.extractFilenameFromResponse(response, fallbackName);
        const blob = await response.blob();

        if (mode === 'folder') {
            const folderHandle = await this.ensureFolderHandle();
            const fileHandle = await folderHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            return;
        }

        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.documentosManager = new DocumentosManager();
});
