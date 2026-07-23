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

    abrirEdicaoCampos() {
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
                div.innerHTML = `
                    <label for="campo_${safeId}">${this.escapeHtml(String(campo).toUpperCase())}</label>
                    <select id="campo_${safeId}" name="${this.escapeHtml(campo)}">
                        <option value="">Selecione o produto...</option>
                        <option value="Prestação de Serviços" ${val === 'Prestação de Serviços' ? 'selected' : ''}>Prestação de Serviços</option>
                        <option value="Averbação" ${val === 'Averbação' ? 'selected' : ''}>Averbação</option>
                        <option value="Defesa de Busca e Apreensão" ${val === 'Defesa de Busca e Apreensão' ? 'selected' : ''}>Defesa de Busca e Apreensão</option>
                        <option value="Emissão de Documentos (Atualização de Parecer Técnico)" ${val === 'Emissão de Documentos (Atualização de Parecer Técnico)' ? 'selected' : ''}>Emissão de Documentos (Atualização de Parecer Técnico)</option>
                        <option value="Emissão de Documentos (Certidão)" ${val === 'Emissão de Documentos (Certidão)' ? 'selected' : ''}>Emissão de Documentos (Certidão)</option>
                        <option value="Emissão de Documentos (Parecer Técnico)" ${val === 'Emissão de Documentos (Parecer Técnico)' ? 'selected' : ''}>Emissão de Documentos (Parecer Técnico)</option>
                        <option value="Emissão de Documentos (Litispendencia)" ${val === 'Emissão de Documentos (Litispendencia)' ? 'selected' : ''}>Emissão de Documentos (Litispendencia)</option>
                        <option value="Citação" ${val === 'Citação' ? 'selected' : ''}>Citação</option>
                        <option value="Custas" ${val === 'Custas' ? 'selected' : ''}>Custas</option>
                        <option value="Audiencia" ${val === 'Audiencia' ? 'selected' : ''}>Audiencia</option>
                        <option value="Distrato" ${val === 'Distrato' ? 'selected' : ''}>Distrato</option>
                        <option value="Despacho" ${val === 'Despacho' ? 'selected' : ''}>Despacho</option>
                        <option value="Homologação" ${val === 'Homologação' ? 'selected' : ''}>Homologação</option>
                    </select>
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

        openModal('modalEditarCampos');
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
            modal.className = 'modal fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all';
            modal.innerHTML = `
                <div class="bg-[var(--bg-panel)] rounded-2xl border border-[var(--border-subtle)] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col transform transition-all">
                    <div class="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center gap-3">
                        <span class="icon text-[var(--primary-500)] text-2xl"><i class="ph-fill ph-gear-six animate-spin"></i></span>
                        <h2 class="text-xl font-display font-bold text-white m-0">Gerando Documentos</h2>
                    </div>
                    <div class="p-6">
                        <div class="progress-container bg-[var(--bg-panel-muted)] rounded-xl p-6 border border-[var(--border-subtle)]">
                            <div class="flex justify-between items-end mb-2">
                                <p id="progressStatus" class="text-sm font-semibold text-[var(--text-main)] m-0">Iniciando...</p>
                                <p id="progressDetails" class="text-xs text-[var(--text-light)] m-0">0 de 0</p>
                            </div>
                            <div class="h-2 w-full bg-[var(--border-strong)] rounded-full overflow-hidden">
                                <div class="h-full bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-500)] transition-all duration-300" id="progressFill" style="width: 0%"></div>
                            </div>
                        </div>
                        <div id="progressResults" class="mt-6" style="display:none;">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-lg font-bold text-white m-0 flex items-center gap-2">
                                    <i class="ph-fill ph-check-circle text-green-500"></i> Concluído
                                </h3>
                                <div class="result-actions" id="resultActions"></div>
                            </div>
                            <div id="generatedDocuments" class="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar"></div>
                        </div>
                    </div>
                    <div class="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-panel-muted)] flex justify-end">
                        <button id="closeProgressBtn" class="btn btn-secondary px-6" style="display:none;">Concluir e Fechar</button>
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

        resultActions.innerHTML = `<button class="btn btn-primary text-sm flex items-center gap-2 py-1.5" id="downloadAllBtn"><i class="ph-fill ph-download-simple"></i> Baixar todos</button>`;
        document.getElementById('downloadAllBtn').addEventListener('click', async () => {
            await this.downloadAllDocuments(documentos);
        });

        list.innerHTML = documentos.map((doc, index) => `
            <div class="p-3 bg-[var(--bg-panel)] rounded-lg border border-[var(--border-subtle)] hover:border-[var(--primary-500)] transition-colors group">
                <div class="flex justify-between items-start gap-4">
                    <div class="flex flex-col gap-1 min-w-0 flex-1">
                        <strong class="text-sm text-white truncate break-words whitespace-normal" title="${this.escapeHtml(doc.nomeArquivo || doc.nome)}">
                            ${this.escapeHtml(doc.nomeArquivo || doc.nome)}
                        </strong>
                        <small class="text-xs text-[var(--text-light)]">
                            <i class="ph-fill ph-user mr-1"></i>${this.escapeHtml(doc.nomeCliente || doc.cliente || '-')}
                        </small>
                    </div>
                    <div class="flex gap-2 shrink-0">
                        ${doc.docxDownloadUrl ? `<button class="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1" data-type="docx" data-index="${index}"><i class="ph-fill ph-file-doc"></i> Word</button>` : ''}
                        ${doc.pdfDownloadUrl ? `<button class="px-3 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors flex items-center gap-1" data-type="pdf" data-index="${index}"><i class="ph-fill ph-file-pdf"></i> PDF</button>` : ''}
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
