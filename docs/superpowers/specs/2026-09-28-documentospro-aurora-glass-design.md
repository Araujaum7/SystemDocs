# DocumentosPro — Redesign Aurora Glass White-Label

## Status e referência aprovada

Esta especificação substitui a direção editorial descrita em `2026-09-28-documentospro-frontend-redesign-design.md`. A referência visual aprovada é o mockup escuro “Aurora Glass” selecionado pelo usuário na conversa de 28 de setembro de 2026.

O objetivo é reproduzir a mesma linguagem visual em todo o sistema: base azul-marinho profunda, painéis translúcidos, bordas luminosas controladas, navegação compacta, cabeçalho com busca e contexto da empresa, conteúdo denso e organizado, além de uma cor de destaque que muda automaticamente conforme a empresa ativa.

“Exatamente como a imagem” significa preservar a composição, hierarquia, densidade, profundidade, proporções e linguagem dos componentes. Textos, números e gráficos sempre usarão dados reais já disponíveis; a interface não inventará percentuais ou categorias que a API atual não fornece.

## Resultado esperado

O DocumentosPro deverá parecer um produto SaaS B2B premium e coeso em todas as oito telas atuais:

- login;
- visão geral;
- clientes;
- documentos;
- templates;
- auditoria;
- empresas;
- usuários.

O modo escuro será a apresentação inicial de novas sessões. O alternador de tema existente continuará disponível e preservará a preferência do usuário. O modo claro será uma contraparte do mesmo sistema Aurora, e não um segundo design desconectado.

## Critérios de sucesso

- O dashboard em desktop deverá reproduzir a composição aprovada sem overflow em 1440 × 900.
- A empresa ativa deverá trocar todos os tokens de marca sem alterar fundos estruturais, legibilidade ou cores semânticas.
- Empresas com cores claras, escuras ou de baixo contraste deverão continuar produzindo ações e focos legíveis.
- Os sete módulos autenticados deverão compartilhar o mesmo shell, a mesma navegação e os mesmos componentes.
- Login, permissões, CRUDs, geração de documentos, downloads, polling, troca de empresa, tema e sidebar deverão manter o comportamento atual.
- A aplicação deverá funcionar em desktop, tablet e celular sem conteúdo bloqueado, texto sobreposto ou rolagem horizontal da página.
- A suíte Playwright existente deverá continuar verde e será ampliada para caracterizar o novo contrato visual.

## Restrições funcionais

Este trabalho é uma refatoração de interface. Permanecem invariantes:

- endpoints, métodos HTTP, cabeçalhos, corpos de requisição e formatos de resposta;
- autenticação, logout, regras de tenant e cabeçalho `X-Empresa-Id`;
- papéis `master`, `admin` e `user` e classes `master-only` e `admin-master-only`;
- IDs consumidos pelo JavaScript, objetos globais, atributos `onclick` e eventos atuais;
- campos, validações, uploads, downloads, progresso e histórico;
- chaves de `localStorage` para sessão, empresa, tema e sidebar;
- banco de dados e backend;
- HTML, CSS e JavaScript puros, sem migração para framework.

Mudanças funcionais descobertas durante a execução serão registradas separadamente. Elas não entrarão em commits de redesign.

## Abordagem técnica escolhida

O frontend continuará multipágina. A implementação reutilizará a separação atual entre tokens, base, tema, shell, componentes, páginas e responsividade, substituindo progressivamente a linguagem editorial pela Aurora. `frontend/css/style.css` continuará como camada legada durante a transição e `frontend/css/editorial.css` continuará como ponto de entrada compatível, evitando alterações desnecessárias em rotas e carregamento.

Não será criada uma terceira camada permanente de CSS. Ao final de cada grupo de telas, regras antigas que conflitem com o contrato Aurora serão removidas ou neutralizadas dentro dos módulos já existentes. O nome histórico `editorial.css` poderá permanecer como detalhe interno; a interface e os tokens serão Aurora.

## Sistema de tema white-label

### Fontes de identidade

`frontend/js/auth.js` continuará lendo:

- `temaCor` como cor primária da empresa;
- `temaCorSecundaria` como cor complementar;
- a configuração da empresa fixa para usuários comuns;
- `empresaContextoConfig` para usuários master.

`applyThemeColor()` e `injectPalette()` continuarão sendo os pontos únicos de aplicação. A paleta gerada deverá expor tons de 50, 100, 400, 500, 600 e 700 e a cor de texto `--on-primary`/`--on-secondary` calculada por luminância.

### Aplicação da cor da empresa

A cor primária será usada em:

- item ativo da navegação;
- botão principal e seu halo;
- foco de teclado e seleção;
- ícones dos indicadores;
- série principal dos gráficos;
- bordas e glows de painéis destacados;
- avatar ou monograma da empresa;
- links e controles selecionados.

A cor secundária será usada em:

- segunda série de gráficos;
- gradiente curto de ações principais;
- estados complementares de seleção;
- detalhes ambientais de baixa opacidade.

Fundos estruturais, textos e bordas neutras não receberão diretamente a cor da empresa. `success`, `warning`, `danger` e `info` continuarão semanticamente estáveis.

### Cores extremas e fallback

- Cores com luminância insuficiente no modo escuro serão elevadas até uma faixa utilizável.
- Cores claras demais no modo claro serão reduzidas até manter contraste.
- O texto de ações será escolhido entre claro e escuro por contraste real, com alvo mínimo de 4,5:1.
- Se não houver empresa ativa ou configuração válida, o fallback será azul-ciano Aurora.
- Valores inválidos não deverão apagar tokens já válidos nem deixar controles sem cor.

### Tema escuro e tema claro

O modo escuro será padrão quando `darkTheme` ainda não existir. Depois da primeira escolha, o valor persistido será respeitado.

Base escura de referência:

- canvas: azul-marinho quase preto entre `#061326` e `#081a33`;
- sidebar e topbar: camadas entre `#08182f` e `#0b203d`;
- painéis: azul ardósia translúcido entre 68% e 82% de opacidade;
- borda: azul frio claro entre 12% e 24% de opacidade;
- texto principal: `#f5f8ff`;
- texto secundário: azul-cinza claro;
- sombra: preta, curta e difusa;
- blur: 14–20 px somente em superfícies elevadas.

O modo claro manterá a mesma hierarquia com canvas azul-gelo, painéis brancos translúcidos, texto azul-marinho e glows de marca com opacidade reduzida.

`backdrop-filter` será aprimoramento progressivo. Quando não houver suporte, o fundo dos painéis permanecerá opaco o suficiente para leitura.

## Tokens e linguagem visual

### Tipografia

- Família principal: `Plus Jakarta Sans`, com fallback para `Inter` e sistema.
- Saudação: 30–34 px, peso 700–800.
- Título de página: 26–30 px, peso 700.
- Título de painel: 15–18 px, peso 650–700.
- Métrica: 28–36 px, peso 700–800.
- Corpo: 14–16 px.
- Metadado: 12–13 px.

### Espaçamento, raio e movimento

- Escala de espaçamento: 4, 8, 12, 16, 20, 24 e 32 px.
- Cards principais: raio de 14–16 px.
- Campos e botões: raio de 10–12 px e altura mínima de 44 px.
- Transições: 140–220 ms em cor, borda, sombra e opacidade.
- Hover poderá elevar brilho e borda, mas não mover blocos de conteúdo.
- `prefers-reduced-motion` removerá glows animados, varreduras e transições não essenciais.

### Glassmorphism controlado

O efeito de vidro será estrutural, não decorativo:

- transparência apenas onde houver uma camada escura estável por baixo;
- borda interna de 1 px;
- blur moderado;
- brilho localizado na direção da cor de marca;
- sem texto sobre áreas de contraste imprevisível;
- sem neon contínuo em todos os cards.

## Shell autenticado

### Sidebar

A sidebar seguirá a referência aprovada:

- largura expandida de aproximadamente 224–232 px;
- largura recolhida de 72–76 px;
- marca no topo;
- navegação principal em uma coluna;
- item ativo com fundo tonal, borda e glow da empresa;
- separação visual da área administrativa;
- cartão de mensagem/produto na base quando houver espaço;
- recolhimento persistido pela chave atual `sidebarCollapsed`;
- drawer com overlay no celular.

Os rótulos, rotas, permissões e ícones Phosphor atuais serão preservados.

### Topbar

A topbar terá 64–72 px e será independente do conteúdo. Em desktop conterá:

- busca visual à esquerda; inicialmente sem criar busca global funcional;
- empresa ativa no centro-direita;
- avatar, nome e papel do usuário;
- alternador de tema;
- gatilho da navegação móvel quando necessário.

A busca será apresentada como atalho visual desabilitado ou rotulada como indisponível enquanto não houver contrato funcional. O redesign não criará uma busca falsa.

### Área de conteúdo

- Padding de 20–24 px em desktop.
- Largura fluida, sem um contêiner estreito centralizado.
- Grid de 12 colunas no dashboard e grids específicos nas demais telas.
- Painéis com alinhamento rigoroso e alturas coerentes.
- Nenhum bloco de dados dependerá apenas de glow para separar conteúdo.

## Dashboard

O dashboard será a implementação canônica da imagem.

### Linha de boas-vindas

- saudação com nome do usuário;
- subtítulo operacional;
- botão “Gerar documento” alinhado à direita;
- quebra vertical no tablet e largura total no celular.

### Indicadores

Quatro cards mostrarão, nesta ordem:

1. documentos gerados, usando `kpis.documentos` de `/api/dashboard/stats`;
2. clientes, usando a lista já carregada ou `kpis.clientes`;
3. templates, usando a lista já carregada;
4. usuários, usando o mesmo escopo e regra de papel atuais.

Percentuais de tendência não serão inventados. O espaço visual equivalente exibirá descrições verdadeiras como “total da empresa”, “modelos disponíveis” ou “membros ativos”.

### Gráfico principal

O painel “Documentos gerados” usará `graficos.docsPorDia`. O desenho será uma série de barras verticais com a paleta da empresa, grade sutil e tooltip legível. O seletor de período será apenas texto de contexto “Últimos 7 dias”, pois a API atual fornece sete dias e não existe filtro funcional.

### Empresa ativa

O painel reproduzirá o bloco direito da referência:

- monograma;
- nome da empresa;
- resumo do contexto;
- amostras da paleta gerada;
- prévia de documento/cartão;
- ação de edição somente quando o papel e a lógica atual permitirem.

As amostras serão informativas. Não haverá troca de tema não persistida por cliques decorativos.

### Atividade recente

O painel usará os registros que o dashboard já carrega, preservando a regra atual de atividade derivada de clientes. A apresentação será uma tabela/lista glass com data, nome e contexto disponível. Uma futura atividade por auditoria exigiria mudança funcional e está fora deste redesign.

### Distribuição secundária

O painel circular da referência exibirá “Templates mais utilizados”, usando `graficos.topTemplates`. Isso mantém o desenho do donut sem rotular os dados incorretamente como “Tipos de documentos”. Quando não houver dados, será mostrado o estado vazio no mesmo espaço.

### Contexto master sem empresa

O layout manterá o estado existente de seleção obrigatória de empresa. Indicadores ficarão neutros, os painéis dependentes de tenant mostrarão estado vazio e a ação “Selecionar empresa” permanecerá prioritária.

## Demais telas

### Login

- canvas marinho com glow ambiental da marca padrão;
- painel central glass, marca, título, apoio, email, senha e ação;
- rótulos explícitos e erro no fluxo atual;
- sem imagens, blobs animados ou dependência adicional.

### Clientes

- cabeçalho compacto com busca e ações existentes;
- resumo em pequenos painéis glass;
- tabela principal com seleção, dados e ações;
- importação e ações em lote preservadas;
- versão móvel em cards sem remover controles.

### Documentos

- fluxo visual em etapas dentro de painéis Aurora;
- seleção de clientes e templates com estados claros;
- revisão e opções em painel lateral ou inferior conforme viewport;
- progresso, edição de campos, histórico e downloads intactos;
- botão final usando a cor da empresa e estado de carregamento existente.

### Templates

- listagem em cards ou linhas glass;
- nome, campos, data e ações atuais;
- upload e edição nos mesmos modais e com as mesmas validações;
- download, edição e exclusão com hierarquia visual distinta.

### Auditoria

- resumo compacto e tabela densa;
- cabeçalho fixo somente se não interferir com a rolagem atual;
- badges semânticos, datas e usuário legíveis;
- rolagem horizontal contida no painel em telas estreitas.

### Empresas

- cards de empresa com monograma, métricas e amostras de `temaCor`/`temaCorSecundaria`;
- empresa ativa destacada pela paleta correspondente;
- “Entrar na empresa” como ação principal;
- editar e excluir preservados, com perigo semântico independente da marca.

### Usuários

- lista com avatar, nome, email, papel e estado;
- criação, troca de papel, redefinição e exclusão preservadas;
- modais glass com foco visível e ações destrutivas inequívocas.

## Componentes compartilhados

A camada visual deverá padronizar:

- botão primário, secundário, ghost, sucesso, alerta e perigo;
- input, senha, busca, select, textarea, checkbox, radio e upload;
- topbar, sidebar, empresa ativa e perfil;
- card métrico, painel de gráfico, painel de dados e card de ação;
- tabela, lista, toolbar, badge e chip de status;
- modal, toast, progresso, carregamento, estado vazio e erro;
- tooltip e foco de teclado;
- skeleton apenas onde o carregamento atual puder representá-lo sem atrasar conteúdo.

O componente visual nunca assumirá a responsabilidade pela chamada de API ou regra de permissão.

## Responsividade

### Desktop amplo — 1280 px ou mais

- sidebar expandida;
- topbar completa;
- quatro KPIs na mesma linha;
- gráfico principal em aproximadamente dois terços da largura;
- empresa ativa em um terço;
- atividade recente em dois terços;
- donut em um terço.

### Tablet e desktop compacto — 769 a 1279 px

- sidebar poderá iniciar recolhida sem sobrescrever preferência persistida;
- KPIs em duas colunas;
- painéis principais empilhados em duas linhas;
- topbar preservará empresa e perfil, ocultando apenas elementos decorativos.

### Celular — até 768 px

- sidebar em drawer;
- topbar com menu, marca curta e perfil compacto;
- saudação e ação principal empilhadas;
- KPIs em uma coluna ou carrossel não será usado;
- tabelas rolarão dentro do painel ou virarão cards;
- modais respeitarão 16 px de margem e altura útil;
- alvos interativos terão pelo menos 44 × 44 px.

## Acessibilidade

- contraste mínimo de 4,5:1 para texto normal;
- foco visível independente de hover;
- navegação ativa com cor, borda e `aria-current`;
- glows e transparência nunca serão a única indicação de estado;
- botões de ícone terão nome acessível;
- modais manterão ordem de foco e fechamento por Escape quando já suportado;
- gráficos terão título e resumo textual;
- `prefers-reduced-motion` reduzirá movimento não essencial.

## Estados e erros

O redesign fornecerá apresentação coerente para:

- carregamento;
- lista vazia;
- ausência de empresa ativa;
- falha de API;
- validação de formulário;
- upload inválido;
- sucesso;
- confirmação destrutiva;
- geração em progresso;
- arquivo expirado ou indisponível.

Mensagens, condições e pontos de disparo continuarão sendo os existentes.

## Estratégia de validação

### Contratos estáticos

- comparar IDs, formulários, scripts e classes de papel antes e depois;
- impedir IDs duplicados;
- confirmar que todas as páginas carregam a camada Aurora;
- confirmar que o CSS antigo não volta a prevalecer por especificidade acidental.

### Testes automatizados

- ampliar `theme.spec.js` para modo escuro padrão, persistência e empresas com cores extremas;
- atualizar `shell.spec.js` para dimensões, topbar, sidebar e drawer Aurora;
- atualizar `login-dashboard.spec.js` para a composição da referência e dados verdadeiros;
- manter testes de clientes, documentos, templates, auditoria, empresas e usuários;
- atualizar a matriz visual para duas empresas, dois temas e três viewports;
- manter o fluxo nativo isolado cobrindo login, empresa, tema, navegação e logout.

### Inspeção visual

Capturas serão comparadas em:

- 1440 × 900;
- 1024 × 768;
- 390 × 844;
- empresa roxa/azul;
- empresa verde/âmbar;
- modo escuro e modo claro.

A validação verificará hierarquia, alinhamento, recorte, overflow, contraste, blur, fallback sem `backdrop-filter` e fidelidade à referência.

## Ordem de execução

1. congelar contratos e baseline visual/funcional;
2. adaptar tokens e geração da paleta white-label;
3. construir shell Aurora e responsividade básica;
4. padronizar componentes compartilhados;
5. reproduzir o dashboard aprovado;
6. aplicar o sistema às telas operacionais;
7. aplicar o sistema às telas administrativas;
8. redesenhar login e estados transversais;
9. revisar modo claro, acessibilidade e movimento;
10. executar regressão completa e remover regras visuais obsoletas somente quando comprovadamente sem uso.

Cada etapa deverá terminar com testes focados e integração verde antes de a próxima começar.

## Fora de escopo

- mudança de backend, banco ou contratos de API;
- novos filtros ou períodos de dashboard;
- busca global funcional;
- cálculo de tendências percentuais;
- novas categorias de documentos;
- troca de paleta por clique sem persistência;
- alteração de permissões;
- migração para framework;
- redesign dos arquivos DOCX/PDF gerados.

## Decisões fechadas

- Direção visual: Aurora Glass aprovada.
- Aparência inicial: escura.
- Tema claro: preservado como contraparte.
- Cor da empresa: fonte exclusiva dos acentos white-label.
- Dados do dashboard: apenas dados reais já disponíveis.
- Stack: HTML, CSS e JavaScript existentes.
- Backend: sem alterações.
- Estratégia: refatoração incremental protegida por testes.

