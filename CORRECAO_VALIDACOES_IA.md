# Agenda Saúde — correção consolidada das validações da IA

## O que foi corrigido

- Períodos explícitos encontrados no texto da notícia podem ser usados mesmo quando o Groq não retorna as datas. Datas conflitantes informadas pela IA continuam impedindo publicação.
- Horário de abertura isolado não é tratado como horário de atendimento. Quando não há horário completo e comprovado, o sistema publica apenas o período e marca `timeConfirmed=false`.
- O calendário apresenta "Não informado" em vez de mostrar horários técnicos (00:00 e 23:59) para essas campanhas.
- Vários horários contraditórios continuam exigindo revisão.
- SESA permanece no coletor com alternativas de consulta; falhas não interrompem as outras fontes.
- Fontes privadas continuam sendo coletadas, mas não são aprovadas automaticamente sem autorização explícita.

## Instalação

Faça backup do projeto e substitua pelos arquivos deste ZIP. O ZIP não contém chaves `.env` nem credenciais. Execute na raiz do projeto:

```powershell
npm install
cd functions
npm install
node --check .\sincronizar-campanhas.cjs
node .\tests\validar-autoaprovacao.cjs
cd ..
npx tsc --noEmit
```

## Prévia (não grava no Firebase)

Na pasta `functions`:

```powershell
$env:GRAVAR_FIRESTORE = 'false'
$env:AUTO_APROVAR_CAMPANHAS = 'true'
$env:IA_ATIVA = 'true'
$env:GROQ_ANALISES_POR_EXECUCAO = '3'
node .\sincronizar-campanhas.cjs
```

O teste pode identificar campanhas publicáveis, mas não grava nada. Se houver `horarios_nao_confirmados` em notícias com apenas horário de abertura, confirme que os arquivos foram substituídos.

## Gravação e ativação

Só habilite `GRAVAR_FIRESTORE=true` depois de conferir a prévia, a compilação e a segurança do painel administrativo. Para testar a gravação sem publicação automática, use `AUTO_APROVAR_CAMPANHAS=false`. Para habilitar publicação automática após a validação, use ambas as variáveis como `true`. Isso publica campanhas que atendam às regras de evidência e fonte autorizada; não equivale a garantir que a notícia esteja correta.

**Observação:** os testes locais não consultam APIs externas nem Firestore. Os horários 00:00 e 23:59 são limites técnicos de período e nunca devem ser anunciados como horários reais.
