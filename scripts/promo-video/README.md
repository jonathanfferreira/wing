# Vídeo promocional do Wing

Gerador do teaser oficial do Wing (16s, 1920×1080, 30fps, H.264), construído
com o design system xpace: fundo preto, gradiente neon (`#6324b2 → #eb00bc →
#ff5200`), dourado `#ffd700` para XP e as fontes Chillax, Steelfish e Poppins.

O vídeo renderizado fica em `public/videos/wing-promo.mp4`.

## Como funciona

1. `promo.html` contém a animação inteira como uma timeline **determinística**:
   `window.seek(t)` posiciona todos os elementos no instante `t` (nada usa
   CSS transitions/animations, então cada frame é reproduzível).
2. `render.mjs` injeta as fontes em base64, abre a página no Chromium headless
   (Playwright), captura os 480 frames como JPEG e monta o MP4 com ffmpeg.

## Cenas

| Tempo | Cena |
| --- | --- |
| 0,0–3,3s | Wordmark WING com gradiente neon + tagline |
| 3,2–6,7s | Hero: "O festival começa aqui." + stats (100% / PIX / RLS) |
| 6,6–10,3s | Features: gestão, inscrições, ranking & XP |
| 10,2–13,3s | Contador de XP com barra de progresso |
| 13,2–16,0s | CTA "Criar conta grátis" + endcard |

## Requisitos

- Node 20+
- Chromium (resolvido automaticamente; sobrescreva com `CHROMIUM_PATH`)
- ffmpeg com libx264 no PATH (sobrescreva com `FFMPEG_PATH`)

## Uso

```bash
cd scripts/promo-video
npm install
npm run preview   # gera frames de conferência em out/preview/
npm run render    # gera out/wing-promo.mp4
```

Depois copie o resultado para o site:

```bash
cp out/wing-promo.mp4 ../../public/videos/wing-promo.mp4
```

## Ajustes

- **Textos/cenas**: edite as seções `<section class="scene">` e a timeline em
  `window.seek` no `promo.html`. Os tempos de cada cena estão comentados.
- **Duração/fps**: `window.DURATION` no `promo.html` e `FPS` no `render.mjs`.
- **Trilha sonora**: o vídeo é mudo; para adicionar áudio:
  `ffmpeg -i wing-promo.mp4 -i trilha.mp3 -c:v copy -c:a aac -shortest final.mp4`
