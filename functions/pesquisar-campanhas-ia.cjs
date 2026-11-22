
const { GoogleGenAI } = require('@google/genai');

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('GEMINI_API_KEY não configurada.');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey,
});

async function pesquisarCampanhas() {
  console.log('==================================');
  console.log('AGENDA SAÚDE - PESQUISA INTELIGENTE');
  console.log('==================================');

  const hoje = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Fortaleza',
  }).format(new Date());

  console.log('Data da pesquisa:', hoje);
  console.log('Pesquisando campanhas na internet...\n');

  try {
    const resposta = await ai.models.generateContent({
      model: 'gemini-3.8-flash',

      config: {
        tools: [
          {
            googleSearch: {},
          },
        ],
      },

      contents: `
        Você é o agente de pesquisa do Agenda Saúde.

        Data atual: ${hoje}.

        Sua missão é pesquisar na internet campanhas
        reais de saúde pública em Fortaleza e nas
        demais cidades do Ceará.

        PESQUISE CAMPANHAS DE:

        - Vacinação;
        - Doação de sangue;
        - Prevenção de doenças;
        - Mutirões de saúde;
        - Exames gratuitos;
        - Saúde da mulher;
        - Saúde do homem;
        - Saúde infantil;
        - Atendimento odontológico;
        - Consultas gratuitas;
        - Ações comunitárias de saúde.

        FONTES PRIORITÁRIAS:

        - Prefeitura de Fortaleza;
        - Secretaria da Saúde do Ceará;
        - Hemoce;
        - Ministério da Saúde;
        - Prefeituras municipais do Ceará;
        - Hospitais públicos;
        - Universidades;
        - Unidades de saúde;
        - Instituições oficiais.

        REGRAS:

        1. Utilize a pesquisa real na internet.

        2. Encontre campanhas futuras ou que estejam
           acontecendo atualmente.

        3. Não apresente campanhas encerradas.

        4. Pesquise em diferentes fontes para
           complementar informações ausentes.

        5. Não invente informações.

        6. Não confunda a data de publicação da
           notícia com a data do evento.

        7. Identifique corretamente o início e
           o término de cada campanha.

        8. Não apresente campanhas duplicadas.

        9. Informe a URL das fontes utilizadas.

        10. Caso uma informação não seja encontrada,
            informe "Não identificado".

        11. Considere apenas ações que ocorram
            no estado do Ceará.

        12. Não considere informações permanentes
            sobre serviços como campanhas temporárias.

        PARA CADA CAMPANHA, INFORME:

        Título:
        Descrição resumida:
        Categoria:
        Data de início:
        Data de término:
        Horário inicial:
        Horário final:
        Município:
        Estado:
        Local:
        Endereço:
        Público-alvo:
        Requisitos de participação:
        Gratuito:
        Fonte oficial:
        URL principal:
        Fontes complementares:
        Informações pendentes:
        Evidências das datas:
        Evidências dos horários:

        Apresente até 15 campanhas relevantes,
        sem inventar resultados para atingir esse limite.

        Responda em português do Brasil.
      `,
    });

    console.log('RESULTADO DA PESQUISA:\n');
    console.log(
      resposta.text || 'Nenhum resultado retornado.'
    );

    const metadata =
      resposta.candidates?.[0]?.groundingMetadata;

    console.log('\n==================================');
    console.log('PESQUISAS REALIZADAS');
    console.log('==================================');

    const pesquisas =
      metadata?.webSearchQueries || [];

    if (pesquisas.length === 0) {
      console.log('Nenhuma consulta registrada.');
    }

    pesquisas.forEach((pesquisa, index) => {
      console.log(`${index + 1}. ${pesquisa}`);
    });

    console.log('\n==================================');
    console.log('FONTES ENCONTRADAS');
    console.log('==================================');

    const fontes =
      metadata?.groundingChunks || [];

    fontes.forEach((fonte, index) => {
      console.log(
        `${index + 1}. ${fonte.web?.title || 'Fonte'}`
      );

      console.log(
        fonte.web?.uri || 'URL não informada'
      );

      console.log('');
    });

    if (fontes.length === 0) {
      console.warn(
        'ATENÇÃO: nenhuma fonte de pesquisa registrada.'
      );

      console.warn(
        'Não considerar os resultados como verificados.'
      );
    }

    console.log('==================================');
    console.log('Pesquisa concluída.');
    console.log('Nenhuma gravação no Firebase.');
    console.log('==================================');

  } catch (error) {
    console.error('Erro durante a pesquisa:');
    console.error(error.message);
    process.exitCode = 1;
  }
}

pesquisarCampanhas();
