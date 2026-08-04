<div align="center">

# 📑 DocumentosPro

**Sistema Multi-Tenant Inteligente para Geração e Gestão de Documentos DOCX/PDF com Templates Personalizáveis**

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 🌟 Visão Geral

O **DocumentosPro** é uma plataforma corporativa web de alta performance voltada para automação, geração em lote e gestão de contratos, procurações, petições e documentos jurídicos ou administrativos em **DOCX** e **PDF**, com **isolamento total multi-tenant (por empresa)** e motor de temas customizável **White-Label**.

---

## 🚀 Principais Funcionalidades

### 🎨 White-Label & Design System HSL
- **Tema Personalizável por Empresa**: Definição independente de cores **Primária** e **Secundária** no painel da empresa.
- **Cálculo Dinâmico de Luminosidade (HSL)**: Geração matemática de variações de cor (tons 50 a 700) que se adaptam automaticamente ao **Modo Claro** e **Modo Noturno (Dark Mode)** garantindo perfeita legibilidade e contraste.
- **Dashboard Interativo com Gráficos**: Gráficos analíticos renderizados com Chart.js que respeitam e sincronizam com a identidade visual da empresa em tempo real.

### 📑 Geração de Documentos & Processamento Word
- **Templates Word (`.docx`) com Handlebars**: Variáveis dinâmicas no estilo `{{nome}}`, `{{cpf}}`, `{{endereco}}`, etc.
- **Pré-Processador de XML do Word**: Reparo automático de tags fragmentadas pela verificação ortográfica ou formatação do Microsoft Word.
- **Validação de Erros em Português Claro**: Sistema que identifica erros em templates (como tags não fechadas `{{` ou arquivos incompatíveis) e explica o problema de forma visual, didática e clara direto no modal e nas notificações.
- **Suporte a Arquivos de Até 50 MB**: Upload e conversão com buffers otimizados para suportar contratos e modelos longos sem travamentos.
- **Conversão DOCX ➔ PDF Nativa**: Integração com **LibreOffice (soffice)** para conversões precisas de documentos preservando layout e imagens.

### 🏢 Arquitetura Multi-Tenant & Segurança
- **Isolamento Completo por Empresa (Tenant)**: Cada cliente enxerga apenas seus clientes, relatórios, templates e documentos.
- **Acesso Hierárquico**:
  - **Master**: Controle global de empresas, usuários, auditoria, firewall e backups.
  - **Admin / Usuário**: Gestão isolada de clientes e documentos de sua própria organização.
- **Auditoria de Sistema**: Registro completo de logs de acesso, geração e exclusões de documentos para fins de compliance.
- **Firewall & Rate Limiting Integrados**: Proteção contra abusos, requisições excessivas e controle de acessos LAN/VPN.

### 🧹 Rotinas de Manutenção Automática (Background Jobs)
- **Backup Automático do Banco de Dados**: Proteção contínua dos registros e dados dos clientes (`database.db`).
- **Garbage Collector (Limpeza Automática)**: Remoção inteligente de arquivos temporários, PDFs e DOCXs antigos sem uso, otimizando o disco do servidor.

---

## 🛠️ Tecnologias Utilizadas

- **Core & Backend**: [Node.js](https://nodejs.org/) (ES Modules) + [Express.js](https://expressjs.com/)
- **Processamento de Word & PDF**: [Docxtemplater](https://docxtemplater.com/) + [PizZip](https://github.com/open-xml-templating/pizzip) + [LibreOffice (`soffice`)](https://www.libreoffice.org/)
- **Frontend**: Vanilla JavaScript (ES6+), CSS3 Moderno (Variáveis CSS & Flex/Grid), HTML5 Semântico e [Chart.js](https://www.chartjs.org/)
- **Banco de Dados**: SQLite3 (com WAL mode para alta concorrência)
- **Containerização**: Docker & Docker Compose

---

## 🐳 Instalação Rápida com Docker (Recomendado para VPS)

O projeto está pronto para rodar em produção (VPS Linux, Hostinger, AWS, DigitalOcean) utilizando **Docker Compose**, já contendo o LibreOffice configurado internamente:

### 1. Clonar o Repositório
```bash
git clone https://github.com/Araujaum7/SystemDocs.git
cd SystemDocs
```

### 2. Subir o Contêiner Docker
```bash
docker compose up -d --build
```
> O servidor iniciará automaticamente na porta **`7000`** (ou na porta mapeada no seu `docker-compose.yml`) com todos os recursos, LibreOffice e limites de upload de 50MB ativados.

### 3. Atualizar o Servidor (Quando houver novos commits)
```bash
git pull
docker compose restart
```

---

## 💻 Execução Local sem Docker (Desenvolvimento)

Caso prefira desenvolver rodando o Node.js diretamente na sua máquina:

### 1. Instalar Dependências
```bash
cd backend
npm install
```

### 2. Rodar Servidor de Desenvolvimento
```bash
npm run dev
```
- A aplicação local estará disponível em **`http://localhost:3000`** (ou `http://localhost:7000`).
- O banco de dados (`database.db`) e as tabelas iniciais são gerados automaticamente na primeira execução.

---

## 🔑 Acesso Principal (Primeiro Uso)

Ao rodar pela primeira vez, o sistema cria automaticamente as credenciais administrativas padrão:

| Campo | Valor Padrão |
| :--- | :--- |
| **Email** | `admin@admin.com` |
| **Senha** | `admin123` |

> ⚠️ *Recomendamos alterar a senha padrão imediatamente após o primeiro login no painel de Usuários.*

---

## 📁 Estrutura do Repositório

```text
DocumentosPro/
├── backend/
│   ├── config/            # Parâmetros de ambiente, paths e limites do sistema
│   ├── database/          # Gerenciamento de conexões, migrations e queries SQLite
│   ├── lib/               # Wrapper de conversão DOCX ➔ PDF via LibreOffice
│   ├── middlewares/       # Auth JWT, Tenant Isolado, Multer (50MB) e Firewall
│   ├── routes/            # Endpoints da REST API (empresas, templates, docs, auditoria)
│   ├── services/          # Serviços de geração em lote e limpeza em background
│   ├── utils/             # Formatador de erros em português, helpers e loggers
│   ├── docx-preprocessor  # Limpeza e reparo de XML do Microsoft Word
│   └── server.js          # Ponto de entrada (Express Server)
├── frontend/
│   ├── css/style.css      # Design System White-Label, Modo Noturno e Variáveis HSL
│   ├── js/                # Aplicação SPA modular (auth, templates, docs, empresas)
│   └── *.html             # Telas do sistema (Dashboard, Clientes, Documentos, Templates)
├── docker-compose.yml     # Orquestração do contêiner Docker para Produção
├── Dockerfile             # Imagem de produção otimizada com Node.js + LibreOffice
└── README.md              # Documentação oficial do projeto
```

---

<div align="center">
  <p><b>Desenvolvido para máxima automação, performance visual e segurança corporativa. 🚀</b></p>
</div>