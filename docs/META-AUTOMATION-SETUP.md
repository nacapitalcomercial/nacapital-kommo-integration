# Automacao do painel Meta Ads

## O que foi criado

- `scripts/sync-meta-insights.mjs`: consulta o Meta Graph API e atualiza o painel.
- `.github/workflows/sync-meta.yml`: executa diariamente às 06:00 no horário de Brasília e também permite execução manual.

## Secrets necessários

Em **Settings > Secrets and variables > Actions**, cadastre:

- `META_ACCESS_TOKEN`: token de acesso do Meta.
- `META_IG_USER_ID`: ID da conta profissional do Instagram.
- `META_AD_ACCOUNT_ID`: ID da conta de anúncios, sem o prefixo `act_`.
- `META_GRAPH_VERSION`: versão da Graph API, opcional; se omitido, usa `v22.0`.

O token deve ter as permissões de leitura necessárias para Insights do Instagram e Insights da conta de anúncios. Nunca coloque o token no HTML, no JavaScript do navegador ou em commits.

## Observacao

O painel atualiza automaticamente o mês corrente e o acumulado do ano. O gasto é calculado pela soma das campanhas retornadas pelo Ads Insights; o Billing Hub continua sendo a conferência financeira oficial quando houver divergência entre cobrança e veiculação.
