FROM node:18-alpine

# Instala LibreOffice, Java e fontes MS para conversão de DOCX para PDF
RUN apk add --no-cache \
    libreoffice \
    libreoffice-common \
    openjdk11-jre \
    msttcorefonts-installer fontconfig && \
    update-ms-fonts && \
    fc-cache -f

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --omit=dev

# Copiar código fonte
COPY . .

# Expor porta 7000
EXPOSE 7000

# Comando de inicialização
CMD ["npm", "start"]