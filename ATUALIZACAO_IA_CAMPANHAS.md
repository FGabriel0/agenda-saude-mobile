# Agenda Saúde — atualização consolidada de coleta e aprovação

## O que foi alterado

- **Tavily:** 8 consultas temáticas alternadas por dia; ampliação para órgãos municipais/estaduais, universidades, hospitais e organizações institucionais. Mantém **SESA**, Hemoce e Fortaleza. Consultas limitadas por execução.
- **Groq:** mantém extração com evidências e controle de chamadas; não usa a IA para inventar horários, locais ou datas.
- **Publicação automática:** habilitada por `AUTO_APROVAR_CAMPANHAS=true`, apenas se a fonte for Hemoce, SESA ou Prefeitura de Fortaleza e se **todas** as verificações de período, horário, endereço, evidências e coerência forem aprovadas. Outras fontes, inclusive privadas, entram em `pending_review` até que haja uma política de verificação e lista de domínios confiáveis.
- **Firestore:** campanhas novas podem ser aprovadas automaticamente; sugestões pendentes também podem ser promovidas quando obtiverem evidências suficientes. Documentos aprovados, rejeitados ou editados manualmente nunca são sobrescritos pelo coletor.
- **Admin:** exibe origem da aprovação. Campanhas de divulgação não são automaticamente agendáveis.
- **Calendário:** campanhas com duração de vários dias aparecem em todos os dias entre início e fim.
- **GitHub Actions:** workflow diário com secrets Groq, Tavily e Firebase, e duas variáveis de segurança para habilitar gravação e publicação. Sem essas variáveis, roda somente prévia.

## Segurança e limitações

**Não foi feita conexão real com o seu Firebase nem com as APIs neste ambiente.** A sintaxe dos scripts e os testes locais das regras foram verificados. O teste TypeScript completo depende da instalação das dependências do projeto (não concluída neste ambiente). Não habilite publicação real sem revisar as campanhas previstas na prévia e conferir as regras de acesso do Firestore no projeto remoto.

**Campanhas privadas:** são pesquisadas e armazenadas como pendentes, não aprovadas automaticamente. Não é seguro permitir publicação automática indiscriminada de sites comerciais ou anúncios sem uma política de fontes verificadas. O projeto mantém revisão administrativa para esses casos.

**Limites gratuitos:** as APIs têm limites definidos pelos fornecedores e podem mudar. O script interrompe buscas Tavily em HTTP 402/429; o Groq interrompe análise em HTTP 429. Não configure faturamento para essa atualização.

## Instalação local (PowerShell, na raiz do projeto)

```powershell
cd functions
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
# Se já existir .env, ele será preservado.
notepad .env
```

Configure em `functions/.env` (não compartilhe as chaves):

```dotenv
GROQ_API_KEY=SUA_CHAVE
TAVILY_API_KEY=SUA_CHAVE
IA_ATIVA=true
GROQ_ANALISES_POR_EXECUCAO=3
TAVILY_BUSCAS_POR_EXECUCAO=2
GRAVAR_FIRESTORE=false
AUTO_APROVAR_CAMPANHAS=true
```

Se usar gravação local, configure `FIREBASE_SERVICE_ACCOUNT` com o JSON da conta de serviço **somente no ambiente seguro**, nunca no Git.

```powershell
node --check .\sincronizar-campanhas.cjs
node --check .\tavily-pesquisa.cjs
node .\tests\validar-autoaprovacao.cjs
node .\sincronizar-campanhas.cjs
```

A prévia mostrará `[PREVIA] PUBLICAR` ou `[PREVIA] REVISAR` para cada campanha, sem gravar. **Não é necessário mudar `GRAVAR_FIRESTORE` para avaliar a decisão automática.**

Após conferir as evidências, caso deseje habilitar gravação real, altere `GRAVAR_FIRESTORE=true`. Atenção: com `AUTO_APROVAR_CAMPANHAS=true`, campanhas qualificadas serão publicadas imediatamente. Para primeiro teste de gravação sem publicar, use `AUTO_APROVAR_CAMPANHAS=false`.

## Automação diária no GitHub

Em **Settings → Secrets and variables → Actions**:

**Repository secrets**: `GROQ_API_KEY`, `TAVILY_API_KEY`, `FIREBASE_SERVICE_ACCOUNT` (JSON completo da conta de serviço).

**Repository variables**: `AGENDA_GRAVAR_AUTOMATICO=true` e `AGENDA_PUBLICAR_AUTOMATICO=true` **somente depois** de validar a prévia e a gravação de teste.

O agendamento existente é 10:00 UTC, aproximadamente 07:00 em Fortaleza. `workflow_dispatch` permite execução manual, com gravação e aprovação desativadas por padrão.

## Testes finais recomendados

1. Rodar `npm ci` na raiz e `npx tsc --noEmit`.
2. Rodar `npm ci` em `functions` e o teste `node tests/validar-autoaprovacao.cjs`.
3. Executar a prévia, conferir URLs, horários e endereços.
4. Executar gravação com `AUTO_APROVAR_CAMPANHAS=false`, confirmar pendentes no painel.
5. Validar uma campanha qualificada para aprovação automática, conferir `approvalMethod=automatic_verified` no Firestore e exibição no app.
6. Confirmar que campanhas rejeitadas e editadas manualmente não são alteradas pela próxima sincronização.
7. Conferir regras de segurança Firestore antes de ativar publicação automática em produção.

## Arquivos alterados

- `functions/sincronizar-campanhas.cjs`
- `functions/tavily-pesquisa.cjs`
- `functions/tests/validar-autoaprovacao.cjs`
- `functions/.env.example`
- `src/screens/AdminCampanhasScreen.tsx`
- `src/services/campaigns.ts`
- `.github/workflows/sincronizar-campanhas.yml`
- `.gitignore`
