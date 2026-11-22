'use strict';

const Groq = require('groq-sdk');

async function main() {
  console.log('==================================');
  console.log('AGENDA SAÚDE - TESTE GROQ');
  console.log('==================================');

  if (!process.env.GROQ_API_KEY) {
    console.log('ERRO: GROQ_API_KEY não configurada.');
    process.exitCode = 1;
    return;
  }

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    maxRetries: 0,
    timeout: 30000,
  });

  console.log('Consultando Groq...\n');

  const resposta = await groq.chat.completions.create({
    model: 'openai/gpt-oss-120b',
    messages: [
      {
        role: 'system',
        content:
          'Você é um assistente especializado em campanhas de saúde pública no Ceará.',
      },
      {
        role: 'user',
        content:
          'Explique em duas frases como você pode ajudar o aplicativo Agenda Saúde a organizar campanhas de saúde.',
      },
    ],
    temperature: 0.1,
  });

  console.log('Resposta da IA:\n');
  console.log(resposta.choices[0]?.message?.content);

  console.log('\nTeste concluído com sucesso.');
}

main().catch(error => {
  if (error.status === 429) {
    console.log('Limite gratuito atingido. Teste interrompido.');
  } else {
    console.log('Erro:', error.message);
  }

  process.exitCode = 1;
});
