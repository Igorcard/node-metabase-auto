// Ponto de entrada do app
require('dotenv').config();
const MetabaseClient = require('./api/metabaseClient');
const cliOptions = require('./cliOptions');
const readline = require('readline');
const { clear } = require('./utils/cmdHelper');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
});

function showMenu() {
    clear();
    console.log('------------------------------------------');
    console.log('        BEM-VINDO AO METABASE-API         ');
    console.log('------------------------------------------');
    console.log('ESCOLHA SUA OPÇÃO:');
    console.log('------------------------------------------');
    console.log('1 - CLONAR CARD');
    console.log('2 - CRIAR CARD');
    console.log('3 - CRIAR DASHBOARD (vários cards)');
    console.log('4 - VISUALIZAR DASHBOARD');
    console.log('5 - VISUALIZAR CARD');
    console.log('6 - CLONAR DASHBOARD');
    console.log('------------------------------------------');
}

async function mainMenu() {
    showMenu();
    rl.question('>> DIGITE O NÚMERO DA OPERAÇÃO DESEJADA: ', async (opcao) => {
        const metabase = new MetabaseClient({
            baseUrl: process.env.METABASE_BASEURL,
            username: process.env.METABASE_EMAIL,
            password: process.env.METABASE_PASSWORD
        });

        switch (opcao) {
            case '1':
                await cliOptions.clonarCard(metabase, rl, mainMenu, clear);
                break;
            case '2':
                await cliOptions.criarCard(metabase, rl, mainMenu, clear);
                break;
            case '3':
                await cliOptions.criarDashboard(metabase, rl, mainMenu, clear);
                break;
            case '4':
                await cliOptions.visualizarDashboard(metabase, rl, mainMenu, clear);
                break;
            case '5':
                await cliOptions.visualizarCard(metabase, rl, mainMenu, clear);
                break;
            case '6':
                await cliOptions.clonarDashboard(metabase, rl, mainMenu, clear);
                break;
            default:
                console.log('\n------------------------------------------');
                console.log('OPÇÃO INVÁLIDA. SAINDO...');
                console.log('------------------------------------------');
                rl.close();
        }
    });
}

mainMenu();
