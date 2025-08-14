import * as databaseRepository from '../../repositories/databases/databases-repository.js'
import { line } from '../../cli/cliHelper.js'

export async function getDatabases(metabase) {
  line('LISTA DE BANCO DE DADOS')
  try {
    const databases = await databaseRepository.getDatabases(metabase)
    const databasesData = databases.data || []
    databasesData.forEach((database) => {
      line(`ID: ${database.id} - Nome: ${database.name} - Tipo: ${database.engine}`)
    })
  } catch (err) {
    line('Erro ao buscar dashcards:', err.response ? err.response.data : err)
  }
}