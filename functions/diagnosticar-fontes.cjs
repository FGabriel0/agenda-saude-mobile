const cheerio = require("cheerio");

async function testar(url) {
  console.log("\nTESTANDO:", url);

  try {
    const resposta = await fetch(url, {
      signal: AbortSignal.timeout(20000)
    });

    console.log("HTTP:", resposta.status);

    const html = await resposta.text();
    const $ = cheerio.load(html);

    console.log("Titulo:", $("title").text().trim());
    console.log("Links:", $("a").length);

    $("a").each((_, elemento) => {
      const titulo = $(elemento).text().trim();
      const href = $(elemento).attr("href");

      if (
        titulo.length > 20 &&
        /vacina|saúde|campanha|mutirão|prevenção/i.test(titulo)
      ) {
        console.log(titulo.slice(0, 130), href);
      }
    });

  } catch (erro) {
    console.log("ERRO:", erro.message);
    console.log("CAUSA:", erro.cause?.code);
  }
}

(async () => {
  await testar("https://www.fortaleza.ce.gov.br/noticias/categoria/saude");
  await testar("https://www.saude.ce.gov.br/");
})();
