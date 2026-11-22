
'use strict';

const {
  initializeApp,
  cert,
  getApps,
} = require('firebase-admin/app');

const {
  getFirestore,
} = require('firebase-admin/firestore');

const {
  analisarCampanha,
} = require('./gemini-campanhas.cjs');

const PROJECT_ID = 'agenda-saude-4ea5b';

function conectarFirebase() {
  const credencial =
    process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!credencial) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT não configurado.'
    );
  }

  if (getApps().length === 0) {
    initializeApp({
      credential: cert(JSON.parse(credencial)),
      projectId: PROJECT_ID,
    });
  }

  return getFirestore();
}

async function main() {
  console.log('==================================');
  console.log('AGENDA SAÚDE - EXTRAÇÃO COM IA');
  console.log('==================================');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY não configurada.'
    );
  }

  const db = conectarFirebase();

  console.log('Firebase conectado.');
  console.log('Modelo: Gemini 3.8 Flash');
  console.log('Limite diário: 20 solicitações');
  console.log('Modo: TESTE\n');

  const campanha = {
    title:
      'Hemoce inicia Semana do Doador de Sangue',

    url:
      'https://www.hemoce.ce.gov.br/2026/11/18/hemoce-inicia-semana-do-doador-de-sangue-com-lancamento-de-nova-campanha-na-proxima-segunda-feira-23/',

    publicationDate: '2026-11-18',
  };

  const resultado = await analisarCampanha(
    db,
    campanha
  );

  console.log(
    '\nResultado da inteligência artificial:\n'
  );

  console.log(
    JSON.stringify(resultado, null, 2)
  );

  if (!resultado) {
    console.log(
      '\nAnálise não realizada ou IA indisponível.'
    );

    process.exitCode = 1;
    return;
  }

  console.log('\n==================================');
  console.log('Teste concluído com sucesso.');
  console.log('Nenhuma campanha foi alterada.');
  console.log('==================================');
}

main().catch(error => {
  console.error('\nErro:', error.message);
  process.exitCode = 1;
});
