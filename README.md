# Metabase API Dashboards CLI

Este projeto é uma CLI Node.js para automatizar operações com a API do Metabase, facilitando a criação, clonagem e atualização de cards (perguntas) e dashboards.

## Funcionalidades
- **Clonar Card**: Duplica uma pergunta existente, trocando o nome da tabela.
- **Criar Card**: Cria uma nova pergunta informando nome, descrição, SQL, banco de dados e coleção.
- **Criar Dashboard (vários cards)**: Cria uma nova coleção, gera vários cards a partir de um arquivo JSON e atualiza os dashcards de um dashboard existente para apontar para os novos cards, mantendo o layout.
- **Visualizar Dashcards**: Exibe os dashcards de um dashboard existente.

## Como Utilizar
1. Instale as dependências:
   ```bash
   npm install
   ```
2. Configure o arquivo `.env` com as credenciais do Metabase:
   ```env
   METABASE_BASEURL=https://seu-metabase.com
   METABASE_EMAIL=seu-email@dominio.com
   METABASE_PASSWORD=sua-senha
   ```
3. Execute a CLI:
   ```bash
   node src/index.js
   ```
4. Siga o menu interativo para escolher a operação desejada:
   - 1: Clonar Card
   - 2: Criar Card
   - 3: Criar Dashboard (vários cards)
   - 4: Visualizar Dashcards

## cards.json
O arquivo `src/cards.json` deve conter um array de objetos com os campos:
```json
[
  {
    "name": "Nome do Card",
    "description": "Descrição",
    "sql": "SELECT * FROM :table"
  }
]
```

## Próximos Passos / Melhorias
- [ ] Adicionar autenticação via token
- [ ] Adicionar filtersets nos cards
- [ ] Implementar logs detalhados de erro
- [ ] Melhorar o design dos cards para o dashboard
- [ ] Adicionar abas no dashboard

---
Adicione aqui suas ideias e melhorias futuras!
