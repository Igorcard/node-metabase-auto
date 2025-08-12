import { clear } from '../utils/cmdHelper.js'

export function showMenu() {
  clear()
  console.log('------------------------------------------')
  console.log('        BEM-VINDO AO METABASE-API         ')
  console.log('------------------------------------------')
  console.log('ESCOLHA SUA OPÇÃO:')
  console.log('------------------------------------------')
  console.log('1 - CRIAR CARD')
  console.log('2 - CRIAR DASHBOARD (vários cards)')
  console.log('3 - VISUALIZAR DASHBOARD')
  console.log('4 - VISUALIZAR CARD')
  console.log('5 - VISUALIZAR BANCOS DE DADOS')
  console.log('6 - CLONAR DASHBOARD GERAL')
  console.log('7 - CLONAR DASHBOARD CONDOMÍNIO')
  console.log('8 - CLONAR DASHBOARD CONDOMÍNIO COM CASHBACK')
  console.log('9 - SAIR')
  console.log('------------------------------------------')
}