# Pastas de Fontes Customizadas

Esta pasta permite que você adicione novas fontes (como \`.ttf\` e \`.otf\`) para serem utilizadas na conversão de documentos para PDF (LibreOffice) no ambiente de produção (Docker).

## Como funciona?

1. Cole seus arquivos de fonte (ex: \`MinhaFonte.ttf\`) dentro desta pasta.
2. Quando você subir o sistema via Docker (\`docker-compose up -d --build\`), as fontes serão automaticamente reconhecidas pelo LibreOffice.
3. Se você adicionar novas fontes enquanto o container já estiver rodando, reinicie o container: \`docker-compose restart documentospro\`.

## Problemas de Formatação Diferente (DOCX -> PDF)
Geralmente, quando o PDF sai com uma formatação diferente ou quebras de página erradas, é porque a fonte usada no DOCX não estava instalada no servidor. O LibreOffice então substitui por uma fonte "parecida", alterando os espaçamentos.
Adicionar a fonte exata nesta pasta corrige este comportamento.
