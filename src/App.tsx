import { useState, useEffect } from 'react';
import { StaffMember, WinnerRecord, Prize } from './types';
import { getDefaultStaffList } from './data/defaultStaff';
import { LotteryDraw } from './components/LotteryDraw';
import { AdminModal } from './components/AdminModal';

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
  // Staff list in localStorage
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

  // Winner records in localStorage
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

  // Prizes in localStorage
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

  // Admin modal state
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('suwon_rehab_staff_list', JSON.stringify(staffList));
  }, [staffList]);

  useEffect(() => {
    localStorage.setItem('suwon_rehab_winners', JSON.stringify(winners));
  }, [winners]);

  useEffect(() => {
    localStorage.setItem('suwon_rehab_prizes', JSON.stringify(prizes));
  }, [prizes]);

  const handleAddWinners = (newWinners: WinnerRecord[]) => {
    setWinners(prev => [...prev, ...newWinners]);
  };

  const handleDeleteWinner = (winnerId: string) => {
    setWinners(prev => prev.filter(w => w.id !== winnerId));
  };

  const handleResetWinners = () => {
    setWinners([]);
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
        onUpdateStaffList={setStaffList}
        winners={winners}
        onDeleteWinner={handleDeleteWinner}
        onResetWinners={handleResetWinners}
        prizes={prizes}
        onUpdatePrizes={setPrizes}
      />
    </div>
  );
}
