# 🚀 GUIA COMPLETO DE DEPLOY - DOCUMENTOSPRO

## ✅ O QUE FOI IMPLEMENTADO

### 🔥 **MELHORIAS TÉCNICAS**
- ✅ **PDF Automático**: Geração simultânea DOCX + PDF
- ✅ **Importação CSV**: Upload em massa de clientes
- ✅ **Progresso em Tempo Real**: Modal com acompanhamento
- ✅ **Validações Aprimoradas**: Campos vazios, acentos, normalização
- ✅ **Interface Moderna**: Novos estilos e componentes

### 📦 **ARQUIVOS DE DEPLOY CRIADOS**
- `package-deploy.json` - Otimizado para produção
- `README.md` - Documentação completa
- `.env.example` - Variáveis de ambiente
- `Dockerfile` - Containerização
- `render.yaml` - Configuração Render.com
- `install.bat` - Instalador Windows

---

## 🌐 DEPLOY EM PLATAFORMAS GRATUITAS

### 🎯 **1. RENDER.COM** (MAIS RECOMENDADO)

#### Passo a passo:
1. **Criar conta gratuita**: https://render.com
2. **Novo Web Service**:
   - Conectar seu repositório GitHub
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. **Environment Variables**:
   ```
   NODE_ENV=production
   JWT_SECRET=seu_segredo_muito_seguro_aqui_altere_isso
   PORT=10000
   ```
4. **Deploy**: Clicar em "Create Web Service"

#### Limites gratuitos:
- 750 horas/mês
- 512MB RAM
- Persistência de arquivos (SQLite)

---

### 🚂 **2. RAILWAY.APP** (MAIS SIMPLES)

#### Passo a passo:
1. **Criar conta**: https://railway.app
2. **Novo projeto**:
   - "Deploy from GitHub repo"
   - Selecionar seu repositório
3. **Railway detecta automaticamente Node.js**
4. **Variables** (Settings > Variables):
   ```
   NODE_ENV=production
   JWT_SECRET=seu_segredo_muito_seguro_aqui_altere_isso
   ```

#### Vantagens:
- Deploy mais rápido
- Interface mais simples
- 512MB RAM gratuito

---

### 🐙 **3. VERCEL** (FRONTEND + API)

#### Se quiser usar Vercel:
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer login
vercel login

# Deploy
vercel --prod

# Configurar variáveis no dashboard
```

**Limitação**: Melhor para frontend, API pode ter cold starts.

---

### 🐘 **4. HEROKU** (CLÁSSICO)

```bash
# Instalar Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Criar app
heroku create seu-app-documentospro

# Configurar variáveis
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=seu_segredo_muito_seguro_aqui_altere_isso

# Deploy
git add .
git commit -m "Deploy para produção"
git push heroku main
```

**Atenção**: Free tier descontinuado, use eco dynos ($5/mês).

---

## 🔧 CONFIGURAÇÃO PRÉ-DEPLOY

### 1. **Variáveis de Ambiente**
```bash
# Copiar .env.example para .env
cp .env.example .env

# Editar .env com seus valores
NODE_ENV=production
JWT_SECRET=seu_segredo_muito_seguro_aqui_altere_isso
PORT=3000
```

### 2. **Banco de Dados**
- SQLite será criado automaticamente
- Usuário master: `admin@admin.com` / `admin123`

### 3. **Dependências**
```bash
# Instalar dependências de produção
npm install --production
```

---

## 🐳 DEPLOY COM DOCKER (QUALQUER PLATAFORMA)

### Build da imagem:
```bash
docker build -t documentospro .
```

### Executar localmente:
```bash
docker run -p 3000:3000 documentospro
```

### Deploy no Docker Hub:
```bash
# Login
docker login

# Tag
docker tag documentospro seuusuario/documentospro:latest

# Push
docker push seuusuario/documentospro:latest
```

---

## 📋 CHECKLIST PRÉ-DEPLOY

- [ ] **JWT_SECRET** alterado para algo seguro
- [ ] **NODE_ENV=production** configurado
- [ ] **Dependências instaladas** (`npm install --production`)
- [ ] **Teste local** funcionando (`npm start`)
- [ ] **Arquivos desnecessários** removidos (.git, node_modules, etc.)
- [ ] **Variáveis de ambiente** configuradas na plataforma

---

## 🔍 TESTE PÓS-DEPLOY

1. **Acessar URL da plataforma**
2. **Login**: `admin@admin.com` / `admin123`
3. **Testar funcionalidades**:
   - Criar empresa
   - Upload template DOCX
   - Cadastrar clientes (manual + CSV)
   - Gerar documentos (DOCX + PDF)

---

## 🚨 POSSÍVEIS PROBLEMAS

### ❌ "LibreOffice not found"
**Solução**: Plataformas sem LibreOffice não geram PDF
- Desative PDF no código ou use Docker

### ❌ "Porta já em uso"
**Solução**: Configure `PORT` nas variáveis de ambiente

### ❌ "JWT token inválido"
**Solução**: Verifique `JWT_SECRET` consistente

### ❌ "Database locked"
**Solução**: SQLite pode ter problemas concorrência
- Considere PostgreSQL para produção

---

## 💰 CUSTOS APROXIMADOS

| Plataforma | Gratuito | Pago |
|------------|----------|------|
| **Render** | 750h/mês | $7/mês (sempre on) |
| **Railway** | 512MB RAM | $5/mês (Hobby) |
| **Vercel** | 100GB bandwidth | $20/mês (Pro) |
| **Heroku** | ❌ | $7/mês (eco) |

---

## 🎉 PRÓXIMOS PASSOS APÓS DEPLOY

1. **Configurar domínio** (se necessário)
2. **Backup automático** do banco
3. **Monitoramento** de erros
4. **Otimização** de performance
5. **Novas funcionalidades** conforme demanda

---

**🎊 SEU SISTEMA ESTÁ PRONTO PARA PRODUÇÃO!**

**Dúvidas?** Abra uma issue no repositório ou entre em contato.

**DocumentosPro** - Simplificando a geração de documentos empresariais! 🚀</content>
<parameter name="filePath">c:\Users\vitor\OneDrive\Documentos\DocumentosPro\DocumentosPro\DEPLOY-GUIDE.md