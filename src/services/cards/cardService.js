// Serviço para clonar perguntas e alterar nomes de tabelas
const tableNameUtils = require('../../utils/tableNameUtils');

module.exports = {
    async cloneCard(metabaseClient, cardId, oldTableName, newTableName) {
        // 1. Buscar a pergunta original
        const res = await metabaseClient.request('get', `/api/card/${cardId}`);
        const originalCard = res.data;

        // 2. Alterar o nome da tabela na query
        let newQuery = originalCard.dataset_query;
        if (oldTableName && newTableName) {
            newQuery = tableNameUtils.replaceTableName(newQuery, oldTableName, newTableName);
        }

        // 3. Montar o payload para a nova pergunta
        const newCardPayload = {
            ...originalCard,
            name: `${originalCard.name} (Clone)`,
            dataset_query: newQuery,
            id: undefined, // Remover id
            creator_id: undefined, // Remover creator_id
            made_public_by_id: undefined, // Remover made_public_by_id
            public_uuid: undefined, // Remover public_uuid
        };

        // 4. Criar a nova pergunta
        const createRes = await metabaseClient.request('post', '/api/card', newCardPayload);
        return createRes.data;
    },
    async updateTableNameInQuery(query, oldTable, newTable) {
        // TODO: Implementar lógica para substituir nome da tabela na query
    },
    /**
     * Cria uma nova pergunta (card) no Metabase
     * @param {MetabaseClient} metabaseClient - Cliente autenticado
     * @param {Object} cardData - Dados da pergunta (name, description, dataset_query, etc)
     * @returns {Promise<Object>} - Pergunta criada
     */
    async createQuestion(metabaseClient, cardData) {
        // Exemplo de questionData:
        // {
        //   name: 'Nome da Pergunta',
        //   description: 'Descrição',
        //   dataset_query: { ... }, // ou SQL nativo
        //   display: 'table',
        //   visualization_settings: {},
        //   collection_id: 1
        // }
        const res = await metabaseClient.request('post', '/api/card', cardData);
        return res.data;
    }
};
