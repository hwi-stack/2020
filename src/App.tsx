import { useState, useEffect } from 'react';
import { StaffMember, WinnerRecord, Prize } from './types';
import { getDefaultStaffList } from './data/defaultStaff';
import { LotteryDraw } from './components/LotteryDraw';
import { AdminModal } from './components/AdminModal';
import {
  testFirestoreConnection,
  subscribeToStaff,
  subscribeToWinners,
  syncStaffListToFirestore,
  saveWinnersToFirestore,
  deleteWinnerFromFirestore,
  resetWinnersInFirestore,
} from './firebase';

const DEFAULT_PRIZES: Prize[] = [
  {
    id: 'coffee',
    name: '커피 티백',
    count: 5,
    colorTheme: 'from-amber-500 to-orange-600',
    accentBg: 'bg-amber-100',
  },
  {
    id: 'cosmetics',
    name: '화장품세트',
    count: 20,
    colorTheme: 'from-rose-500 to-pink-600',
    accentBg: 'bg-rose-100',
  },
];

export default function App() {
  // Staff list (initialized with localStorage or defaults, then synced via Firebase Firestore in real-time)
  const [staffList, setStaffList] = useState<StaffMember[]>(() => {
    try {
      const saved = localStorage.getItem('suwon_rehab_staff_list');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return getDefaultStaffList();
  });

  // Winner records
  const [winners, setWinners] = useState<WinnerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('suwon_rehab_winners');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  // Prizes
  const [prizes, setPrizes] = useState<Prize[]>(() => {
    try {
      const saved = localStorage.getItem('suwon_rehab_prizes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return DEFAULT_PRIZES;
  });

  // Firebase connection & sync status
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('연결 중...');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Initialize Firebase and subscribe to real-time Firestore changes
  useEffect(() => {
    testFirestoreConnection().then(connected => {
      setIsFirebaseConnected(connected);
      if (connected) {
        setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
      }
    });

    // Real-time Firestore listener for staff
    const unsubscribeStaff = subscribeToStaff(
      remoteStaff => {
        if (remoteStaff.length > 0) {
          setStaffList(remoteStaff);
          localStorage.setItem('suwon_rehab_staff_list', JSON.stringify(remoteStaff));
        }
        setIsFirebaseConnected(true);
        setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
      },
      () => {
        setIsFirebaseConnected(false);
      }
    );

    // Real-time Firestore listener for winners
    const unsubscribeWinners = subscribeToWinners(
      remoteWinners => {
        setWinners(remoteWinners);
        localStorage.setItem('suwon_rehab_winners', JSON.stringify(remoteWinners));
        setIsFirebaseConnected(true);
        setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
      },
      () => {
        setIsFirebaseConnected(false);
      }
    );

    return () => {
      unsubscribeStaff();
      unsubscribeWinners();
    };
  }, []);

  // Update staff list (called by AdminModal)
  const handleUpdateStaffList = async (newList: StaffMember[]) => {
    setStaffList(newList);
    localStorage.setItem('suwon_rehab_staff_list', JSON.stringify(newList));

    try {
      await syncStaffListToFirestore(newList);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
      setIsFirebaseConnected(true);
    } catch (err) {
      console.error('Failed to sync staff list to Firebase Firestore', err);
      setIsFirebaseConnected(false);
    }
  };

  // Add winners (called when draw completes)
  const handleAddWinners = async (newWinners: WinnerRecord[]) => {
    const updated = [...winners, ...newWinners];
    setWinners(updated);
    localStorage.setItem('suwon_rehab_winners', JSON.stringify(updated));

    try {
      await saveWinnersToFirestore(newWinners);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      console.error('Failed to sync winners to Firebase Firestore', err);
    }
  };

  // Delete single winner
  const handleDeleteWinner = async (winnerId: string) => {
    const updated = winners.filter(w => w.id !== winnerId);
    setWinners(updated);
    localStorage.setItem('suwon_rehab_winners', JSON.stringify(updated));

    try {
      await deleteWinnerFromFirestore(winnerId);
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      console.error('Failed to delete winner from Firebase Firestore', err);
    }
  };

  // Reset all winners
  const handleResetWinners = async () => {
    setWinners([]);
    localStorage.setItem('suwon_rehab_winners', JSON.stringify([]));

    try {
      await resetWinnersInFirestore();
      setLastSyncTime(new Date().toLocaleTimeString('ko-KR'));
    } catch (err) {
      console.error('Failed to reset winners in Firebase Firestore', err);
    }
  };

  // Update prizes
  const handleUpdatePrizes = (newPrizes: Prize[]) => {
    setPrizes(newPrizes);
    localStorage.setItem('suwon_rehab_prizes', JSON.stringify(newPrizes));
  };

  return (
    <div
      className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-amber-200 notranslate"
      translate="no"
    >
      <LotteryDraw
        staffList={staffList}
        winners={winners}
        onAddWinners={handleAddWinners}
        prizes={prizes}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        staffList={staffList}
        onUpdateStaffList={handleUpdateStaffList}
        winners={winners}
        onDeleteWinner={handleDeleteWinner}
        onResetWinners={handleResetWinners}
        prizes={prizes}
        onUpdatePrizes={handleUpdatePrizes}
        isServerConnected={isFirebaseConnected}
        lastSyncTime={lastSyncTime}
      />
    </div>
  );
}
