
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import * as logger from "firebase-functions/logger";
import { load } from "cheerio";
import { createHash } from "node:crypto";

initializeApp();

const db = getFirestore();

const FONTE =
  "https://www.fortaleza.ce.gov.br/noticias/categoria/saude";

const PALAVRAS_CHAVE = [
  "campanha",
  "vacinação",
  "vacinacao",
  "mutirão",
  "mutirao",
  "dia d",
  "novembro azul",
  "outubro rosa",
  "setembro amarelo",
  "prevenção",
  "prevencao",
];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function ehPossivelCampanha(titulo: string): boolean {
  const texto = normalizar(titulo);

  return PALAVRAS_CHAVE.some((palavra) =>
    texto.includes(normalizar(palavra))
  );
}

function criarId(url: string): string {
  return createHash("sha256")
    .update(url)
    .digest("hex")
    .slice(0, 32);
}

type Publicacao = {
  titulo: string;
  url: string;
};

async function buscarPublicacoes(): Promise<Publicacao[]> {
  const resposta = await fetch(FONTE, {
    headers: {
      "User-Agent": "AgendaSaude/1.0 (importador de noticias publicas)",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!resposta.ok) {
    throw new Error(
      `Falha ao consultar Prefeitura: HTTP ${resposta.status}`
    );
  }

  const html = await resposta.text();
  const $ = load(html);

  const publicacoes = new Map<string, Publicacao>();

  // A estrutura HTML do portal pode mudar.
  // Por isso, coletamos links e validamos o destino.
  $("a[href]").each((_, elemento) => {
    const titulo = $(elemento).text().replace(/\s+/g, " ").trim();
    const href = $(elemento).attr("href");

    if (!href || titulo.length < 15 || titulo.length > 250) {
      return;
    }

    if (!ehPossivelCampanha(titulo)) {
      return;
    }

    let url: URL;

    try {
      url = new URL(href, FONTE);
    } catch {
      return;
    }

    if (
      !["fortaleza.ce.gov.br", "www.fortaleza.ce.gov.br"]
        .includes(url.hostname)
    ) {
      return;
    }

    if (!url.pathname.startsWith("/noticias/")) {
      return;
    }

    // Ignora links de categorias, paginação e filtros.
    if (
      url.pathname.startsWith("/noticias/categoria/") ||
      url.pathname === "/noticias/"
    ) {
      return;
    }

    url.hash = "";
    url.search = "";
    url.hostname = "www.fortaleza.ce.gov.br";

    publicacoes.set(url.toString(), {
      titulo,
      url: url.toString(),
    });
  });

  return [...publicacoes.values()];
}

export const sincronizarCampanhasFortaleza = onSchedule(
  {
    schedule: "every 6 hours",
    timeZone: "America/Fortaleza",
    region: "southamerica-east1",
    maxInstances: 1,
    timeoutSeconds: 120,
    memory: "256MiB",
  },
  async () => {
    logger.info("Iniciando sincronização de Fortaleza");

    const publicacoes = await buscarPublicacoes();

    logger.info("Publicações candidatas encontradas", {
      quantidade: publicacoes.length,
    });

    let adicionadas = 0;
    let existentes = 0;

    for (const publicacao of publicacoes) {
      const id = `fortaleza_${criarId(publicacao.url)}`;
      const referencia = db.collection("campaigns").doc(id);

      // A transação impede sobrescrever documentos existentes.
      const criada = await db.runTransaction(async (transacao) => {
        const documento = await transacao.get(referencia);

        if (documento.exists) {
          return false;
        }

        transacao.create(referencia, {
          title: publicacao.titulo,
          description:
            "Publicação identificada no portal oficial de Fortaleza. " +
            "Consulte a fonte para confirmar datas, locais e serviços.",

          source: "Prefeitura de Fortaleza",
          sourceUrl: publicacao.url,
          sourceType: "official_news",

          city: "Fortaleza",
          state: "CE",

          // Não confundir notícia com campanha confirmada.
          status: "pending_review",
          isPublished: false,
          isBookable: false,

          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });

        return true;
      });

      if (criada) {
        adicionadas++;
      } else {
        existentes++;
      }
    }

    logger.info("Sincronização concluída", {
      encontradas: publicacoes.length,
      adicionadas,
      existentes,
    });
  }
);
