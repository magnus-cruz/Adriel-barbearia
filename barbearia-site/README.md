# Alpha Barber

Projeto completo de barbearia com backend em Node.js + Express e frontend em HTML/CSS/JavaScript puro.

## Requisitos
- Node.js 18+
- npm 9+

## Instalacao
```bash
cd backend
npm install
```

## Executar
```bash
npm start
```
Ou para desenvolvimento:
```bash
npm run dev
```

## Acessar
- API: http://localhost:8080/api/health
- Frontend: abrir frontend/index.html com Live Server (VS Code), geralmente em http://127.0.0.1:5500

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
