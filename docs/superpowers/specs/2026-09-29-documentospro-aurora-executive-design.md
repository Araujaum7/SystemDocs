# DocumentosPro — Aurora Executive

**Data:** 29 de setembro de 2026

**Status:** direção visual aprovada; implementação pendente de plano

**Escopo:** frontend HTML, CSS e JavaScript existente

## 1. Objetivo

Refinar todo o frontend do DocumentosPro para uma interface premium, moderna e adequada ao uso diário, mantendo a identidade Aurora aprovada e a personalização de cores por empresa.

O resultado deve parecer um produto corporativo maduro: hierarquia clara, densidade controlada, componentes consistentes, tema escuro elegante, tema claro verdadeiro e comportamento confiável em desktop, tablet e celular.

O redesign não altera regras de negócio, permissões, APIs, banco de dados, formatos de arquivos, IDs usados pelo JavaScript ou fluxos de geração de documentos.

## 2. Contexto e diagnóstico

O frontend usa HTML, CSS e JavaScript sem framework. Todas as páginas carregam `style.css` e depois `editorial.css`; esta última importa tokens, base, tema, shell, componentes, páginas e responsividade.

A auditoria identificou quatro riscos estruturais que o plano de implementação deverá tratar:

1. regras genéricas como `.card`, `.btn` e seletores de formulário podem sobrescrever componentes especializados;
2. `style.css` e os arquivos `editorial-*` disputam a propriedade dos mesmos estilos;
3. desktop e mobile dependem de muitas correções posteriores, em vez de uma composição responsiva definida na origem;
4. o efeito de vidro perde legibilidade quando blur, tema claro ou cores extremas de empresa entram em cena.

Como o workspace possui alterações paralelas fora do frontend, a implementação deverá começar com uma nova baseline e nunca incluir arquivos não relacionados nos commits do redesign.

## 3. Usuários e tarefas principais

### Usuário comum

- localizar e cadastrar clientes;
- selecionar clientes e templates;
- gerar documentos em Word ou PDF;
- consultar os modelos disponíveis;
- compreender erros e estados vazios sem suporte externo.

### Administrador

- executar todas as tarefas do usuário comum;
- administrar templates e usuários;
- consultar auditoria;
- entender rapidamente o contexto da empresa ativa.

### Master

- executar todas as tarefas administrativas;
- alternar o contexto entre empresas;
- administrar empresas;
- reconhecer com segurança qual empresa está ativa antes de realizar uma ação.

## 4. Restrições preservadas

- Manter HTML, CSS e JavaScript atuais; não migrar para framework.
- Preservar endpoints, payloads, autenticação, permissões e armazenamento local.
- Preservar todos os IDs, nomes de campos, scripts carregados e hooks usados pelos testes.
- Manter tema escuro como preferência inicial quando não houver escolha salva.
- Manter tema claro disponível e persistente.
- Usar `temaCor` e `temaCorSecundaria` como fontes exclusivas dos acentos da empresa.
- Não transformar busca global desabilitada em funcionalidade fictícia.
- Não inventar métricas, tendências ou dados de atividade.
- Manter dados reais existentes no dashboard e marcar claramente indisponibilidade.
- Manter os arquivos DOCX/PDF gerados sem alterações visuais ou estruturais.

## 5. Direção visual

### 5.1 Princípio

Aurora Executive combina superfícies azul-marinho neutras, tipografia forte, vidro discreto e acentos derivados da empresa ativa. A cor da empresa orienta a pessoa; ela não cobre a interface inteira.

Aproximadamente 80% da tela será neutra, 15% usará variações de superfície e no máximo 5% receberá cor de marca ou cor semântica.

### 5.2 Cor

#### Tema escuro

| Token | Valor-base | Uso |
|---|---:|---|
| `--surface-app` | `#07111F` | fundo da aplicação |
| `--surface-sidebar` | `rgba(9, 22, 37, 0.94)` | navegação |
| `--surface-topbar` | `rgba(7, 17, 31, 0.88)` | barra superior |
| `--surface-panel` | `rgba(13, 27, 46, 0.88)` | painéis principais |
| `--surface-panel-solid` | `#0D1B2E` | fallback sem blur |
| `--surface-raised` | `#12243C` | dropdowns, modais e hover |
| `--text-primary` | `#F8FAFC` | títulos e conteúdo principal |
| `--text-secondary` | `#A5B4C7` | descrições e metadados |
| `--border-soft` | `rgba(165, 180, 199, 0.16)` | separação estrutural |
| `--focus-fallback` | `#7DD3FC` | foco sem cor de empresa válida |

Contrastes calculados:

- `#F8FAFC` sobre `#07111F`: 18,10:1;
- `#F8FAFC` sobre `#0D1B2E`: 16,54:1;
- `#A5B4C7` sobre `#07111F`: 8,97:1;
- `#A5B4C7` sobre `#0D1B2E`: 8,20:1;
- `#7DD3FC` sobre `#07111F`: 11,36:1.

#### Tema claro

| Token | Valor-base | Uso |
|---|---:|---|
| `--surface-app` | `#F4F7FB` | fundo da aplicação |
| `--surface-sidebar` | `rgba(255, 255, 255, 0.96)` | navegação |
| `--surface-topbar` | `rgba(255, 255, 255, 0.92)` | barra superior |
| `--surface-panel` | `rgba(255, 255, 255, 0.94)` | painéis |
| `--surface-panel-solid` | `#FFFFFF` | fallback sem blur |
| `--surface-raised` | `#EEF3F9` | dropdowns, modais e hover |
| `--text-primary` | `#172033` | títulos e conteúdo principal |
| `--text-secondary` | `#58677A` | descrições e metadados |
| `--border-soft` | `#CBD5E1` | separação estrutural |
| `--focus-fallback` | `#0369A1` | foco sem cor de empresa válida |

Contrastes calculados:

- `#172033` sobre `#F4F7FB`: 15,14:1;
- `#172033` sobre `#FFFFFF`: 16,27:1;
- `#58677A` sobre `#F4F7FB`: 5,38:1;
- `#58677A` sobre `#FFFFFF`: 5,78:1;
- `#0369A1` sobre `#FFFFFF`: 5,93:1.

#### Cor da empresa

`AuthManager.applyThemeColor()` continuará lendo `temaCor` e `temaCorSecundaria`. `injectPalette()` continuará derivando escalas e deverá garantir:

- ação primária com texto de contraste adequado;
- foco visível com contraste mínimo de 3:1 contra a superfície;
- navegação ativa legível em ambos os temas;
- gráficos distinguíveis sem depender apenas de cor;
- remoção dos tokens secundários anteriores ao trocar para empresa sem cor secundária;
- fallback neutro quando a configuração for ausente ou inválida.

Amostras de validação obrigatórias:

- Amethyst: primária `#7C3AED`, secundária `#2563EB`;
- Executive: primária `#0F766E`, secundária `#B45309`;
- extremos: `#F5F5F5` e `#101010`.

Cores semânticas de sucesso, aviso, perigo e informação não serão substituídas pela cor da empresa.

### 5.3 Tipografia

- Família: `Plus Jakarta Sans`, com `system-ui` como fallback.
- Display: peso 700, `clamp(1.75rem, 2.3vw, 2.25rem)`, entrelinha 1,12, tracking `-0.03em`.
- Título de seção: peso 700, 1rem a 1,125rem, entrelinha 1,3, tracking `-0.015em`.
- Corpo: peso 400 ou 500, 0,9375rem no desktop e 1rem em formulários mobile, entrelinha 1,55, medida máxima de 72 caracteres.
- Utilitário: peso 600, 0,75rem, entrelinha 1,35; caixa alta somente em rótulos curtos de navegação ou tabela.
- Valores de KPI: peso 750 ou 800, `clamp(1.75rem, 3vw, 2.25rem)`, números tabulares.

Não haverá tipografia decorativa adicional.

### 5.4 Espaçamento, formas e elevação

- Escala: 4, 8, 12, 16, 24, 32, 40 e 48 px.
- Espaçamento interno de controles: 12 px vertical e 14–16 px horizontal.
- Altura mínima de controles: 44 px; ações primárias mobile podem usar 48 px.
- Raio de controle: 8 px.
- Raio de card: 12 px.
- Raio de painel de destaque e modal: 16 px.
- Pílulas somente para status, metadados e filtros compactos.
- Sombra pequena: separação de dropdowns.
- Sombra média: topbar e sidebar.
- Sombra grande: modal; nunca em todos os cards simultaneamente.

O brilho de marca será restrito a foco, CTA principal e elemento de assinatura. Hover não deslocará cards de dados.

### 5.5 Assinatura: Faixa Aurora contextual

A assinatura visual será uma faixa vertical de 3 px derivada da cor primária e secundária da empresa.

Ela aparecerá somente em:

- item de navegação ativo;
- KPI ou painel que representa o contexto principal da página;
- item selecionado em fluxos de escolha.

No desktop, a faixa terá 3 px e acompanhará a altura do componente, com brilho máximo de 12 px e 18% de opacidade. No mobile, terá 3 px sem aumentar a largura calculada do componente. Em movimento reduzido, a troca de cor será instantânea.

O fundo Aurora será apenas uma atmosfera estática e muito suave; ao remover a Faixa Aurora, a tela deverá perder sua identidade. Nenhum outro recurso decorativo competirá com ela.

## 6. Arquitetura visual e propriedade CSS

`editorial.css` continuará como ponto de entrada e importará, nesta ordem:

1. `editorial-tokens.css`: somente tokens;
2. `editorial-base.css`: reset, tipografia, foco, seleção, scrollbar e movimento reduzido;
3. `editorial-theme.css`: aplicação white-label e estados de tema;
4. `editorial-shell.css`: sidebar, topbar, área principal e drawer;
5. `editorial-components.css`: botões, campos, cards, tabelas, modal, toast e estados;
6. `editorial-pages.css`: composições específicas por página;
7. `editorial-responsive.css`: somente mudanças entre breakpoints.

Regras de propriedade:

- nenhum seletor genérico de componente poderá redefinir padding de cards especializados;
- cada propriedade visual terá um único arquivo proprietário;
- `style.css` continuará carregado primeiro para compatibilidade, mas conflitos usados pelo frontend serão neutralizados de forma explícita e progressiva;
- não serão adicionados `!important` sem um conflito legado documentado;
- valores repetidos deverão usar tokens;
- estilos inline existentes serão removidos apenas quando o mesmo comportamento estiver coberto por classe e teste;
- nenhuma folha inteira será substituída sem comparação de seletores e contratos.

## 7. Shell autenticado

### Desktop, a partir de 1200 px

- Sidebar fixa com 228 px, margem externa de 16 px e raio de 16 px.
- Topbar com 68 px e conteúdo alinhado à grade principal.
- Conteúdo com padding de 24 px e largura útil fluida até 1600 px.
- Busca global permanece visualmente desabilitada e claramente identificada.
- Contexto da empresa, tema e usuário ficam agrupados à direita.
- Usuário e empresa usam truncamento com tooltip/título, nunca corte silencioso.

### Tablet, 768–1199 px

- Sidebar recolhida para 76 px quando houver espaço; abaixo de 960 px vira drawer.
- A busca global pode reduzir até 280 px e depois é ocultada como unidade completa.
- Conteúdo usa padding de 20 px.
- Grades de quatro colunas tornam-se duas colunas.

### Mobile, até 767 px

- Topbar com 64 px e três zonas: abrir menu, marca/contexto compacto e usuário.
- Busca global, alternância de tema e detalhes da empresa migram para o drawer.
- Sidebar abre como drawer com largura máxima de 320 px e overlay clicável.
- A página recebe gutter de 16 px e nenhuma área usa `100vw`.
- A abertura bloqueia scroll do documento e mantém foco dentro do drawer.
- Fechar funciona por botão, overlay e tecla Escape; foco retorna ao acionador.

## 8. Inventário e composição das páginas

### 8.1 Login

#### Desktop

```text
┌──────────────────────────────┬────────────────────────────┐
│ proposta de valor            │ acesso seguro              │
│ benefícios verificáveis      │ e-mail                     │
│ atmosfera Aurora discreta    │ senha                      │
│                              │ entrar + estado de erro    │
└──────────────────────────────┴────────────────────────────┘
```

- Shell centralizado com máximo de 1120 px.
- Coluna informativa ocupa 52%; formulário, 48%.
- O título explica o produto sem slogans genéricos.
- Erro fica junto ao formulário e recebe `role="alert"`.
- Loading mantém largura do botão e explica a ação em andamento.

#### Mobile

- Uma única coluna.
- Marca, título curto, formulário e garantia de segurança nesta ordem.
- Benefícios longos são removidos, não comprimidos ao lado do formulário.
- Nenhum texto decorativo flutua sobre os campos.

### 8.2 Dashboard

Ordem de leitura:

1. saudação, contexto e CTA “Gerar documento”;
2. quatro KPIs reais;
3. volume de documentos e empresa ativa;
4. atividade recente e templates mais usados;
5. ações rápidas, resumo operacional e visão Master quando permitida.

#### Desktop

```text
┌──────────────────────── cabeçalho + CTA ────────────────────────┐
├──────── KPI ────────┬──────── KPI ───────┬──── KPI ──┬── KPI ─┤
├──────────────── gráfico principal ─────────────┬─ empresa ativa ┤
├──────────────── atividade recente ─────────────┼─ templates ────┤
└──────── ações rápidas ───────┬─ resumo ────────┴─ master ───────┘
```

- Gráfico principal recebe prioridade de largura.
- Empresa ativa permanece visível antes de qualquer ação contextual.
- KPIs não exibem tendências percentuais inventadas.
- Canvas terá texto alternativo e resumo textual adjacente quando os dados forem relevantes.

#### Mobile

- Cabeçalho empilha saudação, contexto e CTA em largura total.
- KPIs usam uma coluna até 479 px e duas colunas a partir de 480 px quando couberem sem reduzir legibilidade.
- Empresa ativa sobe para logo após os KPIs.
- Gráficos têm altura limitada e legenda fora do canvas.
- Atividade e ações rápidas viram listas de toque, não miniaturas do desktop.

### 8.3 Clientes e templates

- Cabeçalho com título, descrição e ação principal.
- Toolbar com busca na primeira linha; ações em grupo separado.
- Seleção em massa só ganha destaque quando houver itens selecionados.
- Cards usam estrutura fixa: identidade, dados essenciais, metadados e ações.
- Nome longo quebra sem empurrar seleção ou ações.
- CPF, e-mail e identificadores usam largura e quebra seguras.
- Desktop pode usar duas ou três colunas conforme largura real; mobile usa uma.
- Ações destrutivas permanecem vermelhas e separadas da ação principal.

### 8.4 Documentos

- Progresso explícito com quatro etapas: clientes, templates, opções, revisão/geração.
- Cada etapa tem número, título, instrução e estado.
- Busca e seleção permanecem dentro da etapa correspondente.
- Resumo lateral é sticky apenas a partir de 1024 px e nunca cobre conteúdo.
- Mobile transforma o progresso em lista compacta horizontal rolável com rótulo atual exposto; conteúdo permanece em uma coluna de largura segura.
- “Editar campos” fica associado à etapa de opções e explica quando está indisponível.
- Geração apresenta progresso, sucesso, erro e disponibilidade do arquivo sem alterar o payload atual.

### 8.5 Auditoria

- Contagem e filtros acima da tabela.
- Tabela mantém cabeçalho fixo somente dentro de seu container.
- Mobile usa scroll horizontal explícito com primeira coluna persistente apenas se não reduzir o conteúdo abaixo de 160 px.
- Datas, usuário, ação e entidade permanecem identificáveis sem depender de ícone.

### 8.6 Empresas e usuários

- Cards administrativos compartilham o mesmo contrato estrutural, mas não o padding de `.card` genérico.
- Empresa ativa recebe a Faixa Aurora e rótulo textual “Empresa ativa”.
- Monograma, nome, slug, contagens e cores aparecem em hierarquia previsível.
- Usuários exibem nome, e-mail, perfil, empresa e status antes das ações.
- Troca de senha, edição e exclusão mantêm os fluxos e permissões atuais.
- Mobile empilha ações; ação destrutiva permanece por último.

## 9. Componentes compartilhados

### Botões

- Primário: cor da empresa com `--on-primary` calculado.
- Secundário: superfície neutra e borda clara.
- Perigo: cor semântica fixa.
- Ghost: navegação ou ação de baixa ênfase.
- Estados obrigatórios: normal, hover, active, focus-visible, disabled e loading.
- Nenhum botão terá menos de 44 px de altura ou dependerá apenas de ícone sem nome acessível.

### Campos

- Label sempre visível; placeholder funciona apenas como exemplo.
- Ajuda, erro e estado ficam abaixo do controle em áreas reservadas quando necessário.
- Foco usa anel de 2 px e offset de 2 px.
- Disabled usa contraste reduzido, cursor apropriado e explicação quando a causa não for óbvia.
- Selects mantêm opções legíveis nos dois temas.

### Cards e painéis

- `.card` fornece apenas superfície, borda e raio.
- Componentes especializados são responsáveis pelo próprio layout e padding.
- Card clicável recebe semântica e foco equivalentes a um controle; card informativo não simula interação.
- Glass com blur tem fallback opaco `--surface-panel-solid`.

### Modal

- Máximo de `calc(100dvh - 32px)`.
- Cabeçalho e ações permanecem visíveis quando o corpo rolar.
- Foco entra no modal, fica contido e retorna ao acionador.
- Escape fecha apenas quando a ação não for destrutiva irreversível em andamento.

### Toast e estados

- Toast usa `role="status"` para sucesso/informação e `role="alert"` para erro.
- Mensagem informa o que aconteceu e a próxima ação quando aplicável.
- Loading, vazio, erro e sucesso compartilham geometria e tom de voz.
- Estado vazio oferece somente ações realmente disponíveis ao perfil atual.

## 10. Conteúdo e linguagem

- Usar português direto, ativo e consistente.
- A mesma ação mantém o mesmo nome em botão, progresso, sucesso e erro.
- “Entrar no sistema”, “Gerar documento”, “Salvar alterações” e “Excluir” não serão substituídos por termos vagos como “Enviar” ou “Confirmar”.
- Erros descrevem ocorrência e próximo passo.
- Campos desabilitados explicam o motivo quando ele não for autoevidente.
- Busca global continua marcada como indisponível.
- Métricas e tendências sem fonte ficam ausentes, não ilustradas.

## 11. Movimento e desempenho

- Duração curta: 140 ms para hover/foco.
- Duração base: 200 ms para drawer, modal e troca de estado.
- Curva: `cubic-bezier(0.2, 0, 0, 1)`.
- Movimento serve apenas a continuidade, hierarquia e feedback.
- `prefers-reduced-motion: reduce` reduz todas as transições e animações a duração praticamente nula.
- Blur será limitado ao shell e a painéis de destaque; listas grandes usarão superfície sólida ou quase opaca.
- Não haverá partículas, auroras animadas continuamente ou parallax.

## 12. Fluxo de dados e preservação funcional

O redesign não cria um novo estado global. HTML e CSS representam a nova aparência; os módulos JavaScript continuam responsáveis pelos fluxos atuais.

- `auth.js`: autenticação, contexto de empresa, tema e paleta.
- `sidebar.js`: navegação, drawer, usuário e logout.
- `dashboard.js`: KPIs, gráficos, atividades e contexto.
- módulos de página: carregamento, CRUD, seleção e geração atuais.
- `ui-core.js`: feedback compartilhado já existente.

Alterações JavaScript serão permitidas somente para semântica, foco, classes de estado ou atualização visual, sem mudar endpoints, payloads ou decisões de negócio. Cada alteração desse tipo deverá possuir teste de caracterização anterior.

## 13. Estados e tratamento de erro

Cada fluxo deverá cobrir:

- carregando;
- carregado;
- vazio;
- erro recuperável;
- sem permissão;
- campo inválido;
- ação desabilitada;
- sucesso;
- confirmação destrutiva;
- geração em progresso;
- arquivo indisponível ou expirado.

Falhas de API preservam a classificação atual. O redesign muda apenas apresentação e clareza. Nenhuma falha será convertida silenciosamente em estado vazio.

## 14. Acessibilidade

- Texto normal: contraste mínimo 4,5:1.
- Texto grande: contraste mínimo 3:1.
- Foco e limites perceptivos essenciais: mínimo 3:1.
- Área de toque: mínimo 44 × 44 px.
- Ordem de foco acompanha a ordem visual.
- Ícones decorativos usam `aria-hidden="true"`.
- Botões apenas com ícone recebem nome acessível.
- Drawer, modal, toast e erros expõem estado por semântica, não apenas por cor.
- Gráficos possuem nome e alternativa textual suficiente para os dados apresentados.
- Zoom de 200% e largura de 320 px não perdem controles essenciais.

## 15. Validação

### Contratos estáticos

- comparar IDs, formulários, scripts e classes comportamentais antes e depois;
- impedir IDs duplicados;
- confirmar ordem das folhas e propriedade dos tokens;
- verificar ausência de estilos inline novos;
- verificar que arquivos externos e rotas não mudaram.

### Testes automatizados

- tema padrão, persistência, troca de empresa e cores extremas;
- shell desktop, sidebar recolhida e drawer mobile;
- login com loading e erro acessível;
- dashboard com dados reais e sem métricas inventadas;
- clientes e templates com busca, seleção e ações por perfil;
- documentos com quatro etapas e payload preservado;
- auditoria, empresas e usuários com permissões atuais;
- modal, toast, disabled, foco e movimento reduzido;
- fluxo nativo: login, contexto, tema, seis rotas e logout.

### Matriz visual

- 1440 × 900;
- 1024 × 768;
- 390 × 844;
- tema escuro e claro;
- Amethyst e Executive;
- login, dashboard, documentos, clientes, empresas e usuários;
- fallback forçado sem `backdrop-filter`.

Critérios congelados: fidelidade ao brief, hierarquia, consistência, responsividade, integridade de conteúdo, identidade, copy, contraste, tema, movimento e estados não felizes.

## 16. Critérios de aceite

- Todas as páginas formam um único sistema visual.
- Tema claro e escuro são distintos e completos.
- Cores de duas empresas e duas cores extremas permanecem legíveis.
- Nenhum viewport testado apresenta overflow horizontal do documento.
- Nenhum controle interativo fica abaixo de 44 px.
- Login mobile não contém sobreposição.
- Topbar mobile não comprime busca, empresa, tema e usuário simultaneamente.
- Documentos mobile ocupa exatamente a largura disponível dentro do gutter.
- Fallback sem blur é opaco e legível.
- Todos os testes de frontend e lint passam.
- Nenhuma lógica, API, permissão ou payload muda sem autorização separada.

## 17. Fora de escopo

- novos recursos de produto;
- busca global funcional;
- filtros ou métricas adicionais;
- mudanças no backend ou banco;
- migração para React, Vue ou outro framework;
- alteração do conteúdo dos documentos gerados;
- troca de iconografia por uma nova dependência;
- animações decorativas contínuas;
- redesign de marca ou criação de logotipo.

## 18. Crítica da direção

### Substituição de assunto

O layout foi comparado mentalmente com CRM genérico, painel financeiro e ferramenta de analytics. KPIs e cards isoladamente funcionariam nesses produtos, o que seria genérico. A reparação é vincular a composição ao que diferencia o DocumentosPro: empresa ativa sempre explícita, fluxo documental em quatro etapas, templates como insumo e Faixa Aurora derivada do tenant.

Ao substituir DocumentosPro por um dashboard financeiro, a empresa ativa e o fluxo cliente → template → documento deixam de fazer sentido. A composição, portanto, depende do assunto correto.

### Clusters padrão

Riscos identificados:

- dashboard SaaS escuro com glow excessivo;
- bento grid genérico;
- glassmorphism aplicado em toda superfície;
- acento neon arbitrário;
- cards iguais sem hierarquia.

Reparações:

- glow limitado à Faixa Aurora, foco e CTA;
- bento justificado pela coexistência de operação, contexto de empresa e atividade;
- blur limitado e fallback sólido obrigatório;
- acento sempre vem da empresa;
- cards especializados controlam sua própria estrutura.

### Eixos livres

- Paleta neutra: consequência da leitura prolongada e do white-label.
- Tipografia: consequência da densidade operacional e da stack existente.
- Raios: convenção moderada, reduzida para evitar aparência lúdica.
- Ícones: preservação da dependência existente.
- Movimento: consequência de continuidade e feedback; decoração rejeitada.
- Tema escuro inicial: requisito previamente aprovado.
- Tema claro: requisito de paridade, não alternativa incompleta.

### Concentração

A Faixa Aurora é o único dispositivo com função identitária. Gradientes atmosféricos permanecem quase imperceptíveis. Se qualquer brilho secundário competir com a faixa, será removido.

### Consistência aritmética

- Escala de espaçamento fecha em múltiplos de 4 px.
- Sidebar 228 px + margem de 16 px preserva área útil em 1024 px.
- Gutter mobile de 16 px produz 358 px úteis em viewport de 390 px.
- Controle mínimo de 44 px atende o alvo de toque definido.
- Contrastes dos pares neutros foram calculados e superam os limites.
- Cores dinâmicas continuam sujeitas a teste automatizado de contraste.

## 19. Direções rejeitadas

### Glass Neon

Rejeitado porque glow, transparência e gradientes em excesso reduzem a leitura, tornam o tema claro artificial e competem com a cor específica de cada empresa.

### Corporate Clean predominantemente claro

Rejeitado porque apaga a identidade Aurora já aprovada e aproxima o produto de um painel administrativo genérico.

### Reescrita completa ou migração de framework

Rejeitada porque aumenta o risco funcional sem benefício necessário para o objetivo visual.

## 20. Sequência conceitual de implementação

1. congelar contratos e baseline atual;
2. reparar tokens e paridade de tema;
3. estabilizar base, foco e movimento;
4. corrigir shell desktop/tablet/mobile;
5. consolidar componentes compartilhados;
6. refinar login e dashboard;
7. refinar clientes, templates e documentos;
8. refinar auditoria, empresas e usuários;
9. revisar copy, estados e acessibilidade;
10. executar regressão funcional e matriz visual completa.

A ordem detalhada, arquivos específicos e checkpoints serão definidos somente no plano de implementação aprovado posteriormente.
