import { auth, db } from '../lib/firebase';
import { doc, getDoc, getDocs, collection, query, where, runTransaction, deleteDoc } from 'firebase/firestore';

export type Appointment = { id: string; created_at: string; user_id: string; campaign_id: number };
function requireUser() {
  const user = auth.currentUser;
  if (!user) throw new Error('Você precisa estar logado para realizar um agendamento.');
  return user;
}
export async function createAppointment(campaignId: number): Promise<Appointment> {
  const user = requireUser();
  const id = `${user.uid}_${campaignId}`;
  const ref = doc(db, 'appointments', id);
  const campaignRef = doc(db, 'campaigns', String(campaignId));
  const result: Appointment = { id, user_id: user.uid, campaign_id: campaignId, created_at: new Date().toISOString() };
  await runTransaction(db, async transaction => {
    const campaign = await transaction.get(campaignRef);
    if (!campaign.exists()) throw new Error('Campanha não encontrada.');
    const existing = await transaction.get(ref);
    if (existing.exists()) throw new Error('Você já possui um agendamento para esta campanha.');
    transaction.set(ref, result);
  });
  return result;
}
export async function getMyAppointments(): Promise<Appointment[]> {
  const user = requireUser();
  const snapshot = await getDocs(query(collection(db, 'appointments'), where('user_id', '==', user.uid)));
  return snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Appointment))
    .sort((a,b) => b.created_at.localeCompare(a.created_at));
}
export async function cancelAppointment(appointmentId: string): Promise<void> {
  const user = requireUser();
  const ref = doc(db, 'appointments', appointmentId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists() || snapshot.data().user_id !== user.uid) throw new Error('Agendamento não encontrado.');
  await deleteDoc(ref);
}
