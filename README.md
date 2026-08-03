# NaCapital Kommo Integration

Base inicial para automatizar o fluxo comercial da NaCapital via API do Kommo.

## O que este projeto ja faz

- expoe um endpoint de webhook para receber eventos do Kommo
- valida uma chave simples de webhook por header
- conecta na CRM API v4 com long-lived token
- identifica interesse por produto a partir de texto
- normaliza texto com acentos e variacoes comuns do WhatsApp
- classifica entrada como inbound, midia paga ou SDR outbound
- roteia leads para Funil de vendas, PROSPECCAO ou pipeline especialista
- cria ou reaproveita contato antes de vincular ao lead
- grava contexto comercial quando os campos ja existirem no Kommo
- automatiza o fluxo inicial de Escritorio Virtual
- automatiza fluxos iniciais de Avulsos, Eventos, Residencia e Coworking
- distribui SDRs e closers por round-robin quando os IDs forem configurados
- cria tarefas internas quando o lead quer contratar, falar com o time, agendar visita ou fechar
- cria tarefas de SLA para resposta inicial e retomada de inbound
- registra notas automaticas no lead
- agenda follow-ups reais em camada de scheduler local
- grava eventos e follow-ups em armazenamento local para auditoria simples
- expoe metricas operacionais por endpoint

## Estrutura

```text
src/
  config.js
  keywords.js
  kommo-client.js
  logger.js
  modules/
    followup/
    persistence/
    reporting/
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
4. Se quiser alterar cadencia e retencao local, ajuste:
   - `DATA_STORE_PATH`
   - `FOLLOWUP_POLL_MS`
   - `INBOUND_FOLLOWUP_MINUTES`
   - `OUTBOUND_FOLLOWUP_MINUTES`
   - `METRICS_RECENT_LIMIT`

Campos novos recomendados no `.env` para a operacao completa:

- `PIPELINE_FUNIL_VENDAS_ID`
- `PIPELINE_PROSPECCAO_ID`
- `SDR_ROUND_ROBIN_USER_IDS`
- `CLOSER_ROUND_ROBIN_USER_IDS`
- `CUSTOM_FIELD_CANAL_ID`
- `CUSTOM_FIELD_CAMPANHA_ID`
- `CUSTOM_FIELD_ADSET_ID`
- `CUSTOM_FIELD_ANUNCIO_ID`
- `CUSTOM_FIELD_PALAVRA_CHAVE_ID`
- `CUSTOM_FIELD_UNIDADE_INTERESSE_ID`
- `CUSTOM_FIELD_SDR_RESPONSAVEL_ID`
- `CUSTOM_FIELD_CLOSER_RESPONSAVEL_ID`
- `CUSTOM_FIELD_DATA_PRIMEIRA_RESPOSTA_ID`
- `CUSTOM_FIELD_DATA_AGENDAMENTO_ID`
- `CUSTOM_FIELD_MOTIVO_PERDA_ID`

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

- `POST /campaigns/indicacao/launch`
  dispara manualmente a campanha de indicacao para um ou mais leads
  pode mover o lead para a etapa `Campanha de indicacao` do pipeline `ORGANIZACAO`
  e dispara o `Salesbot #3` via API sem depender do editor visual do Kommo

- `GET /metrics/summary`
  retorna resumo operacional, contagem de eventos e follow-ups

- `GET /metrics/events`
  retorna os eventos recentes gravados localmente

- `GET /metrics/followups`
  retorna a fila recente de follow-ups locais

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

Teste dedicado da etapa `Campanha de indicacao`:

```bash
TEST_BASE_URL=http://127.0.0.1:3000 ^
TEST_INDICACAO_LEAD_ID=23003285 ^
npm run test:indicacao
```

Disparo manual da campanha de indicacao por API:

```bash
INDICACAO_BASE_URL=https://nacapital-kommo-integration.onrender.com ^
INDICACAO_WEBHOOK_SECRET=seu_segredo ^
INDICACAO_LEAD_IDS=23003285,23003286 ^
npm run launch:indicacao
```

Variaveis aceitas nesse acionamento:

- `INDICACAO_BASE_URL`
- `INDICACAO_WEBHOOK_SECRET`
- `INDICACAO_LEAD_IDS`
- `INDICACAO_MOVE_TO_STAGE`

Fluxo recomendado para operar a campanha sem depender do bot visual:

1. importar ou criar os contatos/leads que vao participar da campanha
2. colocar esses leads no pipeline `ORGANIZACAO`
3. usar a etapa `Campanha de indicacao` quando quiser manter o gatilho por etapa
4. ou chamar `POST /campaigns/indicacao/launch` com os `leadIds` para disparo manual
5. acompanhar os envios e respostas no Kommo normalmente

Para ambiente publicado:

```bash
TEST_BASE_URL=https://nacapital-kommo-integration.onrender.com ^
TEST_INDICACAO_LEAD_ID=23003285 ^
npm run test:indicacao
```

Para ambiente publicado:

```bash
SMOKE_BASE_URL=https://nacapital.work SMOKE_WEBHOOK_SECRET=seu_segredo npm run smoke
```

Validacao recorrente de deploy:

```bash
npm run validate:deploy
```

Esse roteiro faz 4 checagens em sequencia:

- testa `GET /`
- testa `GET /health`
- dispara um `POST /webhooks/kommo` com um lead de teste unico
- consulta o lead criado no Kommo e valida nome, pipeline, responsavel e tags

Para ambiente publicado, use:

```bash
VALIDATION_BASE_URL=https://nacapital-kommo-integration.onrender.com ^
VALIDATION_WEBHOOK_SECRET=seu_segredo ^
npm run validate:deploy
```

Variaveis aceitas pelo teste de deploy:

- `VALIDATION_BASE_URL`
- `VALIDATION_WEBHOOK_SECRET`
- `VALIDATION_EXPECTED_PIPELINE_ID`
- `VALIDATION_EXPECTED_STATUS_ID`
- `VALIDATION_EXPECTED_RESPONSIBLE_ID`
- `VALIDATION_MESSAGE_TEXT`

## Fluxos implementados

### Triagem inbound

- inbound organico entra preferencialmente em `Funil de vendas`
- lead de midia paga pode receber contexto de campanha, adset, anuncio e palavra-chave
- a primeira tarefa e responder dentro do SLA comercial
- o backend ja cria tambem uma retomada automatica de 24h como tarefa
- o scheduler local agenda novas retomadas em 15min, 2h, 24h e 72h por padrao

### Prospeccao SDR

- fontes marcadas como `sdr`, `outbound`, `prospeccao` ou `ativo` entram em `PROSPECCAO`
- quando `SDR_ROUND_ROBIN_USER_IDS` estiver preenchido, o responsavel gira entre os SDRs
- o closer tambem pode girar automaticamente com `CLOSER_ROUND_ROBIN_USER_IDS`
- o scheduler local agenda retomadas outbound de 24h e 72h por padrao

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

## Fase 2 entregue

- scheduler local para follow-up recorrente
- armazenamento local de eventos e follow-ups em `data/automation-store.json`
- endpoints de metricas para leitura rapida da operacao
- consistencia do responsavel do lead com as tarefas automÃ¡ticas

## Proxima evolucao recomendada

- persistir eventos em banco
- usar fila para reprocessamento
- integrar com assinatura de contrato
- trocar o scheduler local por fila persistente e worker dedicado
- enriquecer deduplicacao de contato por telefone/e-mail e por lead aberto
- criar automacoes especificas por unidade
- registrar webhook delivery logs para auditoria
- salvar mudancas de etapa e dono do lead para analytics de SDR e closer
