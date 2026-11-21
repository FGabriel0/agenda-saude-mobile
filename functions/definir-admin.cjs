
const { initializeApp, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

async function executar() {
  const email = process.argv[2];
  const arquivo = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!email || !arquivo) {
    throw new Error(
      "Informe o e-mail e configure GOOGLE_APPLICATION_CREDENTIALS."
    );
  }

  const conta = require(require("node:path").resolve(arquivo));

  if (conta.project_id !== "agenda-saude-4ea5b") {
    throw new Error("Projeto Firebase incorreto.");
  }

  initializeApp({ credential: cert(conta) });

  const auth = getAuth();
  const usuario = await auth.getUserByEmail(email);

  await auth.setCustomUserClaims(usuario.uid, {
    ...usuario.customClaims,
    admin: true
  });

  console.log("Permissão administrativa atribuída com sucesso.");
  console.log("UID:", usuario.uid);
}

executar().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
