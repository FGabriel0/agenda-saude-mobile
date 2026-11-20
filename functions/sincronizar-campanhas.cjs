
const { createHash } = require("node:crypto");
const cheerio = require("cheerio");
const { initializeApp, cert } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

const FONTES = [
  {
    nome: "Prefeitura de Fortaleza",
    abrangencia: "municipal",
    cidade: "Fortaleza",
    urls: [
      "https://www.fortaleza.ce.gov.br/noticias/categoria/saude",
      "https://www.fortaleza.ce.gov.br/noticias/categoria/saude?start=10",
      "https://www.fortaleza.ce.gov.br/noticias/categoria/saude?start=20",
      "https://www.fortaleza.ce.gov.br/noticias/categoria/saude?start=30",
      "https://www.fortaleza.ce.gov.br/noticias/categoria/saude?start=40",
    ],
    dominio: "fortaleza.ce.gov.br",
  },
  {
    nome: "Secretaria da Saúde do Ceará",
    abrangencia: "estadual",
    cidade: null,
    urls: [
      "https://www.saude.ce.gov.br/",
      "https://www.saude.ce.gov.br/category/noticias/",
    ],
    dominio: "saude.ce.gov.br",
  },
];

const TERMOS_CAMPANHA = [
  "campanha de vacinacao",
  "campanha nacional",
  "campanha estadual",
  "campanha de saude",
  "campanha de prevencao",
  "campanha de multivacinacao",
  "campanha contra",
  "campanha do",
  "campanha da",
  "mutirao de saude",
  "mutirao de atendimento",
  "mutirao de exames",
  "mutirao de cirurgias",
  "dia d de vacinacao",
  "dia d da vacinacao",
  "novembro azul",
  "outubro rosa",
  "setembro amarelo",
  "setembro verde",
];

const TERMOS_EXCLUSAO = [
  "encerra",
  "encerrada",
  "balanco",
  "resultado",
  "prestacao de contas",
  "funcionamento dos servicos",
  "feriado",
  "inaugura",
  "entrega de",
  "licitacao",
  "concurso publico",
];

function normalizar(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function ehCandidata(titulo) {
  const texto = normalizar(titulo);

  if (texto.length < 20 || texto.length > 220) {
    return false;
  }

  if (TERMOS_EXCLUSAO.some((termo) => texto.includes(termo))) {
    return false;
  }

  return TERMOS_CAMPANHA.some((termo) =>
    texto.includes(termo)
  );
}

function gerarId(url) {
  return createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32);
}

function limparTitulo(titulo) {
  return titulo.replace(/\s+/g, " ").trim();
}

async function baixarPagina(url) {
  const resposta = await fetch(url, {
    headers: {
      "User-Agent": "AgendaSaude/1.0",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
  }

  return resposta.text();
}

function extrairLinks(html, fonte, pagina) {
  const $ = cheerio.load(html);
  const encontrados = new Map();

  // Seleciona títulos de notícias, evitando o texto
  // de menus, rodapés e blocos administrativos.
  $("h1 a, h2 a, h3 a, .item-title a, .entry-title a")
    .each((_, elemento) => {
      const titulo = limparTitulo($(elemento).text());
      const href = $(elemento).attr("href");

      if (!href || !ehCandidata(titulo)) {
        return;
      }

      let url;

      try {
        url = new URL(href, pagina);
      } catch {
        return;
      }

      const hostname = url.hostname.replace(/^www\./, "");

      if (hostname !== fonte.dominio) {
        return;
      }

      if (url.pathname === "/" || url.pathname.includes("/category/")) {
        return;
      }

      if (url.pathname.includes("/noticias/categoria/")) {
        return;
      }

      url.hash = "";
      url.search = "";

      encontrados.set(url.toString(), {
        titulo,
        url: url.toString(),
        fonte: fonte.nome,
        abrangencia: fonte.abrangencia,
        cidade: fonte.cidade,
        estado: "CE",
      });
    });

  return [...encontrados.values()];
}

async function buscarCampanhas() {
  const todas = new Map();

  for (const fonte of FONTES) {
    console.log(`\nConsultando: ${fonte.nome}`);

    for (const pagina of fonte.urls) {
      try {
        const html = await baixarPagina(pagina);
        const encontradas = extrairLinks(
          html,
          fonte,
          pagina
        );

        console.log(
          `Página consultada: ${encontradas.length} candidatas`
        );

        for (const campanha of encontradas) {
          todas.set(campanha.url, campanha);
        }
      } catch (erro) {
        console.warn(
          `Falha na consulta ${pagina}: ${erro.message}`
        );
      }
    }
  }

  return [...todas.values()];
}

async function executar() {
  console.log("Agenda Saúde — Sincronização CE/Fortaleza");

  const campanhas = await buscarCampanhas();

  console.log(
    `\nTotal de publicações candidatas: ${campanhas.length}`
  );

  for (const campanha of campanhas) {
    console.log(`\n[${campanha.abrangencia}] ${campanha.titulo}`);
    console.log(campanha.url);
  }

  // Prévia por padrão. A gravação exige autorização
  // explícita por variável de ambiente.
  const gravar = process.env.GRAVAR_FIRESTORE === "true";

  if (!gravar) {
    console.log(
      "\nMODO PRÉVIA: nenhuma gravação foi realizada."
    );
    return;
  }

  if (campanhas.length === 0) {
    throw new Error(
      "Nenhuma candidata encontrada. Gravação cancelada."
    );
  }

  const credenciais = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!credenciais) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT não configurado."
    );
  }

  const conta = JSON.parse(credenciais);

  if (conta.project_id !== "agenda-saude-4ea5b") {
    throw new Error("Projeto Firebase incorreto.");
  }

  initializeApp({
    credential: cert(conta),
  });

  const db = getFirestore();

  let adicionadas = 0;
  let existentes = 0;

  for (const campanha of campanhas) {
    const id = `ce_${gerarId(campanha.url)}`;
    const ref = db.collection("campaigns").doc(id);

    try {
      await ref.create({
        title: campanha.titulo,
        description:
          "Publicação identificada automaticamente. " +
          "Consulte a fonte oficial para verificar " +
          "datas, locais e disponibilidade.",

        source: campanha.fonte,
        sourceUrl: campanha.url,
        sourceType: "official_news",

        scope: campanha.abrangencia,
        city: campanha.cidade,
        state: campanha.estado,

        status: "pending_review",
        isPublished: false,
        isBookable: false,

        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      adicionadas++;
    } catch (erro) {
      if (erro.code === 6 || erro.code === "already-exists") {
        existentes++;
      } else {
        throw erro;
      }
    }
  }

  console.log("\nSincronização concluída:");
  console.log({
    encontradas: campanhas.length,
    adicionadas,
    existentes,
  });
}

executar().catch((erro) => {
  console.error("Erro:", erro.message);
  process.exitCode = 1;
});
