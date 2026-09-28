# DocumentosPro Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aplicar o redesign editorial corporativo a todas as telas do DocumentosPro sem alterar seus fluxos, permissões, APIs ou mecanismo white-label.

**Architecture:** O frontend permanece multipágina em HTML, CSS e JavaScript puro. A nova camada visual será separada em fundações, shell, componentes, páginas e responsividade, carregada depois do CSS legado enquanto a migração avança; os contratos de DOM e comportamento serão protegidos por testes Playwright e verificações estáticas.

**Tech Stack:** HTML5, CSS custom properties, JavaScript ES modules/globais existentes, Phosphor Icons, Chart.js, Node.js 18+, Playwright Test com Google Chrome instalado.

**Spec:** `docs/superpowers/specs/2026-09-28-documentospro-frontend-redesign-design.md`

## Global Constraints

- Preservar IDs consumidos pelos arquivos JavaScript, classes `master-only` e `admin-master-only`, objetos globais, atributos `onclick`, eventos, formulários e endpoints.
- Não alterar regras de autenticação, permissões, CRUD, geração de documentos, downloads, polling ou persistência.
- Manter `applyThemeColor()`, `temaCor`, `temaCorSecundaria` e `injectPalette()` como fonte do white-label.
- Não migrar para React, Vue ou outro framework.
- Usar `Plus Jakarta Sans`, com fallback para `Inter` e fontes de sistema; não manter mistura visual com `Outfit`.
- Controles interativos terão altura mínima de 44 px; texto normal buscará contraste mínimo de 4,5:1.
- Validar 1440 px, aproximadamente 1024 px e aproximadamente 390 px, em temas claro e escuro.
- As mudanças já presentes no índice do usuário são a base de trabalho e não podem ser removidas, reformatadas em massa ou incluídas silenciosamente em commits do redesign.
- Antes de cada commit, executar `git diff --cached --name-only` e usar commit limitado aos caminhos da tarefa. Se um caminho da tarefa já contiver mudança pré-existente, deixar esse caminho sem commit e registrar o checkpoint no relatório em vez de absorver trabalho do usuário.

## Review Focus

- Cor empresarial muito clara ou escura: `injectPalette()` deve manter ações, foco e item ativo legíveis nos dois temas; Task 2 testa as combinações extremas.
- Papel `master`, `admin` ou `user`: navegação e ações condicionais devem manter a visibilidade atual; Tasks 3, 6 e 8 cobrem a matriz.
- Viewport de 390 px: sidebar, modais, tabelas e barras de ação não podem bloquear conteúdo nem produzir overflow da página; Tasks 3, 4 e 9 cobrem o caso.
- Listas vazias, textos longos e dados numerosos: o layout deve continuar utilizável sem corte ou sobreposição; Tasks 6, 7 e 8 exercitam essas entradas.
- Edição e download de templates já preparados no worktree: botões, modal, validações e chamadas HTTP devem sobreviver ao redesign; Task 6 fixa esse comportamento.

---

### Task 1: Criar a rede de segurança do frontend

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.gitignore`
- Create: `playwright.config.js`
- Create: `tests/frontend/start-test-server.js`
- Create: `tests/frontend/helpers/session.js`
- Create: `tests/frontend/fixtures/dom-contracts.json`
- Create: `tests/frontend/dom-contracts.spec.js`
- Create: `tests/frontend/auth-shell.spec.js`

**Interfaces:**
- Consumes: HTML e JavaScript atuais; `DATABASE_PATH` e `PORT` já aceitos pelo backend.
- Produces: `installSession(page, { role, company, darkTheme, sidebarCollapsed }) -> Promise<void>`, em que `role` é `master | admin | user` e `company` é `{ id, nome, temaCor, temaCorSecundaria } | null`; `mockApi(page, overrides) -> Promise<void>`, em que `overrides` mapeia rota para `{ status, body }` ou handler Playwright; servidor isolado em `http://127.0.0.1:7101`; scripts `test:ui` e `test:ui:update`.

- [ ] **Step 1: Instalar o runner sem baixar navegador próprio**

Executar `npm install --save-dev @playwright/test`; configurar `playwright.config.js` com `channel: 'chrome'`, `baseURL: 'http://127.0.0.1:7101'`, `workers: 1`, `trace: 'retain-on-failure'` e `webServer.command: 'node tests/frontend/start-test-server.js'`.

- [ ] **Step 2: Isolar banco e processo do teste**

Implementar `tests/frontend/start-test-server.js` para criar `test-results/runtime`, remover somente `documentospro-ui.db`, `documentospro-ui.db-shm` e `documentospro-ui.db-wal` nesse diretório, definir `DATABASE_PATH`, `PORT=7101` e `MASTER_BOOTSTRAP_PASSWORD=admin123456`, e então importar `backend/server.js`.

- [ ] **Step 3: Escrever o teste de caracterização deliberadamente vermelho**

Em `dom-contracts.spec.js`, comparar IDs, formulários, scripts e classes de permissão de cada um dos oito HTMLs com `dom-contracts.json`; inserir inicialmente um ID inexistente em `dashboard.html` para provar que o detector falha.

- [ ] **Step 4: Executar o teste e confirmar a falha**

Run: `npm run test:ui -- tests/frontend/dom-contracts.spec.js`

Expected: FAIL informando o ID deliberadamente inexistente.

- [ ] **Step 5: Fixar o contrato real e adicionar smoke de autenticação**

Substituir o valor inventado pelos IDs, formulários, scripts e classes observados. Em `auth-shell.spec.js`, provar login master com `admin@admin.com`/`admin123456`, redirecionamento para `/empresas`, logout para `/` e restauração de `darkTheme` e `sidebarCollapsed`.

- [ ] **Step 6: Executar a rede de segurança**

Run: `npm run test:ui -- tests/frontend/dom-contracts.spec.js tests/frontend/auth-shell.spec.js`

Expected: PASS; banco criado somente em `test-results/runtime`.

- [ ] **Step 7: Commit dos arquivos novos e de configuração**

Verificar primeiro os caminhos já staged. Se não houver sobreposição, executar:

```bash
git commit --only -m "test: caracterizar contratos do frontend" -- package.json package-lock.json .gitignore playwright.config.js tests/frontend
```

---

### Task 2: Implementar fundações, tokens e white-label

**Files:**
- Create: `frontend/css/editorial-tokens.css`
- Create: `frontend/css/editorial-base.css`
- Create: `frontend/css/editorial-theme.css`
- Modify: `frontend/css/style.css:1-94`
- Modify: `frontend/js/auth.js:185-247`
- Test: `tests/frontend/theme.spec.js`

**Interfaces:**
- Consumes: propriedades `--primary-{50,100,400,500,600,700}` e `--secondary-{500,600,700}` produzidas por `injectPalette()`.
- Produces: tokens neutros `--surface-*`, `--text-*`, `--border-*`, `--shadow-*`, `--radius-*`, `--space-*`; temas por `body.dark-theme` sem mudar a API de `Auth`.

- [ ] **Step 1: Escrever testes computados para os tokens ainda ausentes**

Criar casos que carregam `dashboard.html` com sessão mockada e afirmam: fundo claro `rgb(246, 245, 242)`, painel branco, fundo escuro `rgb(16, 19, 24)`, controle mínimo de 44 px e aplicação de duas empresas. Incluir bases extremas `#F5F5F5` e `#101010` e exigir contraste calculado de pelo menos 4,5:1 nos textos de botão.

- [ ] **Step 2: Executar e confirmar a falha visual de fundação**

Run: `npm run test:ui -- tests/frontend/theme.spec.js`

Expected: FAIL por tokens editoriais inexistentes ou valores antigos.

- [ ] **Step 3: Criar os três arquivos de fundação**

Definir no topo de `editorial-tokens.css` os valores exatos do tema claro e, em `body.dark-theme`, os valores do tema escuro. Definir fonte, escala, espaçamento, raios, sombras e durações. Em `editorial-base.css`, implementar reset, tipografia, links, seleção, scrollbar, foco e `prefers-reduced-motion`. Em `editorial-theme.css`, mapear tokens de marca existentes para ações, foco e séries de dados.

- [ ] **Step 4: Integrar sem apagar o CSS legado**

Adicionar imports no início de `style.css`, preservando a mudança pré-existente já staged e deixando esse caminho fora do commit enquanto não puder ser isolado. Manter fallbacks até toda a migração terminar; os HTMLs continuam apontando apenas para `style.css` como entrada local.

- [ ] **Step 5: Tornar o cálculo de contraste observável sem mudar sua assinatura**

Manter `injectPalette(target, prefix, baseHex, isDark)` e os mesmos pesos; limitar somente os valores usados em foregrounds críticos por meio dos tokens CSS. Não alterar armazenamento nem origem de `temaCor` e `temaCorSecundaria`.

- [ ] **Step 6: Executar testes de tema e contratos**

Run: `npm run test:ui -- tests/frontend/theme.spec.js tests/frontend/dom-contracts.spec.js`

Expected: PASS nos dois temas e nas duas empresas.

- [ ] **Step 7: Commit isolado quando permitido pelo índice**

```bash
git commit --only -m "style: criar fundacoes editoriais white-label" -- frontend/css/editorial-tokens.css frontend/css/editorial-base.css frontend/css/editorial-theme.css frontend/js/auth.js tests/frontend/theme.spec.js
```

Se `style.css` for necessário e continuar com mudança pré-existente, não incluí-lo no commit.

---

### Task 3: Refatorar shell, sidebar e cabeçalhos

**Files:**
- Create: `frontend/css/editorial-shell.css`
- Modify: `frontend/js/sidebar.js`
- Modify: `frontend/dashboard.html`
- Modify: `frontend/clientes.html`
- Modify: `frontend/documentos.html`
- Modify: `frontend/templates.html`
- Modify: `frontend/auditoria.html`
- Modify: `frontend/empresas.html`
- Modify: `frontend/usuarios.html`
- Test: `tests/frontend/shell.spec.js`

**Interfaces:**
- Consumes: tokens da Task 2 e classes existentes `.dashboard-layout`, `.sidebar`, `.main-content`, `.content-header`, `.header-actions`.
- Produces: `createThemeToggle(isDark) -> HTMLButtonElement`; preserva globais `openModal(modalId)` e `closeModal(modalId)`.

- [ ] **Step 1: Escrever testes do shell ainda não implementado**

Testar largura expandida de 248 px, estado recolhido persistente, navegação ativa com `aria-current="page"`, botão de tema com nome acessível, empresa ativa visível e drawer móvel abrindo/fechando em 390 px. Executar a matriz `master`, `admin` e `user` para navegação administrativa.

- [ ] **Step 2: Executar e confirmar as falhas**

Run: `npm run test:ui -- tests/frontend/shell.spec.js`

Expected: FAIL em geometria, `aria-current`, nome acessível ou drawer.

- [ ] **Step 3: Implementar o shell visual compartilhado**

Criar `editorial-shell.css` com layout, sidebar, empresa ativa, navegação, perfil, cabeçalho, conteúdo e overlay. Normalizar a marcação dos sete HTMLs autenticados sem renomear IDs nem remover classes de papel.

- [ ] **Step 4: Refatorar apenas a construção visual do controle de tema**

Extrair `createThemeToggle(isDark)` em `sidebar.js`; usar ícones Phosphor e `aria-label`, conservar `darkTheme`, chamada a `window.auth.applyThemeColor()` e ordem de inserção em `.header-actions`.

- [ ] **Step 5: Preservar sidebar desktop e móvel**

Manter chaves `sidebarCollapsed` e classes `collapsed`/`active`; adicionar `aria-expanded` e sincronizá-lo nos cliques, overlay e resize.

- [ ] **Step 6: Executar shell, autenticação e contratos**

Run: `npm run test:ui -- tests/frontend/shell.spec.js tests/frontend/auth-shell.spec.js tests/frontend/dom-contracts.spec.js`

Expected: PASS em desktop e 390 px.

- [ ] **Step 7: Commit somente dos caminhos sem sobreposição prévia**

```bash
git commit --only -m "style: refatorar shell editorial" -- frontend/css/editorial-shell.css frontend/js/sidebar.js frontend/dashboard.html frontend/clientes.html frontend/documentos.html frontend/auditoria.html frontend/empresas.html frontend/usuarios.html tests/frontend/shell.spec.js
```

Manter `templates.html` fora do commit enquanto contiver mudança pré-existente.

---

### Task 4: Criar componentes globais, estados e acessibilidade

**Files:**
- Create: `frontend/css/editorial-components.css`
- Modify: `frontend/js/ui-core.js`
- Modify: `frontend/css/style.css:820-1020,1186-1343`
- Test: `tests/frontend/components.spec.js`

**Interfaces:**
- Consumes: tokens das Tasks 2 e 3; classes existentes `.btn`, `.card`, `.panel`, `.form-group`, `.modal`, `.toast`.
- Produces: variantes visuais consistentes sem novas APIs; mantém `window.showToast(message, type, duration)` e `window.showNotification`.

- [ ] **Step 1: Escrever testes de componentes que falham no legado**

Testar altura mínima de botão/campo, foco visível, modal contido em 390 px, toast com `role="status"` ou `role="alert"`, estado desabilitado, upload, checkbox e redução de movimento. Confirmar `openModal`/`closeModal` sem alterar `display` esperado pelos scripts.

- [ ] **Step 2: Executar e confirmar as falhas**

Run: `npm run test:ui -- tests/frontend/components.spec.js`

Expected: FAIL em dimensões, acessibilidade ou comportamento responsivo.

- [ ] **Step 3: Implementar componentes reutilizáveis**

Criar estilos para botões, campos, cards, painéis, tabelas, badges, barra de ferramentas, estados vazios, skeleton, modal, toast e progresso. Usar bordas de 1 px, raios de 8–16 px e sombras neutras.

- [ ] **Step 4: Simplificar efeitos sem alterar notificações**

Remover ripple e stagger que deslocam conteúdo; em `showToast`, conservar assinatura, duração e remoção automática, adicionando papel acessível e ícone Phosphor ou fallback textual.

- [ ] **Step 5: Executar testes globais**

Run: `npm run test:ui -- tests/frontend/components.spec.js tests/frontend/shell.spec.js tests/frontend/dom-contracts.spec.js`

Expected: PASS sem perda de contratos.

- [ ] **Step 6: Commit dos componentes isoláveis**

```bash
git commit --only -m "style: padronizar componentes e estados" -- frontend/css/editorial-components.css frontend/js/ui-core.js tests/frontend/components.spec.js
```

---

### Task 5: Redesenhar login e dashboard

**Files:**
- Create: `frontend/css/editorial-pages.css`
- Modify: `frontend/index.html`
- Modify: `frontend/dashboard.html`
- Modify: `frontend/js/dashboard.js`
- Test: `tests/frontend/login-dashboard.spec.js`

**Interfaces:**
- Consumes: fundações, shell e componentes; IDs dinâmicos usados por `DashboardManager`.
- Produces: login editorial e dashboard de referência; preserva `mainChart` e todos os IDs `context*`, `hero*`, `kpi*`, `meta*`, `operationalInsights`, `recentActivity` e `masterInsights`.

- [ ] **Step 1: Escrever testes das duas telas aprovadas**

No login, afirmar formulário, labels, submissão, erro e ausência de blobs/glassmorphism. No dashboard, mockar APIs e afirmar quatro KPIs, gráfico, ações rápidas, atividade, governança master e ausência de overflow em 1440/1024/390 px.

- [ ] **Step 2: Executar e confirmar a falha visual**

Run: `npm run test:ui -- tests/frontend/login-dashboard.spec.js`

Expected: FAIL em estrutura editorial e responsividade.

- [ ] **Step 3: Implementar o login sem Tailwind runtime**

Trocar utilitários Tailwind por classes próprias, remover o CDN dessa página somente depois de não restar nenhuma classe dependente e preservar `loginForm`, `email`, `senha` e scripts atuais.

- [ ] **Step 4: Implementar o dashboard aprovado**

Reorganizar a marcação visual para saudação, KPIs, gráfico, ações, atividade e governança. Preservar os IDs e o canvas; trocar estilos inline por classes. Não alterar cálculos, chamadas nem dados montados por `dashboard.js`.

- [ ] **Step 5: Ajustar apenas opções visuais do Chart.js**

Ler cores de `getComputedStyle(document.body)` para séries, grid e labels; conservar criação, dados e atualização do gráfico.

- [ ] **Step 6: Executar a regressão**

Run: `npm run test:ui -- tests/frontend/login-dashboard.spec.js tests/frontend/theme.spec.js tests/frontend/auth-shell.spec.js`

Expected: PASS nas duas telas, dois temas e três larguras.

- [ ] **Step 7: Commit**

```bash
git commit --only -m "style: redesenhar login e dashboard" -- frontend/css/editorial-pages.css frontend/index.html frontend/dashboard.html frontend/js/dashboard.js tests/frontend/login-dashboard.spec.js
```

---

### Task 6: Redesenhar Clientes e Templates

**Files:**
- Modify: `frontend/clientes.html`
- Modify: `frontend/templates.html`
- Modify: `frontend/css/editorial-pages.css`
- Test: `tests/frontend/clientes-templates.spec.js`

**Interfaces:**
- Consumes: `ClientesManager` e `TemplatesManager` existentes, incluindo edição e download já preparados.
- Produces: apresentações responsivas sem mudar métodos, endpoints, IDs ou permissões.

- [ ] **Step 1: Escrever testes de comportamento e entradas difíceis**

Mockar listas vazia, normal e com nomes/campos longos. Para Clientes, afirmar busca, cadastro, importação e ações em lote. Para Templates, afirmar que `master`/`admin` veem upload, baixar, editar e excluir; `user` não vê essas ações; abrir `modalEditTemplate`, validar arquivo opcional e observar `GET /api/templates/:id/download` e `PUT /api/templates/:id`.

- [ ] **Step 2: Executar e confirmar a falha de apresentação**

Run: `npm run test:ui -- tests/frontend/clientes-templates.spec.js`

Expected: FAIL em layout, overflow ou estado vazio, mantendo verde o contrato funcional já existente.

- [ ] **Step 3: Refatorar Clientes somente pela marcação e CSS**

Criar barra de ferramentas, contagem/seleção, grid/lista responsiva, estado vazio e modais. Preservar todos os IDs e handlers de `clientes.js`.

- [ ] **Step 4: Refatorar Templates sobre o estado atual do worktree**

Estilizar listagem, mensagens, upload e edição sem reescrever `templates.js`. Substituir somente estilos inline por classes quando isso não esconder as mudanças pré-existentes.

- [ ] **Step 5: Executar a matriz de papéis e responsividade**

Run: `npm run test:ui -- tests/frontend/clientes-templates.spec.js tests/frontend/dom-contracts.spec.js`

Expected: PASS para `master`, `admin`, `user` e 390 px.

- [ ] **Step 6: Commit dos caminhos limpos; preservar os sobrepostos**

```bash
git commit --only -m "style: redesenhar clientes e templates" -- frontend/clientes.html frontend/css/editorial-pages.css tests/frontend/clientes-templates.spec.js
```

Não incluir `templates.html` nem `templates.js` enquanto carregarem mudanças pré-existentes; deixá-los no relatório de checkpoint.

---

### Task 7: Redesenhar o fluxo de Documentos

**Files:**
- Modify: `frontend/documentos.html`
- Modify: `frontend/css/editorial-pages.css`
- Modify: `frontend/js/documentos.js`
- Test: `tests/frontend/documentos.spec.js`

**Interfaces:**
- Consumes: seleção, edição de campos, histórico, geração, polling e downloads de `DocumentosManager`.
- Produces: fluxo visual em cinco etapas; não muda endpoints nem formatos de payload.

- [ ] **Step 1: Escrever testes do fluxo completo com APIs mockadas**

Testar busca e seleção de cliente/template, contadores, formatos de saída, modo de download, botão desabilitado sem seleção, edição de campos, histórico, início da geração, progresso até conclusão e ações de download. Incluir 60 clientes/templates e nomes longos.

- [ ] **Step 2: Executar e confirmar a falha de layout**

Run: `npm run test:ui -- tests/frontend/documentos.spec.js`

Expected: FAIL em organização por etapas, overflow ou painel móvel.

- [ ] **Step 3: Reorganizar a marcação sem trocar os hooks**

Agrupar visualmente seleção de clientes, seleção de templates, opções, resumo e ação. Manter `clientesSelection`, `templatesSelection`, contadores, `gerarDocumentosBtn`, `editarCamposBtn`, `downloadMode`, `historyContainer` e modal existentes.

- [ ] **Step 4: Remover estilos inline gerados somente quando houver classe equivalente**

Em `documentos.js`, trocar `style.display`, largura de progresso e estilos de itens apenas quando o estado dinâmico continuar observável pelas mesmas propriedades ou classes testadas. Não alterar polling, blobs, URLs nem parsing de resposta.

- [ ] **Step 5: Executar a regressão do fluxo**

Run: `npm run test:ui -- tests/frontend/documentos.spec.js tests/frontend/components.spec.js tests/frontend/dom-contracts.spec.js`

Expected: PASS em 1440/1024/390 px.

- [ ] **Step 6: Commit**

```bash
git commit --only -m "style: organizar fluxo de geracao de documentos" -- frontend/documentos.html frontend/css/editorial-pages.css frontend/js/documentos.js tests/frontend/documentos.spec.js
```

---

### Task 8: Redesenhar Auditoria, Empresas e Usuários

**Files:**
- Modify: `frontend/auditoria.html`
- Modify: `frontend/empresas.html`
- Modify: `frontend/usuarios.html`
- Modify: `frontend/css/editorial-pages.css`
- Test: `tests/frontend/admin-pages.spec.js`

**Interfaces:**
- Consumes: managers existentes de auditoria, empresas e usuários.
- Produces: tabelas/cards administrativos responsivos; preserva `window.auditoria.carregarLogs()` e métodos globais chamados por `onclick`.

- [ ] **Step 1: Escrever testes da matriz administrativa**

Auditoria: lista vazia, atualização e tabela com detalhes longos. Empresas: entrar, editar e excluir, com empresa ativa distinguível. Usuários: criar, alterar cargo, redefinir senha e excluir. Verificar permissões para os três papéis e conteúdo grande sem corte.

- [ ] **Step 2: Executar e confirmar as falhas visuais**

Run: `npm run test:ui -- tests/frontend/admin-pages.spec.js`

Expected: FAIL em densidade, estado vazio, overflow ou distinção de ações.

- [ ] **Step 3: Refatorar Auditoria**

Aplicar resumo contextual, toolbar e tabela legível; manter `logsTableBody`, `totalLogsCount`, `tenantBadge`, `tenantName` e botão de atualização.

- [ ] **Step 4: Refatorar Empresas e Usuários**

Aplicar cards/linhas consistentes, badges de papel/estado e hierarquia de ações. Preservar todos os IDs dos três formulários de usuários e os métodos globais de `empresasManager` e `usuariosManager`.

- [ ] **Step 5: Executar testes administrativos e contratos**

Run: `npm run test:ui -- tests/frontend/admin-pages.spec.js tests/frontend/dom-contracts.spec.js`

Expected: PASS na matriz de papéis e dados extremos.

- [ ] **Step 6: Commit**

```bash
git commit --only -m "style: redesenhar paginas administrativas" -- frontend/auditoria.html frontend/empresas.html frontend/usuarios.html frontend/css/editorial-pages.css tests/frontend/admin-pages.spec.js
```

---

### Task 9: Fechar responsividade, remover legado visual e validar integralmente

**Files:**
- Create: `frontend/css/editorial-responsive.css`
- Modify: `frontend/css/style.css`
- Modify: todos os `frontend/*.html`
- Modify: `.gitignore`
- Test: `tests/frontend/visual-matrix.spec.js`
- Test: todos os `tests/frontend/*.spec.js`

**Interfaces:**
- Consumes: todas as classes e testes produzidos nas Tasks 1–8.
- Produces: frontend final sem dependência de Tailwind runtime, matriz visual e relatório de preservação.

- [ ] **Step 1: Escrever o teste final de matriz antes da limpeza**

Percorrer oito páginas em 1440×1000, 1024×900 e 390×844, temas claro/escuro e duas empresas (`#7C3AED`/`#2563EB` e `#0F766E`/`#B45309`). Afirmar ausência de overflow horizontal da página, texto cortado crítico, controles menores que 44 px e elementos interativos sem foco visível. Salvar screenshots em `test-results/visual-matrix` somente como evidência de teste.

- [ ] **Step 2: Executar e registrar as falhas restantes**

Run: `npm run test:ui -- tests/frontend/visual-matrix.spec.js`

Expected: FAIL apenas nos breakpoints ou resíduos visuais ainda não tratados.

- [ ] **Step 3: Implementar responsividade final**

Criar `editorial-responsive.css` para grids, toolbar, tabelas, cards, sidebar e modais. Corrigir somente os defeitos observados, sem alterar lógica.

- [ ] **Step 4: Remover dependências e regras visuais mortas**

Confirmar por busca que nenhuma classe utilitária Tailwind permanece antes de remover os CDNs. Remover duplicações e efeitos legados de `style.css` somente depois que os testes provarem cobertura equivalente. Não tocar em regras ainda usadas.

- [ ] **Step 5: Executar verificação estática e suíte completa**

Run:

```bash
npm run test:ui
npx eslint frontend/js/auth.js frontend/js/sidebar.js frontend/js/ui-core.js frontend/js/dashboard.js frontend/js/documentos.js tests/frontend playwright.config.js
npx prettier --check "frontend/css/editorial-*.css" "tests/frontend/**/*.js" playwright.config.js
npm run build
git diff --check
```

Expected: todos com exit code 0; Playwright sem falhas; build imprime `No build step required`.

- [ ] **Step 6: Executar smoke real no banco isolado**

Sem mocks, validar login master, criação de empresa de teste, entrada na empresa, alternância de tema, navegação por todas as páginas e logout. Não executar exclusões nem geração de arquivos contra o banco real do usuário.

- [ ] **Step 7: Inspecionar screenshots críticas**

Revisar dashboard, documentos, templates e usuários em tema claro/escuro e desktop/mobile. Reprovar qualquer texto cortado, sobreposição, contraste fraco, ação sem hierarquia ou diferença estrutural entre empresas.

- [ ] **Step 8: Commit final somente após reconciliar o índice**

Antes do commit, comparar `git diff`, `git diff --cached` e a lista de mudanças pré-existentes. Incluir apenas arquivos do redesign que possam ser isolados com segurança; deixar caminhos sobrepostos sem commit e relatá-los explicitamente.

```bash
git commit --only -m "style: concluir redesign editorial responsivo" -- frontend/css/editorial-responsive.css tests/frontend/visual-matrix.spec.js
```

- [ ] **Step 9: Relatório de entrega**

Registrar páginas validadas, papéis, empresas, temas, viewports, comandos e resultados. Listar arquivos sobrepostos que permaneceram fora dos commits e qualquer risco não coberto.
