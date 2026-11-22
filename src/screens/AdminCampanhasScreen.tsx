import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

import {
  getIdTokenResult,
  onAuthStateChanged,
} from 'firebase/auth';

import {
  auth,
  authReady,
  db,
} from '../lib/firebase';

type DataCandidata = {
  data: string;
  trecho: string;
};

type HorarioCandidato = {
  inicio: string;
  fim: string;
  trecho: string;
};

type Campaign = {
  firestoreId: string;
  title: string;
  description: string;
  status: string;
  approvalMethod: string;
  start_at: unknown;
  end_at: unknown;
  suggestedStartAt: string;
  suggestedEndAt: string;
  suggestedStartTime: string;
  suggestedEndTime: string;
  suggestedPeriodEvidence: string;
  location: string;
  address: string;
  eventDateCandidates: DataCandidata[];
  timeCandidates: HorarioCandidato[];
  suggestedLocation: string;
  suggestedAddress: string;
  aiTitle: string;
  aiDescription: string;
  aiCategory: string;
  aiStartDate: string;
  aiEndDate: string;
  aiStartTime: string;
  aiEndTime: string;
  aiLocation: string;
  aiAddress: string;
  aiDateEvidence: string;
  aiTimeEvidence: string;
  aiLocationEvidence: string;
  aiAddressEvidence: string;
  sourceUrl: string;
};

type FormData = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  location: string;
  address: string;
};

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor : '';
}

function lerData(valor: unknown): Date | null {
  if (!valor) return null;

  let data: Date;

  if (typeof valor === 'string') {
    data = new Date(valor);
  } else if (
    typeof valor === 'object' &&
    'toDate' in valor &&
    typeof valor.toDate === 'function'
  ) {
    data = valor.toDate() as Date;
  } else {
    return null;
  }

  return Number.isNaN(data.getTime()) ? null : data;
}

function partesDataLocal(valor: unknown) {
  const data = lerData(valor);
  if (!data) return null;

  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Fortaleza',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(data);

  const obter = (tipo: string) =>
    partes.find(p => p.type === tipo)?.value ?? '';

  return {
    data: `${obter('year')}-${obter('month')}-${obter('day')}`,
    hora: `${obter('hour')}:${obter('minute')}`,
  };
}

function validarData(valor: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [ano, mes, dia] = valor.split('-').map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function validarHora(valor: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(valor);
}

function paraISO(data: string, hora: string) {
  return new Date(
    `${data}T${hora}:00-03:00`
  ).toISOString();
}

function dataSugerida(valor: string): string {
  if (!valor) return '';
  const encontrada = valor.match(/^\d{4}-\d{2}-\d{2}/);
  return encontrada && validarData(encontrada[0]) ? encontrada[0] : '';
}

function criarFormulario(c: Campaign): FormData {
  const inicio = partesDataLocal(c.start_at);
  const fim = partesDataLocal(c.end_at);

  // Somente uma data candidata pode preencher o início; várias datas
  // distintas não devem ser interpretadas como um período.
  const datas = [...new Set(c.eventDateCandidates
    .map(item => typeof item === 'string' ? item : item?.data)
    .filter((item): item is string => typeof item === 'string' && validarData(item)))];
  const dataUnica = datas.length === 1 ? datas[0] : '';
  const horarioSugerido = c.timeCandidates.length === 1
    ? c.timeCandidates[0] : null;

  return {
    title: c.title,
    description: c.description,
    startDate: inicio?.data || dataSugerida(c.suggestedStartAt) || dataSugerida(c.aiStartDate) || dataUnica,
    endDate: fim?.data || dataSugerida(c.suggestedEndAt) || dataSugerida(c.aiEndDate),
    startTime: inicio?.hora || c.suggestedStartTime || c.aiStartTime || horarioSugerido?.inicio || '',
    endTime: fim?.hora || c.suggestedEndTime || c.aiEndTime || horarioSugerido?.fim || '',
    location: c.location || c.suggestedLocation || c.aiLocation,
    address: c.address || c.suggestedAddress || c.aiAddress,
  };
}

export default function AdminCampanhasScreen() {
  const [autorizado, setAutorizado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [campanhas, setCampanhas] = useState<Campaign[]>([]);
  const [selecionada, setSelecionada] =
    useState<string | null>(null);

  const [form, setForm] = useState<FormData | null>(null);
  const [erro, setErro] = useState('');
  const [filtro, setFiltro] = useState<'pending_review' | 'approved' | 'rejected' | 'all'>('pending_review');

  const carregarCampanhas = useCallback(async () => {
    setCarregando(true);
    setErro('');

    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error('Sessão não encontrada.');
      }

      const token = await getIdTokenResult(usuario, true);

      if (token.claims.admin !== true) {
        throw new Error(
          'Acesso administrativo não autorizado.'
        );
      }

      const snapshot = await getDocs(
        query(
          collection(db, 'campaigns'),
          orderBy('title')
        )
      );

      const dados: Campaign[] = snapshot.docs.map(
        documento => {
          const d = documento.data();

          return {
            firestoreId: documento.id,
            title: texto(d.title),
            description: texto(d.description),
            status: texto(d.status) || 'pending_review',
            approvalMethod: texto(d.approvalMethod),
            start_at: d.start_at ?? null,
            end_at: d.end_at ?? null,
            suggestedStartAt: texto(d.suggestedStartAt),
            suggestedEndAt: texto(d.suggestedEndAt),
            suggestedStartTime: texto(d.suggestedStartTime),
            suggestedEndTime: texto(d.suggestedEndTime),
            suggestedPeriodEvidence: texto(d.suggestedPeriodEvidence || d.periodEvidence),
            location: texto(d.location),
            address: texto(d.address),
            eventDateCandidates:
              Array.isArray(d.eventDateCandidates)
                ? d.eventDateCandidates
                : [],
            timeCandidates:
              Array.isArray(d.timeCandidates)
                ? d.timeCandidates
                : [],
            suggestedLocation:
              texto(d.suggestedLocation),
            suggestedAddress:
              texto(d.suggestedAddress),
            aiTitle: texto(d.aiTitle),
            aiDescription: texto(d.aiDescription),
            aiCategory: texto(d.aiCategory),
            aiStartDate: texto(d.aiStartDate),
            aiEndDate: texto(d.aiEndDate),
            aiStartTime: texto(d.aiStartTime),
            aiEndTime: texto(d.aiEndTime),
            aiLocation: texto(d.aiLocation),
            aiAddress: texto(d.aiAddress),
            aiDateEvidence: texto(d.aiDateEvidence),
            aiTimeEvidence: texto(d.aiTimeEvidence),
            aiLocationEvidence: texto(d.aiLocationEvidence),
            aiAddressEvidence: texto(d.aiAddressEvidence),
            sourceUrl: texto(d.sourceUrl),
          };
        }
      );

      setCampanhas(dados);
    } catch (e: any) {
      setErro(
        e?.message || 'Erro ao carregar campanhas.'
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    let unsubscribe: (() => void) | undefined;

    async function iniciar() {
      try {
        await authReady;
        if (!ativo) return;

        unsubscribe = onAuthStateChanged(
          auth,
          async usuario => {
            if (!usuario) {
              if (ativo) {
                setAutorizado(false);
                setVerificando(false);
              }
              return;
            }

            try {
              const token = await getIdTokenResult(
                usuario,
                true
              );

              if (!ativo) return;

              setAutorizado(
                token.claims.admin === true
              );
              setVerificando(false);
            } catch {
              if (ativo) {
                setAutorizado(false);
                setVerificando(false);
              }
            }
          }
        );
      } catch {
        if (ativo) {
          setAutorizado(false);
          setVerificando(false);
        }
      }
    }

    iniciar();

    return () => {
      ativo = false;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (autorizado) {
      carregarCampanhas();
    }
  }, [autorizado, carregarCampanhas]);

  function editar(campanha: Campaign) {
    setSelecionada(campanha.firestoreId);
    setForm(criarFormulario(campanha));
    setErro('');
  }

  function alterar(
    campo: keyof FormData,
    valor: string
  ) {
    setForm(anterior =>
      anterior
        ? { ...anterior, [campo]: valor }
        : anterior
    );
  }

  async function salvar(
    acao: 'draft' | 'approve' | 'reject'
  ) {
    if (!selecionada || !form || salvando) {
      return;
    }

    // Rejeitar nao exige preencher campos que nao foram confirmados.
    // Rascunhos podem ficar incompletos; aprovacao exige dados completos.
    if (acao !== 'reject') {
      if (!form.title.trim()) {
        setErro('Informe o título.');
        return;
      }
      if (form.startDate && !validarData(form.startDate)) {
        setErro('Data de início inválida. Use AAAA-MM-DD.');
        return;
      }
      if (form.endDate && !validarData(form.endDate)) {
        setErro('Data de término inválida. Use AAAA-MM-DD.');
        return;
      }
      if (form.startTime && !validarHora(form.startTime)) {
        setErro('Horário inicial inválido. Use HH:MM.');
        return;
      }
      if (form.endTime && !validarHora(form.endTime)) {
        setErro('Horário final inválido. Use HH:MM.');
        return;
      }
      if (form.startTime && !form.startDate) {
        setErro('Informe a data correspondente ao horário inicial.');
        return;
      }
      if (form.endTime && !form.endDate) {
        setErro('Informe a data correspondente ao horário final.');
        return;
      }
      if (form.endDate && !form.startDate) {
        setErro('Informe a data de início da campanha.');
        return;
      }
      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        setErro('A data de término não pode ser anterior à data de início.');
        return;
      }
      if (form.startDate && form.endDate && form.startTime && form.endTime &&
          `${form.endDate}T${form.endTime}` <= `${form.startDate}T${form.startTime}`) {
        setErro('O término deve ocorrer depois do início.');
        return;
      }
    }

    if (acao === 'approve') {
      if (!form.description.trim() || !form.startDate || !form.endDate ||
          !form.startTime || !form.endTime || !form.location.trim() || !form.address.trim()) {
        setErro('Para aprovar, informe descrição, datas, horários, local e endereço.');
        return;
      }
    }

    setSalvando(true);
    setErro('');

    try {
      const usuario = auth.currentUser;

      if (!usuario) {
        throw new Error('Faça login novamente.');
      }

      const token = await getIdTokenResult(
        usuario,
        true
      );

      if (token.claims.admin !== true) {
        throw new Error(
          'Você não possui permissão administrativa.'
        );
      }

       const campanhaAtual = campanhas.find(c => c.firestoreId === selecionada);
       if (!campanhaAtual) throw new Error('Campanha não encontrada. Atualize a lista.');

       const aprovada = acao === 'approve';
       const rejeitada = acao === 'reject';
       // Rascunho de uma campanha publicada permanece publicado.
       // Para retirar do ar, use Rejeitar explicitamente.
       const manterPublicada = acao === 'draft' && campanhaAtual.status === 'approved';
       if (manterPublicada) {
         const completo = form.description.trim() && form.startDate && form.endDate &&
           form.startTime && form.endTime && form.location.trim() && form.address.trim();
         if (!completo) {
           throw new Error('Para manter uma campanha publicada, preserve os dados completos. Use Rejeitar para retirar do ar.');
         }
       }

       const alteracoes = rejeitada
         ? {
             status: 'rejected',
             isPublished: false,
             isBookable: false,
             manuallyEdited: true,
             approvalMethod: 'manual_rejected',
             updatedAt: serverTimestamp(),
           }
         : {
             title: form.title.trim(),
             description: form.description.trim(),
             start_at: form.startDate && form.startTime
               ? paraISO(form.startDate, form.startTime) : null,
             end_at: form.endDate && form.endTime
               ? paraISO(form.endDate, form.endTime) : null,
             location: form.location.trim(),
             address: form.address.trim(),
             // Horários somente confirmados após salvamento manual completo.
             timeConfirmed: Boolean(form.startDate && form.endDate && form.startTime && form.endTime),
             status: aprovada || manterPublicada ? 'approved' : 'pending_review',
             isPublished: aprovada || manterPublicada,
             isBookable: false,
             approvalMethod: aprovada ? 'manual' : (manterPublicada ? campanhaAtual.approvalMethod : null),
             manuallyEdited: true,
             updatedAt: serverTimestamp(),
           };

       await updateDoc(doc(db, 'campaigns', selecionada), alteracoes);

      setSelecionada(null);
      setForm(null);

      await carregarCampanhas();

      const mensagem = aprovada
        ? 'Campanha aprovada e publicada!'
        : 'Campanha atualizada com sucesso!';

      if (Platform.OS === 'web') {
        window.alert(mensagem);
      } else {
        Alert.alert('Sucesso', mensagem);
      }
    } catch (e: any) {
      setErro(
        e?.message || 'Não foi possível salvar.'
      );
    } finally {
      setSalvando(false);
    }
  }

  if (verificando) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator
          size="large"
          color="#008767"
        />
        <Text>Verificando acesso...</Text>
      </View>
    );
  }

  if (!autorizado) {
    return (
      <View style={styles.centro}>
        <Text style={styles.titulo}>
          Acesso restrito
        </Text>
        <Text>
          Esta área é exclusiva para administradores.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
    >
      <Text style={styles.titulo}>
        Administração de campanhas
      </Text>

      <TouchableOpacity
        style={styles.botao}
        onPress={carregarCampanhas}
        disabled={carregando}
      >
        <Text style={styles.textoBotao}>
          {carregando
            ? 'Carregando...'
            : 'Atualizar lista'}
        </Text>
      </TouchableOpacity>

      {!!erro && (
        <Text style={styles.erro}>{erro}</Text>
      )}

       <View style={styles.filtros}>
         {(['pending_review', 'approved', 'rejected', 'all'] as const).map(opcao => (
           <TouchableOpacity
             key={opcao}
             style={[
             styles.filtroBotao,
              filtro === opcao && styles.filtroBotaoAtivo,
              ]}
             onPress={() => setFiltro(opcao)}
           >
             <Text style={[styles.filtroTexto, filtro === opcao && styles.filtroTextoAtivo]}>
               {{ pending_review: 'Pendentes', approved: 'Aprovadas', rejected: 'Rejeitadas', all: 'Todas' }[opcao]}
             </Text>
           </TouchableOpacity>
         ))}
       </View>

       {campanhas.filter(c => filtro === 'all' || c.status === filtro).map(campanha => (
        <View
          key={campanha.firestoreId}
          style={styles.cartao}
        >
          <Text style={styles.nome}>
            {campanha.title}
          </Text>

          <Text style={styles.descricao} numberOfLines={3}>
            {campanha.description || "Sem descrição disponível."}
          </Text>

          <Text style={styles.status}>
            Status: {campanha.status}{campanha.approvalMethod === 'automatic_verified' ? ' · Aprovada automaticamente' : campanha.approvalMethod === 'manual' ? ' · Aprovada manualmente' : ''}
          </Text>

          {!!campanha.sourceUrl && (
            <Text style={styles.sugestao} selectable>Fonte oficial: {campanha.sourceUrl}</Text>
          )}
          {!!campanha.aiDescription && (
            <View>
              <Text style={styles.sugestao}>Sugestão da IA ({campanha.aiCategory || 'Outros'}): {campanha.aiDescription}</Text>
              {!!campanha.aiDateEvidence && <Text style={styles.sugestao}>Evidência de data: {campanha.aiDateEvidence}</Text>}
              {!!campanha.aiTimeEvidence && <Text style={styles.sugestao}>Evidência de horário: {campanha.aiTimeEvidence}</Text>}
              {!!campanha.aiLocationEvidence && <Text style={styles.sugestao}>Evidência de local: {campanha.aiLocationEvidence}</Text>}
              {!!campanha.aiAddressEvidence && <Text style={styles.sugestao}>Evidência de endereço: {campanha.aiAddressEvidence}</Text>}
            </View>
          )}
          {!!(campanha.suggestedStartAt || campanha.suggestedEndAt) && (
            <Text style={styles.sugestao}>
              Período sugerido: {dataSugerida(campanha.suggestedStartAt) || 'não identificado'}
              {' até '}{dataSugerida(campanha.suggestedEndAt) || 'não identificado'}
            </Text>
          )}

          {selecionada === campanha.firestoreId &&
          form ? (
            <View style={styles.formulario}>
              <Text style={styles.rotulo}>
                Título
              </Text>
              <TextInput
                style={styles.input}
                value={form.title}
                onChangeText={v => alterar('title', v)}
              />

              <Text style={styles.rotulo}>
                Descrição
              </Text>
              <TextInput
                style={[styles.input, styles.multilinha]}
                multiline
                value={form.description}
                onChangeText={v =>
                  alterar('description', v)
                }
              />

              <Text style={styles.rotulo}>
                Data de início (AAAA-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2026-11-23"
                value={form.startDate}
                onChangeText={v => alterar('startDate', v)}
              />

              <Text style={styles.rotulo}>
                Data de término (AAAA-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2026-11-29"
                value={form.endDate}
                onChangeText={v => alterar('endDate', v)}
              />

              <Text style={styles.rotulo}>
                Horário inicial (HH:MM)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="08:00"
                value={form.startTime}
                onChangeText={v =>
                  alterar('startTime', v)
                }
              />

              <Text style={styles.rotulo}>
                Horário final (HH:MM)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="13:00"
                value={form.endTime}
                onChangeText={v =>
                  alterar('endTime', v)
                }
              />

              <Text style={styles.rotulo}>
                Local
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Passeio Público"
                value={form.location}
                onChangeText={v =>
                  alterar('location', v)
                }
              />

              <Text style={styles.rotulo}>
                Endereço
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Rua, número, bairro, cidade"
                value={form.address}
                onChangeText={v =>
                  alterar('address', v)
                }
              />

              <TouchableOpacity
                style={styles.botao}
                disabled={salvando}
                onPress={() => salvar('draft')}
              >
                <Text style={styles.textoBotao}>
                  Salvar rascunho
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.botao}
                disabled={salvando}
                onPress={() => salvar('approve')}
              >
                <Text style={styles.textoBotao}>
                  {salvando
                    ? 'Salvando...'
                    : 'Salvar e aprovar'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.botao, styles.vermelho]}
                disabled={salvando}
                onPress={() => salvar('reject')}
              >
                <Text style={styles.textoBotao}>
                  Rejeitar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelar}
                onPress={() => {
                  setSelecionada(null);
                  setForm(null);
                  setErro('');
                }}
              >
                <Text>Cancelar edição</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.botao}
              onPress={() => editar(campanha)}
            >
              <Text style={styles.textoBotao}>
                Editar campanha
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ))}

      {!carregando && campanhas.length === 0 && (
        <Text>Nenhuma campanha encontrada.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    filtros: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },

  filtroBotao: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#E7EFEC',
    borderWidth: 1,
    borderColor: '#CEDBD6',
  },

  filtroBotaoAtivo: {
    backgroundColor: '#008767',
    borderColor: '#008767',
  },

  filtroTexto: {
    fontSize: 14,
    fontWeight: '600',
    color: '#008767',
  },

  filtroTextoAtivo: {
    color: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F3F7F6',
  },
  conteudo: {
    padding: 20,
    paddingBottom: 50,
    gap: 14,
  },
  centro: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  titulo: {
    fontSize: 24,
    fontWeight: '700',
    color: '#008767',
    marginBottom: 8,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  nome: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1C2926',
  },
  descricao: {
    fontSize: 14,
    color: '#555555',
  },
  status: {
    fontWeight: '600',
    color: '#333333',
  },
  formulario: {
    gap: 10,
    marginTop: 10,
  },
  sugestao: {
    fontSize: 13,
    color: '#52665F',
  },
  rotulo: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CEDBD6',
    borderRadius: 9,
    padding: 12,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    color: '#222222',
  },
  multilinha: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  botao: {
    backgroundColor: '#008767',
    borderRadius: 9,
    padding: 13,
    alignItems: 'center',
    marginTop: 4,
  },
  vermelho: {
    backgroundColor: '#B42318',
  },
  textoBotao: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cancelar: {
    padding: 12,
    alignItems: 'center',
  },
  erro: {
    color: '#B42318',
    backgroundColor: '#FFF0EF',
    padding: 12,
    borderRadius: 8,
  },
});