# DocumentosPro Aurora Glass Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar todo o frontend multipágina do DocumentosPro no design Aurora Glass aprovado, com acentos derivados da empresa ativa e sem alterar regras de negócio, permissões ou contratos de API.

**Architecture:** O frontend continuará em HTML, CSS e JavaScript puro. A implementação reaproveitará o ponto de entrada `editorial.css` e seus módulos, substituirá progressivamente a linguagem visual atual por tokens e componentes Aurora e manterá toda lógica de tela nos managers existentes; os contratos DOM e os fluxos serão protegidos por Playwright antes de cada propagação.

**Tech Stack:** HTML5, CSS custom properties, JavaScript ES2021, Phosphor Icons, Chart.js, Node.js 18+, Express existente e Playwright Test usando Google Chrome.

**Specification:** `docs/superpowers/specs/2026-09-28-documentospro-aurora-glass-design.md`

## Global Constraints

- Preservar endpoints, métodos HTTP, payloads, autenticação, tenant, downloads, geração, polling e persistência.
- Preservar todos os IDs usados pelo JavaScript, formulários, objetos globais, handlers `onclick`, classes `master-only`/`admin-master-only` e visibilidade por papel.
- Não migrar para React, Vue, Tailwind ou outro framework e não adicionar dependência de produção.
- Não alterar backend, banco, regras de permissão nem documentos DOCX/PDF gerados.
- O modo escuro Aurora será o padrão somente quando `darkTheme` ainda não existir; valores persistidos `true` e `false` continuarão soberanos.
- `temaCor` controlará o acento primário e `temaCorSecundaria` o complementar; neutros e cores semânticas não dependerão da empresa.
- O dashboard usará somente dados reais: `kpis.documentos`, clientes, templates, usuários, `graficos.docsPorDia` e `graficos.topTemplates`. Não exibir percentuais de tendência inventados.
- A busca da topbar será visual e explicitamente indisponível; não criar um campo que pareça funcional sem contrato de busca.
- Alvos interativos terão no mínimo 44 × 44 px, texto normal buscará contraste 4,5:1 e movimento respeitará `prefers-reduced-motion`.
- Validar 1440 × 900, 1024 × 768 e 390 × 844, com empresas roxa/azul e verde/âmbar, nos temas escuro e claro.
- O efeito glass deverá possuir fallback opaco quando `backdrop-filter` não estiver disponível.
- Não apagar, resetar nem reformatar em massa o worktree atual.

## Existing Worktree and Baseline

O início da execução deverá preservar estas alterações já presentes:

- `frontend/js/auth.js`: persistência de `empresaContextoConfig`, ainda com regressão de fallback a corrigir na Task 2;
- `frontend/css/editorial-shell.css`: controles e navegação recolhida com 44 px;
- `frontend/css/editorial-pages.css`: proporção do modal de campos;
- `frontend/css/style.css`: botão de recolhimento com 44 px;
- `frontend/templates.html`: remoção do Tailwind runtime e carga de `editorial.css`;
- `backend/middlewares/tenant.middleware.js`: alteração existente fora do escopo visual, que não deverá ser incluída nos commits deste plano;
- `backend/data/database.db-shm` e `backend/data/database.db-wal`: artefatos locais que nunca deverão ser adicionados ao Git.

Baseline executado em 28/09/2026: 44 testes Playwright passaram e 1 falhou. A falha conhecida é `executive company palette reaches semantic brand tokens`: a empresa verde espera `#0f766e`, mas recebe `#7c3aed`. A Task 2 deve corrigir essa falha antes do redesign visual.

Antes de cada commit:

```powershell
git diff --check
git diff --cached --name-only
```

O segundo comando deve listar somente os arquivos declarados na tarefa. Os arquivos de backend e banco citados acima permanecem fora do staging.

## Review Focus

- Troca de empresa: não pode reaproveitar tokens inline da empresa anterior.
- Tema inicial: ausência da preferência significa escuro; preferência `false` significa claro.
- Cores extremas: ações, foco e item ativo devem manter contraste.
- Dashboard: composição semelhante ao mockup sem fabricar informações indisponíveis.
- Papéis: `master`, `admin` e `user` devem conservar menus e ações atuais.
- Responsividade: sidebar, modais, tabelas e grids não podem causar overflow da página.
- Glassmorphism: o conteúdo precisa continuar legível sem blur e com redução de movimento.
- Worktree: mudanças preexistentes devem ser incorporadas conscientemente ou permanecer fora dos commits, nunca descartadas.

---

### Task 1: Tornar os gates de qualidade executáveis

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json:10`
- Test: `frontend/js/**/*.js`
- Test: `tests/frontend/**/*.js`

**Interfaces:**
- Consumes: ESLint 10.7 já instalado e as regras hoje registradas em `.eslintrc.json`.
- Produces: script `npm run lint:frontend`, que analisa `frontend/js`, `tests/frontend`, `playwright.config.js` e `eslint.config.js` sem depender do formato legado de configuração.

- [ ] **Step 1: Registrar a falha atual do lint**

Executar `npx eslint frontend/js/auth.js`. O resultado esperado é falha informando ausência de `eslint.config.js`; isso prova que o gate atual não é executável.

- [ ] **Step 2: Adicionar o script e a configuração flat**

Adicionar em `package.json`:

```json
"lint:frontend": "eslint frontend/js tests/frontend playwright.config.js eslint.config.js"
```

Criar `eslint.config.js` com `ecmaVersion: 'latest'`, `sourceType: 'module'`, globals de navegador e Node usados pelo projeto (`window`, `document`, `localStorage`, `fetch`, `FormData`, `URL`, `Blob`, `Chart`, timers, `process`, `Buffer`, `console`, `confirm` e `prompt`) e as regras existentes: `no-unused-vars` como warning, `no-console` desativada, ponto e vírgula obrigatório e aspas simples com template literals permitidos. Ignorar `node_modules`, `test-results`, uploads e arquivos vendorizados.

- [ ] **Step 3: Verificar sintaxe e lint**

Executar:

```powershell
Get-ChildItem frontend/js -Filter *.js | ForEach-Object { node --check $_.FullName }
npm run lint:frontend
```

Resultado esperado: todos os arquivos passam no `node --check`; ESLint encerra com código 0, admitindo apenas warnings de variáveis atualmente não usadas.

- [ ] **Step 4: Confirmar que o gate não mudou o produto**

Executar `npx playwright test tests/frontend/dom-contracts.spec.js --reporter=line`.

Resultado esperado: 8 contratos DOM passam.

- [ ] **Step 5: Commitar o gate isolado**

```powershell
git add -- package.json eslint.config.js
git diff --cached --name-only
git commit -m "chore: habilitar lint do frontend"
```

---

### Task 2: Estabilizar tema, empresa ativa e modo escuro inicial

**Files:**
- Modify: `frontend/js/auth.js:17`
- Modify: `frontend/js/sidebar.js:1`
- Modify: `tests/frontend/helpers/session.js:18`
- Modify: `tests/frontend/theme.spec.js:18`
- Modify: `tests/frontend/auth-shell.spec.js:15`

**Interfaces:**
- Consumes: `usuario`, `empresas`, `empresaContextoId`, `empresaContextoConfig`, `darkTheme`, `temaCor` e `temaCorSecundaria` no `localStorage`.
- Produces: `Auth.getEmpresaContextoConfig() -> object | null`, `Auth.clearInjectedPalette(target) -> void` e evento `documentospro:themechange` com `{ detail: { isDark, primary, secondary } }` depois da aplicação de tema.
- Preserva: `Auth.setEmpresaContexto(empresa)`, `Auth.clearEmpresaContexto()` e `Auth.applyThemeColor()` como APIs públicas atuais.

- [ ] **Step 1: Ampliar os testes para as decisões fechadas**

Em `helpers/session.js`, permitir `darkTheme: undefined`: nesse caso, não gravar a chave. Para master, manter a lista `empresas` com config e permitir testar o fallback mesmo sem `empresaContextoConfig`.

Adicionar testes que provem:

- ausência de `darkTheme` inicia `body.dark-theme`;
- `darkTheme = false` inicia tema claro;
- empresa verde aplica `#0f766e` mesmo se somente a lista `empresas` contiver a config;
- `setEmpresaContexto()` troca de roxo para verde sem reload;
- `clearEmpresaContexto()` remove somente tokens injetados, sem apagar outros estilos inline do body;
- config inválida mantém os fallbacks Aurora e não lança erro;
- o evento `documentospro:themechange` é emitido após empresa ou tema mudar.

- [ ] **Step 2: Verificar as falhas relevantes**

Executar `npx playwright test tests/frontend/theme.spec.js tests/frontend/auth-shell.spec.js --reporter=line`.

Resultado esperado antes da implementação: falha da empresa verde e falha do modo escuro padrão; testes antigos de login e persistência continuam passando.

- [ ] **Step 3: Implementar resolução única de configuração**

Implementar a seguinte ordem em `getEmpresaContextoConfig()`:

```text
se master:
  tentar empresaContextoConfig válido
  senão localizar empresaContextoId na lista empresas e ler empresa.config
senão:
  ler usuario.empresa_config
se parse ou formato falhar:
  retornar null
```

`setEmpresaContexto()` deverá persistir id, nome e config quando disponíveis, atualizar usuário e aplicar o tema. `clearEmpresaContexto()` deverá remover as três chaves e somente as custom properties `--primary-*`, `--secondary-*`, `--on-primary` e `--on-secondary`.

- [ ] **Step 4: Implementar preferência escura e sincronização**

Na inicialização, usar tema escuro quando a chave estiver ausente e respeitar `true`/`false` quando presente. O toggle continuará persistindo a escolha, atualizará nome acessível e chamará `applyThemeColor()`. Corrigir também o texto de papel do usuário master para continuar exibindo `Master • <empresa>` ou `Master • Sem empresa selecionada`.

- [ ] **Step 5: Verificar a fundação white-label**

Executar:

```powershell
npx playwright test tests/frontend/theme.spec.js tests/frontend/auth-shell.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: todos os testes passam; roxo/azul e verde/âmbar chegam aos tokens; preferência clara persistida não é sobrescrita.

- [ ] **Step 6: Commitar somente a fundação**

```powershell
git add -- frontend/js/auth.js frontend/js/sidebar.js tests/frontend/helpers/session.js tests/frontend/theme.spec.js tests/frontend/auth-shell.spec.js
git diff --cached --name-only
git commit -m "fix: estabilizar tema white-label"
```

---

### Task 3: Substituir as fundações visuais pelos tokens Aurora

**Files:**
- Modify: `frontend/css/editorial-tokens.css:1`
- Modify: `frontend/css/editorial-base.css:1`
- Modify: `frontend/css/editorial-theme.css:1`
- Modify: `frontend/css/style.css:1`
- Modify: `tests/frontend/theme.spec.js:51`
- Modify: `tests/frontend/components.spec.js:11`

**Interfaces:**
- Consumes: `--primary-*`, `--secondary-*`, `--on-primary` e `--on-secondary` injetados pela Task 2.
- Produces: tokens estruturais `--surface-app`, `--surface-sidebar`, `--surface-topbar`, `--surface-panel`, `--surface-panel-strong`, `--surface-muted`, `--surface-hover`, `--text-primary`, `--text-secondary`, `--text-subtle`, `--border-soft`, `--border-emphasis`, `--glass-blur`, `--brand-glow`, `--focus-ring`, espaçamento, raios, sombras e duração.

- [ ] **Step 1: Atualizar os testes de fundação**

Trocar as expectativas editoriais por estas bases:

- escuro: `--surface-app: #061326`, texto `#f4f8ff`, painel translúcido e borda azul-fria;
- claro: `--surface-app: #eef5fb`, texto `#10233f`, painel branco translúcido;
- `--glass-blur: 18px`;
- foco usa `--focus-ring` derivado da marca;
- ação primária conserva contraste de 4,5:1 para cores `#f5f5f5` e `#101010`.

- [ ] **Step 2: Confirmar que o CSS atual não atende ao contrato**

Executar `npx playwright test tests/frontend/theme.spec.js tests/frontend/components.spec.js --reporter=line`.

Resultado esperado: falhas nas cores estruturais Aurora; contratos funcionais de botões, modal e toast permanecem verdes.

- [ ] **Step 3: Implementar tokens e base escura/clara**

Definir os valores escuros em `body.dark-theme` e os claros em `:root`. Manter aliases legados `--bg-*`, `--text-*` e `--border-*` apontando para os novos tokens para impedir regressão durante a migração. Usar `color-mix()` para glow e estados tonais, sempre com um fallback estático anterior à declaração moderna.

- [ ] **Step 4: Normalizar documento e foco**

Aplicar `Plus Jakarta Sans`, canvas Aurora, seleção de texto, scrollbar, links, foco visível, tipografia e redução de movimento. Remover da camada legada somente fundos e ornamentos que conflitem diretamente com esses tokens; preservar a alteração local do botão de sidebar com 44 px.

- [ ] **Step 5: Verificar temas, contraste e compatibilidade**

Executar:

```powershell
npx playwright test tests/frontend/theme.spec.js tests/frontend/components.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: temas e componentes passam nos dois extremos de cor e nenhuma ação perde legibilidade.

- [ ] **Step 6: Commitar as fundações**

```powershell
git add -- frontend/css/editorial-tokens.css frontend/css/editorial-base.css frontend/css/editorial-theme.css frontend/css/style.css tests/frontend/theme.spec.js tests/frontend/components.spec.js
git diff --cached --name-only
git commit -m "style: criar fundacoes aurora glass"
```

---

### Task 4: Construir sidebar e topbar Aurora em todas as páginas autenticadas

**Files:**
- Modify: `frontend/css/editorial-shell.css:1`
- Modify: `frontend/css/editorial-responsive.css:1`
- Modify: `frontend/js/sidebar.js:29`
- Modify: `frontend/dashboard.html:18`
- Modify: `frontend/clientes.html:15`
- Modify: `frontend/documentos.html:15`
- Modify: `frontend/templates.html:15`
- Modify: `frontend/auditoria.html:14`
- Modify: `frontend/empresas.html:15`
- Modify: `frontend/usuarios.html:15`
- Modify: `tests/frontend/shell.spec.js:10`
- Modify: `tests/frontend/dom-contracts.spec.js:17`
- Modify: `tests/frontend/fixtures/dom-contracts.json:8`

**Interfaces:**
- Consumes: `.dashboard-layout`, `.sidebar`, `.sidebar-toggle`, `.sidebar-overlay`, `.main-content`, `.header-left`, `.header-actions`, `.nav-item`, `#userInfo`, `#userName`, `#userRole` e `#logoutBtn`.
- Produces: `.app-topbar`, `.global-search--disabled`, `.topbar-company-context` e shell com sidebar 228 px expandida/76 px recolhida; nenhuma nova ação de negócio.

- [ ] **Step 1: Especificar o contrato do shell em testes**

Adicionar expectativas para:

- sidebar com 228 px e recolhida com 76 px;
- topbar entre 64 e 72 px;
- empresa ativa na topbar;
- busca com `aria-disabled="true"` e texto acessível “Busca global indisponível”;
- item ativo com `aria-current="page"`;
- toggle de tema e sidebar com nomes acessíveis;
- menus administrativos por papel;
- drawer móvel abre, fecha por overlay e Escape e restaura scroll.

- [ ] **Step 2: Verificar a falha visual do shell antigo**

Executar `npx playwright test tests/frontend/shell.spec.js --reporter=line`.

Resultado esperado: falhas de largura, topbar e busca; testes de permissão e abertura móvel continuam caracterizando o comportamento atual.

- [ ] **Step 3: Normalizar a marcação das sete páginas**

Adicionar classes Aurora sem renomear IDs. A topbar deve conter área de busca não interativa, contexto de empresa, tema e usuário. A sidebar deve conter marca, navegação principal, separador administrativo e logout. A mensagem promocional da referência pode aparecer na base somente quando houver altura suficiente e será marcada como conteúdo não interativo.

- [ ] **Step 4: Atualizar a injeção do contexto**

Fazer `createCompanyContext()` produzir `.topbar-company-context`, inserir em `.header-actions` e evitar duplicidade. Manter `sidebarCollapsed`, classes `collapsed`/`active`, `aria-expanded`, fechamento por resize e atualização de tema.

- [ ] **Step 5: Implementar layout e fallback móvel**

Aplicar canvas fixo, sidebar translúcida, topbar glass sticky e conteúdo fluido. No celular, a sidebar vira drawer de no máximo `min(86vw, 320px)` e a busca desaparece visualmente sem remover empresa, tema ou menu.

- [ ] **Step 6: Verificar shell e contratos DOM**

Executar:

```powershell
npx playwright test tests/frontend/shell.spec.js tests/frontend/dom-contracts.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: shell passa em desktop e celular; os oito contratos DOM permanecem válidos.

- [ ] **Step 7: Commitar o shell**

```powershell
git add -- frontend/css/editorial-shell.css frontend/css/editorial-responsive.css frontend/js/sidebar.js frontend/dashboard.html frontend/clientes.html frontend/documentos.html frontend/templates.html frontend/auditoria.html frontend/empresas.html frontend/usuarios.html tests/frontend/shell.spec.js tests/frontend/dom-contracts.spec.js tests/frontend/fixtures/dom-contracts.json
git diff --cached --name-only
git commit -m "style: construir shell aurora glass"
```

---

### Task 5: Padronizar componentes glass, estados e acessibilidade

**Files:**
- Modify: `frontend/css/editorial-components.css:1`
- Modify: `frontend/css/editorial-base.css:1`
- Modify: `frontend/js/ui-core.js:1`
- Modify: `tests/frontend/components.spec.js:11`

**Interfaces:**
- Consumes: tokens Aurora e classes existentes `.btn`, `.form-control`, `.card`, `.panel`, `.modal`, `.toast`, `.badge`, tabelas, toolbars e estados vazios.
- Produces: aparência consistente para botões, campos, cards, painéis, tabelas, badges, modais, toasts, carregamento, vazio e erro; `window.showToast(message, type, duration)` permanece inalterada.

- [ ] **Step 1: Criar testes de componente Aurora**

Adicionar verificações para painel translúcido com borda, fallback sólido dentro de `@supports not`, botão primário com glow da marca, botão destrutivo sem cor da empresa, foco de 2 px, modal contido em 390 px, toast com `role="status"` ou `alert`, campo desabilitado e redução de movimento.

- [ ] **Step 2: Verificar falhas visuais focadas**

Executar `npx playwright test tests/frontend/components.spec.js --reporter=line`.

Resultado esperado: novos asserts de glass/glow falham; helpers globais e semântica atuais continuam funcionando.

- [ ] **Step 3: Implementar os componentes sem lógica de negócio**

Usar fundo opaco como primeira declaração e `rgba()`/`backdrop-filter` dentro de suporte progressivo. Estados hover alteram borda, cor e sombra sem deslocar layout. Modais usam overlay marinho, `max-height: calc(100dvh - 32px)` e rolagem interna. Tabelas mantêm cabeçalho legível e rolagem dentro do painel.

- [ ] **Step 4: Preservar a API de toast**

Manter assinatura, duração e remoção automática. Garantir uma única região anunciável por toast, sem ripple e sem capturar foco.

- [ ] **Step 5: Verificar componentes e tema extremo**

Executar:

```powershell
npx playwright test tests/frontend/components.spec.js tests/frontend/theme.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: componentes e contrastes passam em claro/escuro e cores extremas.

- [ ] **Step 6: Commitar os componentes**

```powershell
git add -- frontend/css/editorial-components.css frontend/css/editorial-base.css frontend/js/ui-core.js tests/frontend/components.spec.js
git diff --cached --name-only
git commit -m "style: padronizar componentes aurora"
```

---

### Task 6: Reproduzir o dashboard Aurora aprovado

**Files:**
- Modify: `frontend/dashboard.html:68`
- Modify: `frontend/js/dashboard.js:1`
- Modify: `frontend/css/editorial-pages.css:205`
- Modify: `tests/frontend/login-dashboard.spec.js:4`
- Modify: `tests/frontend/fixtures/dom-contracts.json:8`

**Interfaces:**
- Consumes: `/api/clientes`, `/api/templates`, `/api/usuarios`, `/api/empresas`, `/api/health` e `/api/dashboard/stats` no formato atual.
- Produces: `renderKpis({ documentos, clientes, templates, usuarios })`, `renderDocumentsChart(stats)`, `renderTopTemplatesChart(stats)`, `renderCompanyPanel()` e `refreshCharts()` dentro de `DashboardManager`.
- Adiciona ao DOM: `#topTemplatesChart`, `#topTemplatesLegend`, `#companyIdentityPanel` e `#dashboardPrimaryAction`; preserva todos os IDs já existentes.

- [ ] **Step 1: Atualizar fixtures e expectativas do dashboard**

Mockar:

```text
kpis.documentos = 1248
kpis.clientes = 284
docsPorDia = sete pontos reais
topTemplates = Contratos 42, Procurações 24, Declarações 18
```

Testar os quatro KPIs na ordem documentos/clientes/templates/usuários, CTA “Gerar documento”, gráfico de barras, donut “Templates mais utilizados”, empresa ativa, atividade recente e ausência de percentuais fictícios.

- [ ] **Step 2: Verificar a diferença em relação ao dashboard atual**

Executar `npx playwright test tests/frontend/login-dashboard.spec.js --reporter=line`.

Resultado esperado: falhas na composição, no KPI de documentos e no donut; login atual continua passando.

- [ ] **Step 3: Reorganizar o HTML sem romper contratos**

Compor:

1. saudação e CTA;
2. quatro KPIs;
3. gráfico de documentos em dois terços e empresa ativa em um terço;
4. atividade em dois terços e donut em um terço;
5. ações rápidas e visão master abaixo da dobra para preservar funcionalidades existentes.

Integrar `#contextBanner` ao painel da empresa e manter o estado master sem contexto com ação “Selecionar empresa”.

- [ ] **Step 4: Mapear somente dados verdadeiros**

Usar `stats.kpis.documentos` para o primeiro KPI; listas carregadas para templates e usuários; `stats.graficos.docsPorDia` para barras; `stats.graficos.topTemplates` para donut. Subtextos substituem tendências. Estados sem dados mostram zero e mensagem vazia sem gerar valores.

- [ ] **Step 5: Atualizar Chart.js e reação ao tema**

Manter instâncias separadas, destruí-las antes de recriar e obter cores de `--primary-500`, `--secondary-500`, `--text-secondary`, `--border-soft` e `--surface-panel-strong`. Ouvir `documentospro:themechange` e chamar `refreshCharts()` sem refazer chamadas à API.

- [ ] **Step 6: Implementar a fidelidade visual**

Aplicar grid de 12 colunas, painéis glass, glow localizado, barras com gradiente curto, donut com legenda compacta, alturas alinhadas e layout sem overflow nos três viewports.

- [ ] **Step 7: Verificar dashboard e tema**

Executar:

```powershell
npx playwright test tests/frontend/login-dashboard.spec.js tests/frontend/theme.spec.js tests/frontend/dom-contracts.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: dashboard passa com dados completos, vazios e master sem contexto; troca de tema recolore os gráficos.

- [ ] **Step 8: Commitar o dashboard**

```powershell
git add -- frontend/dashboard.html frontend/js/dashboard.js frontend/css/editorial-pages.css tests/frontend/login-dashboard.spec.js tests/frontend/fixtures/dom-contracts.json
git diff --cached --name-only
git commit -m "style: reproduzir dashboard aurora"
```

---

### Task 7: Aplicar Aurora a Clientes e Templates

**Files:**
- Modify: `frontend/clientes.html:88`
- Modify: `frontend/templates.html:88`
- Modify: `frontend/js/clientes.js:86`
- Modify: `frontend/js/templates.js:81`
- Modify: `frontend/css/editorial-pages.css:400`
- Modify: `tests/frontend/clientes-templates.spec.js:33`

**Interfaces:**
- Consumes: managers, endpoints, formulários, modais e IDs atuais das duas páginas.
- Produces: `.aurora-toolbar`, `.aurora-data-card`, `.aurora-selection-bar` e marcação visual consistente; métodos públicos dos managers permanecem com as mesmas assinaturas.

- [ ] **Step 1: Caracterizar layouts e ações**

Ampliar testes para título/toolbar glass, busca, adicionar, importar, ações em lote, cards/linhas de cliente, upload de template, download, edição opcional de arquivo, exclusão e estado de usuário comum sem botões administrativos.

- [ ] **Step 2: Verificar falhas de apresentação**

Executar `npx playwright test tests/frontend/clientes-templates.spec.js --reporter=line`.

Resultado esperado: ações funcionais continuam verdes; novas expectativas de classes e superfícies Aurora falham.

- [ ] **Step 3: Redesenhar Clientes**

Transformar o cabeçalho em toolbar, destacar contagem/seleção, aplicar cards de dados com hierarquia nome–CPF–contato e manter checkboxes e handlers. Modais de cadastro e importação usam componentes da Task 5. Em 390 px, ações quebram em linhas e cards não truncam nomes longos.

- [ ] **Step 4: Redesenhar Templates**

Aplicar cards glass com nome, campos e ações. Integrar conscientemente a remoção de Tailwind já presente no worktree. Manter `templateForm`, `templateEditForm`, limite/validação de arquivo e permissões sem mudança.

- [ ] **Step 5: Verificar fluxos e permissões**

Executar:

```powershell
npx playwright test tests/frontend/clientes-templates.spec.js tests/frontend/components.spec.js tests/frontend/dom-contracts.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: busca, modais, importação, ações em lote e ações de template passam para os papéis cobertos.

- [ ] **Step 6: Commitar as telas operacionais**

```powershell
git add -- frontend/clientes.html frontend/templates.html frontend/js/clientes.js frontend/js/templates.js frontend/css/editorial-pages.css tests/frontend/clientes-templates.spec.js
git diff --cached --name-only
git commit -m "style: redesenhar clientes e templates em aurora"
```

---

### Task 8: Aplicar Aurora ao fluxo de Documentos

**Files:**
- Modify: `frontend/documentos.html:89`
- Modify: `frontend/js/documentos.js:84`
- Modify: `frontend/css/editorial-pages.css:650`
- Modify: `tests/frontend/documentos.spec.js:25`

**Interfaces:**
- Consumes: seleções, contadores, editor de campos, histórico, `/api/gerar-documentos`, polling e downloads atuais.
- Produces: workspace Aurora em etapas visuais; todas as assinaturas de `DocumentosManager` e IDs continuam iguais.

- [ ] **Step 1: Ampliar os testes do fluxo**

Testar quatro etapas visuais, contadores, busca, seleção, edição de campos, histórico, formato, modo de download, botão final, modal de progresso e resultados. Confirmar payload de geração idêntico ao atual e layout utilizável em 390 px.

- [ ] **Step 2: Verificar o contrato antes da mudança**

Executar `npx playwright test tests/frontend/documentos.spec.js --reporter=line`.

Resultado esperado: fluxo atual passa; novas expectativas de etapas e painéis Aurora falham.

- [ ] **Step 3: Reorganizar apenas a apresentação**

Distribuir seleção de clientes, seleção de templates, opções/revisão e ação final em painéis numerados. Reusar os mesmos checkboxes, IDs e listeners. O resumo lateral fica sticky somente em desktop e volta ao fluxo normal em tablet/celular.

- [ ] **Step 4: Integrar editor, progresso e resultados**

Preservar a proporção local já preparada para `#modalEditarCampos`. Aplicar modal glass, histórico contido, barra de progresso com cor da empresa e cartões de resultado com ações de download atuais. Não alterar intervalos de polling nem File System Access API.

- [ ] **Step 5: Verificar geração e responsividade**

Executar:

```powershell
npx playwright test tests/frontend/documentos.spec.js tests/frontend/components.spec.js tests/frontend/dom-contracts.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: payload, polling, editor, histórico e downloads permanecem caracterizados; não existe overflow em 390 px.

- [ ] **Step 6: Commitar o fluxo**

```powershell
git add -- frontend/documentos.html frontend/js/documentos.js frontend/css/editorial-pages.css tests/frontend/documentos.spec.js
git diff --cached --name-only
git commit -m "style: redesenhar fluxo de documentos em aurora"
```

---

### Task 9: Aplicar Aurora a Auditoria, Empresas e Usuários

**Files:**
- Modify: `frontend/auditoria.html:85`
- Modify: `frontend/empresas.html:88`
- Modify: `frontend/usuarios.html:88`
- Modify: `frontend/js/auditoria.js:10`
- Modify: `frontend/js/empresas.js:43`
- Modify: `frontend/js/usuarios.js:82`
- Modify: `frontend/css/editorial-pages.css:1000`
- Modify: `tests/frontend/admin-pages.spec.js:37`

**Interfaces:**
- Consumes: endpoints, managers, prompts, modais, papéis e IDs administrativos atuais.
- Produces: tabela Aurora de auditoria, cards de empresa com paleta e cards/linhas de usuário; contratos públicos dos managers permanecem iguais.

- [ ] **Step 1: Ampliar a matriz administrativa**

Testar auditoria com contagem e linha longa; empresa ativa com monograma e duas amostras de cor; entrar, editar e excluir; usuário com avatar, papel, redefinição e troca de cargo; redirecionamentos por papel e ausência de overflow em 390 px.

- [ ] **Step 2: Verificar falhas visuais focadas**

Executar `npx playwright test tests/frontend/admin-pages.spec.js --reporter=line`.

Resultado esperado: ações e permissões atuais passam; marcação Aurora e amostras de paleta falham.

- [ ] **Step 3: Redesenhar Auditoria**

Aplicar resumo glass, badges semânticos e tabela com rolagem interna. Datas, usuário e ação mantêm o conteúdo retornado por `/api/auditoria`.

- [ ] **Step 4: Redesenhar Empresas**

Substituir estilos inline dos círculos de cor por classes e custom properties escapadas. Exibir monograma, contagens, `temaCor`, `temaCorSecundaria` e estado ativo. A cor de perigo da exclusão permanece semântica.

- [ ] **Step 5: Redesenhar Usuários**

Aplicar hierarquia de avatar, nome, email, papel e ações. Reusar os três formulários e preservar validação de senha, payloads e permissões.

- [ ] **Step 6: Verificar administração completa**

Executar:

```powershell
npx playwright test tests/frontend/admin-pages.spec.js tests/frontend/components.spec.js tests/frontend/dom-contracts.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: páginas passam para master/admin/user conforme o contrato e sem overflow.

- [ ] **Step 7: Commitar as páginas administrativas**

```powershell
git add -- frontend/auditoria.html frontend/empresas.html frontend/usuarios.html frontend/js/auditoria.js frontend/js/empresas.js frontend/js/usuarios.js frontend/css/editorial-pages.css tests/frontend/admin-pages.spec.js
git diff --cached --name-only
git commit -m "style: redesenhar administracao em aurora"
```

---

### Task 10: Redesenhar login e estados transversais

**Files:**
- Modify: `frontend/index.html:11`
- Modify: `frontend/css/editorial-pages.css:1`
- Modify: `frontend/js/auth.js:26`
- Modify: `tests/frontend/login-dashboard.spec.js:25`
- Modify: `tests/frontend/auth-shell.spec.js:4`

**Interfaces:**
- Consumes: `#loginForm`, `#email`, `#senha`, `/api/login`, notificações e redirecionamentos existentes.
- Produces: login Aurora responsivo com os mesmos campos e fluxo; estados de autenticação continuam sendo apresentados por `showNotification`.

- [ ] **Step 1: Definir os asserts do login Aurora**

Testar canvas marinho, painel glass, marca, labels, autocomplete, botão, foco, erro, loading e layout nos três viewports. Confirmar ausência de Tailwind runtime e blobs animados.

- [ ] **Step 2: Verificar a diferença visual**

Executar `npx playwright test tests/frontend/login-dashboard.spec.js tests/frontend/auth-shell.spec.js --grep "login|authenticates" --reporter=line`.

Resultado esperado: fluxo real passa; novos asserts Aurora falham.

- [ ] **Step 3: Implementar o login**

Aplicar fundo em camadas estáticas, painel glass central, campos com ícones decorativos e ação primária white-label de fallback. Não adicionar imagens externas nem animação contínua. Durante submit, o botão preserva largura, mostra estado e volta ao normal em erro.

- [ ] **Step 4: Verificar autenticação e responsividade**

Executar:

```powershell
npx playwright test tests/frontend/login-dashboard.spec.js tests/frontend/auth-shell.spec.js --reporter=line
npm run lint:frontend
```

Resultado esperado: login master redireciona para Empresas, logout retorna à raiz e o login não causa overflow.

- [ ] **Step 5: Commitar o login**

```powershell
git add -- frontend/index.html frontend/css/editorial-pages.css frontend/js/auth.js tests/frontend/login-dashboard.spec.js tests/frontend/auth-shell.spec.js
git diff --cached --name-only
git commit -m "style: redesenhar login em aurora"
```

---

### Task 11: Fechar responsividade, acessibilidade, matriz visual e regressão nativa

**Files:**
- Modify: `frontend/css/editorial-responsive.css:1`
- Modify: `frontend/css/editorial-pages.css:1`
- Modify: `frontend/css/editorial-components.css:1`
- Modify: `frontend/css/editorial-shell.css:1`
- Modify: `frontend/css/style.css:1`
- Modify: `tests/frontend/visual-matrix.spec.js:1`
- Modify: `tests/frontend/native-smoke.spec.js:3`
- Modify: `tests/frontend/theme.spec.js:1`

**Interfaces:**
- Consumes: todas as páginas Aurora, dois temas, duas empresas e os fluxos existentes.
- Produces: matriz de screenshots em `test-results/visual-matrix`, aplicação sem overflow, fluxo nativo completo e CSS legado sem regras conflitantes.

- [ ] **Step 1: Atualizar a matriz final**

Manter as combinações 1440 × 900, 1024 × 768 e 390 × 844; temas claro/escuro; empresas Amethyst e Verde Executivo; oito páginas. Capturar dashboard, documentos, empresas e login em desktop e celular. Adicionar verificação de `backdrop-filter: none` forçado por classe de teste para provar o fallback opaco.

- [ ] **Step 2: Atualizar o smoke nativo para escuro inicial**

Antes do primeiro login, remover `darkTheme`. Depois de entrar, confirmar `body.dark-theme`. Ao clicar no toggle, esperar tema claro e `localStorage.darkTheme === 'false'`. Manter criação de empresa, entrada no contexto, navegação pelas seis rotas e logout.

- [ ] **Step 3: Executar a matriz e corrigir apenas defeitos observados**

Executar `npx playwright test tests/frontend/visual-matrix.spec.js --reporter=line`.

Corrigir no CSS responsivo somente overflow, sobreposição, recorte, alvos menores que 44 px, contraste e ordem visual encontrados. Não alterar managers nem contratos para resolver um defeito puramente visual.

- [ ] **Step 4: Remover conflitos legados comprovadamente sem uso**

Usar DevTools/testes para identificar declarações de `style.css` sobrescritas em todas as páginas. Remover apenas os blocos de fundo, glow, tipografia ou layout que conflitem com Aurora e que tenham substituto nos módulos `editorial-*`. Manter utilitários e regras funcionais ainda referenciados. Após cada remoção, executar contratos e componentes; se um teste falhar, reverter a remoção específica.

- [ ] **Step 5: Executar gates focados e nativos**

Executar:

```powershell
npm run lint:frontend
npx playwright test tests/frontend/dom-contracts.spec.js tests/frontend/theme.spec.js tests/frontend/shell.spec.js tests/frontend/components.spec.js --reporter=line
npx playwright test tests/frontend/login-dashboard.spec.js tests/frontend/clientes-templates.spec.js tests/frontend/documentos.spec.js tests/frontend/admin-pages.spec.js --reporter=line
npx playwright test tests/frontend/native-smoke.spec.js --reporter=line
```

Resultado esperado: todos passam; o teste nativo confirma empresa, tema, navegação e logout.

- [ ] **Step 6: Executar a suíte integral**

Executar `npm run test:ui -- --reporter=line` com tempo suficiente para a matriz sequencial.

Resultado esperado: zero falhas. Comparar as screenshots do dashboard 1440 escuro com a referência aprovada e confirmar manualmente: sidebar compacta, topbar, CTA luminoso, quatro KPIs, gráfico/empresa, atividade/donut, cor da empresa e ausência de conteúdo falso.

- [ ] **Step 7: Verificar o diff final**

Executar:

```powershell
git diff --check
git status --short
git diff --stat
```

Resultado esperado: nenhum erro de whitespace; `backend/middlewares/tenant.middleware.js` e arquivos de banco continuam fora do staging; nenhuma dependência de produção foi adicionada.

- [ ] **Step 8: Commitar o fechamento visual**

```powershell
git add -- frontend/css/editorial-responsive.css frontend/css/editorial-pages.css frontend/css/editorial-components.css frontend/css/editorial-shell.css frontend/css/style.css tests/frontend/visual-matrix.spec.js tests/frontend/native-smoke.spec.js tests/frontend/theme.spec.js
git diff --cached --name-only
git commit -m "style: concluir redesign aurora glass"
```

## Expected Commit Sequence

1. `chore: habilitar lint do frontend`
2. `fix: estabilizar tema white-label`
3. `style: criar fundacoes aurora glass`
4. `style: construir shell aurora glass`
5. `style: padronizar componentes aurora`
6. `style: reproduzir dashboard aurora`
7. `style: redesenhar clientes e templates em aurora`
8. `style: redesenhar fluxo de documentos em aurora`
9. `style: redesenhar administracao em aurora`
10. `style: redesenhar login em aurora`
11. `style: concluir redesign aurora glass`

## Unresolved Externally Observable Decisions

Nenhuma. A especificação aprovada fecha direção visual, tema inicial, preservação do tema claro, origem das cores, dados permitidos no dashboard, responsividade, acessibilidade e limites funcionais.
