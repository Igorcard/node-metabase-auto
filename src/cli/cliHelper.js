import prompts from 'prompts'
export function line(text){
  console.log('------------------------------------------')
  console.log(text)
  console.log('------------------------------------------')
}

export async function input(message) {
  const response = await prompts({ type: 'text', name: 'answer', message: message });
  return response.answer;
}

export async function backToMenu() {
  await prompts({
    type: 'text',
    name: 'continue',
    message: '\nPressione ENTER para voltar ao menu principal...',
    initial: ''
  })
}