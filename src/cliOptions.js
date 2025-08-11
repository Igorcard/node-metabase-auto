// Funções CLI separadas por opção
const cardService = require('./services/cards/cardService.js');
const collectionService = require('./services/collection/collectionService.js');
const { clear } = require('./utils/cmdHelper');
const { mainMenu } = require('./index.js');

module.exports = {
    async cloneCard(metabase, rl) {
        console.log('\n---------- CLONAR CARD ----------');
        rl.question('>> ID DO CARD ORIGINAL: ', (cardId) => {
            rl.question('>> NOME DA TABELA ANTIGA: ', (oldTableName) => {
                rl.question('>> NOME DA NOVA TABELA: ', async (newTableName) => {
                    try {
                        const newCard = await cardService.cloneCard(metabase, Number(cardId), oldTableName, newTableName);
                        console.log('\n------------------------------------------');
                        console.log('RESULTADO:');
                        console.log('------------------------------------------');
                        console.log('CARD CLONADO COM SUCESSO:');
                        console.log(JSON.stringify(newCard, null, 2));
                        console.log('------------------------------------------');
                    } catch (err) {
                        console.log('\n------------------------------------------');
                        console.error('ERRO AO CLONAR PERGUNTA:', err.response ? err.response.data : err);
                        console.log('------------------------------------------');
                    }
                    clear();
                    mainMenu();
                });
            });
        });
    },
    async buildCard(metabase, rl) {
        console.log('\n---------- CRIAR CARD ----------');
        rl.question('>> NOME DO CARD: ', (name) => {
            rl.question('>> DESCRIÇÃO: ', (description) => {
                rl.question('>> QUERY SQL: ', (sql) => {
                    console.log('\nESCOLHA O BANCO DE DADOS:');
                    console.log(' (9)  Production - LojaExpress - Customer');
                    console.log(' (10) Production - LojaExpress - Retailer');
                    rl.question('>> DIGITE O NÚMERO DO BANCO DE DADOS: ', (databaseId) => {
                        rl.question('>> DIGITE O ID DA COLLECTION: ', async (collectionId) => {
                            const cardData = {
                                name,
                                description,
                                dataset_query: {
                                    type: 'native',
                                    native: {
                                        query: sql,
                                        template_tags: {}
                                    },
                                    database: Number(databaseId)
                                },
                                display: 'table',
                                visualization_settings: {},
                                collection_id: Number(collectionId)
                            };
                            try {
                                console.log('\n------------------------------------------');
                                console.log('RESULTADO:');
                                console.log('------------------------------------------');
                                const newCard = await cardService.createCard(metabase, cardData);
                                console.log('CARD CRIADO COM SUCESSO:');
                                console.log(JSON.stringify(newCard, null, 2));
                                console.log('------------------------------------------');
                            } catch (err) {
                                console.log('\n------------------------------------------');
                                console.error('ERRO AO CRIAR CARD:', err.response ? err.response.data : err);
                                console.log('------------------------------------------');
                            }
                            clear();
                            mainMenu();
                        });
                    });
                });
            });
        });
    },
    async buildDashboard(metabase, rl) {
        console.log('\n---------- CRIAR DASHBOARD ----------');
        rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (collectionName) => {
            try {
                const collectionService = require('./services/collection/collectionService.js');
                const dashboardService = require('./services/dashboard/dashboardService.js');
                const fs = require('fs');
                const path = require('path');
                const newCollection = await collectionService.createCollection(metabase, collectionName);
                const collectionId = newCollection.id;
                console.log(`\nCOLLECTION CRIADA COM SUCESSO: ${collectionName} (ID: ${collectionId})`);
                rl.question('>> DIGITE O NOME DA TABELA PARA SUBSTITUIR: ', async (tableName) => {
                    const cardsPath = path.join(__dirname, 'cards.json');
                    let cards;
                    try {
                        cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
                    } catch (err) {
                        console.log('Erro ao ler cards.json:', err.message);
                        clear();
                        mainMenu();
                        return;
                    }
                    let createdCards = [];
                    for (const card of cards) {
                        // Substitui :table pelo nome informado
                        const sql = card.sql.replace(/:table/g, tableName);
                        // Adiciona parâmetro 'data' se necessário
                        let templateTags = {};
                        if (sql.includes('{{data}}')) {
                            templateTags['data'] = {
                                id: 'data',
                                name: 'data',
                                display_name: 'Data',
                                type: 'date/relative',
                                required: false,
                                default: 'thismonth',
                                field_id: 2637
                            };
                        }
                        const cardData = {
                            name: card.name,
                            description: card.description,
                            dataset_query: {
                                type: 'native',
                                native: {
                                    query: sql,
                                    template_tags: templateTags
                                },
                                database: 9
                            },
                            display: 'table',
                            visualization_settings: {},
                            collection_id: Number(collectionId)
                        };
                        try {
                            console.log('\n------------------------------------------');
                            console.log(`CRIANDO CARD: ${card.name}`);
                            const newCard = await cardService.createCard(metabase, cardData);
                            createdCards.push({id: newCard.id});
                            console.log('CARD CRIADO COM SUCESSO:');
                            console.log(JSON.stringify(newCard, null, 2));
                            console.log('------------------------------------------');
                        } catch (err) {
                            console.log('\n------------------------------------------');
                            console.error(`ERRO AO CRIAR CARD ${card.name}:`, err.response ? err.response.data : err);
                            console.log('------------------------------------------');
                        }
                    }
                    // Atualizar dashcards de um dashboard existente
                    rl.question('>> DIGITE O ID DO DASHBOARD EXISTENTE PARA TROCAR OS CARDS: ', async (dashboardId) => {
                        try {
                            // Buscar dashboard e dashcards atuais
                            const dashboardRes = await metabase.request('get', `/api/dashboard/${dashboardId}`);
                            const currentDashcards = dashboardRes.data.dashcards || [];
                            console.log(`Dashboard ${dashboardId} possui ${currentDashcards.length} dashcards.`);
                            // Monta os novos dashcards mantendo layout e propriedades
                            const newDashcards = currentDashcards.map((dashcard, i) => {
                                // Copia todas propriedades do dashcard original
                                const newDashcard = { ...dashcard };
                                // Troca apenas o card_id para o novo card criado
                                newDashcard.card_id = createdCards[i] ? createdCards[i].id : dashcard.card_id;
                                return newDashcard;
                            });
                            await dashboardService.setDashboardCards(metabase, dashboardId, newDashcards);
                            console.log('Todos os dashcards do dashboard foram atualizados para os novos cards!');
                        } catch (err) {
                            console.log('Erro ao atualizar cards do dashboard:', err.response ? err.response.data : err);
                        }
                        rl.close();
                    });
                });
            } catch (err) {
                console.log('Erro ao criar collection:', err.response ? err.response.data : err);
                rl.close();
            }
        });
    },
    async viewDashboard(metabase, rl) {
        console.log('\n---------- VISUALIZAR DASHCARDS ----------');
        rl.question('>> DIGITE O ID DO DASHBOARD PARA VISUALIZAR OS DASHCARDS: ', async (dashboardId) => {
            try {
                const dashboardRes = await metabase.request('get', `/api/dashboard/${dashboardId}`);
                const dashcards = dashboardRes.data.dashcards || [];
                console.log(`\nDashboard ${dashboardId} possui ${dashcards.length} dashcards.`);
                dashcards.forEach((dashcard, idx) => {
                    console.log('------------------------------------------');
                    console.log(`Dashcard #${idx + 1}`);
                    console.log(`ID: ${dashcard.id}`);
                    console.log(`Card ID: ${dashcard.card_id}`);
                    console.log(`Nome do Card: ${dashcard.card && dashcard.card.name ? dashcard.card.name : 'N/A'}`);
                    console.log(`Posição: col=${dashcard.col}, row=${dashcard.row}`);
                    console.log(`Tamanho: size_x=${dashcard.size_x}, size_y=${dashcard.size_y}`);
                });
                console.log('------------------------------------------');
            } catch (err) {
                console.log('Erro ao buscar dashcards:', err.response ? err.response.data : err);
            }
            clear();
            mainMenu();
        });
    },
    async viewCard(metabase, rl) {
        console.log('\n---------- VISUALIZAR CARD ----------');
        rl.question('>> DIGITE O ID DO CARD PARA VISUALIZAR: ', async (cardId) => {
            try {
                const cardRes = await metabase.request('get', `/api/card/${cardId}`);
                const card = cardRes.data;
                console.log('------------------------------------------');
                console.log(`ID: ${card.id}`);
                console.log(`Nome: ${card.name}`);
                console.log(`Descrição: ${card.description || 'N/A'}`);
                console.log(`Banco de Dados: ${card.database_id}`);
                console.log(`Tipo: ${card.query_type}`);
                console.log(`Display: ${card.display}`);
                console.log(`Coleção: ${card.collection_id}`);
                console.log(`Criado em: ${card.created_at}`);
                console.log(`Atualizado em: ${card.updated_at}`);
                console.log('SQL:');
                if (card.dataset_query && card.dataset_query.native && card.dataset_query.native.query) {
                    console.log(card.dataset_query.native.query);
                } else {
                    console.log('N/A');
                }
                // Exibir parâmetros do card
                console.log({card})
                if (Array.isArray(card.parameters) && card.parameters.length > 0) {
                    console.log('\nParâmetros:');
                    for (const param of card.parameters) {
                        let paramKey = param.id;
                        let fieldId = null;
                        // Detecta field_id para filtros de campo
                        if (param.target && param.target[0]) {
                            if (param.target[0].type === 'field') {
                                fieldId = param.target[0].value;
                            } else if (param.target[0].type === 'dimension' && Array.isArray(param.target[0].dimension)) {
                                fieldId = param.target[0].dimension[1];
                            }
                        }
                        console.log(`- Tipo: ${param.type}`);
                        if (fieldId) {
                            console.log(`  Campo configurado (field_id): ${fieldId}`);
                        }
                        if (paramKey) {
                            try {
                                const paramRes = await metabase.request('get', `/api/card/${cardId}/params/${paramKey}/values`);
                                console.log(`  Valores (${paramKey}):`, paramRes.data);
                            } catch (err) {
                                console.log(`  Valores (${paramKey}): Erro ao buscar valores (${err.response ? err.response.data : err})`);
                            }
                        } else {
                            console.log(`  Parâmetro sem chave identificável:`, param);
                        }
                    }
                } else {
                    console.log('Este card não possui parâmetros.');
                }
                console.log('------------------------------------------');
            } catch (err) {
                console.log('Erro ao buscar card:', err.response ? err.response.data : err);
            }
            clear();
            mainMenu();
        });
    },
    async cloneDashboard(metabase, rl) {
        // CLONAR DASHBOARD
        console.log('\n---------- CLONAR DASHBOARD ----------');
        const dashboardIdModel = 292;
        rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (newCollectionName) => {
            try {              
                // Cria nova collection
                const newCollection = await collectionService.createCollection(metabase, newCollectionName);
                const newCollectionId = newCollection.id;
                // Usa o endpoint de cópia do Metabase
                const copyRes = await metabase.request('post', `/api/dashboard/${dashboardIdModel}/copy`, {
                    is_deep_copy: true
                });
                const newDashboard = copyRes.data;
                // Atualiza a collection do novo dashboard
                await metabase.request('put', `/api/dashboard/${newDashboard.id}`, {
                    collection_id: newCollectionId,
                    name: newCollectionName + ' - Dashboard Geral'
                });
                // Busca os dashcards do novo dashboard para garantir que são os duplicados
                const newDashboardRes = await metabase.request('get', `/api/dashboard/${newDashboard.id}`);
                const duplicatedDashcards = newDashboardRes.data.dashcards || [];
                // Solicita o nome da nova tabela
                rl.question('>> DIGITE O NOME DA NOVA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ', async (newTable) => {
                    for (const dashcard of duplicatedDashcards) {
                        if (dashcard.card_id) {
                            try {
                                // Atualiza a collection do card
                                await metabase.request('put', `/api/card/${dashcard.card_id}`, {
                                    collection_id: newCollectionId
                                });
                                // Busca o card duplicado
                                const cardRes = await metabase.request('get', `/api/card/${dashcard.card_id}`);
                                const duplicatedCard = cardRes.data;
                                // Substitui tabelas pela nova tabela no SQL
                                let sql = duplicatedCard.dataset_query && duplicatedCard.dataset_query.native && duplicatedCard.dataset_query.native.query ? duplicatedCard.dataset_query.native.query : null;
                                if (sql && sql.includes('SitesBerluc')) {
                                    const newSql = sql.replace(/SitesBerluc/g, newTable);
                                    // Atualiza o SQL do card
                                    await metabase.request('put', `/api/card/${dashcard.card_id}`, {
                                        dataset_query: {
                                            ...duplicatedCard.dataset_query,
                                            native: {
                                                ...duplicatedCard.dataset_query.native,
                                                query: newSql
                                            }
                                        }
                                    });
                                }
                            } catch (err) {
                                console.log(`Erro ao atualizar card ${dashcard.card_id}:`, err.response ? err.response.data : err);
                            }
                        }
                    }
                    // Duplicar o card de ID 3022, trocar tabela e adicionar à nova collection
                    try {
                        const card3022Res = await metabase.request('get', '/api/card/3022');
                        const card3022 = card3022Res.data;
                        let sql3022 = card3022.dataset_query && card3022.dataset_query.native && card3022.dataset_query.native.query ? card3022.dataset_query.native.query : null;
                        let newSql3022 = sql3022 ? sql3022.replace(/SitesBerluc/g, novaTabela) : sql3022;
                        // Monta dados para criar novo card
                        const newCard3022 = {
                            name: card3022.name + ' (Cópia)',
                            description: card3022.description,
                            dataset_query: {
                                ...card3022.dataset_query,
                                native: {
                                    ...card3022.dataset_query.native,
                                    query: newSql3022
                                }
                            },
                            display: card3022.display,
                            visualization_settings: card3022.visualization_settings,
                            collection_id: newCollectionId
                        };
                        const duplicatedCard3022 = await metabase.request('post', '/api/card', newCard3022);
                        console.log(`Card 3022 duplicado com sucesso! Novo ID: ${duplicatedCard3022.data.id}`);
                    } catch (err) {
                        console.log('Erro ao duplicar o card 3022:', err.response ? err.response.data : err);
                    }
                    console.log(`Dashboard clonado com sucesso! Novo dashboard ID: ${newDashboard.id}`);
                    clear();
                    mainMenu();
                });
            } catch (err) {
                console.log('Erro ao clonar dashboard:', err.response ? err.response.data : err);
                clear();
                mainMenu();
            }
        });
    }
};
