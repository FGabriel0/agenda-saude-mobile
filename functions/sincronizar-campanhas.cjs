
const { createHash } = require("node:crypto");
const cheerio = require("cheerio");
const {
  initializeApp,
  cert,
  getApps
} = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

const PROJETO = "agenda-saude-4ea5b";
const FUSO = "-03:00";

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

const MESES = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12
};

function limpar(valor) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizar(valor) {
  return limpar(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function ehCampanha(titulo) {
  const texto = normalizar(titulo);

  if (texto.length < 20 || texto.length > 220) {
    return false;
  }

  if (EXCLUSOES.some(termo => texto.includes(termo))) {
    return false;
  }

  return TERMOS.some(termo => texto.includes(termo));
}

function urlValida(href, base, dominio) {
  try {
    const url = new URL(href, base);

    if (url.protocol !== "https:") return null;

    if (
      url.hostname.replace(/^www\./, "") !== dominio
    ) {
      return null;
    }

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
      Accept:
        "application/rss+xml, application/xml, text/html"
    },
    signal: AbortSignal.timeout(20000)
  });

  if (!resposta.ok) {
    throw new Error(`HTTP ${resposta.status}`);
  }

  return resposta.text();
}

// ==========================================
// LOCALIZAR NOTÍCIAS
// ==========================================

function extrairRSS(xml, fonte) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const itens = $("channel > item");
  const campanhas = new Map();

  console.log(`Notícias disponíveis: ${itens.length}`);

  itens.each((_, elemento) => {
    const item = $(elemento);

    const titulo = limpar(
      item.find("title").first().text()
    );

    const link = limpar(
      item.find("link").first().text()
    );

    const dataTexto = limpar(
      item.find("pubDate").first().text()
    );

    if (!ehCampanha(titulo)) return;

    const url = urlValida(
      link,
      fonte.url,
      fonte.dominio
    );

    if (!url) return;

    const data = dataTexto
      ? new Date(dataTexto)
      : null;

    campanhas.set(url, {
      titulo,
      url,
      fonte: fonte.nome,
      abrangencia: fonte.abrangencia,
      cidade: fonte.cidade,
      estado: fonte.estado,
      dataPublicacao:
        data && !Number.isNaN(data.getTime())
          ? data
          : null
    });
  });

  return [...campanhas.values()];
}

function extrairHTML(html, fonte) {
  const $ = cheerio.load(html);
  const campanhas = new Map();

  $(
    "h1 a, h2 a, h3 a, .entry-title a, .item-title a"
  ).each((_, elemento) => {
    const titulo = limpar($(elemento).text());
    const href = $(elemento).attr("href");

    if (!href || !ehCampanha(titulo)) return;

    const url = urlValida(
      href,
      fonte.url,
      fonte.dominio
    );

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

// ==========================================
// EXTRAÇÃO DE DATAS
// ==========================================

function dataISO(dia, mes, ano, hora = "00:00") {
  const d = Number(dia);
  const m = Number(mes);
  const a = Number(ano);

  if (
    !Number.isInteger(d) ||
    !Number.isInteger(m) ||
    !Number.isInteger(a) ||
    a < 2020 ||
    a > 2100
  ) {
    return null;
  }

  const [h, min] = hora.split(":").map(Number);

  if (
    h < 0 || h > 23 ||
    min < 0 || min > 59
  ) {
    return null;
  }

  const teste = new Date(
    Date.UTC(a, m - 1, d)
  );

  if (
    teste.getUTCFullYear() !== a ||
    teste.getUTCMonth() !== m - 1 ||
    teste.getUTCDate() !== d
  ) {
    return null;
  }

  const data =
    `${a}-${String(m).padStart(2, "0")}-` +
    `${String(d).padStart(2, "0")}T` +
    `${String(h).padStart(2, "0")}:` +
    `${String(min).padStart(2, "0")}:00${FUSO}`;

  return new Date(data).toISOString();
}

function extrairDatas(texto, anoReferencia) {
  const encontrado = new Map();
  const conteudo = normalizar(texto);

  // Datas numéricas com ano explícito.
  const numericas =
    /\b(\d{1,2})\/(\d{1,2})\/(20\d{2})\b/g;

  for (const match of conteudo.matchAll(numericas)) {
    const iso = dataISO(
      match[1],
      match[2],
      match[3]
    );

    if (iso) {
      encontrado.set(iso, {
        iso,
        trecho: match[0]
      });
    }
  }

  // Datas por extenso, com ano explícito.
  const extenso =
    /\b(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(20\d{2})\b/g;

  for (const match of conteudo.matchAll(extenso)) {
    const iso = dataISO(
      match[1],
      MESES[match[2]],
      match[3]
    );

    if (iso) {
      encontrado.set(iso, {
        iso,
        trecho: match[0]
      });
    }
  }

  // Datas sem ano são apenas candidatas.
  // Não serão gravadas automaticamente.
  const semAno =
    /\b(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\b(?!\s+de\s+\d{4})/g;

  const datasSemAno = [];

  for (const match of conteudo.matchAll(semAno)) {
    datasSemAno.push(match[0]);
  }

  return {
    datas: [...encontrado.values()],
    datasSemAno: [...new Set(datasSemAno)],
    anoReferencia
  };
}

// ==========================================
// EXTRAÇÃO DE HORÁRIOS
// ==========================================

function extrairHorarios(texto) {
  const conteudo = normalizar(texto);

  const padrao =
    /\b(?:das?\s+)?(\d{1,2})(?:h|:)(\d{2})?\s*(?:as|ate|-)\s*(\d{1,2})(?:h|:)(\d{2})?\b/g;

  const encontrados = [];

  for (const match of conteudo.matchAll(padrao)) {
    const inicioHora = Number(match[1]);
    const inicioMin = Number(match[2] || 0);
    const fimHora = Number(match[3]);
    const fimMin = Number(match[4] || 0);

    if (
      inicioHora > 23 ||
      fimHora > 23 ||
      inicioMin > 59 ||
      fimMin > 59
    ) {
      continue;
    }

    const inicio =
      `${String(inicioHora).padStart(2, "0")}:` +
      `${String(inicioMin).padStart(2, "0")}`;

    const fim =
      `${String(fimHora).padStart(2, "0")}:` +
      `${String(fimMin).padStart(2, "0")}`;

    encontrados.push({
      inicio,
      fim,
      trecho: match[0]
    });
  }

  return encontrados;
}

// ==========================================
// EXTRAÇÃO DE LOCAIS
// ==========================================

function extrairLocal(texto) {
  const linhas = String(texto || "")
    .split(/\n+/)
    .map(limpar)
    .filter(Boolean);

  const padroes = [
    /^(?:local|onde)\s*:\s*(.+)$/i,
    /^(?:endereço|endereco)\s*:\s*(.+)$/i
  ];

  let local = null;
  let endereco = null;

  for (const linha of linhas) {
    const matchLocal = linha.match(padroes[0]);
    const matchEndereco = linha.match(padroes[1]);

    if (matchLocal && !local) {
      local = limpar(matchLocal[1]).slice(0, 250);
    }

    if (matchEndereco && !endereco) {
      endereco = limpar(matchEndereco[1]).slice(0, 300);
    }
  }

  return { local, endereco };
}

// ==========================================
// LER CONTEÚDO DA NOTÍCIA
// ==========================================

function extrairConteudoNoticia(html) {
  const $ = cheerio.load(html);

  $(
    "script, style, nav, footer, header, aside"
  ).remove();

  const seletores = [
    ".itemFullText",
    ".itemIntroText",
    ".entry-content",
    ".article-content",
    "article",
    "main"
  ];

  let elemento = null;

  for (const seletor of seletores) {
    const candidato = $(seletor).first();

    if (
      candidato.length &&
      limpar(candidato.text()).length > 100
    ) {
      elemento = candidato;
      break;
    }
  }

  if (!elemento) {
    return {
      texto: "",
      paragrafos: []
    };
  }

  const paragrafos = [];

  elemento.find("p, li").each((_, el) => {
    const texto = limpar($(el).text());

    if (texto.length > 10) {
      paragrafos.push(texto);
    }
  });

  return {
    texto: limpar(paragrafos.join(" ")),
    paragrafos
  };
}

function identificarDetalhes(
  conteudo,
  dataPublicacao
) {
  const anoReferencia =
    dataPublicacao?.getFullYear() || null;

  const datas = extrairDatas(
    conteudo.texto,
    anoReferencia
  );

  const horarios = extrairHorarios(
    conteudo.texto
  );

  const locais = extrairLocal(
    conteudo.paragrafos.join("\n")
  );

  // Não escolher uma data arbitrária quando
  // a notícia menciona vários dias.
  const dataUnica =
    datas.datas.length === 1
      ? datas.datas[0].iso
      : null;

  const horarioUnico =
    horarios.length === 1
      ? horarios[0]
      : null;

  return {
    description:
      conteudo.texto.slice(0, 2000) || null,

    eventDateCandidates:
      datas.datas.map(d => d.iso),

    eventDateTextCandidates:
      datas.datasSemAno,

    timeCandidates: horarios,

    location: locais.local,
    address: locais.endereco,

    // Dados preliminares para revisão.
    suggestedStartAt: dataUnica,
    suggestedStartTime:
      horarioUnico?.inicio || null,
    suggestedEndTime:
      horarioUnico?.fim || null
  };
}

async function enriquecerCampanha(campanha) {
  try {
    const html = await baixar(campanha.url);
    const conteudo = extrairConteudoNoticia(html);

    if (!conteudo.texto) {
      console.warn(
        `Conteúdo não identificado: ${campanha.titulo}`
      );

      return {
        ...campanha,
        detalhes: null
      };
    }

    const detalhes = identificarDetalhes(
      conteudo,
      campanha.dataPublicacao
    );

    console.log(`Detalhes: ${campanha.titulo}`);
    console.log({
      datas: detalhes.eventDateCandidates,
      horarios: detalhes.timeCandidates,
      local: detalhes.location,
      endereco: detalhes.address
    });

    return {
      ...campanha,
      detalhes
    };
  } catch (erro) {
    console.warn(
      `Falha ao abrir notícia: ${campanha.url}`
    );
    console.warn(erro.message);

    return {
      ...campanha,
      detalhes: null
    };
  }
}

// ==========================================
// BUSCAR CAMPANHAS
// ==========================================

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

      console.log(
        `Candidatas encontradas: ${campanhas.length}`
      );

      for (const campanha of campanhas) {
        todas.set(campanha.url, campanha);
      }
    } catch (erro) {
      console.warn(
        `Falha na fonte ${fonte.nome}: ${erro.message}`
      );

      if (erro.cause?.code) {
        console.warn(`Causa: ${erro.cause.code}`);
      }
    }
  }

  const enriquecidas = [];

  for (const campanha of todas.values()) {
    enriquecidas.push(
      await enriquecerCampanha(campanha)
    );
  }

  return enriquecidas;
}

// ==========================================
// FIREBASE
// ==========================================

function conectarFirebase() {
  const segredo =
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!segredo) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT não configurado."
    );
  }

  let conta;

  try {
    conta = JSON.parse(segredo);
  } catch {
    throw new Error(
      "Credenciais Firebase não contêm JSON válido."
    );
  }

  if (conta.project_id !== PROJETO) {
    throw new Error("Projeto Firebase incorreto.");
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(conta)
    });
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
    const referencia =
      db.collection("campaigns").doc(id);

    const detalhes = campanha.detalhes;

    try {
      await referencia.create({
        title: campanha.titulo,

        description:
          detalhes?.description ||
          "Publicação identificada automaticamente. " +
          "Consulte a fonte oficial para detalhes.",

        source: campanha.fonte,
        sourceUrl: campanha.url,
        sourceType: "official_news",

        scope: campanha.abrangencia,
        city: campanha.cidade,
        state: campanha.estado,

        publishedAt:
          campanha.dataPublicacao || null,

        location:
          detalhes?.location || null,

        address:
          detalhes?.address || null,

        eventDateCandidates:
          detalhes?.eventDateCandidates || [],

        eventDateTextCandidates:
          detalhes?.eventDateTextCandidates || [],

        timeCandidates:
          detalhes?.timeCandidates || [],

        suggestedStartAt:
          detalhes?.suggestedStartAt || null,

        suggestedStartTime:
          detalhes?.suggestedStartTime || null,

        suggestedEndTime:
          detalhes?.suggestedEndTime || null,

        // Nunca publicar automaticamente.
        status: "pending_review",
        isPublished: false,
        isBookable: false,

        createdAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp()
      });

      adicionadas++;

      console.log(
        `Adicionada: ${campanha.titulo}`
      );
    } catch (erro) {
      if (
        erro.code === 6 ||
        erro.code === "already-exists"
      ) {
        existentes++;
      } else {
        falhas++;

        console.error(
          `Falha ao gravar "${campanha.titulo}": ` +
          erro.message
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
    throw new Error(
      `${falhas} registros falharam.`
    );
  }
}

// ==========================================
// EXECUÇÃO
// ==========================================

async function executar() {
  console.log("==================================");
  console.log("AGENDA SAÚDE");
  console.log("Sincronização de campanhas");
  console.log("==================================");

  const campanhas = await buscarCampanhas();

  console.log(
    `\nTotal de candidatas: ${campanhas.length}`
  );

  for (const campanha of campanhas) {
    console.log(`\n${campanha.titulo}`);
    console.log(campanha.url);
  }

  if (
    process.env.GRAVAR_FIRESTORE !== "true"
  ) {
    console.log(
      "\nMODO PRÉVIA: nenhuma gravação realizada."
    );
    return;
  }

  if (campanhas.length === 0) {
    throw new Error(
      "Nenhuma campanha encontrada."
    );
  }

  await gravarCampanhas(campanhas);

  console.log("\nSincronização concluída.");
}

executar().catch(erro => {
  console.error("Erro:", erro.message);
  process.exitCode = 1;
});
