import * as collectionRepository from '../../repositories/collections/collections-repository.js'
import * as cardRepository from '../../repositories/cards/cards-repository.js'
import * as dashboardRepository from '../../repositories/dashboards/dashboards-repository.js'
import fs from 'fs'
import path from 'path'

export async function buildDashboard(metabase, rl) {
  console.log('\n---------- CRIAR DASHBOARD ----------')
  rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (collectionName) => {
    try {
      const newCollection = await collectionRepository.createCollection(metabase, collectionName)
      const collectionId = newCollection.id

      console.log(`\nCOLLECTION CRIADA COM SUCESSO: ${collectionName} (ID: ${collectionId})`)
      rl.question('>> DIGITE O NOME DA TABELA PARA SUBSTITUIR: ', async (tableName) => {
        const cardsPath = path.join(__dirname, 'cards.json')
        let cards

        try {
          cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'))
        } catch (err) {
          console.log('Erro ao ler cards.json:', err.message)
          return
        }

        let createdCards = []

        for (const card of cards) {
          const sql = card.sql.replace(/:table/g, tableName)
          let templateTags = {}

          if (sql.includes('{{data}}')) {
            templateTags['data'] = {
              id: 'data',
              name: 'data',
              display_name: 'Data',
              type: 'date/relative',
              required: false,
              default: 'thismonth',
              field_id: 2637
            }
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
          }
          try {
            console.log('\n------------------------------------------')
            console.log(`CRIANDO CARD: ${card.name}`)

            const newCard = await cardRepository.createCard(metabase, cardData)

            createdCards.push({id: newCard.id})
            console.log('CARD CRIADO COM SUCESSO:')
            console.log(JSON.stringify(newCard, null, 2))
            console.log('------------------------------------------')
          } catch (err) {
            console.log('\n------------------------------------------')
            console.error(`ERRO AO CRIAR CARD ${card.name}:`, err.response ? err.response.data : err)
            console.log('------------------------------------------')
            return
          }
        }
        rl.question('>> DIGITE O ID DO DASHBOARD EXISTENTE PARA TROCAR OS CARDS: ', async (dashboardId) => {
          try {
            const dashboardRes = await dashboardRepository.getDashboard(metabase, dashboardId)
            const currentDashcards = dashboardRes.dashcards || []

            console.log(`Dashboard ${dashboardId} possui ${currentDashcards.length} dashcards.`)
            const newDashcards = currentDashcards.map((dashcard, i) => {
              const newDashcard = { ...dashcard }
              newDashcard.card_id = createdCards[i] ? createdCards[i].id : dashcard.card_id
              return newDashcard
            })

            await dashboardRepository.setDashboardCards(metabase, dashboardId, newDashcards)
            console.log('Todos os dashcards do dashboard foram atualizados para os novos cards!')
          } catch (err) {
            console.log('Erro ao atualizar cards do dashboard:', err.response ? err.response.data : err)
            return
          }
        })
      })
    } catch (err) {
      console.log('Erro ao criar collection:', err.response ? err.response.data : err)
    }
  })
}

export async function getDashboard(metabase, rl) {
  console.log('\n---------- VISUALIZAR DASHCARDS ----------')
  rl.question('>> DIGITE O ID DO DASHBOARD PARA VISUALIZAR OS DASHCARDS: ', async (dashboardId) => {
    try {
      const dashboardRes = await dashboardRepository.getDashboard(metabase, dashboardId)
      const dashcards = dashboardRes.dashcards || []

      console.log(`\nDashboard ${dashboardId} possui ${dashcards.length} dashcards.`)
      dashcards.forEach((dashcard, idx) => {
        console.log('------------------------------------------')
        console.log(`Dashcard #${idx + 1}`)
        console.log(`ID: ${dashcard.id}`)
        console.log(`Card ID: ${dashcard.card_id}`)
        console.log(`Nome do Card: ${dashcard.card && dashcard.card.name ? dashcard.card.name : 'N/A'}`)
        console.log(`Posição: col=${dashcard.col}, row=${dashcard.row}`)
        console.log(`Tamanho: size_x=${dashcard.size_x}, size_y=${dashcard.size_y}`)
      })
      console.log('------------------------------------------')
    } catch (err) {
      console.log('Erro ao buscar dashcards:', err.response ? err.response.data : err)
    }
  })
}

export async function cloneMainDashboard(metabase, rl) {
    console.log('\n---------- CLONAR DASHBOARD GERAL ----------')
    const dashboardIdModel = 292
    rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (newCollectionName) => {
      try {              
        const newCollection = await collectionRepository.createCollection(metabase, newCollectionName)
        const newCollectionId = newCollection.id

        const newDashboard = await dashboardRepository.cloneDashboard(metabase, dashboardIdModel)

        await dashboardRepository.updateDashboard(metabase, newDashboard.id, {
          collection_id: newCollectionId,
          name: newCollectionName + ' - Dashboard Geral'
        })

        const newDashboardRes = await dashboardRepository.getDashboard(metabase, newDashboard.id)
        const duplicatedDashcards = newDashboardRes.dashcards || []

        rl.question('>> DIGITE O NOME DA NOVA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ', async (newTable) => {
          for (const dashcard of duplicatedDashcards) {
            if (dashcard.card_id) {
              try {
                await cardRepository.updateCard(metabase, dashcard.card_id, {
                  collection_id: newCollectionId
                })

                const card = await cardRepository.getCard(metabase, dashcard.card_id)

                let sql = card.dataset_query && card.dataset_query.native && card.dataset_query.native.query ? card.dataset_query.native.query : null
                if (sql && sql.includes('SitesBerluc')) {
                  const newSql = sql.replace(/SitesBerluc/g, newTable)

                  await cardRepository.updateCard(metabase, dashcard.card_id, {
                    dataset_query: {
                      ...card.dataset_query,
                      native: {
                        ...card.dataset_query.native,
                        query: newSql
                      }
                    }
                  })
                }
              } catch (err) {
                console.log(`Erro ao atualizar card ${dashcard.card_id}:`, err.response ? err.response.data : err)
                return
              }
            }
        }

        try {
          const card = await cardRepository.getCard(metabase, 3022)
          let sql = card.dataset_query && card.dataset_query.native && card.dataset_query.native.query ? card.dataset_query.native.query : null
          let newSql = sql ? sql.replace(/SitesBerluc/g, newTable) : sql

          const newCard = {
            name: card.name+'-Duplicado',
            description: card.description,
            dataset_query: {
              ...card.dataset_query,
              native: {
                ...card.dataset_query.native,
                query: newSql
              }
            },
            display: card.display,
            visualization_settings: card.visualization_settings,
            collection_id: newCollectionId
          }
          const duplicatedCard = await cardRepository.createCard(metabase, newCard)
          console.log(`Card 3022 duplicado com sucesso! Novo ID: ${duplicatedCard.id}`)
        } catch (err) {
          console.log('Erro ao duplicar o card 3022:', err.response ? err.response.data : err)
          return
        }
        console.log(`Dashboard clonado com sucesso! Novo dashboard ID: ${newDashboard.id}`)
      })
    } catch (err) {
      console.log('Erro ao clonar dashboard:', err.response ? err.response.data : err)
    }
  })
}

export async function cloneManagerDashboard(metabase, rl, Model) {
    console.log('\n---------- CLONAR DASHBOARD PARA CONDOMÍNIO ----------')
    rl.question('>> DIGITE O NOME DA MAIN COLLECTION: ', async (mainCollectionName) => {
      let mainCollectionId
      const dashboardIdModel = Model
      await collectionRepository.getCollections(metabase).then(async (collections) => {
        collections.forEach(collection => {
          if (collection.name == mainCollectionName) mainCollectionId = collection.id
        })
      })

      if (!mainCollectionId) {
        console.log('NÃO FOI ENCONTRADA A MAIN COLLECTION:', mainCollectionName)
        return
      }

      rl.question('>> DIGITE O NOME DA NOVA COLLECTION: ', async (newCollectionName) => {
        try {              
          const newCollection = await collectionRepository.createCollection(metabase, {name : newCollectionName, parent_id: mainCollectionId})
          const newCollectionId = newCollection.id

          const newDashboard = await dashboardRepository.cloneDashboard(metabase, dashboardIdModel)

          await dashboardRepository.updateDashboard(metabase, newDashboard.id, {
            collection_id: newCollectionId,
            name: newCollectionName + ' - Dashboard Para Condomínio'
          })

          const newDashboardRes = await dashboardRepository.getDashboard(metabase, newDashboard.id)
          const duplicatedDashcards = newDashboardRes.dashcards || []

          rl.question('>> DIGITE O NOME DA NOVA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ', async (newTable) => {
            rl.question('>> DIGITE O ID DA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ', async (newTableId) => {
              for (const dashcard of duplicatedDashcards) {
                if (dashcard.card_id) {
                  try {
                    await cardRepository.updateCard(metabase, dashcard.card_id, {
                      collection_id: newCollectionId
                    })

                    const card = await cardRepository.getCard(metabase, dashcard.card_id)

                    let sql = card.dataset_query && card.dataset_query.native && card.dataset_query.native.query ? card.dataset_query.native.query : null
                    if (sql && sql.includes('SitesBerluc') && sql.includes('98')) {
                      sql = sql.replace(/SitesBerluc/g, newTable)
                      const newSql = sql.replace(/98/g, newTableId)

                      await cardRepository.updateCard(metabase, dashcard.card_id, {
                        dataset_query: {
                          ...card.dataset_query,
                          native: {
                            ...card.dataset_query.native,
                            query: newSql
                          }
                        }
                      })
                    }
                  } catch (err) {
                    console.log(`Erro ao atualizar card ${dashcard.card_id}:`, err.response ? err.response.data : err)
                    return
                  }
                }
              }
              console.log(`Dashboard clonado com sucesso! Novo dashboard ID: ${newDashboard.id}`)
            })
          })
      } catch (err) {
        console.log('Erro ao clonar dashboard:', err.response ? err.response.data : err)
      }
    })
  })
}