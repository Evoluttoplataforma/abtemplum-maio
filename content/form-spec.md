# Especificação do formulário

## Escopo
Os mesmos 6 campos são usados em **todos** os pontos de captura:
- Formulário inline (variante A, seção 14)
- Modal aberto por qualquer CTA principal (ambas variantes)

## Campos

| Campo | Tipo HTML | Obrigatório | Validação |
|---|---|---|---|
| Nome completo | `text` | sim | min 3 caracteres |
| Email | `email` | sim | formato email válido |
| WhatsApp | `tel` | sim | máscara `(##) #####-####`, 11 dígitos |
| Empresa | `text` | sim | min 2 caracteres |
| Faixa de funcionários | `select` | sim | uma das opções abaixo |
| Faturamento anual | `select` | sim | uma das opções abaixo |

## Opções de select (defaults — me avise se quiser ajustar)

**Faixa de funcionários:**
- 1 a 9
- 10 a 49
- 50 a 99
- 100 a 249
- 250 a 499
- 500 ou mais

**Faturamento anual:**
- Até R$ 500 mil
- R$ 500 mil a R$ 2 milhões
- R$ 2 milhões a R$ 10 milhões
- R$ 10 milhões a R$ 50 milhões
- Acima de R$ 50 milhões

## Submit
- **Destino:** webhook (URL configurável via `window.__pbqph.config.webhookUrl`)
- **Método:** POST JSON
- **Payload:**
```json
{
  "nome": "...",
  "email": "...",
  "whatsapp": "5511999999999",
  "empresa": "...",
  "funcionarios": "10 a 49",
  "faturamento": "R$ 2 milhões a R$ 10 milhões",
  "variant": "a",
  "source": "inline" | "modal",
  "ts": 1234567890,
  "page_url": "...",
  "utm_*": "..." (se presentes na URL)
}
```
- **Antes de configurar webhook:** form dispara só evento `lead_submit` no dataLayer e mostra mensagem de sucesso. Não bloqueia o teste A/B.

## Tracking (data-track)
- `cta_hero_primary` — CTA do hero
- `cta_dor` — CTA da seção 2 (A) / não existe na B
- `cta_beneficios` — CTA da seção 4 (A) / seção 7 (B)
- `cta_orbit` — CTA das seções 6 bloco 1 e 8 (A)
- `cta_selo` — CTA da seção 6 bloco 2 (A) / seção 5 (B)
- `cta_garantia` — CTA da seção 7 (A) / seção 4 (B)
- `cta_passo_passo` — CTA da seção 13 (A) / seção 9 (B)
- `cta_cobertura` — CTA da seção 12 (A) / seção 11 (B)
- `cta_final` — CTA da seção 17 (A) / seção 15 (B)
- `form_inline_submit` — submit do form inline
- `form_modal_submit` — submit do form modal
- `modal_open` — abertura do modal (qualquer CTA primário)
- `whatsapp_click` — clique direto no WhatsApp (se houver)
