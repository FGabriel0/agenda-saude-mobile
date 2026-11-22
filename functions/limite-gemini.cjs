
'use strict';

const {
  FieldValue,
} = require('firebase-admin/firestore');

const LIMITE_DIARIO = 20;
const INTERVALO_MS = 15000;

function dataDaCota() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function referencia(db) {
  return db
    .collection('ai_usage')
    .doc(`gemini_${dataDaCota()}`);
}

const esperar = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

async function reservarSolicitacao(db) {
  const ref = referencia(db);

  while (true) {
    const resultado = await db.runTransaction(
      async transaction => {
        const snapshot = await transaction.get(ref);
        const dados = snapshot.data() || {};

        const utilizadas = Number(
          dados.requests || 0
        );

        if (
          dados.blocked === true ||
          utilizadas >= LIMITE_DIARIO
        ) {
          return { permitida: false };
        }

        const agora = Date.now();

        const espera = Math.max(
          0,
          Number(dados.nextAllowedAt || 0) - agora
        );

        if (espera > 0) {
          return {
            permitida: false,
            espera,
          };
        }

        transaction.set(ref, {
          provider: 'gemini',
          model: 'gemini-3.8-flash',
          date: dataDaCota(),
          requests: utilizadas + 1,
          limit: LIMITE_DIARIO,
          nextAllowedAt: agora + INTERVALO_MS,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        return {
          permitida: true,
          utilizadas: utilizadas + 1,
        };
      }
    );

    if (resultado.espera) {
      await esperar(resultado.espera);
      continue;
    }

    if (!resultado.permitida) {
      console.log(
        '[IA] Limite gratuito indisponivel hoje.'
      );

      return false;
    }

    console.log(
      `[IA] Uso diario: ${resultado.utilizadas}/${LIMITE_DIARIO}`
    );

    return true;
  }
}

async function bloquearDia(db, motivo) {
  await referencia(db).set({
    blocked: true,
    reason: String(motivo),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log(
    '[IA] Solicitacoes suspensas ate a proxima cota.'
  );
}

module.exports = {
  reservarSolicitacao,
  bloquearDia,
  esperar,
};
