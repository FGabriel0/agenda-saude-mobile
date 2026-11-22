'use strict';
// Teste isolado das regras, sem Firebase, Groq ou Tavily.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const codigo = fs.readFileSync(path.join(__dirname, '..', 'sincronizar-campanhas.cjs'), 'utf8');
const inicio = codigo.indexOf('function avaliarPublicacaoAutomatica(');
const fim = codigo.indexOf('async function saveCampaigns(', inicio);
assert(inicio >= 0 && fim > inicio, 'Regras nao encontradas');
const contexto = { AUTO_APROVAR: true, todayFortaleza: () => '2099-11-22', Date };
vm.createContext(contexto);
vm.runInContext(codigo.slice(inicio, fim) + '\nthis.avaliar = avaliarPublicacaoAutomatica;', contexto);
const campanha = {
  source: { host: 'hemoce.ce.gov.br' },
  details: {
    periodConfidence: 'explicit_range', periodEvidence: 'entre os dias 23 e 29 de novembro',
    suggestedStartAt: '2099-11-23', suggestedEndAt: '2099-11-29',
    suggestedStartTime: '09:00', suggestedEndTime: '17:00',
    timeCandidates: [{ inicio: '09:00', fim: '17:00' }],
    ai: { isCampaign: true, dateEvidence: 'entre os dias 23 e 29 de novembro',
      startDate: '2099-11-23', endDate: '2099-11-29',
      startTime: '09:00', endTime: '17:00', timeEvidence: 'das 9h as 17h',
      location: 'Hemoce', address: 'Av. Exemplo, 123',
      locationEvidence: 'Hemoce', addressEvidence: 'Av. Exemplo, 123',
      description: 'Acao de saude', category: 'Doacao', targetAudience: 'Populacao' },
  },
};
assert.equal(contexto.avaliar(campanha).aprovar, true);
assert.equal(contexto.avaliar({ ...campanha, source: { host: 'hospital-privado.com.br' } }).aprovar, false);
assert.equal(contexto.avaliar({ ...campanha, details: { ...campanha.details, periodConfidence: 'ai_evidence_review_required' } }).aprovar, false);
assert.equal(contexto.avaliar({ ...campanha, details: { ...campanha.details, ai: { ...campanha.details.ai, addressEvidence: null } } }).aprovar, false);
assert.equal(contexto.avaliar({ ...campanha, details: { ...campanha.details, ai: { ...campanha.details.ai, endDate: '2099-11-28' } } }).aprovar, false);
const semHorario = { ...campanha, details: { ...campanha.details,
  suggestedStartTime: '09:00', suggestedEndTime: null, timeCandidates: [],
  ai: { ...campanha.details.ai, startDate: null, endDate: null, startTime: '09:00', endTime: null, timeEvidence: null }
} };
const avaliado = contexto.avaliar(semHorario);
assert.equal(avaliado.aprovar, true, 'Periodo comprovado deve valer mesmo sem horario completo e datas da IA');
assert.equal(avaliado.timeConfirmed, false);
assert.match(avaliado.inicio, /T00:00:00-03:00$/);
assert.match(avaliado.fim, /T23:59:00-03:00$/);
assert.equal(contexto.avaliar({ ...semHorario, details: { ...semHorario.details, timeCandidates: [{}, {}] } }).aprovar, false);
console.log('9 testes de aprovacao automatica passaram.');
