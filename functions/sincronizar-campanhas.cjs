'use strict';
require('dotenv').config({
  path: require('node:path').join(__dirname, '.env'),
  quiet: true,
});

const { createHash } = require('node:crypto');
const cheerio = require('cheerio');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const { pesquisarCampanhas } = require('./tavily-pesquisa.cjs');
const { analisarCampanha } = require('./groq-campanhas.cjs');

const PROJECT_ID = 'agenda-saude-4ea5b';
const GRAVAR = process.env.GRAVAR_FIRESTORE === 'true';
const AUTO_APROVAR = process.env.AUTO_APROVAR_CAMPANHAS === 'true';
const IA_ATIVA = process.env.IA_ATIVA === 'true';
const LIMITE_ANALISES = Math.max(0, Math.min(10, Number(process.env.GROQ_ANALISES_POR_EXECUCAO || 3) || 0));
const DIAS_NOTICIA_RECENTE = 45;
const DIAS_MAX_NOTICIA = 120;
const MAX_DOWNLOADS = Math.max(5, Math.min(80, Number(process.env.MAX_DOWNLOADS_POR_EXECUCAO || 35)));
const GEO_CE = /fortaleza|cear[aá]|\bce\b|sobral|juazeiro do norte|caucaia|maracana[uú]|crato|itapipoca|quixad[aá]|iguatu|aquiraz|pacatuba|eus[eé]bio|maranguape|canind[eé]/i;

const SOURCES = [
  {
    name: 'Prefeitura de Fortaleza',
    url: 'https://www.fortaleza.ce.gov.br/noticias/categoria/saude?format=feed&type=rss',
    kind: 'rss',
    host: 'fortaleza.ce.gov.br',
    scope: 'municipal',
    city: 'Fortaleza',
    state: 'CE',
  },
  {
    name: 'Prefeitura de Fortaleza - Notícias',
    url: 'https://www.fortaleza.ce.gov.br/noticias/categoria/saude',
    kind: 'html',
    host: 'fortaleza.ce.gov.br',
    scope: 'municipal',
    city: 'Fortaleza',
    state: 'CE',
  },
  {
    name: 'Secretaria da Saúde do Ceará',
    url: 'https://www.saude.ce.gov.br/',
    kind: 'html',
    host: 'saude.ce.gov.br',
    scope: 'estadual',
    city: null,
    state: 'CE',
  },
  {
    name: 'Hemoce - API WordPress',
    url: 'https://www.hemoce.ce.gov.br/wp-json/wp/v2/posts',
    kind: 'wordpress',
    host: 'hemoce.ce.gov.br',
    scope: 'estadual',
    city: null,
    state: 'CE',
  },
];

const TERMS = [
  'campanha',
  'vacinacao',
  'vacina',
  'imunizacao',
  'multivacinacao',
  'mutirao',
  'dia d',
  'doacao de sangue',
  'doador de sangue',
  'doar sangue',
  'coleta de sangue',
  'coleta externa',
  'novembro azul',
  'outubro rosa',
  'prevencao',
  'testagem',
  'exames gratuitos',
  'atendimento gratuito',
  'acao de saude',
  'acoes de saude',
  'saude da mulher',
  'saude do homem',
  'saude bucal',
  'triagem gratuita',
  'feira de saude',
  'rastreamento',
  'afericao de pressao',
  'glicemia',
  'consulta gratuita',
];

const EXCLUSIONS = [
  'licitacao',
  'concurso publico',
  'processo seletivo',
  'prestacao de contas',
  'balanco anual',
  'certificacao internacional',
  'concurso de frases',
  'concurso de desenhos',
  'funcionamento dos servicos publicos',
  'funcionamento no feriado',
  'expediente no feriado',
  'horario de funcionamento no feriado',
  'nota de pesar',
  'resultado de selecao',
];

const MONTHS = {
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
  dezembro: 12,
};

const clean = value =>
  String(value ?? '').replace(/\s+/g, ' ').trim();

const norm = value =>
  clean(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const hash = value =>
  createHash('sha256')
    .update(value)
    .digest('hex')
    .slice(0, 32);

function plain(html) {
  return clean(cheerio.load(html || '').text());
}

function isCampaign(title) {
  const text = norm(title);

  return (
    text.length >= 12 &&
    text.length <= 300 &&
    !EXCLUSIONS.some(term => text.includes(term)) &&
    TERMS.some(term => text.includes(term))
  );
}

function safeUrl(href, base, host) {
  try {
    const url = new URL(href, base);

    if (url.protocol !== 'https:') return null;

    if (url.hostname.replace(/^www\./, '') !== host) {
      return null;
    }

    url.hostname = `www.${host}`;
    url.hash = '';
    // Normaliza a barra final para evitar duplicatas entre RSS e Tavily.
    if (url.pathname.length > 1) {
      url.pathname = url.pathname.replace(/\/+$/, '');
    }

    for (const key of [...url.searchParams.keys()]) {
      if (
        key.startsWith('utm_') ||
        ['fbclid', 'gclid'].includes(key)
      ) {
        url.searchParams.delete(key);
      }
    }

    return url.toString();
  } catch {
    return null;
  }
}

async function download(url, accept = 'text/html') {
  let ultimoErro;
  for (let tentativa = 0; tentativa < 2; tentativa++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AgendaSaude/1.0)',
          Accept: accept,
        },
        signal: AbortSignal.timeout(20000),
      });
      if (response.ok) return response;
      // Repetir apenas falhas temporarias; nao insistir em 403/404.
      if (![429, 500, 502, 503, 504].includes(response.status)) {
        throw new Error(`HTTP ${response.status}: ${url}`);
      }
      ultimoErro = new Error(`HTTP ${response.status}: ${url}`);
    } catch (error) {
      ultimoErro = error;
      if (/HTTP (?:400|401|403|404):/.test(String(error.message))) break;
    }
    if (tentativa === 0) await new Promise(resolve => setTimeout(resolve, 1200));
  }
  throw ultimoErro;
}

function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? null : date;
}

function dateParts(date) {
  if (!date) return null;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  const get = type =>
    Number(parts.find(part => part.type === type)?.value);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
  };
}

function isoDate(day, month, year) {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  if (
    !Number.isInteger(d) ||
    !Number.isInteger(m) ||
    !Number.isInteger(y) ||
    y < 2020 ||
    y > 2100 ||
    m < 1 ||
    m > 12
  ) {
    return null;
  }

  const date = new Date(Date.UTC(y, m - 1, d));

  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }

  return [
    y,
    String(m).padStart(2, '0'),
    String(d).padStart(2, '0'),
  ].join('-');
}

function todayFortaleza() {
  const parts = dateParts(new Date());

  return isoDate(parts.day, parts.month, parts.year);
}

function extractDates(text, publicationDate) {
  const content = norm(text);
  const reference = dateParts(publicationDate);
  const found = new Map();

  function add(day, month, year, excerpt) {
    const date = isoDate(day, month, year);

    if (!date || found.has(date)) return;

    found.set(date, {
      data: date,
      trecho: excerpt,
    });
  }

  for (const match of content.matchAll(
    /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/g
  )) {
    if (match[3] || reference) {
      add(
        match[1],
        match[2],
        match[3] || reference.year,
        match[0]
      );
    }
  }

  for (const match of content.matchAll(
    /\b(\d{1,2})\s+de\s+(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)(?:\s+de\s+(\d{4}))?\b/g
  )) {
    if (match[3] || reference) {
      add(
        match[1],
        MONTHS[match[2]],
        match[3] || reference.year,
        match[0]
      );
    }
  }

  return [...found.values()];
}

// Extrai somente periodos expressos claramente na noticia.
// Datas isoladas e datas comemorativas nao definem automaticamente um periodo.
function extractPeriod(text, publicationDate) {
  const content = norm(text);
  const reference = dateParts(publicationDate);
  const year = reference?.year;
  const monthNames = '(?:janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)';
  const matches = [];

  function add(start, end, excerpt, confidence = 'explicit_range') {
    if (!start || !end || start > end) return;
    if (end < todayFortaleza()) return;
    if (matches.some(item => item.start === start && item.end === end)) return;
    matches.push({ start, end, excerpt, confidence });
  }

  // "de 23 a 29 de novembro", "entre 23 e 29 de novembro de 2026"
  const sameMonth = new RegExp(`\\b(?:de|do dia|entre os dias|entre|dos dias)\\s+(\\d{1,2})\\s+(?:a|ate|e)\\s+(\\d{1,2})\\s+de\\s+(${monthNames})(?:\\s+de\\s+(\\d{4}))?\\b`, 'g');
  for (const match of content.matchAll(sameMonth)) {
    const y = match[4] ? Number(match[4]) : year;
    if (!y) continue;
    const m = MONTHS[match[3]];
    add(isoDate(match[1], m, y), isoDate(match[2], m, y), match[0]);
  }

  // "de 28 de novembro a 2 de dezembro" / "entre 28 de novembro e 2 de dezembro"
  const differentMonths = new RegExp(`\\b(?:de|entre)\\s+(\\d{1,2})\\s+de\\s+(${monthNames})(?:\\s+de\\s+(\\d{4}))?\\s+(?:a|ate|e)\\s+(\\d{1,2})\\s+de\\s+(${monthNames})(?:\\s+de\\s+(\\d{4}))?\\b`, 'g');
  for (const match of content.matchAll(differentMonths)) {
    const y1 = Number(match[3] || year);
    let y2 = Number(match[6] || y1);
    if (!y1) continue;
    if (!match[6] && MONTHS[match[5]] < MONTHS[match[2]]) y2++;
    add(isoDate(match[1], MONTHS[match[2]], y1), isoDate(match[4], MONTHS[match[5]], y2), match[0]);
  }

  // "de 23/11/2026 a 29/11/2026"
  for (const match of content.matchAll(/\b(?:de|entre)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s+(?:a|ate|e)\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\b/g)) {
    const y1 = Number(match[3] || year);
    const y2 = Number(match[6] || y1);
    if (!y1) continue;
    add(isoDate(match[1], match[2], y1), isoDate(match[4], match[5], y2), match[0]);
  }

  // Apenas um periodo inequivoco pode ser preenchido automaticamente.
  return matches.length === 1
    ? { start: matches[0].start, end: matches[0].end, evidence: matches[0].excerpt, confidence: matches[0].confidence }
    : { start: null, end: null, evidence: null, confidence: matches.length > 1 ? 'ambiguous' : 'not_found' };
}

function extractTimes(text) {
  const content = norm(text);
  const found = new Map();

  for (const match of content.matchAll(
    /\b(?:das?\s+)?(\d{1,2})(?:h|:)(\d{2})?\s*(?:as|ate|-)\s*(\d{1,2})(?:h|:)(\d{2})?\b/g
  )) {
    const h1 = Number(match[1]);
    const m1 = Number(match[2] || 0);
    const h2 = Number(match[3]);
    const m2 = Number(match[4] || 0);

    if (
      h1 > 23 ||
      h2 > 23 ||
      m1 > 59 ||
      m2 > 59
    ) {
      continue;
    }

    const format = (h, m) =>
      `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

    const start = format(h1, m1);
    const end = format(h2, m2);

    if (end <= start) continue;

    found.set(`${start}-${end}`, {
      inicio: start,
      fim: end,
      trecho: match[0],
    });
  }

  return [...found.values()];
}

function extractArticle(html) {
  const $ = cheerio.load(html);

  $('script,style,nav,footer,header,aside').remove();

  let selected = null;

  for (const selector of [
    '.itemFullText',
    '.entry-content',
    '.article-content',
    '.post-content',
    '.noticia-conteudo',
    '.itemIntroText',
    'article',
    'main',
  ]) {
    const element = $(selector).first();

    if (
      element.length &&
      clean(element.text()).length > 100
    ) {
      selected = element;
      break;
    }
  }

  if (!selected) {
    return { text: '', paragraphs: [] };
  }

  const paragraphs = [];

  selected.find('p,li').each((_, element) => {
    const text = clean($(element).text());

    if (text.length > 10) {
      paragraphs.push(text);
    }
  });

  if (!paragraphs.length) {
    paragraphs.push(clean(selected.text()));
  }

  return {
    text: clean(paragraphs.join(' ')),
    paragraphs,
  };
}

// Datas relativas exigem data de publicacao confiavel; nao extrapolar sem ela.
function extractRelativeDates(text, publicationDate) {
  const ref = parseDate(publicationDate);
  if (!ref) return [];
  const age = (Date.now() - ref.getTime()) / 86400000;
  if (age < -1 || age > 45) return [];
  const weekdays = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
  const found = [];
  const content = norm(text);
  for (const m of content.matchAll(/\b(?:proxim[ao]|nesta|neste)\s+(segunda|terca|quarta|quinta|sexta|sabado|domingo)(?:-feira)?\b/g)) {
    const target = weekdays[m[1]];
    const base = new Date(ref.getTime());
    // Datas sao pistas para revisao, nunca periodo explicito para autoaprovacao.
    const delta = (target - base.getUTCDay() + 7) % 7 || (m[0].startsWith('proxim') ? 7 : 0);
    base.setUTCDate(base.getUTCDate() + delta);
    const parts = dateParts(base);
    const date = isoDate(parts.day, parts.month, parts.year);
    if (date && !found.includes(date)) found.push(date);
  }
  return found;
}

function extractDetails(article, publicationDate) {
  const dates = extractDates(
    article.text,
    publicationDate
  );

  for (const date of extractRelativeDates(article.text, publicationDate)) {
    if (!dates.some(item => item.data === date)) dates.push({ data: date, trecho: "data relativa; revisar" });
  }
  const times = extractTimes(article.text);
  const period = extractPeriod(article.text, publicationDate);

  let location = null;
  let address = null;

  for (const paragraph of article.paragraphs) {
    const localMatch = paragraph.match(
      /^(?:local|onde)\s*:\s*(.+)$/i
    );

    const addressMatch = paragraph.match(
      /^endere[cç]o\s*:\s*(.+)$/i
    );

    if (localMatch && !location) {
      location = clean(localMatch[1]).slice(0, 250);
    }

    if (addressMatch && !address) {
      address = clean(addressMatch[1]).slice(0, 300);
    }
  }

  const today = todayFortaleza();

  const futureDates = dates.filter(
    item => item.data >= today
  );

  return {
    description: article.text.slice(0, 2000) || null,

    // Datas encontradas são sugestões, não confirmações.
    eventDateCandidates: dates.map(item => item.data),
    eventDateDetails: dates,
    futureDateCandidates: futureDates.map(item => item.data),

    timeCandidates: times,
    suggestedEndAt: period.end,
    periodEvidence: period.evidence,
    periodConfidence: period.confidence,

    // Apenas uma sugestão quando não há ambiguidade.
    suggestedStartAt: period.start,

    suggestedStartTime:
      times.length === 1
        ? times[0].inicio
        : null,

    suggestedEndTime:
      times.length === 1
        ? times[0].fim
        : null,

    suggestedLocation: location,
    suggestedAddress: address,
  };
}

function extractRSS(xml, source) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const result = new Map();

  $('item,entry').each((_, element) => {
    const item = $(element);

    const title = clean(
      item.find('title').first().text()
    );

    let link = clean(
      item.find('link').first().text()
    );

    if (!link) {
      link = item.find('link').first().attr('href');
    }

    if (!isCampaign(title)) return;

    const url = safeUrl(link, source.url, source.host);

    if (!url) return;

    const rawDate = clean(
      item.find('pubDate,published,updated').first().text()
    );

    result.set(url, {
      title,
      url,
      source,
      publicationDate: parseDate(rawDate),
    });
  });

  return [...result.values()];
}

function extractHTML(html, source) {
  const $ = cheerio.load(html);
  const result = new Map();

  $('a[href]').each((_, element) => {
    const link = $(element);
    const title = clean(link.text());
    const href = link.attr('href');

    if (!href || !isCampaign(title)) return;

    const url = safeUrl(
      href,
      source.url,
      source.host
    );

    if (!url) return;

    const path = new URL(url).pathname;

    if (
      path === '/' ||
      path.includes('/categoria/') ||
      path.includes('/category/') ||
      path.includes('/tag/')
    ) {
      return;
    }

    if (
      source.host === 'fortaleza.ce.gov.br' &&
      !path.startsWith('/noticias/')
    ) {
      return;
    }

    result.set(url, {
      title,
      url,
      source,
      publicationDate: null,
    });
  });

  return [...result.values()];
}

async function extractWordPress(source) {
  const result = new Map();

  const MAX_PAGES = Math.max(1, Math.min(10, Number(process.env.HEMOCE_MAX_PAGINAS || 3) || 3));
  const PER_PAGE = 50;
  const MAX_AGE_DAYS = 365;

  const cutoff =
    Date.now() - MAX_AGE_DAYS * 86400000;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = new URL(source.url);

    url.searchParams.set('per_page', String(PER_PAGE));
    url.searchParams.set('page', String(page));
    url.searchParams.set(
      '_fields',
      'id,date,link,title,excerpt'
    );

    let response;

    try {
      response = await download(
        url.toString(),
        'application/json'
      );
    } catch (error) {
      console.warn(
        `Hemoce API: página ${page}: ${error.message}`
      );
      break;
    }

    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      break;
    }

    console.log(
      `Hemoce API: página ${page}, ${posts.length} notícias`
    );

    let oldestDate = Infinity;

    for (const post of posts) {
      const title = plain(post.title?.rendered);
      const excerpt = plain(post.excerpt?.rendered);
      const publicationDate = parseDate(
        post.date ? `${post.date}-03:00` : null
      );

      if (publicationDate) {
        oldestDate = Math.min(
          oldestDate,
          publicationDate.getTime()
        );

        if (publicationDate.getTime() < cutoff) {
          continue;
        }
      }

      if (!isCampaign(title)) continue;

      const url = safeUrl(
        post.link,
        source.url,
        source.host
      );

      if (!url) continue;

      result.set(url, {
        title,
        url,
        source,
        publicationDate,
        excerpt,
      });
    }

    // Encerra somente quando a API retornar
    // menos notícias do que o tamanho solicitado.
    if (posts.length < PER_PAGE) {
      break;
    }
  }

  return [...result.values()];
}

// Triagem anterior ao download e ao consumo da cota Groq.
function dataDaUrl(campaign) {
  const m = String(campaign.url || '').match(/\/(20\d{2})\/(\d{1,2})\/(\d{1,2})(?:\/|$)/);
  return m ? parseDate(`${m[1]}-${String(m[2]).padStart(2, '0')}-${String(m[3]).padStart(2, '0')}T12:00:00Z`) : null;
}
function idadeEmDias(date) {
  return date ? Math.floor((Date.now() - date.getTime()) / 86400000) : null;
}
function dataDaNoticia(campaign) {
  // Uma data de publicacao retornada pelo Tavily pode estar ausente ou incorreta;
  // quando houver data na URL, ela prevalece para bloquear noticias antigas.
  return dataDaUrl(campaign) || parseDate(campaign.publicationDate);
}
function motivoDescarteInicial(campaign) {
  let url;
  try { url = new URL(campaign.url); } catch { return 'url_invalida'; }
  const path = decodeURIComponent(url.pathname).toLowerCase();
  const title = norm(campaign.title);
  if (path === '/' || /\/(?:feed|rss|tag|tags|category|categoria|categorias|arquivo|arquivos)(?:\/|$)/.test(path) ||
      /\/(?:20\d{2})(?:\/)?$/.test(path) || /\.(?:xml|rss)$/.test(path)) return 'pagina_institucional_ou_arquivo';
  if (/^(?:canal saude|hemoce - centro|arquivos? |pagina inicial|home\b)/.test(title) ||
      /\b(?:encerra|encerrou|encerrada|balanco|resultado|ja realizou|realizou|2022)\b/.test(title)) return 'pagina_ou_evento_encerrado';
  const idade = idadeEmDias(dataDaNoticia(campaign));
  if (idade !== null && idade > DIAS_MAX_NOTICIA) return 'publicacao_antiga';
  return null;
}
function evidenciaDeEvento(campaign, details) {
  const hoje = todayFortaleza();
  const fim = details?.suggestedEndAt;
  if (fim && fim >= hoje) return true;
  if ((details?.futureDateCandidates || []).some(d => d >= hoje) &&
      details?.contentOrigin === 'original_page') return true;
  // Apenas publicacoes comprovadamente recentes e que anunciam uma acao,
  // nunca paginas institucionais sem data ou noticias sem referencia temporal.
  const idade = idadeEmDias(dataDaNoticia(campaign));
  return idade !== null && idade >= -1 && idade <= 30 &&
    /\b(?:realizara|promovera|acontecera|sera realizado|vai realizar|proxima semana|proximo sabado|proximo domingo|inscricoes abertas|agenda|programacao)\b/.test(norm(`${campaign.title} ${campaign.excerpt || ''}`));
}

// Ordena noticias antes de consumir as cotas do Groq.
// Pontuacao e apenas prioridade: nao comprova a data do evento.
function prioridadeCampanha(campanha) {
  const titulo = norm(campanha.title || '');
  if (EXCLUSIONS.some(term => titulo.includes(term))) return -1000;

  let pontos = 0;
  const agora = Date.now();
  const publicacao = campanha.publicationDate
    ? new Date(campanha.publicationDate)
    : null;

  if (publicacao && !Number.isNaN(publicacao.getTime())) {
    const dias = Math.floor((agora - publicacao.getTime()) / 86400000);
    if (dias >= 0 && dias <= 14) pontos += 80;
    else if (dias >= 0 && dias <= 45) pontos += 50;
    else if (dias >= 0 && dias <= 90) pontos += 15;
    else if (dias > 90) pontos -= 70;
  }

  // Data de publicacao na URL ajuda a priorizar resultados do Tavily.
  // Nao e utilizada como data do evento.
  const dataUrl = campanha.url.match(/\/(20\d{2})\/(\d{2})\/(\d{2})\//);
  if (dataUrl) {
    const data = new Date(`${dataUrl[1]}-${dataUrl[2]}-${dataUrl[3]}T12:00:00Z`);
    if (!Number.isNaN(data.getTime())) {
      const dias = Math.floor((agora - data.getTime()) / 86400000);
      if (dias >= 0 && dias <= 30) pontos += 45;
      else if (dias > 90) pontos -= 60;
    }
  }

  if (/campanha|mutirao|vacinacao|doacao|dia d|acao gratuita/.test(titulo)) {
    pontos += 10;
  }
  return pontos;
}

// Filtro conservador: uma data solta nao prova que o evento ainda vai acontecer.
// Para poupar IA, descarta noticias com TODAS as datas detectadas no passado,
// quando nao ha periodo futuro explicitamente comprovado.
function classificarCandidata(campanha, details) {
  const hoje = todayFortaleza();
  const periodoFuturo = Boolean(
    details?.suggestedStartAt && details?.suggestedEndAt &&
    details.suggestedEndAt >= hoje
  );
  const datas = details?.eventDateCandidates || [];
  const algumaFutura = datas.some(data => data >= hoje);
  const todasPassadas = datas.length > 0 && !algumaFutura;
  const publicada = parseDate(campanha.publicationDate);
  const urlData = campanha.url.match(/\/(20\d{2})\/(\d{2})\/(\d{2})\//);
  const dataPublicacao = publicada || (urlData
    ? parseDate(`${urlData[1]}-${urlData[2]}-${urlData[3]}T12:00:00Z`)
    : null);
  const idade = dataPublicacao
    ? Math.floor((Date.now() - dataPublicacao.getTime()) / 86400000)
    : null;
  const antiga = idade !== null && idade > DIAS_MAX_NOTICIA;
  const recente = idade !== null && idade >= -1 && idade <= DIAS_NOTICIA_RECENTE;
  // Noticias sem periodo confirmado so sao enviadas a IA quando recentes
  // e quando nao ha evidencias de evento encerrado.
  // Eventos com uma data futura no texto original podem ir para analise,
  // mesmo se o mecanismo de busca nao informar a data de publicacao.
  // Isso nao autoriza aprovacao automatica sem periodo e evidencias completas.
  const recenteSemData = idade === null && algumaFutura && !todasPassadas &&
    details?.contentOrigin === 'original_page';
  const podeAnalisar = periodoFuturo || (!todasPassadas && !antiga && (recente || recenteSemData));
  const motivo = periodoFuturo ? 'periodo vigente confirmado' :
    todasPassadas ? 'datas identificadas ja passaram' :
    antiga ? 'noticia antiga sem periodo vigente confirmado' :
    !recente ? 'sem publicacao recente ou periodo futuro comprovado' :
    'noticia recente ou com data futura candidata';
  return { podeAnalisar, periodoFuturo, algumaFutura, todasPassadas, antiga, motivo };
}

function chaveUrl(urlOriginal) {
  try {
    const url = new URL(urlOriginal);
    url.hash = '';
    url.pathname = url.pathname.replace(/\/+$/, '') || '/';
    url.hostname = url.hostname.replace(/^www\./, '');
    for (const chave of [...url.searchParams.keys()]) {
      if (chave.startsWith('utm_') || ['fbclid', 'gclid'].includes(chave)) {
        url.searchParams.delete(chave);
      }
    }
    return url.toString();
  } catch {
    return urlOriginal;
  }
}

async function findCampaigns() {
  const all = new Map();

  for (const source of SOURCES) {
    console.log(`\nConsultando: ${source.name}`);

    try {
      let found;

      if (source.kind === 'wordpress') {
        found = await extractWordPress(source);
      } else {
        const response = await download(
          source.url,
          source.kind === 'rss'
            ? 'application/rss+xml, application/xml'
            : 'text/html'
        );

        const raw = await response.text();

        found =
          source.kind === 'rss'
            ? extractRSS(raw, source)
            : extractHTML(raw, source);
      }

      console.log(
        `Candidatas encontradas: ${found.length}`
      );

      for (const campaign of found) {
        const chave = chaveUrl(campaign.url);
        if (!all.has(chave)) {
          all.set(chave, campaign);
        } else {
          const existing = all.get(chave);

          // Preserva a data de publicação mais informativa.
          if (
            !existing.publicationDate &&
            campaign.publicationDate
          ) {
            all.set(chave, campaign);
          }
        }
      }
    } catch (error) {
      console.warn(`Falha na fonte ${source.name}: ${error.message}`);
      if (source.host === 'saude.ce.gov.br') {
        // A fonte principal pode bloquear acesso automatizado. Testa feed
        // alternativo oficial, sem utilizar proxies ou sites nao oficiais.
        for (const alternativa of [
          'https://www.saude.ce.gov.br/feed/',
          'https://www.saude.ce.gov.br/wp-json/wp/v2/posts?per_page=20',
        ]) {
          try {
            const response = await download(alternativa, 'application/json, application/rss+xml, application/xml');
            const raw = await response.text();
            let encontrados = [];
            if (alternativa.includes('/feed/')) {
              encontrados = extractRSS(raw, { ...source, url: alternativa, kind: 'rss' });
            } else {
              const posts = JSON.parse(raw);
              if (!Array.isArray(posts)) throw new Error('Formato de API inesperado');
              encontrados = posts.map(post => ({
                title: clean(cheerio.load(post.title?.rendered || '').text()),
                url: post.link,
                excerpt: clean(cheerio.load(post.excerpt?.rendered || '').text()).slice(0, 1000),
                publicationDate: parseDate(post.date),
                source,
              })).filter(item => item.url && isCampaign(item.title) && safeUrl(item.url, source.url, source.host));
            }
            for (const campaign of encontrados) {
              const chave = chaveUrl(campaign.url);
              if (!all.has(chave)) all.set(chave, campaign);
            }
            console.log(`[SESA] Fonte alternativa: ${encontrados.length} candidatas.`);
            break;
          } catch (falha) {
            console.warn(`[SESA] Alternativa indisponivel: ${falha.message}`);
          }
        }
      }
    }
  }

  // Tavily complementa as fontes atuais; resultados sao revalidados pelo coletor.
  if (IA_ATIVA) {
    let externos = [];
    try {
      externos = await pesquisarCampanhas();
    } catch (error) {
      console.warn(`[Tavily] Pesquisa indisponível: ${error.message}`);
    }
    for (const item of externos) {
      // O Tavily ja exige termo de saude e referencia geografica no titulo/resumo.
      // Resultados de fontes externas sao revalidados antes da publicacao.
      if (!item?.viaTavily && !isCampaign(item.title)) continue;
      if (EXCLUSIONS.some(term => norm(item.title).includes(term))) continue;
      const chave = chaveUrl(item.url);
      if (!all.has(chave)) all.set(chave, item);
    }
  }

  const results = [];
  let analises = 0;
  let groqBloqueado = false;
  let downloads = 0;
  const stats = { descartadas: 0, revisao: 0, publicaveis: 0, fallback: 0, falhasDownload: 0 };

  const candidatasOrdenadas = [...all.values()].sort(
    (a, b) => prioridadeCampanha(b) - prioridadeCampanha(a)
  );

  console.log(`[Coletor] ${candidatasOrdenadas.length} URLs unicas, priorizadas por atualidade.`);

  for (const campaign of candidatasOrdenadas) {
    const descarteInicial = motivoDescarteInicial(campaign);
    if (descarteInicial) {
      stats.descartadas++;
      console.log(`[Filtro inicial] ${descarteInicial}: ${campaign.title}`);
      continue;
    }
    if (downloads >= MAX_DOWNLOADS) { console.log(`[Coletor] Limite de ${MAX_DOWNLOADS} downloads atingido.`); break; }
    // Noticias institucionais nao devem consumir requisicoes de pagina ou IA.
    if (EXCLUSIONS.some(term => norm(campaign.title).includes(term))) {
      console.log(`Ignorada (informativa): ${campaign.title}`);
      continue;
    }
    try {
      downloads++;
      let article;
      let fallback = false;
      try {
        const response = await download(campaign.url);
        article = extractArticle(await response.text());
        if (article.text.length < 100 && campaign.tavilyContent?.length >= 100) {
          fallback = true;
        }
      } catch (error) {
        if (!campaign.tavilyContent || campaign.tavilyContent.length < 100) throw error;
        fallback = true;
        console.warn(`[Fallback Tavily] Pagina indisponivel: ${campaign.url}`);
      }
      if (fallback) {
        const text = clean(campaign.tavilyContent).slice(0, 5000);
        article = { text, paragraphs: [text] };
        stats.fallback++;
      }
      // Nao aceitar apenas um termo geográfico presente no link da busca.
      if (campaign.viaTavily && !GEO_CE.test(`${campaign.title} ${article.text.slice(0, 6000)}`)) {
        console.log(`[Filtro] Sem vinculo confirmado com o Ceara: ${campaign.title}`);
        continue;
      }

      const details = article.text
        ? extractDetails(article, campaign.publicationDate)
        : null;
      if (details) {
        details.contentFallback = fallback;
        details.contentOrigin = fallback ? 'tavily_snippet_unverified' : 'original_page';
      }

      const selecao = classificarCandidata(campaign, details);
      if (!evidenciaDeEvento(campaign, details) || (selecao.todasPassadas && !selecao.periodoFuturo)) {
        stats.descartadas++;
        console.log(`[Filtro] Sem evidencia de campanha futura: ${campaign.title}`);
        continue;
      }
      let ai = null;
      if (IA_ATIVA && !groqBloqueado && analises < LIMITE_ANALISES &&
          article.text.length >= 100 && selecao.podeAnalisar) {
        analises++;
        console.log(`[Groq] Analisando ${analises}/${LIMITE_ANALISES}: ${campaign.title}`);
        try {
          ai = await analisarCampanha({
            title: campaign.title, url: campaign.url,
            publicationDate: campaign.publicationDate?.toISOString?.() || null,
            articleText: article.text,
          });
        } catch (error) {
          if (error.code === 'GROQ_LIMIT') groqBloqueado = true;
          else console.warn('[Groq] Falha:', error.message);
        }
      } else if (IA_ATIVA && analises < LIMITE_ANALISES && !groqBloqueado) {
        console.log(`[Filtro] Sem analise Groq: ${selecao.motivo} — ${campaign.title}`);
      }
      if (details && ai) {
        details.ai = ai;
        // Datas da IA so complementam a sugestao quando possuem evidencia
        // textual e nao contradizem um periodo explicito do coletor.
        if (!details.suggestedStartAt && !details.suggestedEndAt &&
            ai.startDate && ai.endDate && ai.dateEvidence &&
            ai.startDate <= ai.endDate && ai.endDate >= todayFortaleza()) {
          details.suggestedStartAt = ai.startDate;
          details.suggestedEndAt = ai.endDate;
          details.periodEvidence = ai.dateEvidence;
          details.periodConfidence = 'ai_evidence_review_required';
        }
        if (!details.suggestedLocation && ai.location && ai.locationEvidence) details.suggestedLocation = ai.location;
        if (!details.suggestedAddress && ai.address && ai.addressEvidence) details.suggestedAddress = ai.address;
        // Horario de abertura nao comprova horario completo da campanha.
        if (!details.suggestedStartTime && ai.startTime && ai.timeEvidence) details.suggestedStartTime = ai.startTime;
        if (!details.suggestedEndTime && ai.endTime && ai.timeEvidence) details.suggestedEndTime = ai.endTime;
        console.log('[Groq] Sugestoes:', JSON.stringify({
          title: ai.title, category: ai.category,
          startDate: ai.startDate, endDate: ai.endDate,
          startTime: ai.startTime, endTime: ai.endTime,
          location: ai.location, address: ai.address,
        }));
      }

      console.log(`\nCampanha: ${campaign.title}`);
      console.log(`Fonte: ${campaign.source.name}`);
      console.log(`URL: ${campaign.url}`);
      console.log(
        'Datas candidatas:',
        details?.eventDateCandidates || []
      );
      console.log(
        'Datas futuras candidatas:',
        details?.futureDateCandidates || []
      );
      console.log('Inicio sugerido:', details?.suggestedStartAt || 'nao identificado');
      console.log('Fim sugerido:', details?.suggestedEndAt || 'nao identificado');
      console.log('Evidencia do periodo:', details?.periodEvidence || 'nao identificada');

      // Nao criar/atualizar noticias antigas ou eventos claramente encerrados.
      // Datas futuras isoladas nunca bastam para publicar automaticamente.
      if (selecao.todasPassadas && !selecao.periodoFuturo) {
        console.log(`[Filtro] Evento encerrado: ${campaign.title}`);
        stats.descartadas++;
        continue;
      }
      if (selecao.antiga && !selecao.periodoFuturo) {
        console.log(`[Filtro] Noticia antiga: ${campaign.title}`);
        stats.descartadas++;
        continue;
      }
      if (!selecao.podeAnalisar && !ai) {
        console.log(`[Filtro] Sem evidencia suficiente: ${campaign.title}`);
        stats.descartadas++;
        continue;
      }
      // Uma noticia recente sem data pode ir para revisao, mas somente se
      // anunciar expressamente uma acao futura. Nunca aprovar sem periodo.
      if (!evidenciaDeEvento(campaign, details)) {
        stats.descartadas++;
        continue;
      }
      const proposta = { ...campaign, details };
      if (avaliarPublicacaoAutomatica(proposta).aprovar) stats.publicaveis++;
      else stats.revisao++;
      results.push(proposta);
    } catch (error) {
      stats.falhasDownload++;
      console.warn(
        `Falha ao consultar ${campaign.url}: ${error.message}`
      );

      // Falha de download nao deve gerar documento incompleto no Firebase.
    }
  }

  console.log("[Coletor] Resumo:", { ...stats, selecionadas: results.length, downloads });
  return results;
}

function firestore() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!raw) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT não configurado.'
    );
  }

  let account;

  try {
    account = JSON.parse(raw);
  } catch {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT não é um JSON válido.'
    );
  }

  if (account.project_id !== PROJECT_ID) {
    throw new Error('Projeto Firebase incorreto.');
  }

  if (!getApps().length) {
    initializeApp({
      credential: cert(account),
    });
  }

  return getFirestore();
}

// Sugestoes sao metadados, nao horarios confirmados para agendamento.
// Nunca substituir campos publicos editados manualmente.
function sugestoesParaAgenda(details) {
  const horaValida = value => typeof value === 'string' &&
    /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
  const inicio = details?.suggestedStartTime || details?.ai?.startTime || null;
  const fim = details?.suggestedEndTime || details?.ai?.endTime || null;
  return {
    agendaSuggestedStartTime: horaValida(inicio) ? inicio : null,
    agendaSuggestedEndTime: horaValida(fim) ? fim : null,
    agendaSuggestedLocation: details?.suggestedLocation || details?.ai?.location || null,
    agendaSuggestedAddress: details?.suggestedAddress || details?.ai?.address || null,
    agendaSuggestionUnverified: true,
  };
}

function extractedFields(details) {
  if (!details) return null;

  return {
    extractedDescription: details.description,
    contentOrigin: details.contentOrigin || 'original_page',
    contentFallback: Boolean(details.contentFallback),
    eventDateCandidates: details.eventDateCandidates,
    eventDateDetails: details.eventDateDetails,
    futureDateCandidates: details.futureDateCandidates,
    timeCandidates: details.timeCandidates,
    suggestedStartAt: details.suggestedStartAt,
    suggestedEndAt: details.suggestedEndAt,
    periodEvidence: details.periodEvidence,
    suggestedPeriodEvidence: details.periodEvidence,
    periodConfidence: details.periodConfidence,
    suggestedStartTime: details.suggestedStartTime,
    suggestedEndTime: details.suggestedEndTime,
    suggestedLocation: details.suggestedLocation,
    suggestedAddress: details.suggestedAddress,
    ...sugestoesParaAgenda(details),
    // IA fornece sugestoes; nunca altera diretamente campos aprovados.
    ...(details.ai ? {
      aiProvider: details.ai.provider,
      aiModel: details.ai.model,
      aiTitle: details.ai.title,
      aiDescription: details.ai.description,
      aiCategory: details.ai.category,
      aiStartDate: details.ai.startDate,
      aiEndDate: details.ai.endDate,
      aiStartTime: details.ai.startTime,
      aiEndTime: details.ai.endTime,
      aiLocation: details.ai.location,
      aiAddress: details.ai.address,
      aiCity: details.ai.city,
      aiTargetAudience: details.ai.targetAudience,
      aiDateEvidence: details.ai.dateEvidence,
      aiTimeEvidence: details.ai.timeEvidence,
      aiLocationEvidence: details.ai.locationEvidence,
      aiAddressEvidence: details.ai.addressEvidence,
    } : {}),
    extractedAt: FieldValue.serverTimestamp(),
  };
}

// Datas podem ser confirmadas por extracao deterministica de um periodo
// explicito na noticia, mesmo quando a IA nao conseguiu interpreta-las.
// Horarios sao opcionais: nunca tratar a hora da solenidade de abertura
// como o horario de atendimento de todos os dias.
function avaliarPublicacaoAutomatica(campaign) {
  const d = campaign.details;
  const ai = d?.ai;
  const pendencias = [];
  if (!AUTO_APROVAR) pendencias.push('automacao_desativada');
  if (!ai?.isCampaign) pendencias.push('sem_confirmacao_ia');
  if (d?.contentFallback) pendencias.push('conteudo_tavily_nao_confirmado');
  if (d?.periodConfidence !== 'explicit_range') pendencias.push('periodo_nao_explicito');
  if (!d?.periodEvidence || !d?.suggestedStartAt || !d?.suggestedEndAt) pendencias.push('datas_incompletas');
  if (!ai?.locationEvidence || !ai?.addressEvidence || !ai?.location || !ai?.address) pendencias.push('local_endereco_nao_confirmados');
  // Uma data nao extraida pela IA nao contradiz um periodo comprovado
  // pelo texto. Uma data divergente, sim, e exige revisao.
  if ((ai?.startDate && ai.startDate !== d?.suggestedStartAt) ||
      (ai?.endDate && ai.endDate !== d?.suggestedEndAt)) pendencias.push('datas_nao_conferem');
  if ((d?.timeCandidates?.length || 0) > 1) pendencias.push('horarios_ambiguos');
  const temInicio = Boolean(d?.suggestedStartTime);
  const temFim = Boolean(d?.suggestedEndTime);
  const horariosCompletos = temInicio && temFim && d?.timeCandidates?.length === 1 &&
    Boolean(ai?.timeEvidence) && ai?.startTime === d?.suggestedStartTime &&
    ai?.endTime === d?.suggestedEndTime;
  // Horario parcial (ex.: abertura as 9h) nao e horario da campanha.
  // Publicar somente o periodo, sem inventar horarios.
  if (temInicio && temFim && !horariosCompletos &&
      ai?.startTime && ai?.endTime &&
      (ai.startTime !== d.suggestedStartTime || ai.endTime !== d.suggestedEndTime)) {
    pendencias.push('horarios_contraditorios');
  }
  if (!ai?.description || !ai?.category || !ai?.targetAudience) pendencias.push('informacoes_incompletas');
  if (!d?.suggestedEndAt || d.suggestedEndAt < todayFortaleza()) pendencias.push('evento_encerrado');
  if (!campaign.source?.host || !FONTE_APROVADA_AUTOMATICAMENTE(campaign.source.host)) pendencias.push('fonte_nao_autorizada');
  if (d?.suggestedStartAt && d?.suggestedEndAt &&
      (Date.parse(d.suggestedEndAt) - Date.parse(d.suggestedStartAt)) > 31 * 86400000) pendencias.push('periodo_extenso');
  if (d?.suggestedStartAt && d?.suggestedEndAt && d.suggestedStartAt > d.suggestedEndAt) pendencias.push('periodo_invalido');
  if (pendencias.length) return { aprovar: false, pendencias };
  // ISO necessario para o calendario; 00:00 e 23:59 sao apenas limites
  // tecnicos de datas. O campo timeConfirmed evita exibi-los como horario.
  const inicio = `${d.suggestedStartAt}T${horariosCompletos ? d.suggestedStartTime : '00:00'}:00-03:00`;
  const fim = `${d.suggestedEndAt}T${horariosCompletos ? d.suggestedEndTime : '23:59'}:00-03:00`;
  if (new Date(fim).getTime() <= Date.now() || new Date(fim) <= new Date(inicio)) {
    return { aprovar: false, pendencias: ['horario_ou_data_encerrado'] };
  }
  return { aprovar: true, pendencias: [], inicio, fim, timeConfirmed: horariosCompletos };
}

// Dominio governamental ou institucional pre-aprovado. Sites privados podem
// gerar sugestoes, mas ficam em revisao ate terem dominio autorizado.
function FONTE_APROVADA_AUTOMATICAMENTE(host) {
  const dominio = String(host).toLowerCase().replace(/^www\./, '');
  return ['fortaleza.ce.gov.br', 'saude.ce.gov.br', 'hemoce.ce.gov.br'].includes(dominio);
}

async function saveCampaigns(campaigns) {
  if (!GRAVAR) throw new Error('Gravacao desabilitada por seguranca.');
  const db = firestore();

  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let failed = 0;
  let aprovadasAutomaticamente = 0;

  for (const campaign of campaigns) {
    const ref = db
      .collection('campaigns')
      .doc(`ce_${hash(campaign.url)}`);

    const extra = extractedFields(campaign.details);
    const auto = avaliarPublicacaoAutomatica(campaign);

    try {
      const outcome = await db.runTransaction(
        async transaction => {
          const snapshot = await transaction.get(ref);

          if (!snapshot.exists) {
            transaction.create(ref, {
              title: campaign.title,
              description:
                campaign.details?.ai?.description ||
                campaign.excerpt ||
                'Publicação identificada em fonte oficial.',

              source: campaign.source.name,
              sourceUrl: campaign.url,
              sourceType: campaign.source.host && FONTE_APROVADA_AUTOMATICAMENTE(campaign.source.host) ? 'official_news' : 'community_news',
              organizationType: campaign.source.host && FONTE_APROVADA_AUTOMATICAMENTE(campaign.source.host) ? 'public' : 'private_or_other',

              scope: campaign.source.scope,
              city: campaign.details?.ai?.city || campaign.source.city,
              state: campaign.source.state,

              publishedAt: campaign.publicationDate,

              // Não inventar dados de agendamento.
              location: auto.aprovar ? campaign.details.ai.location : null,
              address: auto.aprovar ? campaign.details.ai.address : null,
              start_at: auto.aprovar ? auto.inicio : null,
              end_at: auto.aprovar ? auto.fim : null,
              category: auto.aprovar ? campaign.details.ai.category : null,
              targetAudience: auto.aprovar ? campaign.details.ai.targetAudience : null,

              status: auto.aprovar ? 'approved' : 'pending_review',
              isPublished: auto.aprovar,
              approvalMethod: auto.aprovar ? 'automatic_verified' : null,
              timeConfirmed: auto.aprovar ? auto.timeConfirmed : false,
              autoApprovalChecks: auto.pendencias,
              autoApprovalVersion: 1,
              autoApprovedAt: auto.aprovar ? FieldValue.serverTimestamp() : null,

              // Compatibilidade com documentos antigos.
              // Campanhas informativas nao sao agendaveis automaticamente.
              isBookable: false,

              manuallyEdited: false,

              ...(extra || {}),

              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });

            return auto.aprovar ? 'auto_approved' : 'added';
          }

          const existing = snapshot.data();

          // Decisoes e dados publicos editados manualmente sao intocaveis.
          if (existing.manuallyEdited === true || existing.status === 'rejected' ||
              (existing.status === 'approved' && existing.approvalMethod !== 'automatic_verified')) {
            return 'unchanged';
          }

          // Em campanhas aprovadas automaticamente, atualizar SOMENTE metadados
          // de sugestao. Nao alterar start_at/end_at, status ou aprovacao.
          if (existing.status === 'approved') {
            if (!extra) return 'unchanged';
            const comparaveis = Object.keys(extra).filter(k => k !== 'extractedAt');
            const mudou = comparaveis.some(k =>
              JSON.stringify(existing[k] ?? null) !== JSON.stringify(extra[k] ?? null));
            if (!mudou) return 'unchanged';
            transaction.update(ref, { ...extra, updatedAt: FieldValue.serverTimestamp() });
            return 'updated';
          }

          // Uma sugestao antiga pode ser aprovada quando uma nova coleta
          // finalmente trouxer todas as evidencias, sem alterar decisao humana.
          if (existing.status === 'pending_review' && auto.aprovar) {
            transaction.update(ref, {
              ...(extra || {}),
              description: campaign.details.ai.description,
              location: campaign.details.ai.location,
              address: campaign.details.ai.address,
              category: campaign.details.ai.category,
              targetAudience: campaign.details.ai.targetAudience,
              start_at: auto.inicio,
              end_at: auto.fim,
              status: 'approved',
              isPublished: true,
              isBookable: false,
              approvalMethod: 'automatic_verified',
              timeConfirmed: auto.timeConfirmed,
              autoApprovalChecks: [],
              autoApprovalVersion: 1,
              autoApprovedAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });
            return 'auto_approved';
          }

           if (!extra) return 'unchanged';

            // Nao preencher datas publicas antes da revisao do administrador.
            const autoDates = {};

            const camposComparaveis = Object.keys(extra).filter(
              campo => campo !== 'extractedAt'
            );

            const houveAlteracao = camposComparaveis.some(campo => {
              return JSON.stringify(existing[campo] ?? null) !==
                JSON.stringify(extra[campo] ?? null);
            });

            if (!houveAlteracao && Object.keys(autoDates).length === 0) {
              return 'unchanged';
            }

            transaction.update(ref, {
              ...extra,
              ...autoDates,
              updatedAt: FieldValue.serverTimestamp(),
            });

            return 'updated';
        }
      );

      if (outcome === 'auto_approved') aprovadasAutomaticamente++;
      else if (outcome === 'added') added++;
      else if (outcome === 'updated') updated++;
      else unchanged++;

      console.log(`${outcome}: ${campaign.title}`);
    } catch (error) {
      failed++;

      console.error(
        `Falha ao gravar ${campaign.title}: ${error.message}`
      );
    }
  }

  console.log('\nResultado:', {
    encontradas: campaigns.length,
    adicionadas: added,
    aprovadasAutomaticamente,
    atualizadas: updated,
    semAlteracao: unchanged,
    falhas: failed,
  });

  if (failed > 0) {
    throw new Error(
      `${failed} campanha(s) falharam ao gravar.`
    );
  }
}

async function main() {
  console.log('==================================');
  console.log('AGENDA SAÚDE');
  console.log('Sincronização CE / Fortaleza');
  console.log('==================================');

  console.log(`IA: ${IA_ATIVA ? 'ATIVA' : 'DESATIVADA'}; limite Groq por execucao: ${LIMITE_ANALISES}`);
  console.log(`Publicacao automatica: ${AUTO_APROVAR ? 'HABILITADA' : 'DESATIVADA'}; Firestore: ${GRAVAR ? 'GRAVACAO' : 'PREVIA'}`);
  const campaigns = await findCampaigns();

  console.log(
    `\nTotal de candidatas: ${campaigns.length}`
  );

  if (!GRAVAR) {
    const aprovaveis = campaigns.filter(c => avaliarPublicacaoAutomatica(c).aprovar);
    console.log(`[PREVIA] Publicaveis automaticamente: ${aprovaveis.length}/${campaigns.length}`);
    for (const campanha of campaigns) {
      const decisao = avaliarPublicacaoAutomatica(campanha);
      console.log(`[PREVIA] ${decisao.aprovar ? 'PUBLICAR' : 'REVISAR'}: ${campanha.title}`);
      if (!decisao.aprovar) console.log(`  Pendencias: ${decisao.pendencias.join(', ')}`);
    }
    console.log(
      '\nMODO PRÉVIA: nenhuma gravação realizada.'
    );
    return;
  }

  if (campaigns.length === 0) {
    throw new Error(
      'Nenhuma campanha encontrada. Gravação cancelada.'
    );
  }

  await saveCampaigns(campaigns);

  console.log('\nSincronização concluída.');
}

main().catch(error => {
  console.error('Erro:', error.message);
  process.exitCode = 1;
});
