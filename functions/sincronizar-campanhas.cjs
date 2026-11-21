
'use strict';

const { createHash } = require('node:crypto');
const cheerio = require('cheerio');
const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

const PROJECT_ID = 'agenda-saude-4ea5b';
const GRAVAR = process.env.GRAVAR_FIRESTORE === 'true';

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
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'AgendaSaude/1.0',
      Accept: accept,
    },
    signal: AbortSignal.timeout(20000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${url}`);
  }

  return response;
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

function extractDetails(article, publicationDate) {
  const dates = extractDates(
    article.text,
    publicationDate
  );

  const times = extractTimes(article.text);

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

    // Apenas uma sugestão quando não há ambiguidade.
    suggestedStartAt:
      futureDates.length === 1
        ? futureDates[0].data
        : null,

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

  const MAX_PAGES = 3;
  const PER_PAGE = 50;
  const MAX_AGE_DAYS = 120;

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

    if (posts.length < PER_PAGE) break;

    // Interrompe páginas antigas quando a ordenação é recente.
    if (oldestDate < cutoff) break;
  }

  return [...result.values()];
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
        if (!all.has(campaign.url)) {
          all.set(campaign.url, campaign);
        } else {
          const existing = all.get(campaign.url);

          // Preserva a data de publicação mais informativa.
          if (
            !existing.publicationDate &&
            campaign.publicationDate
          ) {
            all.set(campaign.url, campaign);
          }
        }
      }
    } catch (error) {
      console.warn(
        `Falha na fonte ${source.name}: ${error.message}`
      );
    }
  }

  const results = [];

  for (const campaign of all.values()) {
    try {
      const response = await download(campaign.url);
      const html = await response.text();

      const article = extractArticle(html);

      const details = article.text
        ? extractDetails(
            article,
            campaign.publicationDate
          )
        : null;

      // Verificação adicional para notícias institucionais.
      if (
        EXCLUSIONS.some(term =>
          norm(campaign.title).includes(term)
        )
      ) {
        console.log(
          `Ignorada (informativa): ${campaign.title}`
        );
        continue;
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

      results.push({
        ...campaign,
        details,
      });
    } catch (error) {
      console.warn(
        `Falha ao consultar ${campaign.url}: ${error.message}`
      );

      results.push({
        ...campaign,
        details: null,
      });
    }
  }

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

function extractedFields(details) {
  if (!details) return null;

  return {
    extractedDescription: details.description,
    eventDateCandidates: details.eventDateCandidates,
    eventDateDetails: details.eventDateDetails,
    futureDateCandidates: details.futureDateCandidates,
    timeCandidates: details.timeCandidates,
    suggestedStartAt: details.suggestedStartAt,
    suggestedStartTime: details.suggestedStartTime,
    suggestedEndTime: details.suggestedEndTime,
    suggestedLocation: details.suggestedLocation,
    suggestedAddress: details.suggestedAddress,
    extractedAt: FieldValue.serverTimestamp(),
  };
}

async function saveCampaigns(campaigns) {
  const db = firestore();

  let added = 0;
  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (const campaign of campaigns) {
    const ref = db
      .collection('campaigns')
      .doc(`ce_${hash(campaign.url)}`);

    const extra = extractedFields(campaign.details);

    try {
      const outcome = await db.runTransaction(
        async transaction => {
          const snapshot = await transaction.get(ref);

          if (!snapshot.exists) {
            transaction.create(ref, {
              title: campaign.title,
              description:
                campaign.details?.description ||
                campaign.excerpt ||
                'Publicação identificada em fonte oficial.',

              source: campaign.source.name,
              sourceUrl: campaign.url,
              sourceType: 'official_news',

              scope: campaign.source.scope,
              city: campaign.source.city,
              state: campaign.source.state,

              publishedAt: campaign.publicationDate,

              // Não inventar dados de agendamento.
              location: null,
              address: null,
              start_at: null,
              end_at: null,

              status: 'pending_review',
              isPublished: false,

              // Compatibilidade com documentos antigos.
              // Não deve controlar agendamento.
              isBookable: false,

              manuallyEdited: false,

              ...(extra || {}),

              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
            });

            return 'added';
          }

          const existing = snapshot.data();

          // Não sobrescrever decisões ou edições do admin.
          if (
            existing.manuallyEdited === true ||
            existing.status === 'approved' ||
            existing.status === 'rejected'
          ) {
            return 'unchanged';
          }

          if (!extra) return 'unchanged';

          transaction.update(ref, {
            ...extra,
            updatedAt: FieldValue.serverTimestamp(),
          });

          return 'updated';
        }
      );

      if (outcome === 'added') added++;
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

  const campaigns = await findCampaigns();

  console.log(
    `\nTotal de candidatas: ${campaigns.length}`
  );

  if (!GRAVAR) {
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
