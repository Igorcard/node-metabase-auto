import * as cardRepository from '../../repositories/cards/cards-repository.js'

export async function buildCard(metabase, rl) {
	console.log('\n---------- CRIAR CARD ----------')
	await rl.question('>> NOME DO CARD: ', async (name) => {
		await rl.question('>> DESCRIÇÃO: ',  async (description) => {
			await rl.question('>> QUERY SQL: ', async (sql) => {
				console.log('\nESCOLHA O BANCO DE DADOS:')
				console.log(' (9)  Production - LojaExpress - Customer')
				console.log(' (10) Production - LojaExpress - Retailer')
				await rl.question('>> DIGITE O NÚMERO DO BANCO DE DADOS: ',  async (databaseId) => {
					await rl.question('>> DIGITE O ID DA COLLECTION: ', async (collectionId) => {
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
					})
				})
			})
		})
	})
}

export async function getCard(metabase, rl) {
	console.log('\n---------- VISUALIZAR CARD ----------')
	rl.question('>> DIGITE O ID DO CARD PARA VISUALIZAR: ', async (cardId) => {
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
	})
}