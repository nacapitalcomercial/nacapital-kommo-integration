# Google Sheets Como Base Dinamica

## Objetivo

Usar o Google Sheets como camada web de leitura para o Painel Dinamico de Leads.

## Planilha web

`https://docs.google.com/spreadsheets/d/1bhkPAzUQExot-v5gcmHhK9tKBBVemfNZemHSyEmzLLo/edit?usp=drivesdk`

## Aba esperada

`Leads_Semanais`

## Estrutura da aba

| data | categoria | quantidade |
| --- | --- | --- |
| 27/07/2026 | Instagram | 6 |
| 27/07/2026 | Google | 2 |

## Como publicar a planilha como CSV

1. Abrir a planilha no Google Sheets.
2. Ir em `Arquivo`.
3. Selecionar `Compartilhar`.
4. Selecionar `Publicar na Web`.
5. Escolher a aba `Leads_Semanais`.
6. Escolher o formato `Valores separados por virgula (.csv)`.
7. Publicar.
8. Copiar o link gerado.

## Como conectar no painel

1. Abrir o site publicado.
2. Colar o link de edicao da planilha ou o link CSV publicado.
3. Clicar em `Conectar planilha`.

O painel tambem possui o botao `Usar planilha NaCapital`, que tenta conectar a planilha padrao ja cadastrada no codigo.

## Observacao importante

O navegador so consegue ler a planilha se ela estiver publicada como CSV ou acessivel publicamente.

Se a planilha estiver privada, o painel nao consegue sincronizar automaticamente no site publico.
