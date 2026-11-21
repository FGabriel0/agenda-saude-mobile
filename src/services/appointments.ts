
import { auth, db } from '../lib/firebase';

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from 'firebase/firestore';

export type Appointment = {
  id: string;
  created_at: string;
  user_id: string;
  campaign_id: number | string;
};

function requireUser() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      'Você precisa estar logado para realizar um agendamento.'
    );
  }

  return user;
}

export async function createAppointment(
  campaignId: number | string
): Promise<Appointment> {
  const user = requireUser();

  const campaignDocId = String(campaignId);

  const appointmentId = `${user.uid}_${campaignDocId}`;

  const appointmentRef = doc(
    db,
    'appointments',
    appointmentId
  );

  const campaignRef = doc(
    db,
    'campaigns',
    campaignDocId
  );

  const resultado: Appointment = {
    id: appointmentId,
    created_at: new Date().toISOString(),
    user_id: user.uid,
    campaign_id: campaignId,
  };

  await runTransaction(db, async transaction => {
    const campaignSnapshot =
      await transaction.get(campaignRef);

    if (!campaignSnapshot.exists()) {
      throw new Error('Campanha não encontrada.');
    }

    const campanha = campaignSnapshot.data();

    if (campanha.status !== 'approved') {
  throw new Error(
    'Esta campanha ainda não foi aprovada.'
  );
}

    const appointmentSnapshot =
      await transaction.get(appointmentRef);

    if (appointmentSnapshot.exists()) {
      throw new Error(
        'Você já possui um agendamento para esta campanha.'
      );
    }

    transaction.set(appointmentRef, resultado);
  });

  return resultado;
}

export async function getMyAppointments():
  Promise<Appointment[]> {
  const user = requireUser();

  const snapshot = await getDocs(
    query(
      collection(db, 'appointments'),
      where('user_id', '==', user.uid)
    )
  );

  return snapshot.docs
    .map(documento => {
      const dados = documento.data();

      return {
        id: documento.id,
        created_at:
          typeof dados.created_at === 'string'
            ? dados.created_at
            : '',
        user_id: String(dados.user_id ?? ''),
        campaign_id: dados.campaign_id,
      } as Appointment;
    })
    .sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
}

export async function cancelAppointment(
  appointmentId: string
): Promise<void> {
  const user = requireUser();

  const referencia = doc(
    db,
    'appointments',
    appointmentId
  );

  const snapshot = await getDoc(referencia);

  if (
    !snapshot.exists() ||
    snapshot.data().user_id !== user.uid
  ) {
    throw new Error('Agendamento não encontrado.');
  }

  await deleteDoc(referencia);
}
