# DocumentosPro

Sistema multi-tenant de geração de documentos DOCX/PDF com templates personalizáveis.

## 🚀 Funcionalidades Implementadas

- ✅ **Autenticação JWT** com isolamento por empresa (Multi-tenant)
- ✅ **Geração de documentos DOCX** com templates Handlebars (Docxtemplater)
- ✅ **Conversão automática para PDF** usando LibreOffice
- ✅ **Pré-processamento de templates** para resolver quebras de tags comuns do Word
- ✅ **Geração em lote** com acompanhamento de progresso em tempo real
- ✅ **Importação de clientes via CSV**
- ✅ **Interface responsiva** e limpa construída com Vanilla JavaScript e CSS
- ✅ **Níveis de Acesso**: Usuário Master (gestão global) vs Usuários regulares (gestão isolada por empresa)
- ✅ **Download** facilitado de todos os documentos gerados

## 🛠️ Instalação e Execução

### Pré-requisitos

- **Node.js** 16+ (recomendado 18+)
- **LibreOffice** instalado e configurado (necessário para a conversão DOCX→PDF funcionar corretamente)
- **Git** (opcional, mas recomendado para versionamento)

### 1. Clonar e Instalar Dependências

```bash
git clone https://github.com/Araujaum7/SystemDocs.git
cd SystemDocs/backend
npm install
```

### 2. Iniciar Servidor de Desenvolvimento

O projeto pode ser iniciado facilmente usando o `npm`:

```bash
cd backend
npm run dev
```
*(O `nodemon` está configurado para recarregar o servidor a cada alteração salva)*

Caso precise rodar em produção ou usar o Node diretamente:
```bash
cd backend
npm start
# ou
node server.js
```

Se a porta 3000 já estiver em uso, você pode defini-la via variável de ambiente:
```powershell
# No PowerShell do Windows
$env:PORT=3001; npm run dev
```

### 3. Acessar a Aplicação

- **URL**: [http://localhost:3000](http://localhost:3000) (ou porta configurada)
- **Login Master Padrão** (criado automaticamente no primeiro acesso):
  - Email: `admin@admin.com`
  - Senha: `admin123`

## 📁 Estrutura do Projeto

```
DocumentosPro/
├── backend/
│   ├── server.js              # Servidor principal (Express)
│   ├── docx-preprocessor.js   # Pré-processamento e correção de templates DOCX
│   ├── lib/
│   │   └── convert-wrapper.js # Lógica de conversão DOCX → PDF
│   ├── middlewares/           # Middlewares (auth, tenant, upload, firewall, ratelimit)
│   ├── routes/                # Rotas da API (auth, clientes, documentos, empresas, etc.)
│   ├── package.json           # Dependências Node.js e scripts
│   └── uploads/               # Arquivos enviados e gerados
│       ├── templates/         # Templates base enviados (.docx)
│       └── gerados/           # Documentos finais processados
├── frontend/
│   ├── index.html             # Página de login
│   ├── dashboard.html         # Painel principal
│   ├── clientes.html          # Gestão e importação de clientes
│   ├── documentos.html        # Geração em lote e relatórios
│   ├── templates.html         # Cadastro de templates
│   ├── empresas.html          # Gestão de empresas (Master)
│   ├── usuarios.html          # Gestão de usuários (Master)
│   ├── css/
│   │   └── style.css          # Estilos globais CSS
│   └── js/                    # Scripts do client-side
│       ├── api.js             # Módulo de requisições para o Backend
│       ├── auth.js            # Lógica de login/sessão
│       ├── clientes.js        # Lógica da tela de clientes e upload de CSV
│       ├── documentos.js      # Geração, websocket e polling
│       └── templates.js       # Gerenciamento de arquivos .docx
├── database.db                # Banco de Dados SQLite (gerado automaticamente)
└── .gitignore                 # Arquivos ignorados no Git (node_modules, banco de dados, etc.)
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/` caso deseje sobrescrever as opções padrão:

```env
PORT=3000
NODE_ENV=development
JWT_SECRET=seu_segredo_super_secreto_aqui_altere_isso
```

### Banco de Dados (SQLite)

O sistema usa **SQLite** e cria automaticamente as tabelas na primeira vez que o servidor (`server.js`) for executado.
Para "resetar" os dados em desenvolvimento, basta excluir o arquivo `database.db` e reiniciar a aplicação.

## 📊 Como Usar a Aplicação

1. **Login Inicial**
   - Acesse com `admin@admin.com` e a senha `admin123`.
2. **Cadastrar Empresa e Usuários**
   - Na aba Empresas, crie os ambientes isolados para os Tenants.
   - Na aba Usuários, crie os logins vinculados a cada empresa.
3. **Templates**
   - Faça upload de arquivos `.docx`.
   - Adicione campos no formato Handlebars: `{{NOME_DO_CAMPO}}`, `{{CPF}}`, `{{ENDERECO}}`.
4. **Clientes**
   - Você pode inserir os clientes manualmente na interface ou importar via **CSV**.
5. **Geração em Massa**
   - Acesse "Documentos", escolha os clientes desejados, selecione o template.
   - Aguarde o processo gerar tanto a via DOCX quanto a via PDF para cada registro e baixe os resultados!

## 🌐 Deploy em Produção

Recomenda-se utilizar plataformas como **Render.com** ou **Railway**.
O projeto já conta com arquivos preparados para serviços de hospedagem modernos (como `render.yaml` caso precise, ou configurações simples de `package.json` onde o comando de build é `npm install` e o de produção é `npm start`).

**Nota Importante para Hospedagens Web:** Como o sistema utiliza o LibreOffice em segundo plano (SO) para conversão para PDF, caso opte por usar provedores de VPS ou plataformas como o Render.com, certifique-se de que o LibreOffice está instalado na imagem do SO/Docker em que a aplicação Node.js roda. A conversão de DOCX para PDF **falhará** em contêineres sem o binário do LibreOffice disponível (`soffice`).

---

**Desenvolvido com ❤️ para simplificar e escalar a geração de documentos empresariais.**