import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  onSnapshot,
  setDoc,
  deleteDoc,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { StaffMember, WinnerRecord, Prize } from './types';
import { getDefaultStaffList } from './data/defaultStaff';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom databaseId if specified
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test Firestore connection on boot as required by Firestore integration skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline, please check your network or config.');
      return false;
    }
    // Document might not exist which is fine, connection is still active
    return true;
  }
}

// Subscribe to real-time staff changes
export function subscribeToStaff(
  callback: (staff: StaffMember[]) => void,
  onError?: (err: Error) => void
) {
  const staffRef = collection(db, 'staff');
  return onSnapshot(
    staffRef,
    async snapshot => {
      if (snapshot.empty) {
        // Check if database has already been initialized
        const isSeeded = localStorage.getItem('suwon_rehab_db_seeded');
        if (!isSeeded) {
          const defaults = getDefaultStaffList();
          await seedDefaultStaff(defaults);
          localStorage.setItem('suwon_rehab_db_seeded', 'true');
          callback(defaults);
          return;
        }
        // If already initialized, empty collection means user intentionally cleared all staff!
        callback([]);
        return;
      }
      localStorage.setItem('suwon_rehab_db_seeded', 'true');
      const staffList: StaffMember[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.id && data.name) {
          staffList.push({ id: data.id, name: data.name });
        }
      });
      // Sort to keep consistent order
      staffList.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
      callback(staffList);
    },
    err => {
      console.error('Firestore staff subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Subscribe to real-time winners changes
export function subscribeToWinners(
  callback: (winners: WinnerRecord[]) => void,
  onError?: (err: Error) => void
) {
  const winnersRef = collection(db, 'winners');
  return onSnapshot(
    winnersRef,
    snapshot => {
      const winnersList: WinnerRecord[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.id && data.name) {
          winnersList.push(data as WinnerRecord);
        }
      });
      callback(winnersList);
    },
    err => {
      console.error('Firestore winners subscription error:', err);
      if (onError) onError(err);
    }
  );
}

// Seed default 90 staff in batches
export async function seedDefaultStaff(staffList: StaffMember[]) {
  const batch = writeBatch(db);
  staffList.forEach(member => {
    const docRef = doc(db, 'staff', member.id);
    batch.set(docRef, { id: member.id, name: member.name });
  });
  await batch.commit();
}

// Overwrite/reset entire staff list
export async function syncStaffListToFirestore(newList: StaffMember[]) {
  // 1. Get existing docs
  const staffRef = collection(db, 'staff');
  const snapshot = await getDocs(staffRef);

  // 2. Batch delete old & add new
  const batch = writeBatch(db);
  snapshot.forEach(docSnap => {
    batch.delete(docSnap.ref);
  });
  newList.forEach(member => {
    const docRef = doc(db, 'staff', member.id);
    batch.set(docRef, { id: member.id, name: member.name });
  });
  await batch.commit();
}

// Add/Update single staff
export async function saveStaffMemberToFirestore(member: StaffMember) {
  await setDoc(doc(db, 'staff', member.id), { id: member.id, name: member.name });
}

// Delete single staff
export async function deleteStaffMemberFromFirestore(id: string) {
  await deleteDoc(doc(db, 'staff', id));
}

// Add winners to Firestore
export async function saveWinnersToFirestore(winners: WinnerRecord[]) {
  const batch = writeBatch(db);
  winners.forEach(w => {
    const docRef = doc(db, 'winners', w.id);
    batch.set(docRef, w);
  });
  await batch.commit();
}

// Delete single winner from Firestore
export async function deleteWinnerFromFirestore(winnerId: string) {
  await deleteDoc(doc(db, 'winners', winnerId));
}

// Reset all winners from Firestore
export async function resetWinnersInFirestore() {
  const winnersRef = collection(db, 'winners');
  const snapshot = await getDocs(winnersRef);
  const batch = writeBatch(db);
  snapshot.forEach(docSnap => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}
