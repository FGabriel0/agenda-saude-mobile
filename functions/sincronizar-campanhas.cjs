
const { createHash } = require("node:crypto");
const cheerio = require("cheerio");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

const PROJETO = "agenda-saude-4ea5b";

const FONTES = [
  {
    nome: "Prefeitura de Fortaleza",
    url: "https://www.fortaleza.ce.gov.br/noticias/categoria/saude?format=feed&type=rss",
    tipo: "rss",
    dominio: "fortaleza.ce.gov.br",
    abrangencia: "municipal",
    cidade: "Fortaleza",
    estado: "CE"
  },
  {
    nome: "Secretaria da Saúde do Ceará",
    url: "https://www.saude.ce.gov.br/",
    tipo: "html",
    dominio: "saude.ce.gov.br",
    abrangencia: "estadual",
    cidade: null,
    estado: "CE"
  }
];

const TERMOS = [
  "campanha de vacinacao",
  "campanha de saude",
  "campanha de prevencao",
  "campanha nacional",
  "campanha estadual",
  "campanha contra",
  "campanha do",
  "campanha da",
  "multivacinacao",
  "mutirao de saude",
  "mutirao de atendimento",
  "mutirao de exames",
  "mutirao de cirurgias",
  "dia d de vacinacao",
  "dia d da vacinacao",
  "outubro rosa",
  "novembro azul",
  "setembro amarelo",
  "setembro verde"
];

const EXCLUSOES = [
  "encerra",
  "encerrada",
  "balanco",
  "resultado",
  "prestacao de contas",
  "feriado",
  "funcionamento dos servicos",
  "inaugura",
  "entrega de",
  "licitacao",
  "concurso publico"
];

function normalizar(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function limpar(valor) {
  return String(valor || "").replace(/\s+/g, " ").trim();
}

function ehCampanha(titulo) {
  const texto = normalizar(titulo);

  if (texto.length < 20 || texto.length > 220) return false;
  if (EXCLUSOES.some(t => texto.includes(t))) return false;

  return TERMOS.some(t => texto.includes(t));
}

function urlValida(href, base, dominio) {
  try {
    const url = new URL(href, base);

    if (url.protocol !== "https:") return null;
    if (url.hostname.replace(/^www\./, "") !== dominio) return null;

    url.hash = "";
    url.search = "";

    return url.toString();
  } catch {
    return null;
  }
}

function gerarId(url) {
  return createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32);
}

async function baixar(url) {
  const resposta = await fetch(url, {
    headers: {
      "User-Agent": "AgendaSaude/1.0",
      Accept: "application/rss+xml, application/xml, text/html"
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
  }

  return resposta.text();
}

function extrairRSS(xml, fonte) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const itens = $("channel > item");
  const campanhas = new Map();

  console.log(`Notícias disponíveis: ${itens.length}`);

  itens.each((_, elemento) => {
    const item = $(elemento);

    const titulo = limpar(item.find("title").first().text());
    const link = limpar(item.find("link").first().text());
    const dataTexto = limpar(item.find("pubDate").first().text());

    if (!ehCampanha(titulo)) return;

    const url = urlValida(link, fonte.url, fonte.dominio);
    if (!url) return;

    const data = dataTexto ? new Date(dataTexto) : null;

    campanhas.set(url, {
      titulo,
      url,
      fonte: fonte.nome,
      abrangencia: fonte.abrangencia,
      cidade: fonte.cidade,
      estado: fonte.estado,
      dataPublicacao:
        data && !Number.isNaN(data.getTime()) ? data : null
    });
  });

  return [...campanhas.values()];
}

function extrairHTML(html, fonte) {
  const $ = cheerio.load(html);
  const campanhas = new Map();

  $("h1 a, h2 a, h3 a, .entry-title a, .item-title a")
    .each((_, elemento) => {
      const titulo = limpar($(elemento).text());
      const href = $(elemento).attr("href");

      if (!href || !ehCampanha(titulo)) return;

      const url = urlValida(href, fonte.url, fonte.dominio);
      if (!url) return;

      const caminho = new URL(url).pathname;

      if (
        caminho === "/" ||
        caminho.includes("/category/") ||
        caminho.includes("/noticias/categoria/")
      ) {
        return;
      }

      campanhas.set(url, {
        titulo,
        url,
        fonte: fonte.nome,
        abrangencia: fonte.abrangencia,
        cidade: fonte.cidade,
        estado: fonte.estado,
        dataPublicacao: null
      });
    });

  return [...campanhas.values()];
}

async function buscarCampanhas() {
  const todas = new Map();

  for (const fonte of FONTES) {
    console.log(`\nConsultando: ${fonte.nome}`);

    try {
      const conteudo = await baixar(fonte.url);

      const campanhas =
        fonte.tipo === "rss"
          ? extrairRSS(conteudo, fonte)
          : extrairHTML(conteudo, fonte);

      console.log(`Candidatas encontradas: ${campanhas.length}`);

      for (const campanha of campanhas) {
        todas.set(campanha.url, campanha);
      }
    } catch (erro) {
      console.warn(`Falha na fonte ${fonte.nome}: ${erro.message}`);

      if (erro.cause?.code) {
        console.warn(`Causa: ${erro.cause.code}`);
      }
    }
  }

  return [...todas.values()];
}

function conectarFirebase() {
  const segredo = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!segredo) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT não configurado.");
  }

  let conta;

  try {
    conta = JSON.parse(segredo);
  } catch {
    throw new Error("Credenciais Firebase não contêm JSON válido.");
  }

  if (conta.project_id !== PROJETO) {
    throw new Error("Projeto Firebase incorreto.");
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(conta) });
  }

  return getFirestore();
}

async function gravarCampanhas(campanhas) {
  const db = conectarFirebase();

  let adicionadas = 0;
  let existentes = 0;
  let falhas = 0;

  for (const campanha of campanhas) {
    const id = `ce_${gerarId(campanha.url)}`;
    const referencia = db.collection("campaigns").doc(id);

    try {
      await referencia.create({
        title: campanha.titulo,
        description:
          "Publicação identificada automaticamente em fonte oficial. " +
          "Consulte a notícia original para verificar datas, " +
          "locais e disponibilidade.",

        source: campanha.fonte,
        sourceUrl: campanha.url,
        sourceType: "official_news",

        scope: campanha.abrangencia,
        city: campanha.cidade,
        state: campanha.estado,

        publishedAt: campanha.dataPublicacao,

        status: "pending_review",
        isPublished: false,
        isBookable: false,

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      adicionadas++;
      console.log(`Adicionada: ${campanha.titulo}`);
    } catch (erro) {
      if (
        erro.code === 6 ||
        erro.code === "already-exists"
      ) {
        existentes++;
      } else {
        falhas++;
        console.error(
          `Falha ao gravar "${campanha.titulo}": ${erro.message}`
        );
      }
    }
  }

  console.log("\nResultado:");
  console.log({
    encontradas: campanhas.length,
    adicionadas,
    existentes,
    falhas
  });

  if (falhas > 0) {
    throw new Error(`${falhas} registros falharam.`);
  }
}

async function executar() {
  console.log("====================================");
  console.log("AGENDA SAÚDE");
  console.log("Sincronização de campanhas CE/Fortaleza");
  console.log("====================================");

  const campanhas = await buscarCampanhas();

  console.log(`\nTotal de candidatas: ${campanhas.length}`);

  for (const campanha of campanhas) {
    console.log(`\n${campanha.titulo}`);
    console.log(campanha.url);
  }

  if (process.env.GRAVAR_FIRESTORE !== "true") {
    console.log("\nMODO PRÉVIA: nenhuma gravação realizada.");
    return;
  }

  if (campanhas.length === 0) {
    throw new Error(
      "Nenhuma campanha encontrada. Gravação cancelada."
    );
  }

  await gravarCampanhas(campanhas);

  console.log("\nSincronização concluída.");
}

executar().catch(erro => {
  console.error("Erro:", erro.message);
  process.exitCode = 1;
});
