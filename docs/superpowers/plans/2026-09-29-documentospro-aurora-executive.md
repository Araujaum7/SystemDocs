# DocumentosPro Aurora Executive Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar todo o frontend do DocumentosPro no sistema Aurora Executive, com tema white-label, responsividade e acessibilidade, sem alterar regras de negócio ou contratos existentes.

**Architecture:** Manter a stack HTML/CSS/JavaScript atual e tornar `editorial.css` a camada visual proprietária sobre o legado carregado antes dela. Implementar de baixo para cima — tokens, base, shell, componentes e páginas — protegendo IDs, payloads, permissões e fluxos com Playwright.

**Tech Stack:** HTML5, CSS custom properties, JavaScript ES modules/scripts existentes, Chart.js, Phosphor Icons, Playwright e ESLint.

**Spec:** `docs/superpowers/specs/2026-09-29-documentospro-aurora-executive-design.md`

## Global Constraints

- Não alterar endpoints, payloads, autenticação, permissões, banco ou formatos DOCX/PDF.
- Não migrar para framework nem adicionar dependências de produção.
- Preservar todos os IDs, nomes de campos, scripts e hooks cobertos por `tests/frontend/fixtures/dom-contracts.json`.
- Manter modo escuro como padrão sem preferência salva e oferecer tema claro completo.
- Derivar acentos exclusivamente de `temaCor` e `temaCorSecundaria`; cores semânticas não recebem white-label.
- Controles interativos devem medir no mínimo 44 × 44 px; texto normal deve atingir 4,5:1 e foco essencial 3:1.
- Suportar 390 × 844, 1024 × 768 e 1440 × 900; verificar também 320 px e zoom de 200%.
- Manter busca global explicitamente desabilitada; não inventar métricas ou tendências.
- Usar `Plus Jakarta Sans` com `system-ui` como fallback e a escala de espaço 4/8/12/16/24/32/40/48 px.
- Não usar animação decorativa contínua; respeitar `prefers-reduced-motion`.
- Preservar alterações paralelas do workspace e preparar em cada commit somente os arquivos listados na tarefa.

## Review Focus

- Configuração de empresa ausente, inválida, clara (`#F5F5F5`) ou escura (`#101010`) deve manter CTA e foco legíveis — coberto na Task 1.
- Nomes, e-mails e identificadores longos não podem empurrar seleção ou ações para fora do card — coberto nas Tasks 6 e 8.
- Navegador sem `backdrop-filter` deve mostrar superfícies opacas e legíveis — coberto na Task 3.
- Drawer, conteúdo e formulários devem continuar operáveis em 320 px e zoom de 200% — coberto nas Tasks 2 e 9.
- Falha de API, carregamento, vazio e arquivo gerado indisponível não podem ser apresentados como sucesso ou tela vazia — coberto nas Tasks 5, 7 e 8.

---

## File Structure

- `frontend/css/editorial-tokens.css`: neutros, cores semânticas, tipografia, espaço, raios, elevação e movimento.
- `frontend/css/editorial-base.css`: base do documento, foco, seleção, scrollbar e movimento reduzido.
- `frontend/css/editorial-theme.css`: aplicação visual dos tokens white-label.
- `frontend/css/editorial-shell.css`: sidebar, topbar, drawer e área de conteúdo.
- `frontend/css/editorial-components.css`: botões, campos, cards, tabelas, modais, toasts e estados.
- `frontend/css/editorial-pages.css`: composições de login, dashboard e páginas funcionais.
- `frontend/css/editorial-responsive.css`: somente mudanças de composição nos breakpoints.
- `frontend/js/auth.js`: geração/persistência da paleta e estados de login já existentes.
- `frontend/js/sidebar.js`: controles compartilhados, drawer e gerenciamento de foco.
- `frontend/js/dashboard.js`: renderização dos dados e alternativas textuais dos gráficos.
- `frontend/js/documentos.js`: apresentação dos estados do fluxo documental sem mudar o payload.
- `frontend/js/ui-core.js`: feedback compartilhado, somente se um contrato de toast/estado exigir.
- `frontend/*.html`: semântica e classes de apresentação; IDs e scripts permanecem.
- `tests/frontend/*.spec.js`: contratos funcionais, visuais, responsivos e de acessibilidade.

### Task 1: Fundações Aurora Executive e tema white-label

**Files:**
- Modify: `frontend/css/editorial-tokens.css`
- Modify: `frontend/css/editorial-base.css`
- Modify: `frontend/css/editorial-theme.css`
- Modify: `frontend/js/auth.js:248-335`
- Modify: `tests/frontend/theme.spec.js`
- Modify: `tests/frontend/components.spec.js`

**Interfaces:**
- Consumes: `AuthManager.applyThemeColor()`, `AuthManager.injectPalette(target, prefix, baseHex, isDark)` e evento `documentospro:themechange` existentes.
- Produces: tokens neutros exatos da especificação, `--surface-panel-solid`, `--focus-fallback`, `--on-primary` legível e a mesma API pública de tema.

- [ ] **Step 1: Escrever os testes de fundação que falham**

Adicionar testes com estes contratos:

```js
test('Aurora Executive exposes exact dark and light neutral foundations', async ({ page }) => {
  // dark: --surface-app #07111f, --surface-panel-solid #0d1b2e,
  // --text-primary #f8fafc, --text-secondary #a5b4c7
  // light: --surface-app #f4f7fb, --surface-panel-solid #ffffff,
  // --text-primary #172033, --text-secondary #58677a
});

test('invalid and extreme company colors retain readable action and focus tokens', async ({ page }) => {
  // #F5F5F5, #101010 e config inválida não lançam erro;
  // contraste computado de texto/CTA >= 4.5 e foco/superfície >= 3.
});
```

- [ ] **Step 2: Executar os testes e confirmar a falha correta**

Run: `npx playwright test tests/frontend/theme.spec.js tests/frontend/components.spec.js --reporter=line`

Expected: FAIL nos valores antigos dos tokens ou no novo `--surface-panel-solid`; os contratos atuais de troca de empresa continuam passando.

- [ ] **Step 3: Implementar tokens, base e aplicação de tema**

Aplicar os valores das seções 5.2–5.4 da especificação. Manter as assinaturas públicas de `auth.js`; alterar somente a derivação visual necessária para garantir contraste, limpeza de tokens antigos e fallback inválido.

- [ ] **Step 4: Verificar fundação e regressão de autenticação**

Run: `npx playwright test tests/frontend/theme.spec.js tests/frontend/auth-shell.spec.js tests/frontend/components.spec.js --reporter=line`

Expected: PASS em todos os testes desses três arquivos.

- [ ] **Step 5: Commit**

```bash
git add frontend/css/editorial-tokens.css frontend/css/editorial-base.css frontend/css/editorial-theme.css frontend/js/auth.js tests/frontend/theme.spec.js tests/frontend/components.spec.js
git commit -m "style: estabelecer fundacoes aurora executive"
```

### Task 2: Shell desktop, tablet e drawer mobile

**Files:**
- Modify: `frontend/css/editorial-shell.css`
- Modify: `frontend/css/editorial-responsive.css`
- Modify: `frontend/js/sidebar.js`
- Modify: `tests/frontend/shell.spec.js`
- Modify: `tests/frontend/auth-shell.spec.js`

**Interfaces:**
- Consumes: tokens da Task 1 e markup compartilhado `.dashboard-layout`, `.sidebar`, `.app-topbar`, `.main-content`.
- Produces: sidebar 228/76 px, topbar 68/64 px, drawer abaixo de 960 px, retorno de foco e scroll lock; não muda URLs ou visibilidade por perfil.

- [ ] **Step 1: Escrever testes de composição e teclado que falham**

```js
test('mobile drawer owns secondary controls and restores trigger focus', async ({ page }) => {
  // 390x844: busca, tema e contexto detalhado não competem na topbar;
  // abrir move foco ao drawer, Escape fecha, body libera scroll e foco retorna ao botão.
});

test('shell remains usable at 320px and 200 percent zoom', async ({ page }) => {
  // viewport lógica estreita: sem overflow do documento e todos os controles essenciais visíveis.
});
```

- [ ] **Step 2: Rodar os testes do shell e observar a falha**

Run: `npx playwright test tests/frontend/shell.spec.js tests/frontend/auth-shell.spec.js --reporter=line`

Expected: FAIL nos novos contratos de foco/320 px; testes de permissão continuam verdes.

- [ ] **Step 3: Implementar shell responsivo e foco do drawer**

Concentrar geometria em `editorial-shell.css`, breakpoints em `editorial-responsive.css` e somente estado/foco em `sidebar.js`. Não duplicar controles nem criar novo estado persistente.

- [ ] **Step 4: Verificar shell em todos os perfis**

Run: `npx playwright test tests/frontend/shell.spec.js tests/frontend/auth-shell.spec.js --reporter=line`

Expected: PASS, incluindo master/admin/user, abrir/fechar/retornar foco e preferências restauradas.

- [ ] **Step 5: Commit**

```bash
git add frontend/css/editorial-shell.css frontend/css/editorial-responsive.css frontend/js/sidebar.js tests/frontend/shell.spec.js tests/frontend/auth-shell.spec.js
git commit -m "style: refinar shell aurora executive"
```

### Task 3: Componentes compartilhados e estados acessíveis

**Files:**
- Modify: `frontend/css/editorial-components.css`
- Modify: `frontend/js/ui-core.js`
- Modify: `frontend/js/sidebar.js` only if modal focus behavior remains there
- Modify: `tests/frontend/components.spec.js`

**Interfaces:**
- Consumes: tokens da Task 1 e funções globais `openModal(modalId)`/`closeModal(modalId)`.
- Produces: contratos visuais de `.btn`, campos, `.card`, `.panel`, tabela, modal, toast, loading/empty/error e fallback sólido; mantém helpers globais.

- [ ] **Step 1: Escrever testes de propriedade de componente que falham**

```js
test('specialized cards own layout while base card owns only surface', async ({ page }) => {
  // .card fornece superfície/borda/raio; empresa-card e usuario-card mantêm padding 0.
});

test('glass fallback is opaque when backdrop filter is unavailable', async ({ page }) => {
  // .force-solid-glass remove blur e resolve background para --surface-panel-solid.
});

test('modal traps focus and returns it to the opener', async ({ page }) => {
  // Tab não sai do modal; Escape fecha; foco volta ao botão original.
});
```

- [ ] **Step 2: Executar teste de componentes e confirmar falhas**

Run: `npx playwright test tests/frontend/components.spec.js --reporter=line`

Expected: FAIL nos novos contratos sem quebrar nomes globais de modal/toast.

- [ ] **Step 3: Implementar componentes sem seletores genéricos invasivos**

Fazer `.card` possuir apenas superfície, borda e raio. Garantir 44 px, foco de 2 px + offset de 2 px, disabled explícito, modal contido, toast sem ripple e fallback opaco.

- [ ] **Step 4: Verificar componentes e contratos DOM**

Run: `npx playwright test tests/frontend/components.spec.js tests/frontend/dom-contracts.spec.js --reporter=line`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/css/editorial-components.css frontend/js/ui-core.js frontend/js/sidebar.js tests/frontend/components.spec.js
git commit -m "style: consolidar componentes aurora executive"
```

### Task 4: Login premium responsivo

**Files:**
- Modify: `frontend/index.html`
- Modify: `frontend/css/editorial-pages.css`
- Modify: `frontend/js/auth.js` only for existing loading/error semantics
- Modify: `tests/frontend/login-dashboard.spec.js`
- Modify: `tests/frontend/visual-matrix.spec.js`

**Interfaces:**
- Consumes: `AuthManager.login()` e IDs atuais do formulário.
- Produces: layout 52/48 desktop, coluna única mobile, loading estável e erro `role="alert"`; payload de login permanece idêntico.

- [ ] **Step 1: Escrever testes do login que falham**

```js
test('login uses a two-column desktop shell and a single mobile flow', async ({ page }) => {
  // 1440px: intro e formulário lado a lado dentro de max-width 1120px.
  // 390px: uma coluna, sem assinatura lateral sobre o formulário e sem overflow.
});

test('login loading and error preserve action width and accessible message', async ({ page }) => {
  // botão mantém largura, informa andamento e erro usa role=alert.
});
```

- [ ] **Step 2: Confirmar falha visual/estrutural**

Run: `npx playwright test tests/frontend/login-dashboard.spec.js --grep "login" --reporter=line`

Expected: FAIL na geometria nova; ação real de login continua coberta.

- [ ] **Step 3: Implementar composição do login**

Preservar IDs e conteúdo verdadeiro. Em mobile, remover da composição — não comprimir lateralmente — benefícios que não cabem antes do formulário.

- [ ] **Step 4: Verificar login em seis combinações visuais**

Run: `npx playwright test tests/frontend/login-dashboard.spec.js tests/frontend/visual-matrix.spec.js --grep "login" --reporter=line`

Expected: PASS em desktop/tablet/mobile, claro/escuro, loading e erro.

- [ ] **Step 5: Commit**

```bash
git add frontend/index.html frontend/css/editorial-pages.css frontend/js/auth.js tests/frontend/login-dashboard.spec.js tests/frontend/visual-matrix.spec.js
git commit -m "style: refinar login aurora executive"
```

### Task 5: Dashboard operacional e contexto de empresa

**Files:**
- Modify: `frontend/dashboard.html`
- Modify: `frontend/css/editorial-pages.css`
- Modify: `frontend/js/dashboard.js`
- Modify: `tests/frontend/login-dashboard.spec.js`
- Modify: `tests/frontend/visual-matrix.spec.js`

**Interfaces:**
- Consumes: `DashboardManager.renderKpis()`, `renderCompanyPanel()`, `renderDocumentsChart()` e `renderTopTemplatesChart()` existentes.
- Produces: ordem visual definida na spec, Faixa Aurora, dados reais, alternativas textuais e estados sem contexto/API; não muda requests.

- [ ] **Step 1: Escrever testes de hierarquia e estados que falham**

```js
test('dashboard orders operational data around the active company context', async ({ page }) => {
  // header/CTA, quatro KPIs, gráfico+empresa, atividade+templates, suporte.
});

test('dashboard distinguishes loading api failure empty and no-company states', async ({ page }) => {
  // falha não vira vazio; Master sem contexto recebe ação real; gráficos têm resumo textual.
});
```

- [ ] **Step 2: Executar testes do dashboard e confirmar falha**

Run: `npx playwright test tests/frontend/login-dashboard.spec.js --grep "dashboard" --reporter=line`

Expected: FAIL nos novos estados/ordem, enquanto valores reais e ausência de tendências inventadas permanecem verdes.

- [ ] **Step 3: Implementar o dashboard Aurora Executive**

Manter quatro KPIs reais e a grade da especificação. Aplicar cor da empresa somente à Faixa Aurora, CTA, foco e séries; adicionar resumo textual sem duplicar dados fictícios.

- [ ] **Step 4: Verificar dashboard nos três viewports e dois tenants**

Run: `npx playwright test tests/frontend/login-dashboard.spec.js tests/frontend/visual-matrix.spec.js --grep "dashboard|desktop|tablet|mobile" --reporter=line`

Expected: PASS sem overflow, headings cortados ou controles menores que 44 px.

- [ ] **Step 5: Commit**

```bash
git add frontend/dashboard.html frontend/css/editorial-pages.css frontend/js/dashboard.js tests/frontend/login-dashboard.spec.js tests/frontend/visual-matrix.spec.js
git commit -m "style: refinar dashboard aurora executive"
```

### Task 6: Clientes e templates consistentes

**Files:**
- Modify: `frontend/clientes.html`
- Modify: `frontend/templates.html`
- Modify: `frontend/css/editorial-pages.css`
- Modify: `frontend/js/clientes.js` only if state classes/semantics require it
- Modify: `frontend/js/templates.js` only if state classes/semantics require it
- Modify: `tests/frontend/clientes-templates.spec.js`

**Interfaces:**
- Consumes: busca, CRUD, importação, seleção em massa e permissões existentes.
- Produces: toolbar hierárquica e contrato de card `identidade → essenciais → metadados → ações`; nenhuma API muda.

- [ ] **Step 1: Escrever testes de conteúdo longo e seleção que falham**

```js
test('long client and template content cannot displace selection or actions', async ({ page }) => {
  // nome, e-mail e identificador longos quebram; checkbox e ações ficam dentro do card em 390px.
});

test('bulk actions gain emphasis only while items are selected', async ({ page }) => {
  // estado visual acompanha contagem existente sem mudar a lógica.
});
```

- [ ] **Step 2: Executar testes de clientes/templates e confirmar falhas**

Run: `npx playwright test tests/frontend/clientes-templates.spec.js --reporter=line`

Expected: FAIL nas novas invariantes de layout/ênfase; busca, importação e permissões seguem passando.

- [ ] **Step 3: Implementar toolbars e cards especializados**

Usar uma coluna no mobile, duas/três apenas quando a largura suportar. Manter ação destrutiva separada e vermelha. Não deixar `.card` decidir o padding interno.

- [ ] **Step 4: Verificar comportamento e responsividade**

Run: `npx playwright test tests/frontend/clientes-templates.spec.js tests/frontend/dom-contracts.spec.js --reporter=line`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/clientes.html frontend/templates.html frontend/css/editorial-pages.css frontend/js/clientes.js frontend/js/templates.js tests/frontend/clientes-templates.spec.js
git commit -m "style: refinar clientes e templates"
```

### Task 7: Fluxo de documentos em quatro etapas

**Files:**
- Modify: `frontend/documentos.html`
- Modify: `frontend/css/editorial-pages.css`
- Modify: `frontend/js/documentos.js`
- Modify: `tests/frontend/documentos.spec.js`
- Modify: `tests/frontend/visual-matrix.spec.js`

**Interfaces:**
- Consumes: seleção atual, `gerarDocumentos()`, editor de campos, polling e downloads existentes.
- Produces: progresso visual de quatro etapas, resumo sticky somente a partir de 1024 px e estados claros de geração/arquivo; payload permanece byte-for-byte equivalente em propriedades.

- [ ] **Step 1: Escrever testes de layout e estados que falham**

```js
test('document workflow maps selection options review and generation without changing payload', async ({ page }) => {
  // quatro etapas, contadores e request atual preservados.
});

test('document failure and unavailable file remain distinct from success', async ({ page }) => {
  // erro de API, polling e URL ausente mostram causa/próxima ação; não criam botão inválido.
});

test('document workflow fits 320px and 390px without document overflow', async ({ page }) => {
  // gutter de 16px; progresso compacto; resumo deixa de ser sticky.
});
```

- [ ] **Step 2: Executar testes e confirmar falhas específicas**

Run: `npx playwright test tests/frontend/documentos.spec.js --reporter=line`

Expected: FAIL nos novos estados/320 px; payload e editor atual continuam passando.

- [ ] **Step 3: Implementar composição e estados do fluxo**

Alterar JavaScript somente para classes, semântica e mensagens de apresentação. Não mudar corpo de `/api/gerar-documentos`, polling ou estratégia de download.

- [ ] **Step 4: Verificar fluxo completo e screenshots críticas**

Run: `npx playwright test tests/frontend/documentos.spec.js tests/frontend/visual-matrix.spec.js --grep "document|documentos|mobile" --reporter=line`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/documentos.html frontend/css/editorial-pages.css frontend/js/documentos.js tests/frontend/documentos.spec.js tests/frontend/visual-matrix.spec.js
git commit -m "style: refinar fluxo de documentos"
```

### Task 8: Auditoria, empresas e usuários

**Files:**
- Modify: `frontend/auditoria.html`
- Modify: `frontend/empresas.html`
- Modify: `frontend/usuarios.html`
- Modify: `frontend/css/editorial-pages.css`
- Modify: `frontend/js/auditoria.js` only for presentational state semantics
- Modify: `frontend/js/empresas.js` only for state classes/semantics
- Modify: `frontend/js/usuarios.js` only for state classes/semantics
- Modify: `tests/frontend/admin-pages.spec.js`

**Interfaces:**
- Consumes: permissões master/admin, CRUD e carregamento atuais.
- Produces: tabela de auditoria contida, cards administrativos uniformes, rótulo textual da empresa ativa e conteúdo longo seguro.

- [ ] **Step 1: Escrever testes administrativos que falham**

```js
test('active company remains explicit without relying on color', async ({ page }) => {
  // Faixa Aurora + texto Empresa ativa + ações/permissões atuais.
});

test('long company and user identity remains usable at 390px', async ({ page }) => {
  // nome/e-mail/slug quebram; ações empilham; excluir fica por último.
});

test('audit api error is not rendered as an empty log', async ({ page }) => {
  // estado de erro nomeado com ação possível; tabela vazia fica distinta.
});
```

- [ ] **Step 2: Executar testes administrativos e confirmar falhas**

Run: `npx playwright test tests/frontend/admin-pages.spec.js --reporter=line`

Expected: FAIL nas novas semânticas/layout, com permissões existentes ainda verdes.

- [ ] **Step 3: Implementar páginas administrativas**

Compartilhar contrato de card sem fundir intenções de empresa e usuário. Manter tabela dentro de container; primeira coluna sticky somente se restarem 160 px úteis para conteúdo.

- [ ] **Step 4: Verificar páginas e contratos DOM**

Run: `npx playwright test tests/frontend/admin-pages.spec.js tests/frontend/dom-contracts.spec.js --reporter=line`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/auditoria.html frontend/empresas.html frontend/usuarios.html frontend/css/editorial-pages.css frontend/js/auditoria.js frontend/js/empresas.js frontend/js/usuarios.js tests/frontend/admin-pages.spec.js
git commit -m "style: refinar administracao aurora executive"
```

### Task 9: Responsividade, matriz visual e limpeza final

**Files:**
- Modify: `frontend/css/editorial-responsive.css`
- Modify: `frontend/css/editorial-pages.css` only for defects owned by page composition
- Modify: `frontend/css/editorial-components.css` only for defects owned by shared components
- Modify: `tests/frontend/visual-matrix.spec.js`
- Modify: `tests/frontend/native-smoke.spec.js`
- Modify: `tests/frontend/dom-contracts.spec.js` only if a preserved contract needs stronger coverage

**Interfaces:**
- Consumes: todas as interfaces produzidas nas Tasks 1–8.
- Produces: frontend integrado em 320/390/1024/1440 px, temas/tenants completos e suíte final verde; nenhuma nova API.

- [ ] **Step 1: Ampliar a matriz antes das correções finais**

Adicionar cenários explícitos:

```js
test('critical pages remain usable at 320px and 200 percent zoom', async ({ page }) => {
  // sem overflow do documento, controle perdido ou texto sobreposto.
});

test('Aurora Executive light and dark themes remain structurally equivalent', async ({ page }) => {
  // mesma ordem/conteúdo; superfícies realmente distintas; foco e fallback válidos.
});
```

Capturar login, dashboard, documentos, clientes, empresas e usuários para Amethyst/Executive onde aplicável.

- [ ] **Step 2: Executar matriz e registrar cada falha por proprietário**

Run: `npx playwright test tests/frontend/visual-matrix.spec.js --reporter=line`

Expected: os novos casos podem falhar; cada falha deve ser classificada como shell, componente ou página antes da correção.

- [ ] **Step 3: Corrigir somente defeitos comprovados e remover duplicações obsoletas**

Mover cada regra para seu arquivo proprietário. Remover override apenas após `rg` confirmar ausência de consumidor ou teste provar substituição. Não fazer limpeza cosmética alheia ao redesign.

- [ ] **Step 4: Executar regressão funcional completa**

Run: `npm run lint:frontend`

Expected: exit 0, sem warning.

Run: `npm run test:ui -- --reporter=line`

Expected: todos os testes passam, incluindo matriz visual e fluxo nativo.

Run: `npm run build`

Expected: exit 0 (`No build step required`).

- [ ] **Step 5: Revisar manualmente as capturas finais**

Registrar caminho, viewport, tema e tenant de cada captura crítica. Avaliar brief, hierarquia, consistência, responsividade, conteúdo, identidade, copy, contraste, movimento e estados não felizes separadamente do resultado dos testes.

- [ ] **Step 6: Confirmar escopo do commit**

Run: `git diff --check && git status --short`

Expected: sem erro de whitespace; arquivos paralelos já existentes continuam fora do staging.

- [ ] **Step 7: Commit**

```bash
git add frontend/css/editorial-responsive.css frontend/css/editorial-pages.css frontend/css/editorial-components.css tests/frontend/visual-matrix.spec.js tests/frontend/native-smoke.spec.js tests/frontend/dom-contracts.spec.js
git commit -m "style: concluir aurora executive"
```

## Completion Gate

- `npm run lint:frontend` passa sem warning.
- `npm run test:ui -- --reporter=line` passa integralmente.
- `npm run build` retorna exit 0.
- O diff não contém backend, banco ou alterações paralelas.
- Cada commit corresponde a uma única tarefa e pode ser revertido isoladamente.
- Capturas finais documentam 390/1024/1440 px, claro/escuro e Amethyst/Executive.
- Limitações visuais ou comportamentais restantes são listadas explicitamente; ausência de evidência não é chamada de conclusão.
