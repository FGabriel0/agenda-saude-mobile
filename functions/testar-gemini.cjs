
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY não configurada.');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
});

async function testarGemini() {
  console.log('==================================');
  console.log('AGENDA SAÚDE - INTELIGÊNCIA ARTIFICIAL');
  console.log('==================================');

  try {
    console.log('Modelo: Gemini 3.8 Flash');
    console.log('Conectando ao Google Gemini...\n');

    const resposta = await ai.models.generateContent({
      model: 'gemini-3.8-flash',

      contents: `
        Você é um assistente do aplicativo Agenda Saúde.

        O aplicativo tem como objetivo divulgar
        campanhas de saúde pública em Fortaleza
        e nas demais cidades do Ceará.

        Confirme que está funcionando e explique
        brevemente como poderia ajudar na coleta,
        análise e organização dessas campanhas.

        Responda em português do Brasil.
      `,
    });

    console.log('Resposta da inteligência artificial:\n');
    console.log(resposta.text);

    console.log('\n==================================');
    console.log('Teste concluído com sucesso.');
    console.log('==================================');

  } catch (error) {
    console.error('\nErro ao conectar ao Gemini:');
    console.error(error.message);
    process.exitCode = 1;
  }
}

testarGemini();
