# NursyTots — Análise de Canal (28/10/2026)

Canal: https://www.youtube.com/@nursytots · dados públicos coletados com `scripts/analyze_channel.py` em 28/10/2026.

---

## Retrato

| | |
|---|---|
| Inscritos | 47.800 |
| Vídeos | 85 — 84 Shorts + 1 vídeo longo (2min20) |
| Views totais | 94,0 milhões |
| Idade | Primeiro upload em 15/06/2026 (4,5 meses) |
| Frequência | 4,5 uploads/semana até 28/09; depois 26 dias parado; voltou em 24/10 |
| Formato | Shorts verticais 1080×1920, animação 3D estilo Pixar, 15–19s na maioria |
| Público | Bebês e crianças de 1–5 anos. Comentários ocultos em todos os vídeos → marcado como "conteúdo para crianças" |

---

## O veredito em 3 linhas

1. É um canal movido a poucos hits: **os 5 maiores vídeos somam 81% das views** e um único Short (44,4M) responde por 47%.
2. O que gera esses hits não é "aprender cores/números" (o tema mais produzido), e sim **mini-fábulas de bons hábitos e segurança**: bebê erra → sofre a consequência → alguém ajuda → ele corrige → final feliz.
3. A maior oportunidade é produzir esse formato de propósito, com remakes dos vencedores, em vez de apostar em vídeos de conceito sem história.

---

## O que funciona

Shorts agrupados por tema (hit = mais de 1M de views):

| Tema | Vídeos | Mediana | Máximo | Hits |
|---|---|---|---|---|
| **Bons hábitos** (lixo, dividir, lavar as mãos, dentes) | 19 | **137.654** | 44.391.724 | 4 |
| **Segurança / dodói** (patinete, piscina, queimadura) | 7 | **128.669** | 11.742.795 | 3 |
| Cantigas clássicas / brincadeira | 8 | 102.183 | 346.790 | 0 |
| Números | 6 | 53.910 | 106.486 | 0 |
| Formas | 4 | 51.499 | 3.029.199 | 1 |
| Vocabulário (animais, frutas, palavras) | 5 | 43.988 | 111.778 | 0 |
| Cores | 27 | 43.287 | 6.436.017 | 1 |
| Veículos | 5 | 36.137 | 103.913 | 0 |
| ABC | 3 | 32.043 | 166.508 | 0 |

- **Bons hábitos + Segurança** são 26 vídeos (31% do canal) e geraram **86% das views e 7 dos 9 hits**. Nesses temas, 27% dos vídeos passam de 1M de views; nos demais, só 3%.
- **Três dos 4 maiores vídeos contam a mesma história.** O bebê joga lixo pela janela do carro ("Don't Throw Garbage on the Road", 44,4M, 26/08). O canal refez a história duas vezes, trocando carro, cenário e coadjuvante: "Bogo Learns Good Manners" (6,6M) e "No Littering Good Manners", com um xerife (6,9M). **O remake do vencedor funcionou.**
- A mediana mensal subiu de 32K (junho) e 47K (julho) para 127K (agosto) e 107K (setembro), justamente quando os temas de hábitos e segurança entraram.

## O que não funciona

- **Cores** foi o tema mais produzido (27 vídeos) e tem a menor mediana entre os grandes. O único hit de cores ("Magic Superhero Color Balls", 6,4M) é na verdade uma história de **transformação**: a bola explode em tinta e vira fantasia de super-herói.
- Vídeos de **demonstração sem história** ficam entre 20K e 45K. Exemplos: bebês mergulhando a mão em tinta com o nome da cor na tela (28K), tubarões bebê pulando na água sem nenhum personagem humano (23K) e "Find the Vegetables" (28K).
- O **único vídeo longo** (2min20, veículos) tem 3,3 mil views.
- O retorno depois da pausa de 26 dias ("Johny Johny Yes Papa", 24/10) tem 3,4 mil views em 4 dias. Mudou tudo ao mesmo tempo: tema clássico (que nunca teve hit), outro design de bebê e um avô novo. Ainda é cedo para concluir, mas o início é muito abaixo da mediana de setembro.

---

## A fórmula dos hits (leitura dos storyboards)

| Regra | Onde aparece |
|---|---|
| **1. Abre com o bebê já fazendo algo fofo e cotidiano**: bebendo suco no carro, andando de patinete, comendo macarrão. Close no rosto em até 2s. | lKyas2tOeZ4, bP-7NZgiR-w, 3HtgO7Uc3HA |
| **2. Erro ou acidente no primeiro terço**: joga o copo pela janela, cai do patinete, o macaco se queima com uma bebida quente. | lKyas2tOeZ4, bP-7NZgiR-w, 3HtgO7Uc3HA |
| **3. Pico emocional em close**: choro, culpa, lábio tremendo. É o quadro mais "parado" do vídeo. | bP-7NZgiR-w (choro), lKyas2tOeZ4 (culpa) |
| **4. Um ajudante resolve** (menina, xerife, mãe, o próprio bebê ajudando o macaco) e **o bebê corrige**: recolhe o lixo, coloca capacete e joelheiras. | lKyas2tOeZ4, gQm5Q9I5bHo, bP-7NZgiR-w |
| **5. Final feliz em plano aberto**, de preferência com movimento (andando de patinete de capacete, os dois sorrindo). | bP-7NZgiR-w, lKyas2tOeZ4 |
| **6. Cenário realista e ensolarado**: rua de subúrbio, carro, piscina, supermercado. Cores saturadas, luz de dia. | todos os hits |

Nos fracassos falta a regra 2: não há conflito, só a repetição de um conceito.

**Produção:** tudo indica que os vídeos são gerados por IA, em 3D estilo Pixar. Há sinais típicos: luvas com dedos em forma de garra no vídeo do super-herói, e o "mesmo" bebê muda de cabelo e roupa entre vídeos. A marca "NursyTots" fica no canto superior esquerdo. Ou seja, é o mesmo tipo de pipeline deste repositório (Seedance 2.0).

---

## Embalagem

- **Termos de título:** os vídeos com "manners", "safety", "rules" e "boo boo" têm mediana de 20 a 100 vezes maior que o resto, e "habits" 3,4 vezes. "Learn" (0,39×) e "colors" (0,49×) ficam bem abaixo. Ressalva: o sufixo "Nursery Rhymes & Baby Songs" (3,4×) só passou a ser usado em agosto, quando o canal já crescia, então parte do efeito é tempo.
- **Duração:** 15–19s concentra 7 dos 9 hits (46 vídeos nessa faixa).
- **Dublagem:** 6 dos 9 hits têm áudio em 9 idiomas (pt-BR, fr, it, en…). Desde 20/08, os vídeos dublados têm mediana de 166K contra 126K dos não dublados. Pode ser causa ou consequência (o YouTube tende a dublar o que já está performando), mas é barato ativar.
- **Engajamento:** likes ficam em 0,5–0,9% das views, e os comentários estão desativados por ser conteúdo infantil.

---

## Ressalvas

- Vídeos de 24–28/09 têm um mês e o de 24/10 tem 4 dias; ainda podem crescer.
- Com 9 hits no total, qualquer regra aqui é um padrão forte, não uma lei. Dois vídeos de segurança no mesmo formato ficaram fracos: cinto de segurança (19K) e dodói no balanço (35K).
- Dados públicos não mostram CTR, retenção, origem do tráfego nem receita.
- O áudio não foi analisado: o YouTube bloqueou o download dos vídeos a partir do servidor, e os storyboards não têm som.
- **Riscos de copiar:** o hit nº 5 usa o logo do Superman no peito da personagem, e há títulos com "Baby Shark" (marca da Pinkfong). Ambos são riscos de direitos autorais. Desde julho de 2025, o YouTube também desmonetiza "conteúdo inautêntico" produzido em massa, então remakes precisam de variação real de história, cenário e personagens.

---

## Recomendações

| # | Ação | Evidência | Como testar |
|---|---|---|---|
| 1 | **Fazer 70–80% dos vídeos no formato fábula de hábito/segurança** | 86% das views e 27% de taxa de hit, contra 3% no resto | 4 semanas com 3 de cada 4 vídeos no formato; comparar a mediana com setembro |
| 2 | **Remake sistemático de cada hit**: 2–3 versões com o mesmo arco e novo cenário/coadjuvante | Lixo pela janela: 44M → 6,6M → 6,9M | Para cada vídeo acima de 1M, publicar uma variação em até 10 dias |
| 3 | **Fixar um protagonista** com visual único (ficha de personagem como `@image1`) | A maioria dos hits usa um bebê ruivo de camiseta verde, mas o design varia de vídeo para vídeo | Comparar a mediana antes e depois de fixar o personagem |
| 4 | **Título = regra ou lição + emoji** ("Don't Throw Garbage!", "Safety Rules for Kids") | "learn" e "colors" têm 0,4–0,5× de mediana | Usar o mesmo vídeo como base e alternar o padrão de título entre vídeos |
| 5 | **15–19s** | 7 dos 9 hits | — |
| 6 | **Ativar dublagem em todos os vídeos** | 6 dos 9 hits estão dublados | — |
| 7 | **Cores e números só com história ou transformação mágica** | Superhero Color Balls (6,4M) contra mediana de 43K | Próximos 5 vídeos de cores com arco de transformação |
| 8 | **Não ficar semanas parado** e não mudar tema e personagem na volta | Pausa de 26 dias, retorno com 3,4K | Retomar com um remake de um hit |
| 9 | **Compilações longas (10–30 min) dos hits** para monetização | Só existe 1 vídeo longo; Shorts infantis rendem pouco por view | 1 compilação "Good Habits for Kids" por semana, medindo o tempo assistido |

---

## Próximos vídeos

Os cinco seguem o mesmo arco: erro → consequência → ajudante → correção → final feliz.

1. **Stop, Look, Hold Hands! 🚦 Street Safety for Kids.** O bebê corre atrás da bola para a rua, o carro buzina e para, a mãe ensina a atravessar na faixa.
2. **Wait Your Turn! 🛝 Playground Rules for Kids.** O bebê fura a fila do escorregador, outra criança cai e chora, ele pede desculpa e espera a vez.
3. **Don't Throw Banana Peels! 🍌 Good Habits for Kids.** O bebê joga a casca pelo carrinho, o vovô escorrega (cômico, sem se machucar), o bebê ajuda e põe a casca no lixo. É um remake do hit do lixo.
4. **Don't Climb the Shelf! 🤕 Boo Boo Song & Safety.** O bebê sobe na estante e cai (dodói leve), a mãe põe curativo e mostra o banquinho.
5. **Keep the Beach Clean! 🐢 Good Manners for Kids.** O bebê deixa uma garrafa na areia, uma tartaruguinha fica triste, o bebê e um caranguejo ajudante recolhem o lixo.

### Prompt Seedance 2.0 — vídeo 1 (skill 05 Faceless Channel, 9:16, 15s)

```
CHARACTER LOCK:
Chubby 2-year-old toddler boy, round face, big glossy brown eyes, rosy cheeks, short tousled orange hair, mint-green t-shirt, denim shorts, white sneakers — stylized 3D animation, soft Pixar-like shading, identical design in every shot. @image1 = character reference sheet.

OPENING FRAME (0:00–0:02):
Low-angle close-up of the toddler giggling and kicking a bright red ball on a sunny suburban sidewalk — the ball bounces toward the lens and past it; camera whips to follow it rolling off the curb into the street.

THE MISTAKE (0:02–0:05):
Wide shot from across the street: toddler runs after the ball and steps off the curb, arms out — a yellow car in the background slows, two soft horn beeps, the car stops gently at a safe distance. No impact.

THE SCARE (0:05–0:08):
Snap zoom to the toddler's face frozen mid-step: eyes wide, lower lip trembling, tears welling, background falls to soft blur. Mom (young woman, brown ponytail, yellow cardigan) rushes in from frame left and lifts him back onto the sidewalk.

THE LESSON (0:08–0:12):
Medium two-shot at toddler eye level: mom kneels and holds his hand, points to a crosswalk signal; toddler copies her, turning his head left, then right — the signal switches from red hand to green walking figure with a cheerful chime.

HAPPY ENDING (0:12–0:15):
Slow dolly back: toddler and mom cross on the zebra stripes holding hands, the driver waves, toddler hugs the red ball and gives a big thumbs-up to camera.

MOTION NOTE:
Bouncy, toy-like character animation; camera mostly locked at child eye level except the whip pan (0:02) and snap zoom (0:05). Every shot holds the face large enough to read the emotion on a phone screen.

LIGHTING:
Bright late-morning sun, 5600K key with soft fill, no harsh shadows, saturated primary colors, pastel houses and round green trees — friendly, never frightening.

SOUND DIRECTION (music-first):
Ukulele + xylophone nursery melody, 110 BPM. SFX: ball bounce, two soft horn beeps (music ducks for 1s), small sniffle, crosswalk chime, kids' "Yay!" at 0:13. Sung hook at 0:09: "Stop, look left, look right, hold my hand!"
```

Para chegar aos 16–19s dos hits, gere um segundo clipe de 4s com o refrão e o final feliz, usando o último quadro do clipe 1 como `@image1`.
