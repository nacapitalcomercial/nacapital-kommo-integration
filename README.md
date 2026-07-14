# NaCapital Kommo Integration

Base inicial para automatizar o fluxo comercial da NaCapital via API do Kommo.

## O que este projeto ja faz

- expoe um endpoint de webhook para receber eventos do Kommo
- valida uma chave simples de webhook por header
- conecta na CRM API v4 com long-lived token
- identifica interesse por produto a partir de texto
- normaliza texto com acentos e variacoes comuns do WhatsApp
- roteia leads para o pipeline correto
- cria ou reaproveita contato antes de vincular ao lead
- automatiza o fluxo inicial de Escritorio Virtual
- automatiza fluxos iniciais de Avulsos, Eventos, Residencia e Coworking
- cria tarefas internas quando o lead quer contratar, falar com o time, agendar visita ou fechar
- registra notas automaticas no lead

## Estrutura

```text
src/
  config.js
  keywords.js
  kommo-client.js
  logger.js
  normalize-webhook.js
  rules.js
  server.js
```

## Configuracao

1. Use o arquivo `.env` ja criado no projeto.
2. Preencha:
   - `KOMMO_LONG_LIVED_TOKEN`
   - `KOMMO_WEBHOOK_SECRET`
   - `PUBLIC_WEBHOOK_URL`
   - `KOMMO_REDIRECT_URI`
3. Revise se os IDs preenchidos continuam corretos.

Configuracao atual deste projeto:

- `PUBLIC_WEBHOOK_URL=https://nacapital.work/webhooks/kommo`
- `KOMMO_REDIRECT_URI=https://nacapital.work/integrations/kommo/oauth/callback`

## IDs reais ja mapeados da conta

- usuario responsavel ativo:
  - `Jairo = 12908151`

- pipelines:
  - `Funil de vendas = 10768071`
  - `Escritorio Virtual = 10768291`
  - `Residencia = 10768327`
  - `Avulsos = 10768331`
  - `Eventos = 10768423`
  - `NC - Joao da Cruz = 10768467`
  - `NC - Rio Branco = 10768471`

## Observacao importante sobre campos personalizados

Hoje a conta nao tem campos de lead com nomes como:

- `produto_interesse`
- `origem_lead`
- `temperatura_lead`
- `quer_contratar`
- `quer_falar_com_time`
- `pronto_para_fechamento`
- `documentacao_completa`

Por isso esses IDs ficaram em branco no `.env`.

A integracao continua funcionando com:

- pipeline
- etapa
- tarefa
- nota
- responsavel
- contato vinculado por telefone/e-mail quando disponivel

Quando esses campos forem criados no Kommo, basta preencher os IDs no `.env`.

## Instalacao

```bash
npm install
npm run dev
```

## Publicacao

Opcao simples com container:

```bash
docker build -t nacapital-kommo-integration .
docker run --env-file .env -p 3000:3000 nacapital-kommo-integration
```

Opcao simples no Render:

- usar o arquivo [render.yaml](C:\Users\geomf\Documents\Codex\2026-06-30\in-app-browser-the-user-has\work\kommo-integration\render.yaml)
- configurar no painel as mesmas variaveis do `.env`
- apontar o dominio final para o servico publicado

Depois de subir, valide:

- `GET /`
- `GET /health`
- `POST /simulate/message`

## Endpoints locais

- `GET /`
  retorna status simples do servico e URL publica configurada

- `GET /health`
  valida a conexao com a conta do Kommo

- `POST /webhooks/kommo`
  recebe eventos do Kommo
  ignora automaticamente duplicatas recentes do mesmo evento

- `POST /simulate/message`
  simula uma mensagem para testar regras sem depender do webhook

Exemplo de payload para teste:

```json
{
  "lead": { "id": 123456 },
  "contact": { "name": "Ze" },
  "message": {
    "text": "quero contratar escritorio virtual",
    "source": "whatsapp"
  }
}
```

Tambem deixei um exemplo pronto em [sample-payload.json](C:\Users\geomf\Documents\Codex\2026-06-30\in-app-browser-the-user-has\work\kommo-integration\sample-payload.json).

Teste de fumaca automatizado:

```bash
npm run smoke
```

Para ambiente publicado:

```bash
SMOKE_BASE_URL=https://nacapital.work SMOKE_WEBHOOK_SECRET=seu_segredo npm run smoke
```

## Fluxos implementados

### Escritorio Virtual

- detecta interesse e move para `Contato inicial`
- inicia fluxo de contratacao
- cria tarefa comercial
- registra checklist documental
- cria contato e vincula ao lead quando o webhook chegar sem lead previo

### Avulsos

- roteia para `Avulsos`
- cria tarefa para qualificar data, periodo, pessoas e tipo de uso
- avanca para fechamento quando o cliente quer contratar

### Eventos

- roteia para `Eventos`
- cria tarefa para confirmar data, publico e estrutura

### Residencia

- roteia para `Residencia`
- cria tarefa de qualificacao
- move para visita quando o lead pedir agendamento
- avanca para contratacao quando o lead esquentar

### Coworking / Salas

- usa `NC - Joao da Cruz` como pipeline base
- cria triagem automatica
- cria tarefa para visita ou fechamento

## Proxima evolucao recomendada

- persistir eventos em banco
- usar fila para reprocessamento
- integrar com assinatura de contrato
- criar scheduler para follow-up de 24h, 72h e 7 dias
- enriquecer deduplicacao de contato por telefone/e-mail e por lead aberto
- criar automacoes especificas por unidade
- registrar webhook delivery logs para auditoria
