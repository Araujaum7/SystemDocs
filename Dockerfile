FROM node:18-alpine

# Instala LibreOffice, Java e fontes MS/Extras para conversão de DOCX para PDF
RUN apk add --no-cache \
    libreoffice \
    libreoffice-common \
    openjdk11-jre \
    msttcorefonts-installer \
    fontconfig \
    font-noto \
    font-ubuntu \
    font-liberation \
    font-carlito \
    font-caladea && \
    update-ms-fonts && \
    mkdir -p /usr/share/fonts/custom && \
    fc-cache -fv

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

# Comando de inicialização (atualiza cache de fontes customizadas da pasta ./fonts ao iniciar)
CMD ["sh", "-c", "fc-cache -f && npm start"]