# DocumentosPro Figma Editorial Premium Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar no Figma um protótipo premium e componentizado do dashboard do DocumentosPro, com temas claro e escuro e identidade white-label demonstrada por duas empresas.

**Architecture:** O arquivo terá páginas separadas para fundamentos, componentes e composição final. Variáveis de cor neutra, identidade empresarial e dimensões serão independentes; o dashboard será um componente-base instanciado quatro vezes, combinando duas empresas com dois temas sem duplicar a estrutura.

**Tech Stack:** Figma Design, Figma Plugin API via `use_figma`, variables, auto layout, components, variants e Phosphor Icons em SVG.

**Spec:** `docs/superpowers/specs/2026-09-25-documentospro-editorial-premium-design.md`

## Global Constraints

- O artefato inicial é somente um arquivo Figma; nenhum arquivo do frontend será alterado.
- A tela-piloto terá largura de 1440 px e representará o dashboard desktop.
- O arquivo deve incluir tema claro, tema escuro e duas identidades empresariais.
- `Brand Primary` governa ações, foco, seleção e navegação ativa; `Brand Secondary` governa gráficos e destaques complementares.
- Estados de sucesso, atenção, erro e informação permanecem independentes das cores de marca.
- Elementos repetidos devem ser componentes ou instâncias com auto layout.
- O protótipo final não pode conter textos cortados, sobreposições ou placeholders.

## Review Focus

- Cor empresarial muito clara ou escura: derivar a escala por HSL e corrigir luminosidade para manter contraste mínimo de 4,5:1 nos textos normais.
- Troca de empresa: alterar apenas o modo da coleção `Brand`, sem mudar tamanho, espaçamento ou hierarquia.
- Troca de tema: alterar apenas o modo da coleção `Theme`, mantendo a cor empresarial e os estados semânticos.
- Fonte indisponível: confirmar `Plus Jakarta Sans` antes da construção e usar `Inter` em todos os estilos somente se a família preferida não estiver disponível.
- Conteúdo variável: validar títulos, métricas e itens com larguras reais para evitar corte ou sobreposição.

---

### Task 1: Criar o arquivo e a estrutura de páginas

**Files:**
- Create: arquivo Figma `DocumentosPro — Editorial Premium`
- Create: páginas Figma `01 Foundations`, `02 Components` e `03 Dashboard`

**Interfaces:**
- Consumes: plano autenticado retornado por `figma_whoami`.
- Produces: `fileKey` do novo arquivo e IDs das três páginas.

- [ ] **Step 1: Confirmar a conta e o plano do Figma**

Executar `figma_whoami`. Se houver um único plano gravável, usar sua `key`. Se houver mais de um, interromper antes da criação e pedir ao usuário que escolha o plano.

- [ ] **Step 2: Criar o arquivo de design**

Executar `figma_create_new_file` com `editorType: "design"`, `fileName: "DocumentosPro — Editorial Premium"` e a `planKey` confirmada no passo anterior.

- [ ] **Step 3: Criar e nomear as páginas**

Executar `use_figma` uma vez no novo arquivo:

```js
const firstPage = figma.root.children[0];
firstPage.name = "01 Foundations";
const componentsPage = figma.createPage();
componentsPage.name = "02 Components";
const dashboardPage = figma.createPage();
dashboardPage.name = "03 Dashboard";
return {
  mutatedNodeIds: [firstPage.id],
  createdNodeIds: [componentsPage.id, dashboardPage.id],
  pages: figma.root.children.map(page => ({ id: page.id, name: page.name }))
};
```

- [ ] **Step 4: Verificar a estrutura**

O retorno deve conter exatamente três páginas com os nomes definidos. Não continuar se existir página sem nome ou duplicada.

---

### Task 2: Construir as variáveis e a prancha de fundamentos

**Files:**
- Modify: página Figma `01 Foundations`

**Interfaces:**
- Consumes: ID da página `01 Foundations`.
- Produces: IDs das coleções `Theme`, `Brand`, `Foundation` e do frame `Foundations Board`.

- [ ] **Step 1: Confirmar a fonte do produto**

Em uma chamada read-only de `use_figma`, executar `await figma.listAvailableFontsAsync()` e confirmar a presença de `Plus Jakarta Sans` nos estilos Regular, Medium, SemiBold e Bold. Se qualquer estilo estiver ausente, selecionar `Inter` para todos os textos e registrar a família escolhida no retorno.

- [ ] **Step 2: Criar a coleção `Theme`**

Criar modos `Light` e `Dark` e as seguintes variáveis de cor:

| Variável | Light | Dark |
|---|---|---|
| `color/bg/app` | `#F6F5F2` | `#111418` |
| `color/bg/panel` | `#FFFFFF` | `#181C21` |
| `color/bg/muted` | `#EFEEEA` | `#21262C` |
| `color/bg/elevated` | `#FFFFFF` | `#272D34` |
| `color/text/primary` | `#202124` | `#F5F3EE` |
| `color/text/secondary` | `#60646C` | `#B4BAC3` |
| `color/text/subtle` | `#8B8F96` | `#7F8791` |
| `color/border/subtle` | `#E2E0DA` | `#2D333B` |
| `color/border/strong` | `#CBC8C0` | `#414852` |
| `color/status/success` | `#16845B` | `#49C58F` |
| `color/status/warning` | `#A9650B` | `#E7AC4C` |
| `color/status/danger` | `#C43D4B` | `#F07A85` |
| `color/status/info` | `#3567B7` | `#72A2ED` |

Definir `variable.scopes` explicitamente: fundos em `FRAME_FILL` e `SHAPE_FILL`, textos em `TEXT_FILL`, bordas em `STROKE_COLOR` e status em escopos de preenchimento e texto.

- [ ] **Step 3: Criar a coleção `Brand`**

Criar modos `Amethyst Legal` e `Verde Executivo`. Usar como bases:

- `Amethyst Legal`: primária `#7C3AED`, secundária `#2563EB`.
- `Verde Executivo`: primária `#0F766E`, secundária `#B45309`.

Para cada base, gerar `50`, `100`, `400`, `500`, `600` e `700` com a mesma lógica HSL do produto: no tema-base claro, luminosidades `98`, `95`, `base + 10`, `base`, `base - 10` e `base - 20`, limitadas ao intervalo de 0 a 100. Criar variáveis `color/brand/primary/{peso}` e `color/brand/secondary/{peso}`.

- [ ] **Step 4: Criar a coleção `Foundation`**

Criar variáveis numéricas de espaçamento `space/4`, `space/8`, `space/12`, `space/16`, `space/24`, `space/32` e `space/40`; raios `radius/8`, `radius/12`, `radius/16`, `radius/20`; e dimensões `layout/sidebar/248` e `layout/page/1440`. Definir escopos `GAP`, `WIDTH_HEIGHT` e `CORNER_RADIUS` conforme o uso.

- [ ] **Step 5: Criar a prancha visual**

Na página `01 Foundations`, criar um frame `Foundations Board` de 1440 px com auto layout vertical e seções para cores neutras, marcas, estados, tipografia, espaçamento e raios. Exibir amostras das duas empresas e dos dois temas com rótulos reais; todos os swatches devem estar ligados às variáveis criadas.

- [ ] **Step 6: Validar coleções e contraste**

Retornar nomes, modos e contagem de variáveis. Calcular em JavaScript o contraste WCAG entre `brand/primary/600` e branco, além de `text/primary` e `bg/panel`, para cada modo aplicável. O script deve retornar `passes: true` somente quando todas as combinações de texto normal forem maiores ou iguais a `4.5`.

---

### Task 3: Criar a biblioteca local de componentes

**Files:**
- Modify: página Figma `02 Components`

**Interfaces:**
- Consumes: coleções `Theme`, `Brand`, `Foundation` e família tipográfica confirmada.
- Produces: IDs dos component sets `Navigation Item`, `Button`, `KPI Card`, `Status Badge` e dos componentes `Content Panel`, `Quick Action`, `Activity Item`, `Company Context`, `Profile Control`.

- [ ] **Step 1: Criar a prancha de componentes**

Criar `Components Board` com 1440 px, auto layout vertical, padding de 48 px e gap de 40 px. Definir seções `Navigation`, `Actions`, `Data Display` e `Identity`.

- [ ] **Step 2: Criar `Navigation Item`**

Criar componentes de 216 × 44 px com propriedades `State=Default` e `State=Active`. Usar auto layout horizontal, ícone SVG Phosphor de 20 px, gap de 12 px e label de 14 px SemiBold. O estado ativo usa `brand/primary/100` no fundo e `brand/primary/700` no ícone e texto; o padrão usa fundo transparente e `text/secondary`.

- [ ] **Step 3: Criar `Button`**

Criar variantes `Style=Primary`, `Style=Secondary` e `Style=Ghost`, todas com altura de 44 px, padding horizontal de 16 px, gap de 8 px, raio de 10 px e texto de 14 px SemiBold. O primário usa `brand/primary/600`; o secundário usa `bg/panel` com `border/strong`; o ghost não tem preenchimento.

- [ ] **Step 4: Criar componentes de dados**

Criar:

- `KPI Card` com variantes `Tone=Brand`, `Tone=Neutral`, `Tone=Success` e `Tone=Warning`, tamanho 244 × 132 px, rótulo, valor, legenda e marcador de 4 px.
- `Content Panel` com largura flexível, padding de 24 px, raio de 16 px, título, descrição opcional e slot de conteúdo.
- `Status Badge` com variantes `Tone=Success`, `Tone=Warning`, `Tone=Info` e `Tone=Neutral`.
- `Quick Action` com ícone, título, descrição e seta, largura de 248 px e altura mínima de 88 px.
- `Activity Item` com ícone, título, metadado, data e divisor inferior.

- [ ] **Step 5: Criar componentes de identidade**

Criar `Company Context` com monograma, nome da empresa e legenda `Empresa ativa`; criar `Profile Control` com avatar, nome, função e chevron. Ambos usam auto layout e devem aceitar textos reais sem largura fixa no conteúdo interno.

- [ ] **Step 6: Verificar componentização**

Retornar o ID, nome, tipo, largura e altura de cada componente e component set. A validação passa com quatro component sets, cinco componentes simples e nenhuma camada repetida equivalente fora de um componente.

---

### Task 4: Montar o dashboard-base

**Files:**
- Modify: página Figma `03 Dashboard`

**Interfaces:**
- Consumes: componentes e variáveis produzidos nas Tasks 2 e 3.
- Produces: componente `Dashboard / Desktop` de 1440 × 1120 px.

- [ ] **Step 1: Criar a estrutura principal**

Criar o componente `Dashboard / Desktop` em auto layout horizontal, 1440 × 1120 px, com `bg/app`. Inserir sidebar de 248 px e área principal com largura restante, padding de 32 px e gap vertical de 24 px.

- [ ] **Step 2: Compor a sidebar**

Adicionar marca `DocumentosPro`, contexto da empresa `Amethyst Legal`, navegação com Dashboard ativo e itens Clientes, Documentos, Templates e Auditoria. Incluir seção `Administração` com Empresas e Usuários, e posicionar perfil `Marina Costa — Administradora` no rodapé.

- [ ] **Step 3: Compor o cabeçalho e o resumo**

Adicionar título `Visão geral`, subtítulo `Acompanhe a operação e priorize os próximos passos.`, badge `API operacional`, controle de tema e perfil. Abaixo, criar resumo editorial com o texto `Bom dia, Marina`, contexto `Amethyst Legal` e ação primária `Gerar documentos`.

- [ ] **Step 4: Inserir indicadores**

Instanciar quatro `KPI Card` com estes conteúdos:

- Clientes: `248`, `+12 neste mês`.
- Templates: `36`, `8 atualizados recentemente`.
- Usuários: `14`, `Todos com acesso revisado`.
- Capacidade: `8.928`, `documentos por rodada`.

- [ ] **Step 5: Inserir gráfico e ações rápidas**

Criar painel `Evolução operacional` com gráfico de linha de seis pontos (`142`, `168`, `154`, `211`, `236`, `284`) para os meses `Abr` a `Set`. Usar `brand/primary/600` na linha e `brand/secondary/500` no destaque comparativo. Ao lado, inserir três instâncias `Quick Action`: `Novo cliente`, `Gerar documentos` e `Adicionar template`.

- [ ] **Step 6: Inserir atividade e governança**

Criar painel `Atividade recente` com quatro itens reais e painel `Governança` com status `Permissões revisadas`, `Backups em dia` e `2 modelos aguardando revisão`. Usar estados semânticos, não cores da empresa.

- [ ] **Step 7: Verificar conteúdo e geometria**

Retornar todos os textos descendentes com `characters`, `width`, `height` e `textAutoResize`; retornar também bounds de sidebar, área principal, KPIs e painéis. A validação falha se algum texto estiver vazio, se algum item sair dos limites de 1440 × 1120 px ou se houver sobreposição entre irmãos na composição principal.

---

### Task 5: Criar as quatro combinações e validar visualmente

**Files:**
- Modify: página Figma `03 Dashboard`

**Interfaces:**
- Consumes: componente `Dashboard / Desktop` e coleções `Theme` e `Brand`.
- Produces: frame `Dashboard Comparison`, quatro instâncias finais, captura aprovada e URL do arquivo.

- [ ] **Step 1: Criar a prancha de comparação**

Criar `Dashboard Comparison` com auto layout vertical, fundo neutro, padding de 80 px e gap de 80 px. Adicionar título `DocumentosPro — Editorial Premium` e subtítulo `Temas e identidades empresariais`.

- [ ] **Step 2: Instanciar as quatro combinações**

Criar instâncias nomeadas:

- `Amethyst Legal / Light` com modos `Theme=Light` e `Brand=Amethyst Legal`.
- `Amethyst Legal / Dark` com modos `Theme=Dark` e `Brand=Amethyst Legal`.
- `Verde Executivo / Light` com modos `Theme=Light` e `Brand=Verde Executivo`.
- `Verde Executivo / Dark` com modos `Theme=Dark` e `Brand=Verde Executivo`.

Nas instâncias da segunda empresa, trocar somente o nome e o monograma da empresa; a estrutura e os demais conteúdos permanecem idênticos.

- [ ] **Step 3: Validar os modos e a fonte**

Executar leitura estrutural para confirmar quatro instâncias do mesmo componente-base, duas por modo de tema e duas por modo de marca. Ler todos os nós de texto e retornar famílias usadas; a lista deve conter somente a família confirmada na Task 2.

- [ ] **Step 4: Capturar a composição completa**

Executar uma captura do frame `Dashboard Comparison`. Inspecionar texto cortado, sobreposição, contraste, placeholders, alinhamento, consistência de ícones e diferenças indevidas entre empresas.

- [ ] **Step 5: Corrigir somente defeitos encontrados**

Se a captura revelar defeito material, aplicar uma alteração direcionada nos componentes ou no dashboard-base e capturar novamente uma única vez. Não duplicar nem reconstruir a tela.

- [ ] **Step 6: Entregar para aprovação**

Fornecer a URL do arquivo Figma, informar a família tipográfica usada e resumir as quatro combinações disponíveis. Não modificar o frontend até uma solicitação separada do usuário.
