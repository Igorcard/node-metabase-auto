import readline from 'readline'
import sleep from 'sleep-promise'
import * as cardService from '../services/cards/cards-service.js'
import * as dashboardService from '../services/dashboards/dashboards-service.js'
import * as databaseService from '../services/databases/databases-service.js'
import { config } from '../config/env.js'
import { mainMenu } from '../index.js'
import { MetabaseClient } from '../api/metabaseClient.js'
import { clear } from '../utils/cmdHelper.js'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: true
})

export function cliOptions() {  
  const metabase = new MetabaseClient(config)
  rl.question('>> DIGITE O NÚMERO DA OPERAÇÃO DESEJADA: ', async (opcao) => {
    switch (opcao) {
      case '1':
        await cardService.buildCard(metabase, rl)
        break
      case '2':
        await dashboardService.buildDashboard(metabase, rl)
        break
      case '3':
        await dashboardService.getDashboard(metabase, rl)
        break
      case '4':
        await cardService.getCard(metabase, rl)
        break
      case '5':
        await databaseService.getDatabases(metabase, rl)
        break
      case '6':
        await dashboardService.cloneMainDashboard(metabase, rl)
        break
      case '7':
        await dashboardService.cloneManagerDashboard(metabase, rl, 314)
        break
      case '8':
        await dashboardService.cloneManagerDashboard(metabase, rl, 318)
        break
      case '9':
        console.log('\n------------------------------------------')
        console.log('ENCERRANDO O PROGRAMA...')
        console.log('------------------------------------------')
        rl.close()
        break
      default:
        console.log('\n------------------------------------------')
        console.log('OPÇÃO INVÁLIDA.')
        console.log('------------------------------------------')
    }
    await sleep(1000)
    //clear()
    //mainMenu()
  })
}