# Sistema Web - Barbearia

Projeto full-stack com backend em Spring Boot e frontend em HTML5, CSS3 e JavaScript Vanilla.

## Estrutura

- backend: API REST, autenticacao admin e persistencia em arquivos JSON
- frontend: paginas publicas, agendamento, galeria, cursos, localizacao e painel admin

## Requisitos

- Java 17+
- Maven 3.9+
- VS Code Live Server (ou qualquer servidor estatico para frontend)

## Windows: se `mvn` nao for reconhecido

Se aparecer o erro "mvn nao e reconhecido", execute no PowerShell:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
mvn -v
```

Se ainda assim nao funcionar, rode usando caminho absoluto do Maven instalado neste projeto de usuario:

```powershell
& "$env:USERPROFILE\tools\apache-maven-3.9.9\bin\mvn.cmd" -v
& "$env:USERPROFILE\tools\apache-maven-3.9.9\bin\mvn.cmd" spring-boot:run
```

## Como executar o backend

1. Entre na pasta do backend:

```bash
cd barbearia-site/backend
```

2. Rode o projeto:

```bash
mvn spring-boot:run
```

Alternativa recomendada no Windows (mais estavel neste workspace):

```bash
mvn -DskipTests package
java -jar target/backend-1.0.0.jar
```

3. API disponivel em:

- http://localhost:8080/api

## Como executar o frontend

1. Abra a pasta `barbearia-site/frontend` com Live Server ou outro servidor estatico.
2. Acesse `index.html`.

## Inicializacao automatica no VS Code (API + Frontend)

Para subir tudo de uma vez no VS Code:

1. Abra `Terminal > Run Task...`
2. Execute a task `Barbearia: Tudo (API + Frontend)`
3. Abra `http://localhost:5500/index.html`

Tasks disponiveis:

- `Barbearia: Backend API` (sobe API Java)
- `Barbearia: Frontend estatico` (sobe servidor estatico)
- `Barbearia: Tudo (API + Frontend)` (sobe ambos)
- `Barbearia: Abrir frontend` (abre o navegador em localhost:5500)

Observacao: o clique direto no botao "Go Live" do Live Server nao dispara o backend Java automaticamente. Para comportamento de "um clique", use a task `Barbearia: Tudo (API + Frontend)`.

## Credenciais do admin

- Usuario: `admin`
- Senha: `123456`

## Fluxo principal

- Site publico consome:
  - `GET /api/servicos`
  - `GET /api/agendamentos/disponibilidade?data=YYYY-MM-DD`
  - `POST /api/agendamentos`
  - `GET /api/midias`
  - `GET /api/cursos`

- Painel admin usa token via `localStorage`:
  - `POST /api/admin/login`
  - CRUD de servicos, horarios, imprevistos, cursos e agendamentos
  - upload de imagem em `POST /api/midias/upload`

## Persistencia JSON

Arquivos em `backend/src/main/resources/data`:

- `servicos.json`
- `horarios.json`
- `agendamentos.json`
- `imprevistos.json`
- `cursos.json`
- `midias.json`

## Observacoes

- O backend esta configurado com CORS para frontend local.
- Alteracoes no painel sao refletidas imediatamente nas paginas publicas.
- Em producao, troque credenciais admin no `application.properties`.
