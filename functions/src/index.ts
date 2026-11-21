
import { initializeApp } from "firebase-admin/app";
import {
  FieldValue,
  getFirestore,
} from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { load } from "cheerio";
import { createHash } from "node:crypto";

initializeApp();

const db = getFirestore();

type Fonte = {
  nome: string;
  url: string;
  dominio: string;
  tipo: "prefeitura" | "hemoce";
};

type Publicacao = {
  titulo: string;
  url: string;
  fonte: string;
};

const FONTES: Fonte[] = [
  {
    nome: "Prefeitura de Fortaleza",
    url: "https://www.fortaleza.ce.gov.br/noticias/categoria/saude",
    dominio: "fortaleza.ce.gov.br",
    tipo: "prefeitura",
  },
  {
    nome: "Hemoce",
    url: "https://www.hemoce.ce.gov.br/",
    dominio: "hemoce.ce.gov.br",
    tipo: "hemoce",
  },
  {
    nome: "Hemoce",
    url: "https://www.hemoce.ce.gov.br/category/sessao-de-noticias/",
    dominio: "hemoce.ce.gov.br",
    tipo: "hemoce",
  },
];

const PALAVRAS_CHAVE = [
  "campanha",
  "vacinacao",
  "multivacinacao",
  "imunizacao",
  "mutirao",
  "dia d",
  "novembro azul",
  "outubro rosa",
  "setembro amarelo",
  "prevencao",
  "doacao de sangue",
  "doador de sangue",
  "coleta de sangue",
  "coleta externa",
  "saude da mulher",
  "saude do homem",
  "testagem",
  "exames gratuitos",
  "acao de saude",
  "acoes de saude",
  "servicos de saude",
  "postos de saude abertos",
];

const TERMOS_DESCARTE = [
  "encerra com",
  "balanco da campanha",
  "resultado da campanha",
  "vencedores do concurso",
];

function normalizar(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function ehPossivelCampanha(titulo: string): boolean {
  const texto = normalizar(titulo);

  if (
    TERMOS_DESCARTE.some(termo =>
      texto.includes(termo)
    )
  ) {
    return false;
  }

  return PALAVRAS_CHAVE.some(termo =>
    texto.includes(termo)
  );
}

function criarId(url: string): string {
  return createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32);
}

function normalizarUrl(
  href: string,
  base: string
): string | null {
  try {
    const url = new URL(href, base);

    if (
      url.protocol !== "https:" &&
      url.protocol !== "http:"
    ) {
      return null;
    }

    url.protocol = "https:";
    url.hostname = url.hostname
      .toLowerCase()
      .replace(/^www\./, "");

    url.hash = "";
    url.search = "";

    url.pathname =
      url.pathname.replace(/\/+$/, "") || "/";

    return url.toString();
  } catch {
    return null;
  }
}

function ehNoticiaValida(
  urlTexto: string,
  fonte: Fonte
): boolean {
  const url = new URL(urlTexto);

  if (url.hostname !== fonte.dominio) {
    return false;
  }

  if (fonte.tipo === "prefeitura") {
    return (
      url.pathname.startsWith("/noticias/") &&
      url.pathname !== "/noticias" &&
      !url.pathname.startsWith(
        "/noticias/categoria/"
      )
    );
  }

  // Notícias do Hemoce usam URLs com ano/mês/dia.
  return /^\/20\d{2}\/\d{2}\/\d{2}\/.+/.test(
    url.pathname
  );
}

async function baixarHtml(
  url: string
): Promise<string> {
  const resposta = await fetch(url, {
    headers: {
      "User-Agent":
        "AgendaSaude/1.0 (coletor de noticias publicas)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!resposta.ok) {
    throw new Error(
      `HTTP ${resposta.status}: ${url}`
    );
  }

  return resposta.text();
}

function extrairPublicacoes(
  html: string,
  fonte: Fonte,
  urlPagina: string
): Publicacao[] {
  const $ = load(html);

  const publicacoes = new Map<
    string,
    Publicacao
  >();

  $("a[href]").each((_, elemento) => {
    const link = $(elemento);
    const href = link.attr("href");

    if (!href) return;

    const titulo = link
      .text()
      .replace(/\s+/g, " ")
      .trim();

    if (
      titulo.length < 15 ||
      titulo.length > 250 ||
      !ehPossivelCampanha(titulo)
    ) {
      return;
    }

    const url = normalizarUrl(
      href,
      urlPagina
    );

    if (
      !url ||
      !ehNoticiaValida(url, fonte)
    ) {
      return;
    }

    publicacoes.set(url, {
      titulo,
      url,
      fonte: fonte.nome,
    });
  });

  return [...publicacoes.values()];
}

function paginasDaFonte(
  fonte: Fonte
): string[] {
  if (fonte.tipo !== "prefeitura") {
    return [fonte.url];
  }

  // O portal da Prefeitura utiliza paginação.
  return [
    fonte.url,
    ...[0, 5, 10, 15, 20, 25, 30, 35, 40].map(
      inicio =>
        `${fonte.url}?start=${inicio}`
    ),
  ];
}

async function buscarPublicacoes():
  Promise<Publicacao[]> {
  const publicacoes = new Map<
    string,
    Publicacao
  >();

  for (const fonte of FONTES) {
    const paginas = [
      ...new Set(paginasDaFonte(fonte)),
    ];

    for (const pagina of paginas) {
      try {
        const html = await baixarHtml(pagina);

        const encontradas =
          extrairPublicacoes(
            html,
            fonte,
            pagina
          );

        for (const publicacao of encontradas) {
          publicacoes.set(
            publicacao.url,
            publicacao
          );
        }

        logger.info(
          "Página consultada",
          {
            fonte: fonte.nome,
            pagina,
            encontradas:
              encontradas.length,
          }
        );
      } catch (error) {
        logger.warn(
          "Falha ao consultar fonte",
          {
            fonte: fonte.nome,
            pagina,
            erro: String(error),
          }
        );
      }
    }
  }

  return [...publicacoes.values()];
}

async function salvarPublicacao(
  publicacao: Publicacao
): Promise<boolean> {
  const prefixo =
    publicacao.fonte === "Hemoce"
      ? "hemoce"
      : "fortaleza";

  const id =
    `${prefixo}_${criarId(publicacao.url)}`;

  const referencia = db
    .collection("campaigns")
    .doc(id);

  return db.runTransaction(
    async transacao => {
      const existente =
        await transacao.get(referencia);

      if (existente.exists) {
        return false;
      }

      transacao.create(referencia, {
        title: publicacao.titulo,

        description:
          "Notícia identificada automaticamente em fonte oficial. " +
          "O administrador deve verificar a data, " +
          "o endereço, a disponibilidade e " +
          "as condições de participação.",

        source: publicacao.fonte,
        sourceUrl: publicacao.url,
        sourceType: "official_news",

        city: "Fortaleza",
        state: "CE",

        category: null,
        start_at: null,
        end_at: null,
        address: null,
        location: null,

        status: "pending_review",
        isPublished: false,
        isBookable: false,
        appointment_required: false,

        createdAt:
          FieldValue.serverTimestamp(),
        updatedAt:
          FieldValue.serverTimestamp(),
      });

      return true;
    }
  );
}

export const sincronizarCampanhasFortaleza =
  onSchedule(
    {
      schedule: "every 6 hours",
      timeZone: "America/Fortaleza",
      region: "southamerica-east1",
      maxInstances: 1,
      timeoutSeconds: 300,
      memory: "256MiB",
    },
    async () => {
      logger.info(
        "Iniciando coleta de campanhas"
      );

      const publicacoes =
        await buscarPublicacoes();

      let adicionadas = 0;
      let existentes = 0;
      let falhas = 0;

      for (const publicacao of publicacoes) {
        try {
          const criada =
            await salvarPublicacao(
              publicacao
            );

          if (criada) {
            adicionadas++;
          } else {
            existentes++;
          }
        } catch (error) {
          falhas++;

          logger.error(
            "Erro ao salvar publicação",
            {
              url: publicacao.url,
              erro: String(error),
            }
          );
        }
      }

      logger.info(
        "Sincronização concluída",
        {
          encontradas:
            publicacoes.length,
          adicionadas,
          existentes,
          falhas,
        }
      );
    }
  );
