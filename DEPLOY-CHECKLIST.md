# Deploy Checklist - NaCapital Kommo

## Objetivo

Publicar o backend da integracao e concluir a ativacao do webhook no Kommo.

## 1. Publicar o backend

- Subir este projeto em um servidor com HTTPS ativo.
- Garantir que o dominio final responda em:
  - `GET https://nacapital.work/`
  - `GET https://nacapital.work/health`
  - `POST https://nacapital.work/webhooks/kommo`

## 2. Variaveis obrigatorias em producao

- `KOMMO_SUBDOMAIN=nacapital`
- `KOMMO_LONG_LIVED_TOKEN`
- `KOMMO_WEBHOOK_SECRET`
- `PUBLIC_WEBHOOK_URL=https://nacapital.work/webhooks/kommo`
- `KOMMO_REDIRECT_URI=https://nacapital.work/integrations/kommo/oauth/callback`
- `WEBHOOK_DEDUPE_TTL_MS=300000`
- `WEBHOOK_MAX_CACHE_ENTRIES=2000`

## 3. Validacao minima apos deploy

- Abrir `https://nacapital.work/` e confirmar retorno JSON com `ok: true`
- Abrir `https://nacapital.work/health` e confirmar conexao com Kommo
- Rodar o smoke test do projeto:

```bash
SMOKE_BASE_URL=https://nacapital.work SMOKE_WEBHOOK_SECRET=seu_segredo npm run smoke
```

- Rodar a validacao ponta a ponta do deploy:

```bash
VALIDATION_BASE_URL=https://nacapital-kommo-integration.onrender.com ^
VALIDATION_WEBHOOK_SECRET=seu_segredo ^
npm run validate:deploy
```

- Confirmar no retorno:
  - `ok: true`
  - `requestId`
  - `validationLeadId`
  - `checks` todos com `ok: true`

- Ou testar manualmente:

```bash
curl -X POST https://nacapital.work/webhooks/kommo ^
  -H "Content-Type: application/json" ^
  -H "x-kommo-secret: SEU_SEGREDO" ^
  -d "{\"message\":{\"text\":\"quero contratar escritorio virtual\",\"phone\":\"+5511999998888\",\"source\":\"whatsapp\"},\"contact\":{\"name\":\"Ze\"}}"
```

## 4. Eventos para ativar no Kommo

Quando a URL ficar publica e valida, ativar estes eventos no bloco de webhook:

- `add_message`
- `add_talk`
- `add_lead`
- `update_lead`
- `add_contact`
- `update_contact`
- `status_lead`

## 5. Tela exata no Kommo

- Central de integracoes
- `Web hooks`
- `Adicionar webhook`
- URL:
  - `https://nacapital.work/webhooks/kommo`

## 6. Bloqueio atual

Hoje o Kommo mostra `URL invalida` para `https://nacapital.work/webhooks/kommo`.

Isso indica que o endpoint ainda nao esta publicado de forma acessivel para validacao externa, ou nao esta respondendo corretamente via HTTPS.

## 7. Assim que subir

- voltar nesta mesma tela do Kommo
- preencher novamente a URL
- marcar os eventos acima
- salvar
- disparar um teste de mensagem pelo WhatsApp integrado
