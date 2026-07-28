# Painel Dinamico de Leads NaCapital

Site estatico pronto para GitHub Pages, Cloudflare Pages ou Netlify.

## Arquivos

- `index.html`
  Painel completo.
- `template-leads-nacapital.csv`
  Modelo de planilha para upload.
- `.nojekyll`
  Arquivo necessario para o GitHub Pages publicar sem processar o site como Jekyll.

## Publicar no GitHub Pages

1. Criar um repositorio no GitHub.
2. Enviar estes arquivos para a branch `main`.
3. Abrir `Settings`.
4. Abrir `Pages`.
5. Em `Build and deployment`, selecionar `Deploy from a branch`.
6. Selecionar branch `main` e pasta `/root`.
7. Salvar.

O GitHub vai gerar uma URL no formato:

`https://usuario.github.io/repositorio/`

## Atualizacao por planilha

O painel aceita dois caminhos:

1. Upload manual de arquivo `.xlsx`, `.xls`, `.csv` ou `.txt`.
2. Conexao com Google Sheets publicado como CSV.

Para uso semanal compartilhado, o melhor fluxo e:

SharePoint -> Google Sheets publicado -> Painel GitHub Pages.

## Planilha Google criada

`https://docs.google.com/spreadsheets/d/1bhkPAzUQExot-v5gcmHhK9tKBBVemfNZemHSyEmzLLo/edit?usp=drivesdk`

Use a aba `Leads_Semanais`.

## Colunas esperadas

Minimo:

- `data`
- `categoria`

Opcional:

- `quantidade`

Se `quantidade` nao existir, cada linha sera interpretada como 1 lead.
