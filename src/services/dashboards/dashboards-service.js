import * as collectionRepository from '../../repositories/collections/collections-repository.js'
import * as cardRepository from '../../repositories/cards/cards-repository.js'
import * as dashboardRepository from '../../repositories/dashboards/dashboards-repository.js'
import * as cliHelper from '../../cli/cliHelper.js'
import fs from 'fs'
import path from 'path'

export async function buildDashboard(metabase) {
  console.log('\n---------- CRIAR DASHBOARD ----------')
  const collectionName = await cliHelper.input('>> DIGITE O NOME DA NOVA COLLECTION: ')
  try {
    const newCollection = await collectionRepository.createCollection(metabase, collectionName)
    const collectionId = newCollection.id

    console.log(`\nCOLLECTION CRIADA COM SUCESSO: ${collectionName} (ID: ${collectionId})`)
    const tableName = await cliHelper.input('>> DIGITE O NOME DA TABELA PARA SUBSTITUIR: ')
    const cardsPath = path.join(__dirname, 'repositores\cards\json\cards.json')
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

    const dashboardId = await cliHelper.input('>> DIGITE O ID DO DASHBOARD EXISTENTE PARA TROCAR OS CARDS: ')
    
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
  } catch (err) {
    console.log('Erro ao criar collection:', err.response ? err.response.data : err)
  }
}

export async function getDashboard(metabase) {
  console.log('\n---------- VISUALIZAR DASHCARDS ----------')
  const dashboardId = await cliHelper.input('>> DIGITE O ID DO DASHBOARD PARA VISUALIZAR OS DASHCARDS: ')
  try {
    const dashboardRes = await dashboardRepository.getDashboard(metabase, dashboardId)
    const dashcards = dashboardRes.dashcards || []

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
}

export async function cloneMainDashboard(metabase) {
  console.log('\n---------- CLONAR DASHBOARD GERAL ----------')
  const dashboardIdModel = 292
  const newCollectionName = await await cliHelper.input('>> DIGITE O NOME DA NOVA COLLECTION: ')
  try {              
    const newCollection = await collectionRepository.createCollection(metabase, {name : newCollectionName})
    const newCollectionId = newCollection.id

    const newDashboard = await dashboardRepository.cloneDashboard(metabase, dashboardIdModel)

    await dashboardRepository.updateDashboard(metabase, newDashboard.id, {
      collection_id: newCollectionId,
      name: newCollectionName + ' - Dashboard Geral'
    })

    const newDashboardRes = await dashboardRepository.getDashboard(metabase, newDashboard.id)
    const duplicatedDashcards = newDashboardRes.dashcards || []

    const newId = await await cliHelper.input('>> DIGITE O ID DA NOVA ORGANIZATION PARA SUBSTITUIR NO SQL DOS CARDS: ')
    for (const dashcard of duplicatedDashcards) {
      if (dashcard.card_id) {
        try {
          await cardRepository.updateCard(metabase, dashcard.card_id, {
            collection_id: newCollectionId
          })

          const card = await cardRepository.getCard(metabase, dashcard.card_id)

          let sql = card.dataset_query && card.dataset_query.native && card.dataset_query.native.query ? card.dataset_query.native.query : null
          if (sql && sql.includes('7')) {
            const newSql = sql.replace(/7/g, newId)

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
      let newSql = sql ? sql.replace(/7/g, newId) : sql

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
  } catch (err) {
    console.log('Erro ao clonar dashboard:', err.response ? err.response.data : err)
  }
}

export async function cloneManagerDashboard(metabase, model){
  console.log('\n---------- CLONAR DASHBOARD PARA CONDOMÍNIO ----------')
  
  const mainCollectionName = await await cliHelper.input('>> DIGITE O NOME DA MAIN COLLECTION: ')

  let mainCollectionId
  const dashboardIdModel = model

  await collectionRepository.getCollections(metabase).then(async (collections) => {
    collections.forEach(collection => {
      if (collection.name == mainCollectionName) mainCollectionId = collection.id
    })
  })

  if (!mainCollectionId) {
    console.log('NÃO FOI ENCONTRADA A MAIN COLLECTION:', mainCollectionName)
    return
  }

  const newCollectionName = await cliHelper.input('>> DIGITE O NOME DA NOVA COLLECTION: ')
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
    
    if (model === 314) await managerDashboard(metabase, duplicatedDashcards, newCollectionId)

    if (model === 318) await cashbackDashboard(metabase, duplicatedDashcards, newCollectionId)

    console.log(`Dashboard clonado com sucesso! Novo dashboard ID: ${newDashboard.id}`)
  } catch (err) {
    console.log('Erro ao clonar dashboard:', err.response ? err.response.data : err)
  }
}

export async function managerDashboard(metabase, duplicatedDashcards, newCollectionId) {
  const newOrganization = await cliHelper.input('>> DIGITE O ID DA NOVA ORGANIZATION PARA SUBSTITUIR NO SQL DOS CARDS: ')
  const newTableId = await cliHelper.input('>> DIGITE O ID DA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ')
  for (const dashcard of duplicatedDashcards) {
    if (dashcard.card_id) {
      try {
        await cardRepository.updateCard(metabase, dashcard.card_id, {
          collection_id: newCollectionId
        })

        const card = await cardRepository.getCard(metabase, dashcard.card_id)

        let sql = card.dataset_query && card.dataset_query.native && card.dataset_query.native.query ? card.dataset_query.native.query : null
        if (sql && sql.includes('7') && sql.includes('46')) {
          sql = sql.replace(/7/g, newOrganization)
          const newSql = sql.replace(/46/g, newTableId)

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
}

export async function cashbackDashboard(metabase, duplicatedDashcards, newCollectionId) {        
  const newTable = await cliHelper.input('>> DIGITE O NOME DA NOVA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ')
  const newTableId = await cliHelper.input('>> DIGITE O ID DA TABELA PARA SUBSTITUIR NO SQL DOS CARDS: ')
  
  for (const dashcard of duplicatedDashcards) {
    if (dashcard.card_id) {
      try {
        await cardRepository.updateCard(metabase, dashcard.card_id, {
          collection_id: newCollectionId
        })

        const card = await cardRepository.getCard(metabase, dashcard.card_id)

        let sql = card.dataset_query && card.dataset_query.native && card.dataset_query.native.query ? card.dataset_query.native.query : null
        if (sql && sql.includes('sitesMicroMarket') && sql.includes('46')) {
          sql = sql.replace(/sitesMicroMarket/g, newTable)
          const newSql = sql.replace(/46/g, newTableId)

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
}