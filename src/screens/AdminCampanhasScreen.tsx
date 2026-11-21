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
  start_at: string | null;
  end_at: string | null;
  location: string;
  address: string;
  eventDateCandidates: DataCandidata[];
  timeCandidates: HorarioCandidato[];
  suggestedLocation: string;
  suggestedAddress: string;
};

type FormData = {
  title: string;
  description: string;
  date: string;
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

function criarFormulario(c: Campaign): FormData {
  const inicio = partesDataLocal(c.start_at);
  const fim = partesDataLocal(c.end_at);

  const dataSugerida =
    c.eventDateCandidates.length === 1
      ? c.eventDateCandidates[0].data
      : '';

  const horarioSugerido =
    c.timeCandidates.length === 1
      ? c.timeCandidates[0]
      : null;

  return {
    title: c.title,
    description: c.description,
    date: inicio?.data || dataSugerida,
    startTime:
      inicio?.hora || horarioSugerido?.inicio || '',
    endTime:
      fim?.hora || horarioSugerido?.fim || '',
    location:
      c.location || c.suggestedLocation,
    address:
      c.address || c.suggestedAddress,
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
            start_at: d.start_at ?? null,
            end_at: d.end_at ?? null,
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

    if (!form.title.trim()) {
      setErro('Informe o título.');
      return;
    }

    if (form.date && !validarData(form.date)) {
      setErro('Data inválida. Use AAAA-MM-DD.');
      return;
    }

    if (
      form.startTime &&
      !validarHora(form.startTime)
    ) {
      setErro('Horário inicial inválido.');
      return;
    }

    if (
      form.endTime &&
      !validarHora(form.endTime)
    ) {
      setErro('Horário final inválido.');
      return;
    }

    if (
      (form.startTime || form.endTime) &&
      (!form.date || !form.startTime || !form.endTime)
    ) {
      setErro('Preencha data e os dois horários.');
      return;
    }

    if (
      form.startTime &&
      form.endTime &&
      form.endTime <= form.startTime
    ) {
      setErro('O horário final deve ser posterior ao inicial.');
      return;
    }

    if (
      acao === 'approve' &&
      (
        !form.date ||
        !form.startTime ||
        !form.endTime ||
        !form.location.trim() ||
        !form.address.trim()
      )
    ) {
      setErro(
        'Para aprovar, informe data, horários, local e endereço.'
      );
      return;
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

      const inicio =
        form.date && form.startTime
          ? paraISO(form.date, form.startTime)
          : null;

      const fim =
        form.date && form.endTime
          ? paraISO(form.date, form.endTime)
          : null;

      const aprovada = acao === 'approve';

      await updateDoc(
        doc(db, 'campaigns', selecionada),
        {
          title: form.title.trim(),
          description: form.description.trim(),
          start_at: inicio,
          end_at: fim,
          location: form.location.trim(),
          address: form.address.trim(),

          status: aprovada
          ? 'approved'
          : acao === 'reject'
            ? 'rejected'
            : 'pending_review',

          manuallyEdited: true,
          updatedAt: serverTimestamp(),
        }
      );

      setSelecionada(null);
      setForm(null);

      await carregarCampanhas();

      const mensagem = aprovada
        ? 'Campanha aprovada e liberada para agendamento!'
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

      {campanhas.map(campanha => (
        <View
          key={campanha.firestoreId}
          style={styles.cartao}
        >
          <Text style={styles.nome}>
            {campanha.title}
          </Text>

          <Text style={styles.descricao}>
            {campanha.description}
          </Text>

          <Text style={styles.status}>
            Status: {campanha.status}
          </Text>

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
                Data do evento (AAAA-MM-DD)
              </Text>
              <TextInput
                style={styles.input}
                placeholder="2026-11-19"
                value={form.date}
                onChangeText={v => alterar('date', v)}
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