import * as cardRepository from '../../repositories/cards/cards-repository.js'
import * as cliHelper from '../../cli/cliHelper.js'
import * as databaseService from '../databases/databases-service.js'

export async function buildCard(metabase) {
	console.clear()
	cliHelper.line('CRIAR CARD')
	const name = await cliHelper.input('>> NOME DO CARD: ')
	const description = await cliHelper.input('>> DESCRIÇÃO: ') 
	const sql = await cliHelper.input('>> QUERY SQL: ') 
	
	console.log('\nESCOLHA O BANCO DE DADOS:')
	await databaseService.getDatabases(metabase)
	
	const databaseId = await cliHelper.input('>> DIGITE O NÚMERO DO BANCO DE DADOS: ')
	const collectionId = await cliHelper.input('>> DIGITE O ID DA COLLECTION: ')
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
	}

	try {
		console.log('\n------------------------------------------')
		console.log('RESULTADO:')
		console.log('------------------------------------------')

		const newCard = await cardRepository.createCard(metabase, cardData)
		
		console.log('CARD CRIADO COM SUCESSO:')
		console.log(JSON.stringify(newCard, null, 2))
		console.log('------------------------------------------')
	} catch (err) {
		console.log('\n------------------------------------------')
		console.error('ERRO AO CRIAR CARD:', err.response ? err.response.data : err)
		console.log('------------------------------------------')
	}
}

export async function getCard(metabase) {
	console.log('\n---------- VISUALIZAR CARD ----------')
	const cardId = await cliHelper.input('>> DIGITE O ID DO CARD PARA VISUALIZAR: ')
	try {
		const card = await cardRepository.getCard(metabase, cardId)
		console.log('------------------------------------------')
		console.log(`ID: ${card.id}`)
		console.log(`Nome: ${card.name}`)
		console.log(`Descrição: ${card.description || 'N/A'}`)
		console.log(`Banco de Dados: ${card.database_id}`)
		console.log(`Tipo: ${card.query_type}`)
		console.log(`Display: ${card.display}`)
		console.log(`Coleção: ${card.collection_id}`)
		console.log(`Criado em: ${card.created_at}`)
		console.log(`Atualizado em: ${card.updated_at}`)
		console.log('SQL:')
		if (card.dataset_query && card.dataset_query.native && card.dataset_query.native.query) {
			console.log(card.dataset_query.native.query)
		} else {
			console.log('N/A')
		}

		console.log({card})
		if (Array.isArray(card.parameters) && card.parameters.length > 0) {
			console.log('\nParâmetros:')
			for (const param of card.parameters) {
				let paramKey = param.id
				let fieldId = null

				if (param.target && param.target[0]) {
					if (param.target[0].type === 'field') {
						fieldId = param.target[0].value
					} else if (param.target[0].type === 'dimension' && Array.isArray(param.target[0].dimension)) {
						fieldId = param.target[0].dimension[1]
					}
				}
				console.log(`- Tipo: ${param.type}`)

				if (fieldId) {
					console.log(`  Campo configurado (field_id): ${fieldId}`)
				}
				if (paramKey) {
					try {
						const paramRes = cardRepository.getCardParams(metabase, cardId, paramKey)
						console.log(`  Valores (${paramKey}):`, paramRes.data)
					} catch (err) {
						console.log(`  Valores (${paramKey}): Erro ao buscar valores (${err.response ? err.response.data : err})`)
					}
				} else {
					console.log(`  Parâmetro sem chave identificável:`, param)
				}
			}
		} else {
			console.log('Este card não possui parâmetros.')
		}
		console.log('------------------------------------------')
	} catch (err) {
		console.log('Erro ao buscar card:', err.response ? err.response.data : err)
	}
}