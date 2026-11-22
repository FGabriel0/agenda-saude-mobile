'use strict';
require('dotenv').config({ path: require('node:path').join(__dirname, '.env'), quiet: true });

// Consultas rotativas e datadas para reduzir repeticao e noticias antigas.
const AGORA = new Date();
const MES = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'America/Fortaleza' }).format(AGORA);
const ANO = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'America/Fortaleza' }).format(AGORA);
const PROXIMO = new Date(AGORA.getTime() + 35 * 86400000);
const MES_PROXIMO = new Intl.DateTimeFormat('pt-BR', { month: 'long', timeZone: 'America/Fortaleza' }).format(PROXIMO);
const ANO_PROXIMO = new Intl.DateTimeFormat('pt-BR', { year: 'numeric', timeZone: 'America/Fortaleza' }).format(PROXIMO);
const CONSULTAS = [
  `mutirão de saúde vacinação exames gratuitos Fortaleza ${MES} ${ANO} programação`,
  `campanha de doação de sangue coleta externa Hemoce Ceará ${MES} ${ANO}`,
  `ação de saúde gratuita atendimento exames Fortaleza Caucaia Maracanaú Eusébio ${MES} ${ANO}`,
  `prefeitura vacinação dia D mutirão saúde Sobral Juazeiro do Norte Crato ${MES} ${ANO}`,
  `hospital Santa Casa universidade UFC UECE Unifor campanha saúde gratuita Ceará ${MES} ${ANO}`,
  `ONG instituto associação campanha prevenção testagem gratuita Fortaleza Ceará ${MES} ${ANO}`,
  `secretaria municipal de saúde Ceará campanha vacinação mutirão próximos dias ${MES} ${ANO}`,
  `saúde da mulher novembro azul saúde do homem exame gratuito Ceará ${MES} ${ANO}`,
  `hospital clínica faculdade ação comunitária saúde Fortaleza ${MES_PROXIMO} ${ANO_PROXIMO}`,
  `campanha vacinação dengue influenza multivacinação Ceará ${MES_PROXIMO} ${ANO_PROXIMO}`,
];
const TERMOS = /campanha|vacina|imuniza|mutir[aã]o|doa[cç][aã]o|coleta de sangue|testagem|exames? gratuit|atendimento gratuit|a[cç][aã]o de sa[uú]de|preven[cç][aã]o|outubro rosa|novembro azul|sa[uú]de da mulher|sa[uú]de do homem/i;
const LOCAL = /fortaleza|cear[aá]|\bce\b|sobral|juazeiro do norte|caucaia|maracana[uú]|crato|itapipoca|quixad[aá]|iguatu|aquiraz|pacatuba|eusebio|eus[eé]bio|maranguape|canind[eé]/i;
const HOSTS_BLOQUEADOS = /(^|\.)(localhost|facebook\.com|instagram\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|pinterest\.com|linkedin\.com|google\.com|bing\.com)$/i;

function numero(nome, padrao, minimo, maximo) {
  const valor = Number(process.env[nome]);
  return Number.isFinite(valor) && valor >= minimo ? Math.min(maximo, Math.floor(valor)) : padrao;
}
function urlSegura(value) {
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const host = u.hostname.toLowerCase();
    if (!host.includes('.') || HOSTS_BLOQUEADOS.test(host) || /^(?:\d+\.){3}\d+$/.test(host) || host.endsWith('.local')) return null;
    if (/\.(?:pdf|zip|exe|jpg|jpeg|png|mp4|docx?)$/i.test(u.pathname)) return null;
    u.hash = '';
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    for (const key of [...u.searchParams.keys()]) if (/^utm_|^(?:fbclid|gclid)$/i.test(key)) u.searchParams.delete(key);
    return u.toString();
  } catch { return null; }
}
function dataPublicacao(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}
async function pesquisarCampanhas() {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) { console.warn('[Tavily] TAVILY_API_KEY ausente; pesquisa geral desativada.'); return []; }
  const quantidade = numero('TAVILY_CONSULTAS_POR_EXECUCAO', 6, 1, CONSULTAS.length);
  const porConsulta = numero('TAVILY_RESULTADOS_POR_CONSULTA', 8, 1, 20);
  // Alterna os grupos de pesquisa por dia, mantendo cobertura geografica.
  const rotacao = AGORA.getUTCDate() % CONSULTAS.length;
  const consultas = [...CONSULTAS.slice(rotacao), ...CONSULTAS.slice(0, rotacao)].slice(0, quantidade);
  const diasBusca = numero('TAVILY_DIAS_RECENTES', 14, 1, 90);
  const encontrados = new Map();
  console.log(`[Tavily] Busca geral: ${consultas.length} consultas, ate ${porConsulta} resultados por consulta, sem restricao de dominio.`);
  for (let i = 0; i < consultas.length; i++) {
    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ query: consultas[i], search_depth: 'basic', topic: 'general', max_results: porConsulta, include_answer: false, include_images: false, include_raw_content: false, days: diasBusca }),
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) {
        const body = (await response.text()).slice(0, 200);
        console.warn(`[Tavily] Consulta ${i + 1}: HTTP ${response.status} ${body}`);
        if ([401, 402, 403, 429].includes(response.status)) break;
        continue;
      }
      const data = await response.json();
      let aceitos = 0;
      for (const item of data.results || []) {
        const url = urlSegura(item.url);
        const title = String(item.title || '').trim();
        const resumo = String(item.content || '').trim();
        if (!url || title.length < 12 || !TERMOS.test(`${title} ${resumo}`)) continue;
        if (/\b(?:202[0-4]|201\d)\b/.test(title) && !/\b202[6-9]\b/.test(title)) continue;
        if (!LOCAL.test(`${title} ${resumo} ${url}`)) continue;
        const host = new URL(url).hostname.replace(/^www\./, '');
        const source = {
          name: `Tavily - ${host}`,
          url: `https://${host}/`,
          host,
          kind: 'search',
          scope: 'estadual',
          city: null,
          state: 'CE',
        };
        if (!encontrados.has(url)) {
          encontrados.set(url, { title, url, source, publicationDate: dataPublicacao(item.published_date), excerpt: resumo.slice(0, 1000), tavilyContent: resumo.slice(0, 5000), viaTavily: true });
          aceitos++;
        }
      }
      console.log(`[Tavily] Consulta ${i + 1}/${consultas.length}: ${aceitos} novas URLs; total ${encontrados.size}.`);
    } catch (error) {
      console.warn(`[Tavily] Consulta ${i + 1} falhou: ${error.message}`);
    }
  }
  return [...encontrados.values()];
}
module.exports = { pesquisarCampanhas };
