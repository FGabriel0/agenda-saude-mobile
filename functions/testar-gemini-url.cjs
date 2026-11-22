const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function main() {
  console.log('==================================');
  console.log('AGENDA SAUDE - TESTE URL CONTEXT');
  console.log('==================================');

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',

      contents: `
        Acesse a seguinte notícia oficial:

        https://www.hemoce.ce.gov.br/2026/11/18/hemoce-inicia-semana-do-doador-de-sangue-com-lancamento-de-nova-campanha-na-proxima-segunda-feira-23/

        Identifique as seguintes informações:

        - Título da campanha
        - Descrição resumida
        - Data de início
        - Data de término
        - Horário inicial
        - Horário final
        - Local
        - Endereço
        - Público-alvo
        - Categoria
        - Fonte oficial

        Não invente informações.
        Se alguma informação não estiver disponível,
        informe "Não identificado".

        Responda em português brasileiro.
      `,

      config: {
        tools: [
          {
            urlContext: {},
          },
        ],
      },
    });

    console.log('\nResposta do Gemini:\n');
    console.log(response.text);

    console.log('\nMetadados da consulta:');
    console.dir(
      response.candidates?.[0]?.urlContextMetadata,
      { depth: null }
    );

    console.log('\nTeste concluído com sucesso.');
  } catch (error) {
    console.error('\nErro durante a consulta:');
    console.error(error.message);
  }
}

main();