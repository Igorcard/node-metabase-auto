// Utilitário para manipulação de nomes de tabelas nas queries

module.exports = {
    replaceTableName(query, oldTable, newTable) {
        // Caso seja uma query SQL nativa do Metabase
        if (
            typeof query === 'object' &&
            query.type === 'native' &&
            query.native &&
            typeof query.native.query === 'string'
        ) {
            // Substitui todas as ocorrências do nome da tabela no SQL
            query.native.query = query.native.query.replace(new RegExp(oldTable, 'g'), newTable);
            return query;
        }

        // Se for uma query SQL (string) pura
        if (typeof query === 'string') {
            return query.replace(new RegExp(oldTable, 'g'), newTable);
        }

        // Se for um objeto dataset_query do query builder
        if (typeof query === 'object' && query.query) {
            if (query.query.source_table === oldTable) {
                query.query.source_table = newTable;
            }
        }
        return query;
    }
};
