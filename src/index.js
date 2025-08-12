import { showMenu } from './cli/cliMenu.js'
import { cliOptions } from './cli/cliOptions.js'  

export async function mainMenu() {
  showMenu()
  cliOptions()
}

mainMenu()
