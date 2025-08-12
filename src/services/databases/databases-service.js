import * as databaseRepository from '../../repositories/databases/databases-repository.js'

export async function getDatabases(metabase, rl) {
  console.log('\n---------- BANCOS DE DADOS ----------')
  try {
    const databases = await databaseRepository.getDatabases(metabase)
    const databasesData = databases.data || []
    console.log(`\nHá ${databasesData.length} bancos de dados.`)
    databasesData.forEach((database) => {
      console.log('------------------------------------------')
      console.log(`ID: ${database.id}`)
      console.log(`Nome: ${database.name}`)
      console.log(`Tipo: ${database.engine}`)
    })
    console.log('------------------------------------------')
  } catch (err) {
    console.log('Erro ao buscar dashcards:', err.response ? err.response.data : err)
  }
}