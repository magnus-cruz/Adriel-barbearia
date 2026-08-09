# Alpha Barber

Projeto completo de barbearia com backend em Node.js + Express e frontend em HTML/CSS/JavaScript puro.

## Requisitos
- Node.js 18+ opcional, se quiser usar o runtime do sistema
- npm 9+
- Python 3 para o servidor estatico local

## Instalacao no Linux Mint
```bash
cd barbearia-site/backend
npm install
```

Se o `node` nao estiver instalado no sistema, o script do backend usa o runtime Node empacotado via Python e continua funcionando.

Se preferir usar as tasks do VS Code, elas agora chamam scripts `bash` para funcionar no Linux Mint.

## Executar
```bash
cd barbearia-site/backend
npm start
```
Ou para desenvolvimento:
```bash
npm run dev
```

Frontend local:
```bash
cd barbearia-site/frontend
python3 -m http.server 5500
```

Depois abra `http://localhost:5500/index.html`.

Atalho validado na workspace:
```bash
bash .vscode/scripts/start-backend.sh
bash .vscode/scripts/start-frontend.sh
```

## Acessar
- API: http://localhost:8080/api/health
- Frontend: http://localhost:5500/index.html

## Como rodar tudo
1. Abra um terminal na raiz do repositório.
2. Execute `cd barbearia-site/backend && npm install` na primeira vez.
3. Em outro terminal, execute `bash .vscode/scripts/start-backend.sh`.
4. Em outro terminal, execute `bash .vscode/scripts/start-frontend.sh`.
5. Acesse `http://localhost:5500/index.html` e a API em `http://localhost:8080/api/health`.

No VS Code, as tasks `Barbearia: Backend API`, `Barbearia: Frontend estatico` e `Barbearia: Tudo (API + Frontend)` usam esses mesmos comandos no Linux Mint.

## Login Admin
- Usuario: admin
- Senha: barbearia123
- URL: frontend/admin/login.html

## Token API
`Authorization: Bearer barberco-admin-2026`

## Estrutura de Endpoints
| Metodo | Endpoint | Auth | Descricao |
|---|---|---|---|
| GET | /api/health | Nao | Status da API |
| POST | /api/admin/login | Nao | Login administrativo |
| GET | /api/admin/check | Sim | Validar sessao admin |
| GET | /api/servicos | Nao | Listar servicos ativos |
| GET | /api/admin/servicos | Sim | Listar todos os servicos |
| POST | /api/admin/servicos | Sim | Criar servico |
| PUT | /api/admin/servicos/:id | Sim | Atualizar servico |
| DELETE | /api/admin/servicos/:id | Sim | Remover servico |
| GET | /api/barbeiros | Nao | Listar barbeiros ativos |
| GET | /api/admin/barbeiros | Sim | Listar barbeiros admin |
| POST | /api/admin/barbeiros | Sim | Criar barbeiro com foto |
| PUT | /api/admin/barbeiros/:id | Sim | Atualizar barbeiro |
| PATCH | /api/admin/barbeiros/:id/pausar | Sim | Pausar ou reativar barbeiro |
| DELETE | /api/admin/barbeiros/:id | Sim | Remover barbeiro |
| GET | /api/horarios | Nao | Ler configuracao de horarios |
| POST | /api/admin/horarios | Sim | Salvar configuracao de horarios |
| GET | /api/horarios/disponiveis?data=YYYY-MM-DD&servico=... | Nao | Horarios livres |
| POST | /api/agendamentos | Nao | Criar agendamento |
| GET | /api/agendamentos | Nao | Listar agendamentos |
| GET | /api/admin/agendamentos | Sim | Listar agendamentos admin |
| PUT | /api/admin/agendamentos/:id/cancelar | Sim | Cancelar agendamento |
| GET | /api/admin/imprevistos | Sim | Listar bloqueios |
| POST | /api/admin/imprevistos | Sim | Criar bloqueio |
| DELETE | /api/admin/imprevistos/:id | Sim | Remover bloqueio |
| GET | /api/galeria | Nao | Listar midias |
| POST | /api/admin/upload | Sim | Upload de foto/video |
| POST | /api/midias/video | Sim | Cadastrar video por URL |
| DELETE | /api/admin/galeria/:nomeArquivo | Sim | Excluir midia |
| GET | /api/uploads/:arquivo | Nao | Servir arquivo enviado |

## Dados JSON
Os dados ficam em `backend/data`.

### servicos.json
```json
[
  { "id": 1, "nome": "Corte Masculino", "preco": 35, "duracaoMinutos": 30, "ativo": true }
]
```

### barbeiros.json
```json
[
  { "id": 1, "nome": "Adriel", "especialidade": "Degrade", "whatsapp": "5561999999999", "instagram": "@adriel", "ativo": true, "pausado": false, "motivoPausa": "", "criadoEm": "2026-04-24", "fotoArquivo": "barbeiro-...jpg", "fotoUrl": "http://localhost:8080/api/uploads/..." }
]
```

### horarios.json
```json
{
  "configuracao": {
    "intervaloPadrao": 30,
    "diasSemana": {
      "segunda": { "inicio": "09:00", "fim": "18:00", "ativo": true }
    }
  }
}
```

### agendamentos.json
```json
[
  { "id": 1, "nomeCliente": "Joao", "telefone": "6199...", "servico": "Corte", "barbeiro": "Adriel", "data": "2026-04-24", "horario": "10:30", "status": "confirmado" }
]
```

### imprevistos.json
```json
[
  { "id": 1, "data": "2026-04-30", "periodo": "manha", "motivo": "Compromisso" }
]
```

### midia-metadata.json
```json
[
  { "id": "uuid", "nomeArquivo": "upload-...jpg", "tipo": "image/jpeg", "categoria": "cortes", "titulo": "Corte", "url": "http://localhost:8080/api/uploads/...", "tamanhoKb": 321, "dataUpload": "2026-04-24" }
]
```

## Tecnologias
- Backend: Node.js + Express
- Frontend: HTML5 + CSS3 + JavaScript ES6+
- Dados: Arquivos JSON locais
- Upload: Multer
- Fontes: Google Fonts (Playfair Display + Barlow)
