// Ponto de entrada do app
require('dotenv').config();
const MetabaseClient = require('./api/metabaseClient');
const questionService = require('./services/questionService');
const dashboardService = require('./services/dashboardService');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});



function clear() {
    process.stdout.write(process.platform === 'win32' ? '\x1Bc' : '\x1B[2J\x1B[0f');
}

clear();
console.log('------------------------------------------');
console.log('        BEM-VINDO AO METABASE-API         ');
console.log('------------------------------------------');
console.log('ESCOLHA SUA OPÇÃO:');
console.log('------------------------------------------');
console.log('1 - CLONAR CARD');
console.log('2 - CRIAR CARD');
console.log('3 - CRIAR DASHBOARD (vários cards)');
console.log('4 - VISUALIZAR DASHBOARD');
console.log('5 - VISUALIZAR CARD');
console.log('6 - CLONAR DASHBOARD');
console.log('------------------------------------------');

rl.question('>> DIGITE O NÚMERO DA OPERAÇÃO DESEJADA: ', async (opcao) => {
    const metabase = new MetabaseClient({
        baseUrl: process.env.METABASE_BASEURL,
        username: process.env.METABASE_EMAIL,
        password: process.env.METABASE_PASSWORD
    });

    if (opcao === '6') {
        // CLONAR DASHBOARD
        console.log('\n---------- CLONAR DASHBOARD ----------');
        rl.question('>> DIGITE O ID DO DASHBOARD ORIGINAL: ', (dashboardIdOriginal) => {
            rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (novaCollectionName) => {
                try {
                    const collectionService = require('./services/collectionService');
                    // Cria nova collection
                    const novaCollection = await collectionService.createCollection(metabase, novaCollectionName);
                    const novaCollectionId = novaCollection.id;
                    // Usa o endpoint de cópia do Metabase
                    const copyRes = await metabase.request('post', `/api/dashboard/${dashboardIdOriginal}/copy`, {
                        is_deep_copy: true
                    });
                    const novoDashboard = copyRes.data;
                    // Atualiza a collection do novo dashboard
                    await metabase.request('put', `/api/dashboard/${novoDashboard.id}`, {
                        collection_id: novaCollectionId
                    });
                    // Busca os dashcards do novo dashboard para garantir que são os duplicados
                    const novoDashboardRes = await metabase.request('get', `/api/dashboard/${novoDashboard.id}`);
                    const dashcardsDuplicados = novoDashboardRes.data.dashcards || [];
                    // Solicita o nome da nova tabela
                    rl.question('>> DIGITE O NOME DA NOVA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ', async (novaTabela) => {
                        for (const dashcard of dashcardsDuplicados) {
                            if (dashcard.card_id) {
                                try {
                                    // Atualiza a collection do card
                                    await metabase.request('put', `/api/card/${dashcard.card_id}`, {
                                        collection_id: novaCollectionId
                                    });
                                    // Busca o card duplicado
                                    const cardRes = await metabase.request('get', `/api/card/${dashcard.card_id}`);
                                    const cardDuplicado = cardRes.data;
                                    // Substitui SitesBerluc pela nova tabela no SQL
                                    let sqlAtual = cardDuplicado.dataset_query && cardDuplicado.dataset_query.native && cardDuplicado.dataset_query.native.query ? cardDuplicado.dataset_query.native.query : null;
                                    if (sqlAtual && sqlAtual.includes('SitesBerluc')) {
                                        const novoSql = sqlAtual.replace(/SitesBerluc/g, novaTabela);
                                        // Atualiza o SQL do card
                                        await metabase.request('put', `/api/card/${dashcard.card_id}`, {
                                            dataset_query: {
                                                ...cardDuplicado.dataset_query,
                                                native: {
                                                    ...cardDuplicado.dataset_query.native,
                                                    query: novoSql
                                                }
                                            }
                                        });
                                    }
                                } catch (err) {
                                    console.log(`Erro ao atualizar card ${dashcard.card_id}:`, err.response ? err.response.data : err);
                                }
                            }
                        }
                        console.log(`Dashboard clonado com sucesso! Novo dashboard ID: ${novoDashboard.id}`);
                        rl.close();
                    });
                } catch (err) {
                    console.log('Erro ao clonar dashboard:', err.response ? err.response.data : err);
                    rl.close();
                }
            });
        });
    } else 
    if (opcao === '1') {
        // CLONAR CARD
        console.log('\n---------- CLONAR CARD ----------');
        rl.question('>> ID DA PERGUNTA ORIGINAL: ', (questionId) => {
            rl.question('>> NOME DA TABELA ANTIGA: ', (oldTableName) => {
                rl.question('>> NOME DA NOVA TABELA: ', async (newTableName) => {
                    try {
                        const novaPergunta = await questionService.cloneQuestion(metabase, Number(questionId), oldTableName, newTableName);
                        console.log('\n------------------------------------------');
                        console.log('RESULTADO:');
                        console.log('------------------------------------------');
                        console.log('PERGUNTA CLONADA COM SUCESSO:');
                        console.log(JSON.stringify(novaPergunta, null, 2));
                        console.log('------------------------------------------');
                    } catch (err) {
                        console.log('\n------------------------------------------');
                        console.error('ERRO AO CLONAR PERGUNTA:', err.response ? err.response.data : err);
                        console.log('------------------------------------------');
                    }
                    rl.close();
                });
            });
        });
    } else if (opcao === '2') {
        // CRIAR CARD
        console.log('\n---------- CRIAR CARD ----------');
        rl.question('>> NOME DA PERGUNTA: ', (name) => {
            rl.question('>> DESCRIÇÃO: ', (description) => {
                rl.question('>> QUERY SQL: ', (sql) => {
                    console.log('\nESCOLHA O BANCO DE DADOS:');
                    console.log(' (9)  Production - LojaExpress - Customer');
                    console.log(' (10) Production - LojaExpress - Retailer');
                    rl.question('>> DIGITE O NÚMERO DO BANCO DE DADOS: ', (databaseId) => {
                        rl.question('>> DIGITE O ID DA COLLECTION: ', async (collectionId) => {
                            const questionData = {
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
                                const novaPergunta = await questionService.createQuestion(metabase, questionData);
                                console.log('PERGUNTA CRIADA COM SUCESSO:');
                                console.log(JSON.stringify(novaPergunta, null, 2));
                                console.log('------------------------------------------');
                            } catch (err) {
                                console.log('\n------------------------------------------');
                                console.error('ERRO AO CRIAR PERGUNTA:', err.response ? err.response.data : err);
                                console.log('------------------------------------------');
                            }
                            rl.close();
                        });
                    });
                });
            });
        });
    } else if (opcao === '3') {
        // CRIAR DASHBOARD (vários cards)
        console.log('\n---------- CRIAR DASHBOARD ----------');
        rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (collectionName) => {
            try {
                const collectionService = require('./services/collectionService');
                const dashboardService = require('./services/dashboardService');
                const novaCollection = await collectionService.createCollection(metabase, collectionName);
                const collectionId = novaCollection.id;
                console.log(`\nCOLLECTION CRIADA COM SUCESSO: ${collectionName} (ID: ${collectionId})`);
                rl.question('>> DIGITE O NOME DA TABELA PARA SUBSTITUIR: ', async (tableName) => {
                        const fs = require('fs');
                        const path = require('path');
                        const cardsPath = path.join(__dirname, 'cards.json');
                        let cards;
                        try {
                            cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));
                        } catch (err) {
                            console.log('Erro ao ler cards.json:', err.message);
                            rl.close();
                            return;
                        }
                        let createdCards = [];
                        for (const card of cards) {
            // Substitui :table pelo nome informado
            const sqlFinal = card.sql.replace(/:table/g, tableName);
            // Adiciona parâmetro 'data' se necessário
            let templateTags = {};
            if (sqlFinal.includes('{{data}}')) {
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
            const questionData = {
                name: card.name,
                description: card.description,
                dataset_query: {
                    type: 'native',
                    native: {
                        query: sqlFinal,
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
                                const novaPergunta = await questionService.createQuestion(metabase, questionData);
                                createdCards.push({id: novaPergunta.id});
                                console.log('PERGUNTA CRIADA COM SUCESSO:');
                                console.log(JSON.stringify(novaPergunta, null, 2));
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
                                const dashcardsAtuais = dashboardRes.data.dashcards || [];
                                console.log(`Dashboard ${dashboardId} possui ${dashcardsAtuais.length} dashcards.`);
                                // Monta os novos dashcards mantendo layout e propriedades
                                const novosDashcards = dashcardsAtuais.map((dashcard, i) => {
                                    // Copia todas propriedades do dashcard original
                                    const novoDashcard = { ...dashcard };
                                    // Troca apenas o card_id para o novo card criado
                                    novoDashcard.card_id = createdCards[i] ? createdCards[i].id : dashcard.card_id;
                                    return novoDashcard;
                                });
                                await dashboardService.setDashboardCards(metabase, dashboardId, novosDashcards);
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
    } else if (opcao === '4') {
        // VISUALIZAR DASHCARDS
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
            rl.close();
        });
    } else if (opcao === '5') {
        // VISUALIZAR CARD
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
            rl.close();
        });
    } else {
        console.log('\n------------------------------------------');
        console.log('OPÇÃO INVÁLIDA. SAINDO...');
        console.log('------------------------------------------');
        rl.close();
    }
});
