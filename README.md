# Brasa Burger — site com scroll

## 1. Instalar
    npm install

## 2. Colocar os quadros
Copie o vídeo para esta pasta (nomeado como video.mp4) e rode:

    ffmpeg -i video.mp4 -an -vf "fps=24,scale=1280:-2" -q:v 4 public/frames/frame_%04d.jpg

Isso gera 240 quadros (10 s a 24 fps). Se mudar a quantidade, ajuste FRAME_COUNT em src/App.jsx.

## 3. Rodar
    npm run dev

## 4. Publicar
    npm run build

A pasta dist/ pode ir para Vercel ou Netlify.

## Dados
Nome, slogan, cardápio, WhatsApp e horário estão em src/data.js (dados fictícios para portfólio).
