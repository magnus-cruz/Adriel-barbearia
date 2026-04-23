# Alpha Barber - Backend Node.js

Backend em Node.js para substituir o backend Java Spring Boot, mantendo os mesmos endpoints, o mesmo token de autenticação e a persistência em arquivos JSON para compatibilidade total com o frontend atual.

## Instalação

```bash
cd barbearia-backend
npm install
```

## Executar

```bash
node server.js
# ou em desenvolvimento:
npm run dev
```

## Testar API

Abra no navegador:

```txt
http://localhost:8080/api/health
```

## Endpoints completos

| Método | Endpoint | Auth admin | Descrição |
| --- | --- | --- | --- |
| GET | /api/health | Não | Status da API |
| GET | /api/servicos | Não | Lista serviços |
| POST | /api/admin/servicos | Sim | Cadastra serviço |
| PUT | /api/admin/servicos/:id | Sim | Atualiza serviço |
| DELETE | /api/admin/servicos/:id | Sim | Exclui serviço |
| GET | /api/horarios | Não | Configuração de horários |
| POST | /api/admin/horarios | Sim | Salva configuração de horários |
| GET | /api/horarios/disponiveis | Não | Lista slots disponíveis |
| GET | /api/agendamentos | Não | Lista agendamentos |
| POST | /api/agendamentos | Não | Cria agendamento |
| PUT | /api/admin/agendamentos/:id/cancelar | Sim | Cancela agendamento |
| GET | /api/admin/imprevistos | Sim | Lista bloqueios/imprevistos |
| POST | /api/admin/imprevistos | Sim | Cria bloqueio |
| DELETE | /api/admin/imprevistos/:id | Sim | Remove bloqueio |
| GET | /api/cursos | Não | Lista cursos |
| POST | /api/admin/cursos | Sim | Cadastra curso |
| PUT | /api/admin/cursos/:id | Sim | Atualiza curso |
| DELETE | /api/admin/cursos/:id | Sim | Exclui curso |
| GET | /api/galeria | Não | Lista metadados da galeria |
| POST | /api/admin/upload | Sim | Upload de mídia (multipart/form-data) |
| GET | /api/uploads/:filename | Não | Retorna arquivo enviado |
| DELETE | /api/admin/galeria/:nomeArquivo | Sim | Remove mídia e metadado |

## Estrutura de arquivos JSON

Todos os arquivos ficam em `data/`.

### servicos.json

```json
[
  {
    "id": 1,
    "nome": "Corte",
    "preco": 45,
    "duracaoMinutos": 30,
    "ativo": true
  }
]
```

### horarios.json

```json
{
  "configuracao": {
    "intervaloPadrao": 30,
    "diasSemana": {
      "segunda": { "inicio": "09:00", "fim": "18:00", "ativo": true },
      "domingo": { "ativo": false }
    }
  }
}
```

### agendamentos.json

```json
[
  {
    "id": 1,
    "nome": "João",
    "telefone": "11999999999",
    "servico": "Corte",
    "data": "2026-04-23",
    "horario": "10:00",
    "status": "confirmado",
    "criadoEm": "2026-04-23T10:00:00.000Z"
  }
]
```

### imprevistos.json

```json
[
  {
    "id": 1,
    "data": "2026-04-24",
    "periodo": "manha",
    "motivo": "Evento externo"
  }
]
```

### cursos.json

```json
[
  {
    "id": 1,
    "titulo": "Curso de Fade",
    "preco": 197.9,
    "cargaHoraria": "8h",
    "descricao": "Curso completo",
    "imagemUrl": "https://...",
    "linkCompra": "https://..."
  }
]
```

### midia-metadata.json

```json
[
  {
    "id": "uuid",
    "nomeArquivo": "upload-uuid.jpg",
    "titulo": "Antes e depois",
    "categoria": "galeria",
    "url": "http://localhost:8080/api/uploads/upload-uuid.jpg",
    "tipo": "image/jpeg",
    "tamanhoKb": 240,
    "dataUpload": "2026-04-23"
  }
]
```

## Token de autenticação

Use exatamente este header nas rotas administrativas:

```txt
Authorization: Bearer barberco-admin-2026
```

## Migração do Java

1. Pare o backend Java (se estiver rodando na porta 8080).
2. Copie os dados existentes:

```bash
# dentro do projeto Java antigo
copy backend\data\*.json ..\barbearia-backend\data\
copy backend\uploads\* ..\barbearia-backend\uploads\
```

3. Instale as dependências do Node e rode o servidor:

```bash
cd barbearia-backend
npm install
node server.js
```

4. Valide no frontend (sem alterar nada):
   - Frontend segue chamando `http://localhost:8080`
   - Token admin permanece o mesmo
   - Endpoints e respostas permanecem compatíveis

## Observações de compatibilidade

- Porta fixa: `8080`.
- Persistência em arquivos JSON locais (sem banco).
- Uploads servidos em `/api/uploads`.
- CORS liberado para `localhost:5500`.
- Headers anti-cache aplicados em todas as rotas GET.
- Logs de debug no console para facilitar suporte.