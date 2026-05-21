# Sistema de Tracking — Documentação Técnica

Sistema portável de rastreamento, atribuição e captura de leads para landing pages estáticas. Funciona com qualquer Tag Manager e qualquer endpoint de webhook (Make, Zapier, n8n, função serverless, etc.).

---

## 1. Arquitetura

```
HTML da Landing
  ├─ Tag Manager (lazy via requestIdleCallback)
  ├─ Ferramenta de A/B (opcional, SmartCode no <head>)
  ├─ <div data-form="lead" data-submit-label="..." data-empresa-label="..."></div>
  └─ <script src="shared/js/analytics.js?v=…" defer>
     <script src="shared/js/form.js?v=…" defer>

analytics.js (roda no DOMContentLoaded)
  ├─ captureFirstTouch()       grava UTMs/click IDs em cookies root domain (2 anos)
  ├─ pushPageView()            dataLayer.push de pageview customizado
  ├─ loadGeo()                 fetch geo IP + dataLayer.push de geo
  ├─ initClarity / initScrollDepth / initTimeOnPage
  └─ expõe window.__pbqph.submitLead(data, opts)

form.js (auto-init em qualquer container [data-form="lead"])
  ├─ Renderiza HTML do form
  ├─ Atualiza window.__pbqphFormData em cada input/change
  ├─ Validação inline + máscara WhatsApp
  └─ Submit → submitLead() → POST webhook + push no dataLayer
```

---

## 2. Eventos no `dataLayer`

| `event`                  | Quando dispara                                | Categoria       |
|--------------------------|-----------------------------------------------|-----------------|
| `custom_page_view`       | DOMContentLoaded                              | Pageview        |
| `geo_loaded`             | Após retorno do geo IP                        | Atribuição      |
| `scroll_depth`           | 25 / 50 / 75 / 90 %                           | Engagement      |
| `time_on_page`           | 30s, 60s, ... até 10min                       | Engagement      |
| `faq_open`               | Clique em qualquer FAQ                        | Microcompromisso|
| `nav_drawer_open`        | Abriu o menu hamburguer mobile                | Engagement      |
| **`form_submit_success`** ⭐ | Lead enviado com sucesso (200 do webhook) | **Conversão**   |
| `lead_thanks_view`       | Thank-you carregou                            | Consolidação    |

---

## 3. Variáveis no payload

### Do form (em `form_submit_success`)

```
name              firstname        lastname
nome              sobrenome
email
whatsapp          phone            phoneNumber        telefone
empresa           funcionarios     faturamento
```

### Geo (em `geo_loaded` e no webhook)

```
geo_country     geo_country_name
geo_state       geo_state_name
geo_city        geo_zip          geo_ip
```

### First-touch (cookie 2 anos, prefixo `ft_`)

```
ft_utm_source    ft_utm_medium    ft_utm_campaign
ft_utm_term      ft_utm_content
ft_fbclid        ft_gclid         ft_ttclid        ft_msclkid
ft_gad_source    ft_gad_campaignid
ft_gbraid        ft_wbraid        ft_li_fat_id ...
```

### Last-touch (URL atual)

```
utm_source       utm_medium       utm_campaign
fbclid           gclid            ttclid           msclkid
gad_source       gad_campaignid   gbraid           wbraid           li_fat_id ...
```

### Contexto

```
session_id       variant          event_id
ts               time_on_page_at_submit
referrer         user_agent
```

---

## 4. DLV — Data Layer Variables

DLV lê do `dataLayer.push`. Funciona **depois** que o evento dispara.

Pra cada campo:

```
Variável → Data Layer Variable
  Data Layer Variable Name: <nome do campo no payload>
  Versão: 2
```

Exemplos comuns: `email`, `nome`, `sobrenome`, `phone`, `geo_state`, `geo_city`, `ft_utm_campaign`.

Pra a variável ter valor disponível na Tag, configure a Tag pra disparar num **Custom Event Trigger** com:

```
Event name: form_submit_success
```

(ou `geo_loaded` para variáveis de geo).

---

## 5. JSC — JavaScript Variables

JSC é uma função JS que roda **a qualquer momento** (não precisa esperar evento). Útil pra usar antes do submit (ex: marcar a tag de pageview com dados já digitados ou ID da sessão).

Os dados ficam globalmente acessíveis em duas referências:

```js
// Form (atualiza em real-time conforme o usuário digita)
window.__pbqphFormData = {
  name, firstname, lastname,
  nome, sobrenome,
  email,
  whatsapp, phone, phoneNumber, telefone,
  empresa, funcionarios, faturamento
}

// Geo (carrega uma vez por sessão, cacheado em sessionStorage)
window.__pbqphGeo = {
  geo_country, geo_country_name,
  geo_state, geo_state_name,
  geo_city, geo_zip, geo_ip
}
```

Snippets prontos pra colar como JSC:

```js
// jsc_form_email
function() { return (window.__pbqphFormData && window.__pbqphFormData.email) || ""; }

// jsc_form_phone
function() { return (window.__pbqphFormData && window.__pbqphFormData.phone) || ""; }

// jsc_form_nome
function() { return (window.__pbqphFormData && window.__pbqphFormData.nome) || ""; }

// jsc_form_sobrenome
function() { return (window.__pbqphFormData && window.__pbqphFormData.sobrenome) || ""; }

// jsc_geo_state
function() { return (window.__pbqphGeo && window.__pbqphGeo.geo_state) || ""; }

// jsc_geo_city
function() { return (window.__pbqphGeo && window.__pbqphGeo.geo_city) || ""; }
```

---

## 6. Disparar o evento de conversão

O sistema **só** dispara `form_submit_success` quando o webhook responde **200** — ou seja, quando o lead foi efetivamente recebido pelo backend. Não dispara em validação falha, erro de rede ou modo demo (webhook não configurado).

No Tag Manager:

- **Trigger**: Custom Event com `Event name: form_submit_success`
- **Tags acopladas**: cada plataforma de conversão (analytics, ads, CRM) lê as variáveis (DLV/JSC) e dispara o evento próprio dela.

Padrão de **dedupe** entre pixel client-side e API server-side: ambos usam o mesmo `event_id` que já está no payload.

---

## 7. Webhook (payload completo)

Quando o submit é bem-sucedido, o sistema posta JSON com **todos** os campos juntos: form + first-touch + last-touch + geo + contexto.

```json
{
  "event": "form_submit_success",
  "event_id": "ev_…",
  "variant": "a",
  "source": "inline",
  "ts": 1771719700456,
  "time_on_page_at_submit": 42,

  "name": "...",
  "firstname": "...",     "lastname": "...",
  "nome": "...",          "sobrenome": "...",
  "email": "...",
  "whatsapp": "...",      "phone": "...", "phoneNumber": "...", "telefone": "...",
  "empresa": "...",       "funcionarios": "...", "faturamento": "...",

  "ft_utm_source": "...", "ft_utm_medium": "...", "ft_utm_campaign": "...",
  "utm_source": "...",    "utm_medium": "...",

  "geo_country": "...",   "geo_state": "...",
  "geo_city": "...",      "geo_zip": "...",

  "session_id": "...",    "referrer": "...",     "user_agent": "..."
}
```

URL configurada em cada landing:

```js
window.__pbqph.config.webhookUrl = "https://seu-endpoint";
```

---

## 8. Persistência (cookies & storage)

| Onde                                  | O que                                            | TTL     |
|---------------------------------------|--------------------------------------------------|---------|
| Cookies `utm_*` (root domain)         | First-touch UTMs                                 | 2 anos  |
| Cookie `_fbc`                         | Facebook click ID formatado para CAPI            | 2 anos  |
| Cookies `cookie_em`, `cookie_nm`      | Email/nome do lead                               | 2 anos  |
| Cookies `first_visit`, `landing_page` | Atribuição inicial                               | 2 anos  |
| sessionStorage `apex_session_id`      | ID da sessão                                     | sessão  |
| sessionStorage `__pbqph_geo`          | Cache do geo IP                                  | sessão  |
| sessionStorage `__pbqph_lastlead`     | Snapshot do lead para a thank-you                | sessão  |
| `window.__pbqphFormData`              | Estado live do form (atualiza a cada digitação)  | runtime |
| `window.__pbqphGeo`                   | Cópia in-memory do geo                           | runtime |

**Regra de first-touch**: `setFirstTouch()` só grava **se ainda não existe** — nunca sobrescreve. Garante atribuição correta mesmo se o lead voltar com UTMs diferentes em visitas posteriores.

---

## 9. Checklist de implementação

1. Copiar `shared/js/analytics.js` e `shared/js/form.js`.
2. Configurar webhook em cada landing (no `script.js` da página):
   ```js
   window.__pbqph.config.webhookUrl = "https://seu-endpoint";
   ```
3. HTML mínimo da landing:
   ```html
   <body data-variant="a">
     <!-- Tag Manager no <head> ou aqui -->

     <!-- Container do form (renderizado pelo form.js) -->
     <div data-form="lead"
          data-submit-label="Texto do botão"
          data-empresa-label="Nome da empresa"></div>

     <script src="shared/js/analytics.js?v=1" defer></script>
     <script src="shared/js/form.js?v=1" defer></script>
   </body>
   ```
4. O `<form>` é renderizado automaticamente com `id="waitlist-form"`.
5. Sempre que mexer no JS, incrementar `?v=…` nos `<script src>` para invalidar cache do browser.
6. Domínio com **root sharing** (cookies `.dominio.com` funcionam entre subdomínios).
7. **Variante** detectada automaticamente de `<body data-variant="...">`.
8. **Norma/Produto** detectado automaticamente do primeiro segmento do path (`/<segmento>/...`).

---

## 10. Eventos secundários úteis

### Lead na thank-you
Quando o usuário chega na thank-you após submit, o `form.js` salva um snapshot do lead em `sessionStorage.__pbqph_lastlead`. Pode ser lido pra:

- Pre-preencher um segundo formulário (ex: convite pra evento)
- Mostrar mensagem personalizada ("Obrigado, {nome}!")
- Disparar tag de conversão consolidada

```js
const lead = JSON.parse(sessionStorage.getItem("__pbqph_lastlead") || "{}");
// lead.firstname, lead.email, lead.whatsapp, lead.norm_slug, lead.variant, ...
```

### Pageview enriquecido
O evento `custom_page_view` carrega **first-touch + last-touch + contexto** num único push. Útil pra:

- Disparar pixel/analytics com atribuição completa já na primeira request
- Alimentar dashboards de tráfego por canal

### Geo loaded
Evento `geo_loaded` dispara após o geo IP responder (depende da latência do serviço externo). Tags que precisam de localização (segmentação por estado, exclusão por país, etc.) devem usar esse trigger em vez do pageview.

---

## 11. Configurações opcionais

### Debug mode
```js
window.__pbqph.config.debug = true;
```
Loga no console todos os eventos disparados, geo carregado, atribuição capturada.

### Webhook customizado
```js
window.__pbqph.config.webhookUrl = "...";
```
Se vazio/null, o submit roda em modo demo (não posta, retorna `{ ok: true, simulated: true }`).

### Microsoft Clarity
Plug-and-play: se o Clarity estiver instalado, o `analytics.js` chama `clarity("identify", email)` automaticamente após o submit, ligando a sessão gravada ao lead.

---

## 12. Pontos importantes

- **Mesmo `event_id`** é usado em pixel client-side e API server-side — habilita deduplicação automática.
- **Cookies first-touch** vivem 2 anos em root domain — primeira UTM nunca é sobrescrita.
- **Geo via API externa** (gratuita, com CORS aberto). Pode ser substituído por header do CDN/edge function se o volume crescer.
- **Norma e variante** vão automaticamente no payload sem precisar configurar manualmente em cada landing.
- **PageSpeed**: o `analytics.js` é `defer`, não bloqueia render. Scripts de tracking pesados (GTM, pixels, CRM) devem ser carregados via `requestIdleCallback` ou após primeira interação.
