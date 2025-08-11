
import dotenv from 'dotenv';
import readline from 'readline';
import MetabaseClient from './api/metabaseClient.js';
import * as cliOptions from './cliOptions.js';
import { clear } from './utils/cmdHelper.js';

dotenv.config();

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

export async function mainMenu() {
    showMenu();
    rl.question('>> DIGITE O NÚMERO DA OPERAÇÃO DESEJADA: ', async (opcao) => {
        const metabase = new MetabaseClient({
            baseUrl: process.env.METABASE_BASEURL,
            username: process.env.METABASE_EMAIL,
            password: process.env.METABASE_PASSWORD
        });

        switch (opcao) {
            case '1':
                await cliOptions.cloneCard(metabase, rl);
                break;
            case '2':
                await cliOptions.buildCard(metabase, rl);
                break;
            case '3':
                await cliOptions.buildDashboard(metabase, rl);
                break;
            case '4':
                await cliOptions.viewDashboard(metabase, rl);
                break;
            case '5':
                await cliOptions.viewCard(metabase, rl);
                break;
            case '6':
                await cliOptions.cloneDashboard(metabase, rl);
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
