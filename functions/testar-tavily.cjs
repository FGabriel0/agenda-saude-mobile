'use strict';

async function main() {
  console.log('==================================');
  console.log('AGENDA SAÚDE - TESTE TAVILY');
  console.log('==================================');

  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    throw new Error('TAVILY_API_KEY não configurada.');
  }

  console.log('Pesquisando campanhas oficiais...\n');

  const resposta = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query: 'campanha de saúde vacinação doação de sangue Fortaleza Ceará novembro 2026',
      search_depth: 'basic',
      max_results: 5,
      include_domains: [
        'fortaleza.ce.gov.br',
        'saude.ce.gov.br',
        'hemoce.ce.gov.br',
      ],
    }),
  });

  const dados = await resposta.json();

  if (!resposta.ok) {
    throw new Error(
      `HTTP ${resposta.status}: ${JSON.stringify(dados)}`
    );
  }

  const resultados = dados.results || [];

  console.log(`Resultados encontrados: ${resultados.length}\n`);

  resultados.forEach((item, indice) => {
    console.log(`${indice + 1}. ${item.title}`);
    console.log(`URL: ${item.url}`);
    console.log(`Resumo: ${item.content}\n`);
  });

  console.log('Teste concluído com sucesso.');
  console.log('Nenhuma informação foi gravada no Firebase.');
}

main().catch(error => {
  console.error('Erro na pesquisa:', error.message);
  process.exitCode = 1;
});
