# abtemplum-maio — A/B tests de landing pages (Templum)

Projeto de A/B tests para landing pages de marketing da Templum. Cada norma tem sua pasta e dentro variantes (A, B, ...).

Domínio: `mkt.templum.com.br`
URL de produção (PBQP-H): `https://mkt.templum.com.br/pbqp-h/variant-a/`

## Stack
- HTML/CSS/JS puro (sem framework)
- Sem build step — abrir os HTMLs direto no navegador ou servir com `python3 -m http.server` na raiz
- Ferramenta de A/B: estilo VWO/Optimizely — variantes em pastas separadas, marcadas via `data-variant` e `data-track` para tagging

## Estrutura
```
assets/
  brand/        Logos e favicon da Templum
  clientes/     Logos dos clientes (prova social)
  images/       Imagens das páginas (hero, seções, etc.)
references/
  design-system-1.html   Referência de design system
  design-system-2.html   Segunda referência
shared/
  js/analytics.js        Tracking comum (UTMs, click IDs, eventos)
  js/form.js             Render + submit do formulário
pbqp-h/         Norma PBQP-H
  variant-a/      Variante A
    index.html
    styles.css
    script.js
  variant-b/      Variante B
    index.html
    styles.css
    script.js
content/        Textos/copy fornecidos pelo cliente
index.html      Redirect / → /pbqp-h/variant-a/
_headers        Cache + security headers (Cloudflare Pages)
```

Para uma nova norma (ex: ISO-9001), criar `iso-9001/variant-a/`, `iso-9001/variant-b/` no mesmo padrão. Paths internos: `../../assets/`, `../../shared/`.

## Convenções para A/B
- Cada CTA, formulário e ponto de conversão deve ter `data-track="<nome-do-evento>"` para a ferramenta de A/B conseguir medir.
- O `<body>` de cada variante leva `data-variant="a"` ou `data-variant="b"`.
- CSS específico fica em `<norma>/<variant-x>/styles.css` (cada variante self-contained com tokens DS2 inline).

## Como rodar localmente
```
python3 -m http.server 8000
# abrir http://localhost:8000/pbqp-h/variant-a/ e http://localhost:8000/pbqp-h/variant-b/
```
