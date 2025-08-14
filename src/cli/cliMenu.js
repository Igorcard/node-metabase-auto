import prompts from 'prompts'
import * as cardService from '../services/cards/cards-service.js'
import * as dashboardService from '../services/dashboards/dashboards-service.js'
import * as databaseService from '../services/databases/databases-service.js'
import { line, backToMenu }from './cliHelper.js'
import { config } from '../config/env.js'
import { metabaseClient } from '../api/metabaseClient.js'

export async function showMenu() {
  let option = { choice: 0 };
  
  while (option.choice !== 9) {
    console.clear()
    line('BEM-VINDO AO METABASE-API')

    option = await prompts({
      type: 'select',
      name: 'choice',
      message: 'Escolha uma opção:',
      choices: getMenuOptions()
    })
    
    if (option.choice) {
      await handleOptions(option.choice)
    }
  }
}

export async function handleOptions(option) { 
  const metabase = new metabaseClient(config)
  const actions = getMenuActions(metabase)

  if (actions[option]) {
    await actions[option]()
    if (option !== 9) {
      await backToMenu()
    }
  } else if (option !== 9) {
    line('OPÇÃO INVÁLIDA.')
    await backToMenu()
  }
}

function getMenuOptions() {
  return [
    { title: '1 - CRIAR CARD', value: 1 },
    { title: '2 - CRIAR DASHBOARD (vários cards)', value: 2 },
    { title: '3 - VISUALIZAR DASHBOARD', value: 3 },
    { title: '4 - VISUALIZAR CARD', value: 4 },
    { title: '5 - VISUALIZAR BANCOS DE DADOS', value: 5 },
    { title: '6 - CLONAR DASHBOARD GERAL', value: 6 },
    { title: '7 - CLONAR DASHBOARD CONDOMÍNIO', value: 7 },
    { title: '8 - CLONAR DASHBOARD CONDOMÍNIO COM CASHBACK', value: 8 },
    { title: '9 - SAIR', value: 9 }
  ]
}

function getMenuActions(metabase) {
  return {
    1: async () => await cardService.buildCard(metabase),
    2: async () => await dashboardService.buildDashboard(metabase),
    3: async () => await dashboardService.getDashboard(metabase),
    4: async () => await cardService.getCard(metabase),
    5: async () => await databaseService.getDatabases(metabase),
    6: async () => await dashboardService.cloneMainDashboard(metabase),
    7: async () => await dashboardService.cloneManagerDashboard(metabase, 314),
    8: async () => await dashboardService.cloneManagerDashboard(metabase, 318),
    9: () => {
      console.clear()
      line('PROGRAMA ENCERRADO.');
      process.exit(0)
    }
  }
}