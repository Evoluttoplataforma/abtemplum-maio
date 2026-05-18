# abpbqphv1 — Landing page A/B test PBQP-H (Templum)

Projeto de teste A/B para uma landing page do produto **PBQP-H** da Templum.

## Stack
- HTML/CSS/JS puro (sem framework)
- Sem build step — abrir os HTMLs direto no navegador ou servir com `python3 -m http.server` na raiz
- Ferramenta de A/B: estilo VWO/Optimizely — variantes em pastas separadas, marcadas via `data-variant` e `data-track` para tagging

## Estrutura
```
assets/
  brand/        Logos e favicon da Templum
  clientes/     Logos dos clientes PBQP-H (prova social)
  images/       Imagens adicionais da página (hero, seções, etc.)
references/
  design-system-1.html   Referência de design system (usar para tokens, componentes)
  design-system-2.html   Segunda referência de design system
shared/
  css/tokens.css         Variáveis CSS comuns às duas variantes (cores, tipografia, espaçamento)
  js/analytics.js        Tracking comum (eventos, data-attributes)
variant-a/      Variante A da landing
  index.html
  styles.css
  script.js
variant-b/      Variante B da landing
  index.html
  styles.css
  script.js
content/        Textos/copy fornecidos pelo cliente
```

## Convenções para A/B
- Cada CTA, formulário e ponto de conversão deve ter `data-track="<nome-do-evento>"` para a ferramenta de A/B conseguir medir.
- O `<body>` de cada variante leva `data-variant="a"` ou `data-variant="b"`.
- Estilos comuns vão em `shared/css/tokens.css`. Estilos específicos da variante ficam em `variant-x/styles.css`.

## Como rodar localmente
```
python3 -m http.server 8000
# abrir http://localhost:8000/variant-a/ e http://localhost:8000/variant-b/
```
