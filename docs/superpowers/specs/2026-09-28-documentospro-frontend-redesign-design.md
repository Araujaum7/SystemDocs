# DocumentosPro — Redesign Editorial Corporativo Multipágina

## Objetivo

Refatorar integralmente a camada visual do frontend do DocumentosPro para uma linguagem editorial corporativa, profissional e consistente, preservando o comportamento atual do produto. O redesign deve funcionar para empresas com identidades diferentes, em temas claro e escuro, sem alterar autenticação, permissões, chamadas de API, regras de negócio, geração de documentos ou persistência.

## Resultado esperado

O produto deverá parecer uma única aplicação coesa em todas as telas. A identidade da empresa ativa continuará visível, mas será aplicada de forma controlada em ações, foco, navegação, seleção e visualizações de dados. Superfícies, textos, bordas e estados semânticos permanecerão neutros para proteger contraste, legibilidade e consistência.

O redesign abrange:

- login;
- dashboard;
- clientes;
- geração de documentos;
- templates;
- auditoria;
- empresas;
- usuários;
- sidebar, cabeçalhos, formulários, tabelas, cards, modais, notificações, estados vazios, carregamento e responsividade.

## Restrições de preservação funcional

A implementação é uma refatoração visual. Os seguintes contratos são invariantes:

- IDs usados pelos arquivos JavaScript não podem ser removidos nem renomeados.
- Classes de permissão `master-only` e `admin-master-only` devem conservar o comportamento atual.
- Objetos globais, métodos chamados por atributos `onclick` e eventos registrados em `DOMContentLoaded` devem continuar disponíveis.
- Formulários devem preservar IDs, tipos de campo, requisitos, nomes conceituais e eventos de envio.
- Endpoints, métodos HTTP, corpos de requisição, tratamento de resposta, downloads e progresso de geração não serão alterados.
- O contexto da empresa ativa e as regras de visibilidade por papel continuarão sendo controlados pela lógica existente.
- A preferência de sidebar recolhida e o tema persistido em `localStorage` devem continuar funcionando.
- As alterações já preparadas para edição e download de templates devem ser incorporadas visualmente sem regressão.
- Nenhuma migração para React, Vue ou outro framework será introduzida nesta etapa.

Qualquer melhoria funcional descoberta durante a implementação deverá ser registrada separadamente e não será misturada ao redesign.

## Arquitetura visual

O frontend permanecerá multipágina em HTML, CSS e JavaScript puro. `frontend/css/style.css` continuará como ponto de entrada para evitar mudanças em carregamento e rotas, mas seu conteúdo será organizado em camadas claras:

1. tokens de tema e fundações;
2. reset e tipografia;
3. shell da aplicação;
4. componentes reutilizáveis;
5. padrões de dados e formulários;
6. regras específicas de página;
7. estados, animações e acessibilidade;
8. responsividade.

A marcação repetida entre páginas será normalizada visualmente, mas não será substituída por injeção dinâmica nesta etapa. Isso reduz risco de mudança no momento em que autenticação, papel do usuário e listeners são aplicados.

## Sistema white-label

O mecanismo existente em `frontend/js/auth.js` continuará sendo a fonte da identidade da empresa. `applyThemeColor()` seguirá lendo `temaCor` e `temaCorSecundaria`, e `injectPalette()` seguirá derivando as escalas `primary` e `secondary`.

### Responsabilidade das cores

- `Primary`: botão principal, link, foco, item de navegação ativo, seleção e série principal de gráfico.
- `Secondary`: comparações, séries secundárias e destaques complementares.
- `Success`, `warning`, `danger` e `info`: estados do sistema independentes da empresa.
- Neutros: fundo da aplicação, painéis, textos, bordas, overlays e sombras.

As cores de marca não serão usadas em grandes fundos, sombras difusas ou decoração ambiental. Empresas com cores muito claras ou escuras continuarão recebendo ajuste de luminosidade pela lógica atual. O CSS fornecerá fallbacks coerentes para o carregamento anterior à aplicação do tema da empresa.

## Temas claro e escuro

### Tema claro

- fundo principal marfim frio;
- painéis brancos;
- texto grafite;
- bordas cinza-neutras discretas;
- sombras curtas e de baixa opacidade;
- cor empresarial concentrada em elementos interativos.

### Tema escuro

- fundo carvão azulado, sem preto puro;
- painéis em camadas de carvão;
- texto principal quase branco e texto secundário cinza frio;
- bordas visíveis sem brilho;
- cor empresarial recalculada para contraste;
- ausência de neon, glow e glassmorphism.

Tema e empresa serão dimensões independentes: a mesma empresa poderá aparecer nos dois temas e empresas diferentes compartilharão exatamente a mesma estrutura.

## Tipografia e densidade

Será usada uma única família principal, `Plus Jakarta Sans`, com fallback para `Inter` e fontes de sistema. A mistura atual entre `Inter`, `Outfit` e fontes declaradas em páginas será removida visualmente.

Escala proposta:

- título de página: 28–32 px, peso 700;
- título de seção: 18–20 px, peso 650–700;
- métrica: 28–36 px, peso 700;
- corpo: 14–16 px;
- rótulo e metadado: 12–14 px.

O espaçamento seguirá base de 4 px, com intervalos predominantes de 8, 12, 16, 24 e 32 px. Controles terão altura mínima de 44 px. Raios ficarão principalmente entre 8 e 16 px.

## Shell da aplicação

### Sidebar

A sidebar terá largura expandida próxima de 248 px e estado recolhido compatível com o mecanismo atual. Ela reunirá:

- marca DocumentosPro;
- empresa ativa;
- navegação principal;
- seção administrativa condicionada ao papel;
- perfil e saída.

O item ativo terá fundo tonal discreto e marcador na cor primária. Ícones usarão a família Phosphor já existente. No celular, a sidebar continuará como painel lateral com overlay.

### Cabeçalho

O cabeçalho será compacto e consistente, contendo:

- título e descrição contextual;
- empresa ou contexto ativo quando necessário;
- alternância de tema;
- perfil ou ações da página.

A hierarquia do cabeçalho não dependerá de grandes banners ou gradientes.

### Conteúdo

O conteúdo terá largura fluida, respiro regular e alinhamento consistente. Cards e painéis usarão borda de 1 px, fundo neutro e sombra discreta. Hover não deslocará blocos grandes nem prejudicará leitura.

## Componentes visuais

O sistema deverá fornecer padrões consistentes para:

- botões primário, secundário, discreto, sucesso, alerta e perigo;
- campos de texto, senha, busca, select, textarea, upload, radio e checkbox;
- card de indicador;
- painel de conteúdo;
- tabela e lista responsiva;
- badge e estado;
- ação rápida;
- barra de ferramentas;
- modal;
- toast/notificação;
- progresso;
- estado vazio, carregando e erro;
- confirmação de ação destrutiva;
- paginação ou contagem quando já houver suporte lógico.

Os componentes serão implementados por classes CSS reutilizáveis. Regras inline existentes serão removidas apenas quando a substituição preservar o mesmo comportamento e visibilidade.

## Desenho por tela

### Login

Tela centralizada, sóbria e direta, com marca, título, texto de apoio, campos de email e senha e ação principal. O fundo poderá usar uma variação tonal muito discreta da identidade padrão, sem blobs animados nem glassmorphism. Erros permanecem visíveis junto ao fluxo atual de autenticação.

### Dashboard

Será a referência visual do produto:

- contexto da empresa e saudação editorial;
- quatro indicadores;
- evolução operacional;
- ações rápidas;
- atividade recente;
- governança para perfis autorizados.

A estrutura seguirá o conceito visual aprovado: sidebar compacta, superfícies neutras, marca aplicada em navegação, ações e gráfico, e densidade adequada para operação diária.

### Clientes

O topo reunirá título, busca, importação, cadastro e ações em lote. A listagem terá seleção clara, informações principais bem hierarquizadas e ações secundárias menos ruidosas. No celular, cada registro poderá assumir apresentação em card, mantendo os mesmos controles e IDs.

### Documentos

A tela será tratada como um fluxo operacional em etapas visuais:

1. selecionar clientes;
2. selecionar templates;
3. escolher formato e modo de download;
4. revisar quantidades;
5. gerar e acompanhar progresso.

A reorganização será exclusivamente visual. Seleções, edição de campos, histórico, progresso, polling e downloads manterão a lógica atual.

### Templates

O cabeçalho exibirá contexto e ação de upload conforme permissão. Os templates terão nome, campos, data e ações de baixar, editar e excluir. Os modais de upload e edição compartilharão o mesmo padrão visual, preservando validações e limite de arquivo existentes.

### Auditoria

A tela priorizará leitura de eventos: resumo da empresa, quantidade de registros, ação de atualização e tabela com boa densidade. Datas, usuário, ação e contexto terão hierarquia clara. Em telas estreitas, a tabela poderá rolar horizontalmente sem ocultar conteúdo.

### Empresas

Os cards ou linhas destacarão nome, configuração, métricas e empresa ativa. Entrar na empresa será a ação principal; editar e excluir serão ações secundária e destrutiva. A seleção do contexto master continuará usando a lógica atual.

### Usuários

A listagem mostrará nome, email, papel e estado com badges semânticos. Criar usuário, alterar cargo, redefinir senha e excluir manterão seus modais e permissões. Ações destrutivas terão distinção visual clara.

## Responsividade

Serão validadas três faixas:

- desktop amplo: 1280 px ou mais;
- tablet/desktop compacto: 769–1279 px;
- celular: até 768 px.

No desktop, o conteúdo aproveitará largura sem criar linhas excessivamente longas. Em tablet, grids reduzirão colunas progressivamente. No celular:

- sidebar abrirá sobre overlay;
- cabeçalhos e barras de ações poderão quebrar em linhas;
- botões críticos ocuparão largura útil;
- tabelas terão rolagem horizontal ou apresentação adaptada;
- modais respeitarão margens e altura da viewport;
- controles manterão alvo mínimo de 44 px.

## Acessibilidade

- foco visível em todos os controles interativos;
- contraste alvo de 4,5:1 para texto normal;
- estados não dependerão apenas de cor;
- ícones decorativos não substituirão rótulos essenciais;
- botões de fechar e alternar tema terão nomes acessíveis;
- `prefers-reduced-motion` reduzirá animações não essenciais;
- ordem de foco seguirá a ordem visual;
- overlays e modais manterão leitura e interação previsíveis.

## Movimento

Transições serão curtas, entre 120 e 220 ms, aplicadas a cor, borda, opacidade e pequenos deslocamentos. Serão removidos orbes ambientais animados, flutuações contínuas e transformações que façam cards saltarem durante uso. Loading, progresso e abertura de modal continuarão comunicando estado.

## Tratamento de estados e erros

O redesign não mudará a origem nem o conteúdo dos erros. Ele fornecerá apresentação consistente para:

- erro de autenticação;
- falha de API;
- validação de formulário;
- arquivo inválido ou acima do limite;
- lista vazia;
- carregamento;
- sucesso de operação;
- confirmação e progresso de geração.

Toasts e mensagens inline continuarão usando os pontos de chamada atuais. Erros relevantes de formulário permanecerão próximos ao controle ou modal associado.

## Estratégia de implementação

A implementação será incremental e verificável:

1. caracterizar contratos e fluxos existentes;
2. criar fundações e tokens;
3. refatorar shell, navegação, cabeçalho e tema;
4. refatorar componentes globais;
5. aplicar o sistema ao login e dashboard;
6. aplicar às páginas operacionais;
7. aplicar às páginas administrativas;
8. revisar responsividade, acessibilidade e temas;
9. executar validação funcional completa.

Cada etapa deverá manter a aplicação utilizável. Uma falha nos fluxos existentes interrompe a propagação do redesign até a regressão ser corrigida.

## Validação

Como o projeto não possui suíte automatizada de frontend, a implementação incluirá uma matriz de caracterização e smoke tests dos fluxos críticos, sem mudar as regras de negócio.

### Verificações estáticas

- todos os IDs consumidos pelo JavaScript continuam presentes;
- classes de permissão continuam presentes;
- scripts continuam carregados nas páginas corretas;
- não há duplicação acidental de IDs;
- não há links, botões ou formulários sem destino funcional.

### Fluxos funcionais

- login e logout;
- alternância de tema e persistência;
- sidebar expandida, recolhida e móvel;
- seleção de empresa por usuário master;
- CRUD, importação e ações em lote de clientes;
- seleção e geração de documentos;
- edição de campos, acompanhamento de progresso e downloads;
- upload, edição, download e exclusão de templates;
- leitura e atualização de auditoria;
- CRUD e entrada em empresas;
- criação, alteração de papel, redefinição de senha e exclusão de usuários;
- visibilidade correta para `master`, `admin` e `user`.

### Matriz visual

- tema claro e escuro;
- pelo menos duas empresas com pares de cores diferentes;
- desktop de 1440 px;
- viewport intermediária próxima de 1024 px;
- celular próximo de 390 px;
- ausência de texto cortado, sobreposição, overflow inesperado e contraste insuficiente.

## Critérios de aceite

O redesign estará concluído quando:

- todas as oito telas seguirem o mesmo sistema visual;
- temas claro e escuro estiverem consistentes;
- duas identidades empresariais alterarem apenas os tokens de marca;
- os fluxos existentes funcionarem sem mudança observável;
- as permissões por papel permanecerem corretas;
- desktop, tablet e celular não apresentarem defeitos materiais;
- formulários, modais, tabelas e estados tiverem foco e contraste adequados;
- não houver regressão nas alterações atuais de Templates;
- a verificação final registrar comandos, fluxos executados e limitações remanescentes.

## Fora de escopo

- mudança de backend, banco ou API;
- alteração de regras de negócio;
- migração de framework;
- introdução de novas funcionalidades;
- mudança do modelo de permissões;
- substituição do mecanismo white-label;
- redesign de documentos DOCX/PDF gerados.
