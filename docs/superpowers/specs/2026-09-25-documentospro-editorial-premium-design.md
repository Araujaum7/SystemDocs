# DocumentosPro — Redesign Editorial Premium

## Objetivo

Criar no Figma uma proposta visual premium para o DocumentosPro, usando o dashboard como tela-piloto. A proposta deve transmitir confiança, clareza operacional e sofisticação corporativa sem alterar o produto atual nesta etapa.

## Escopo do protótipo

- Painel de tokens e fundamentos visuais.
- Dashboard desktop com largura de 1440 px.
- Versões clara e escura da tela principal.
- Componentes reutilizáveis para navegação, botões, indicadores e painéis.
- Duas identidades empresariais demonstrativas para validar o white-label.

Não fazem parte desta etapa a implementação no frontend, a refatoração das demais telas ou a alteração de fluxos funcionais.

## Direção visual

A interface seguirá uma linguagem editorial corporativa: composição sóbria, espaço em branco generoso, tipografia com hierarquia forte, painéis limpos, bordas finas e sombras discretas. Gradientes serão usados apenas em detalhes de marca ou visualizações de dados, nunca como decoração dominante.

As superfícies permanecerão neutras para que a identidade de cada empresa apareça com controle e preserve a aparência premium. Cores institucionais não serão aplicadas indiscriminadamente em fundos, textos ou sombras.

## Sistema white-label

Cada empresa continuará definindo duas cores-base:

- `Brand Primary`: ações principais, links, foco, seleção e navegação ativa.
- `Brand Secondary`: gráficos, comparações e destaques complementares.

No Figma, as cores serão representadas por variáveis semânticas com escalas de 50 a 700 e modos para tema claro e escuro. A estrutura espelhará o comportamento existente de geração de paletas por luminosidade.

As cores de sucesso, atenção, erro e informação serão independentes das cores da empresa. Superfícies, textos e bordas usarão tokens neutros. Combinações com contraste insuficiente terão luminosidade ajustada para preservar legibilidade, especialmente em botões, estados ativos e gráficos.

O protótipo mostrará a mesma tela com duas empresas demonstrativas, comprovando que a troca de identidade não altera layout, hierarquia ou acessibilidade.

## Estrutura do dashboard

### Navegação lateral

A sidebar reunirá marca, navegação principal, seção administrativa, empresa ativa e perfil. O item selecionado usará a cor primária da empresa de forma contida. A estrutura manterá suporte visual ao estado recolhido, embora o protótipo inicial represente o estado expandido.

### Cabeçalho

O cabeçalho será compacto e apresentará título, contexto operacional, empresa ativa, data, alternância de tema e acesso ao perfil. O contexto da empresa deve ser visível sem competir com o título da página.

### Conteúdo principal

O conteúdo seguirá esta ordem:

1. Resumo editorial do contexto ativo e estado do sistema.
2. Quatro indicadores: clientes, templates, usuários e capacidade de geração.
3. Gráfico de evolução operacional como elemento analítico principal.
4. Ações rápidas orientadas às tarefas frequentes.
5. Atividades recentes e visão administrativa para perfis autorizados.

O banner atual com grande gradiente será substituído por uma composição mais discreta, com destaque tipográfico e uma pequena área de marca.

## Componentes

O arquivo do Figma terá componentes reutilizáveis para:

- item de navegação e estado ativo;
- botão primário, secundário e discreto;
- card de indicador;
- painel de conteúdo;
- ação rápida;
- badge e status;
- identificação da empresa ativa;
- item de atividade;
- controle de tema e perfil.

Os componentes usarão auto layout, variantes e variáveis semânticas. Ícones serão consistentes com a família Phosphor já adotada pelo produto.

## Tipografia e densidade

A proposta priorizará uma família sans-serif contemporânea disponível no Figma, com peso editorial nos títulos e alta legibilidade em dados e formulários. A escala tipográfica distinguirá título de página, títulos de seção, métricas, texto de apoio e rótulos compactos.

O espaçamento seguirá uma base de 4 px, com intervalos predominantes de 8, 12, 16, 24 e 32 px. Cards e painéis terão raios moderados; o excesso atual de cantos muito arredondados será reduzido.

## Temas claro e escuro

O tema claro usará fundo marfim frio, painéis brancos, texto grafite e bordas suaves. O tema escuro usará superfícies carvão azuladas, evitando preto puro e fundos excessivamente coloridos.

As cores de empresa serão recalculadas para cada tema. A versão escura não será uma inversão direta da clara: superfícies, bordas, sombras e intensidade das cores de marca terão valores próprios.

## Validação

A proposta será considerada pronta para avaliação quando:

- o dashboard estiver completo em tema claro e escuro;
- a troca entre duas empresas demonstrativas preservar contraste e hierarquia;
- os elementos repetidos estiverem componentizados;
- não houver textos cortados, sobreposições ou placeholders;
- a família tipográfica usada estiver verificada;
- uma captura final do dashboard permitir comparação visual integral.

Após a aprovação do protótipo, a implementação no frontend será tratada como uma etapa separada.
