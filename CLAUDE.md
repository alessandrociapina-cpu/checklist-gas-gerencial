# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

App gerencial PWA para consolidação de checklists de fiscalização de interferência de gás (Sabesp/Comgás). O gerente importa arquivos JSON exportados pelos fiscais em campo (app companion: `alessandrociapina-cpu/checklist-gas`) e visualiza relatórios, gráficos e conformidade consolidados. Todo o banco de dados fica local no dispositivo do gerente via IndexedDB (sem servidor backend).

## Comandos

```bash
npm run dev      # servidor de desenvolvimento (localhost:5173)
npm run build    # gera dist/ para produção
npm run preview  # serve dist/ localmente para testar o build
npm start        # serve dist/ em localhost:3000 com abertura automática do browser (para uso do gerente sem HTTPS)
npm run icons    # regenera todos os PNGs de ícone a partir de icons/icon.svg (requer sharp)
```

O `dist/` é commitado no repositório para que o gerente possa rodar `node serve.js` sem precisar fazer o build.

## Deploy

GitHub Pages em `https://alessandrociapina-cpu.github.io/checklist-gas-gerencial/` via GitHub Actions (`.github/workflows/deploy.yml`). O workflow dispara a cada push na `main`. Para ativar pela primeira vez: Settings → Pages → Source → GitHub Actions.

O `base` do Vite é fixo em `/checklist-gas-gerencial/` — não usar `'./'` mesmo em desenvolvimento, pois o `serve.js` já faz o strip do prefixo.

## Arquitetura

### Navegação

Não há router — `App.jsx` gerencia a página ativa via estado `pagina` (string) e passa `navegar(pagina, id?, opts?)` pelo layout. A prop `autoPrint: true` em `opts` faz `ChecklistDetail` disparar `window.print()` após montar.

### Banco de dados local (`src/lib/db.js`)

Dexie.js (wrapper IndexedDB), banco `gas-gerencial`, três stores:

| Store | Chave | Descrição |
|---|---|---|
| `checklists` | `id` | Objeto completo do checklist + campos `fiscal`, `municipio`, `data` extraídos para índice |
| `fotos` | `id` | Fotos com `checklistId`, `itemKey`, `dataUrl` (base64) |
| `importacoes` | `++id` | Log de cada arquivo importado |

A deduplicação é por `id` + `atualizadoEm`: só sobrescreve se o arquivo importado for mais recente.

### Formato JSON do app de campo

```json
{
  "app": "checklist-gas",
  "versao": 1,
  "dados": [
    {
      "checklist": {
        "id": "...",
        "atualizadoEm": "ISO8601",
        "geral": { "os": "", "responsavel": "", "municipio": "", "data": "YYYY-MM-DD", ... },
        "frentes": {
          "f1": [{ "ok": true/false, "justificativa": "", "responsavel": "", "observacoes": "" }],
          "f2": [...], "f3": [...], "f4": [...]
        },
        "cadastro": { "necessita": "sim|nao", "registros": [...] },
        "assinaturas": { "ass1": { "nome": "", "img": "base64..." }, ... }
      },
      "fotos": [{ "id": "", "checklistId": "", "itemKey": "f1_0", "dataUrl": "base64..." }]
    }
  ]
}
```

**Atenção crítica:** as chaves das frentes são `f1`, `f2`, `f3`, `f4` — não `frente1` etc. `item.ok` é booleano (`true`/`false`), nunca string.

### Títulos dos itens (`src/lib/reportData.js`)

O JSON exportado pelo app de campo **não inclui o texto dos itens** — armazena só as respostas (`ok`, `justificativa`, etc.). Os títulos são definidos localmente em `DEFINICOES_FRENTES` espelhando o `data.js` do app de campo. Se o app de campo adicionar ou reordenar itens, atualizar aqui também.

O `itemKey` das fotos pode variar (`f1_0`, `f1-0`, `f1.0`, `f10`) — `fotosDoItem()` testa todos os padrões.

### Relatório (`src/pages/ChecklistDetail.jsx`)

Layout fiel ao relatório do app de campo: cabeçalho azul `#0d2b45`, cards de resumo coloridos, tabela por frente com barra de progresso, fotos embarcadas por item, assinaturas. CSS `@media print` preserva cores com `print-color-adjust: exact` para PDF fiel. Classe `.no-print` oculta elementos de navegação na impressão.

### PWA (`src/hooks/usePWA.js`)

`registerType: 'prompt'` — **não** chama `e.preventDefault()` no `beforeinstallprompt` para que o botão nativo do Edge/Chrome apareça na barra de endereços. O evento é capturado apenas para acionar o prompt via botão customizado. `InstallBanner` e o card no Dashboard são secundários ao botão nativo.

### Ícones

A fonte é `icons/icon.svg`. Os PNGs em `public/icons/` são gerados por `scripts/generate-icons.js` (usa `sharp`). Após editar o SVG, rodar `npm run icons` e commitar os PNGs atualizados.
