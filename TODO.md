# TODO — Reorganização Painel Admin com Sidebar

## Passos

- [ ] 1. Reescrever `admin/painel.html` com sidebar lateral fixa, header, breadcrumb, 7 tab-contents preservando todo o conteúdo existente
- [ ] 2. Reescrever `css/admin.css` com novo layout sidebar + main, responsivo (desktop/tablet/mobile), merge com estilos existentes de galeria/upload
- [ ] 3. Reescrever `js/admin.js` com `switchTab()`, metadados de abas, `atualizarBadges()`, preservar todas as funções CRUD
- [ ] 4. Testar visualmente (sidebar fixa, tabs sem quebra, mobile bottom bar, badges)

## Execucao local no Linux Mint

- Use o backend em `barbearia-site/backend`.
- Inicie a API com `bash .vscode/scripts/start-backend.sh` na raiz do repositório.
- Inicie o frontend com `bash .vscode/scripts/start-frontend.sh` na raiz do repositório.
- As tasks do VS Code foram ajustadas para `bash` e deixam de depender de PowerShell.

