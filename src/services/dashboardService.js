// Serviço para clonar dashboards e adicionar perguntas

module.exports = {
    async addDashcard(metabaseClient, dashboardId, dashcardPayload) {
        // Cria dashcard (adiciona card ao dashboard)
        const res = await metabaseClient.request('post', `/api/dashboard/${dashboardId}/cards`, dashcardPayload);
        return res.data;
    },
    async setDashboardCards(metabaseClient, dashboardId, cards) {
        // Atualiza os dashcards do dashboard
        const payload = { cards };
        const res = await metabaseClient.request('put', `/api/dashboard/${dashboardId}/cards`, payload);
        return res.data;
    },
    async createDashboard(metabaseClient, name) {
        // Cria um novo dashboard
        const res = await metabaseClient.request('post', '/api/dashboard', { name });
        return res.data;
    },
    async addCardToDashboard(metabaseClient, dashboardId, cardId, position = 0) {
        // Adiciona card ao dashboard usando o endpoint oficial
        const payload = {
            cardId,
            parameter_mappings: [],
            visualization_settings: {},
            col: position % 4, // distribui em colunas
            row: Math.floor(position / 4),
            sizeX: 4,
            sizeY: 4
        };
        const res = await metabaseClient.request('post', `/api/dashboard/${dashboardId}/cards`, payload);
        return res.data;
    }
};
