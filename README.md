# DocumentosPro

Sistema multi-tenant de geração de documentos DOCX/PDF com templates personalizáveis.

## 🚀 Funcionalidades Implementadas

- ✅ **Autenticação JWT** com isolamento por empresa
- ✅ **Geração de documentos DOCX** com templates Handlebars
- ✅ **Conversão automática para PDF** usando LibreOffice
- ✅ **Pré-processamento de templates** para resolver quebras de tags
- ✅ **Geração em lote** com acompanhamento de progresso em tempo real
- ✅ **Importação de clientes via CSV**
- ✅ **Interface responsiva** com Vanilla JavaScript
- ✅ **Isolamento multi-tenant** (Master vs Usuários regulares)
- ✅ **Sistema de templates** com campos dinâmicos
- ✅ **Download de documentos** gerados

## 🛠️ Instalação e Execução

### Pré-requisitos

- **Node.js** 16+ (recomendado 18+)
- **LibreOffice** (para conversão DOCX→PDF)
- **Windows PowerShell** com permissões de execução

### 1. Instalar Dependências

```powershell
cd backend
npm install
```

### 2. Resolver Política de Execução do PowerShell (se necessário)

Se receber erro de política de execução:

```powershell
# Executar como Administrador
Set-ExecutionPolicy RemoteSigned
```

### 3. Iniciar Servidor de Desenvolvimento

```powershell
# Opção 1: Usando npm (recomendado)
cd backend
npm run dev

# Opção 2: Usando Node diretamente
cd backend
node server.js

# Opção 3: Porta específica (se 3000 estiver ocupada)
cd backend
$env:PORT=3001; node server.js
```

### 4. Acessar a Aplicação

- **URL**: http://localhost:3000 (ou porta configurada)
- **Login padrão**:
  - Email: `admin@admin.com`
  - Senha: `admin123`

## 📁 Estrutura do Projeto

```
DocumentosPro/
├── backend/
│   ├── server.js              # Servidor principal Express
│   ├── docx-preprocessor.js   # Pré-processamento de templates
│   ├── lib/
│   │   └── convert-wrapper.js # Conversão DOCX→PDF
│   ├── package.json           # Dependências Node.js
│   └── uploads/               # Arquivos enviados
│       ├── templates/         # Templates DOCX
│       └── gerados/           # Documentos gerados
├── frontend/
│   ├── index.html             # Página de login
│   ├── dashboard.html         # Dashboard principal
│   ├── clientes.html          # Gestão de clientes
│   ├── documentos.html        # Geração de documentos
│   ├── templates.html         # Gestão de templates
│   ├── empresas.html          # Gestão de empresas
│   ├── usuarios.html          # Gestão de usuários
│   ├── css/
│   │   └── style.css          # Estilos CSS
│   └── js/                    # Scripts JavaScript
│       ├── auth.js
│       ├── clientes.js
│       ├── documentos.js
│       ├── templates.js
│       └── sidebar.js
└── database.db                # Banco SQLite
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na pasta `backend/`:

```env
PORT=3000
JWT_SECRET=seu_segredo_super_secreto_aqui_altere_isso
```

### Banco de Dados

O sistema usa SQLite e cria automaticamente as tabelas na primeira execução. O usuário master padrão é criado automaticamente.

## 🌐 Implantação em Produção

### Opção 1: Render.com (Recomendado)

1. **Criar conta** no [Render.com](https://render.com)

2. **Criar novo serviço Web**:
   - Conectar repositório GitHub
   - **Runtime**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: (Render define automaticamente)
     - `JWT_SECRET`: seu segredo seguro

3. **Configurar domínio** (opcional)

### Opção 2: Railway

1. **Criar conta** no [Railway.app](https://railway.app)

2. **Criar novo projeto**:
   - Conectar repositório GitHub
   - Railway detectará automaticamente como projeto Node.js
   - **Environment Variables**:
     - `JWT_SECRET`: seu segredo seguro

### Opção 3: VPS Manual

```bash
# 1. Instalar Node.js e LibreOffice no servidor
sudo apt update
sudo apt install nodejs npm libreoffice

# 2. Clonar repositório
git clone seu-repositorio
cd DocumentosPro/backend

# 3. Instalar dependências
npm install

# 4. Configurar variáveis de ambiente
export JWT_SECRET=seu_segredo_seguro

# 5. Iniciar aplicação
npm start

# 6. Configurar proxy reverso (nginx/apache)
```

## 📊 Uso da Aplicação

### 1. Login
- Use as credenciais padrão ou crie uma empresa/usuário

### 2. Criar Empresa (Master)
- Acesse `/empresas` e crie uma empresa

### 3. Criar Usuário (Master)
- Acesse `/usuarios` e crie usuários vinculados à empresa

### 4. Importar Clientes
- Acesse `/clientes` → "Importar CSV"
- Formato CSV: `nome,email,cpf,telefone,endereco`

### 5. Criar Template (Master)
- Acesse `/templates`
- Faça upload de arquivo DOCX com campos `{{NOME_CAMPO}}`
- Defina os campos disponíveis

### 6. Gerar Documentos
- Acesse `/documentos`
- Selecione clientes e templates
- Clique "Gerar Documentos"
- Acompanhe o progresso em tempo real
- Baixe os documentos gerados

## 🔍 Solução de Problemas

### Erro: "execução de scripts foi desabilitada"
```powershell
Set-ExecutionPolicy RemoteSigned
```

### Erro: "Porta já em uso"
```powershell
# Usar porta diferente
$env:PORT=3001; node server.js
```

### Erro: "LibreOffice não encontrado"
- Instale LibreOffice: `sudo apt install libreoffice` (Linux)
- Ou `choco install libreoffice` (Windows)

### Erro: "Template não processado"
- Verifique se o template DOCX foi criado no Word
- Use `{{CAMPO}}` sem formatação especial
- O pré-processador corrige quebras de tags automaticamente

## 📝 Notas Técnicas

- **Templates**: Use MS Word para criar templates com `{{CAMPO}}`
- **PDF**: Conversão automática usando LibreOffice
- **Progresso**: Acompanhamento em tempo real via WebSocket-like polling
- **Segurança**: JWT tokens, isolamento por empresa
- **Performance**: Geração paralela de documentos

## 🤝 Suporte

Para dúvidas ou problemas, verifique:
1. Logs do servidor no terminal
2. Console do navegador (F12)
3. Arquivos de configuração
4. Documentação das dependências

---

**Desenvolvido com**: Node.js, Express, SQLite, Docxtemplater, PizZip, LibreOffice
npm start
```

## 🌐 Deploy em Plataformas Gratuitas

### 1. **Render.com** (Recomendado) ⭐

1. **Criar conta**: [render.com](https://render.com)
2. **Novo Web Service**:
   - Conectar GitHub repo
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: `NODE_ENV=production`
3. **Configurar variáveis** (se necessário):
   - `JWT_SECRET`: seu_segredo_super_secreto_aqui_altere_isso
   - `PORT`: 10000 (padrão do Render)

**Atenção**: Render tem limite de 750h/mês gratuito.

### 2. **Railway.app**

1. **Criar conta**: [railway.app](https://railway.app)
2. **Novo projeto**:
   - Conectar GitHub
   - Railway detecta automaticamente Node.js
3. **Configurar variáveis**:
   - `JWT_SECRET`
   - `NODE_ENV=production`

**Vantagem**: Deploy mais rápido, limite de 512MB RAM gratuito.

### 3. **Vercel** (Frontend + API)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Limitação**: Melhor para frontend, backend pode ter limitações.

### 4. **Heroku** (Clássico)

```bash
# Criar app
heroku create seu-app-documentospro

# Configurar variáveis
heroku config:set JWT_SECRET=seu_segredo_super_secreto_aqui_altere_isso
heroku config:set NODE_ENV=production

# Deploy
git push heroku main
```

**Atenção**: Heroku free tier foi descontinuado.

## 📁 Estrutura do Projeto

```
DocumentosPro/
├── backend/
│   ├── server.js              # API principal
│   ├── docx-preprocessor.js   # Processamento de templates
│   ├── lib/
│   │   └── convert-wrapper.js # Conversão DOCX→PDF
│   └── uploads/               # Arquivos gerados
├── frontend/
│   ├── index.html            # Login
│   ├── dashboard.html        # Home
│   ├── clientes.html         # CRUD clientes
│   ├── documentos.html       # Geração em massa
│   ├── templates.html        # Upload templates
│   ├── css/style.css         # Estilos modernos
│   └── js/                   # Módulos JavaScript
└── package.json              # Dependências
```

## 🎯 Como Usar

### 1. **Primeiro Acesso**
- Login: `admin@admin.com` / `admin123`
- Crie empresas e usuários

### 2. **Cadastrar Templates**
- Faça upload de arquivo `.docx`
- Use `{{CAMPO}}` para campos dinâmicos
- Exemplo: `{{NOME}}`, `{{CPF}}`, `{{ENDERECO}}`

### 3. **Cadastrar Clientes**
- Via interface ou **importação CSV**
- Campos suportados: nome, cpf, email, telefone, endereco

### 4. **Gerar Documentos**
- Selecione clientes + templates
- Sistema gera automaticamente DOCX + PDF
- Acompanhe progresso em tempo real

## 📊 Formato CSV para Importação

```csv
nome,cpf,email,telefone,endereco
João Silva,12345678901,joao@email.com,11999999999,Rua A, 123
Maria Santos,98765432100,maria@email.com,11888888888,Av B, 456
```

## 🔧 Configurações

### Variáveis de Ambiente

```bash
# Produção
NODE_ENV=production
JWT_SECRET=seu_segredo_super_secreto_aqui_altere_isso
PORT=3000

# Desenvolvimento
NODE_ENV=development
```

### Banco de Dados

- **Arquivo**: `database.db` (SQLite)
- **Reset**: Delete o arquivo para recriar tabelas
- **Backup**: Copie o arquivo `database.db`

## 🐛 Troubleshooting

### Erro: "Template not found"
- Verifique se arquivo foi uploaded corretamente
- Caminho: `backend/uploads/templates/`

### Erro: "LibreOffice not found" (PDF)
- Instale LibreOffice no servidor
- Ou comente geração PDF se não precisar

### Erro: "Multiple runs" (DOCX)
- Nosso `docx-preprocessor.js` resolve isso
- Teste templates editados no Word

## 📈 Melhorias Implementadas

### ✅ **PDF Automático**
- Geração simultânea DOCX + PDF
- Usa LibreOffice internamente

### ✅ **Importação CSV**
- Upload direto via interface
- Validação automática
- Suporte a múltiplos campos

### ✅ **Progresso em Tempo Real**
- Modal com barra de progresso
- Atualização automática
- Resultados detalhados

### ✅ **Validações Aprimoradas**
- Campos vazios → `[CAMPO NÃO INFORMADO]`
- Normalização case-insensitive
- Suporte a acentos e caracteres especiais

## 🤝 Contribuição

1. Fork o projeto
2. Crie branch: `git checkout -b feature/nova-funcionalidade`
3. Commit: `git commit -m 'Adiciona nova funcionalidade'`
4. Push: `git push origin feature/nova-funcionalidade`
5. Abra Pull Request

## 📄 Licença

MIT - Veja [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para simplificar a geração de documentos empresariais**</content>
<parameter name="filePath">c:\Users\vitor\OneDrive\Documentos\DocumentosPro\DocumentosPro\README.md