# Use uma imagem Node.js como base
FROM node:latest

# Criação do diretório de trabalho na imagem
WORKDIR /usr/src/app

# Copia os arquivos do seu projeto para o diretório de trabalho na imagem
COPY . .

# Instala as dependências do Node.js
RUN npm install

# Expõe a porta em que a aplicação estará rodando
EXPOSE 5000

# Comando para iniciar a aplicação quando o contêiner for iniciado
CMD [ "npm", "start" ]
