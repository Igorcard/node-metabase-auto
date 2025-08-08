// Serviço para criar collection no Metabase

module.exports = {
    async createCollection(metabaseClient, name) {
        const res = await metabaseClient.request('post', '/api/collection', { name });
        return res.data;
    }
};
