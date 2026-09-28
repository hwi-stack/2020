import React, { useState, useEffect, useRef } from 'react';
import { StaffMember, WinnerRecord, Prize, DrawPhase } from '../types';
import { DrawSlotCard } from './DrawSlotCard';
import { sound } from '../utils/sound';
import { fireGrandCelebration } from '../utils/confetti';
import {
  Volume2,
  VolumeX,
  Lock,
  Sparkles,
  Trophy,
  Coffee,
  Sparkle,
  History,
  RotateCcw,
  Users,
  AlertCircle
} from 'lucide-react';

interface LotteryDrawProps {
  staffList: StaffMember[];
  winners: WinnerRecord[];
  onAddWinners: (newWinners: WinnerRecord[]) => void;
  prizes: Prize[];
  onOpenAdmin: () => void;
}

export const LotteryDraw: React.FC<LotteryDrawProps> = ({
  staffList,
  winners,
  onAddWinners,
  prizes,
  onOpenAdmin,
}) => {
  // Selected prize for current round (defaults to 1st prize)
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>(prizes[0]?.id || 'coffee');
  const selectedPrize = prizes.find(p => p.id === selectedPrizeId) || prizes[0];

  // Sound mute state
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());

  // Current draw state
  const [phase, setPhase] = useState<DrawPhase>('idle');
  const [currentSelectedCandidates, setCurrentSelectedCandidates] = useState<StaffMember[]>([]);

  // Winners drawer modal
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // In-app alert error message (no browser alert popup)
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timer references for clean cancellation
  const timer1Ref = useRef<number | null>(null);
  const timer2Ref = useRef<number | null>(null);
  const timer3Ref = useRef<number | null>(null);

  // Cleanup timers & sounds on unmount
  useEffect(() => {
    return () => {
      sound.stopRolling();
      if (timer1Ref.current) clearTimeout(timer1Ref.current);
      if (timer2Ref.current) clearTimeout(timer2Ref.current);
      if (timer3Ref.current) clearTimeout(timer3Ref.current);
    };
  }, []);

  const handleToggleMute = () => {
    const nextMute = sound.toggleMute();
    setIsMuted(nextMute);
  };

  // Remaining eligible staff (never drawn yet)
  const wonStaffNames = new Set(winners.map(w => w.name));
  const eligibleStaff = staffList.filter(s => !wonStaffNames.has(s.name));

  // Winners already drawn for the currently selected prize
  const prizeWinners = winners.filter(w => w.prizeId === selectedPrizeId);
  const isPrizeCompleted = prizeWinners.length >= selectedPrize.count;

  // Start Draw Execution
  const handleStartDraw = () => {
    if (phase !== 'idle' && phase !== 'completed') return;

    const countNeeded = selectedPrize.count;

    if (eligibleStaff.length < countNeeded) {
      setErrorMessage(
        `추첨 가능한 인원이 부족합니다. (현재 남은 미당첨 인원: ${eligibleStaff.length}명 / 필요 인원: ${countNeeded}명)`
      );
      return;
    }

    setErrorMessage(null);

    // 1. Fair random selection of `countNeeded` candidates from eligible pool (Fisher-Yates shuffle)
    const shuffled = [...eligibleStaff];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const chosenWinners = shuffled.slice(0, countNeeded);
    setCurrentSelectedCandidates(chosenWinners);

    // 2. Start rolling sound & initial rolling phase
    sound.startRolling();
    setPhase('rolling_intro');

    // Step 1: After 1.0s of suspense spinning, reveal 1st character ('정')
    timer1Ref.current = window.setTimeout(() => {
      setPhase('char_1_revealed');
      sound.playCharLock(1);

      // Delay between 1st char and 2nd char:
      // 20 people: exactly 3.0s (3000ms)
      // 5 people: 2.5s (2500ms)
      const delayBetween1And2 = selectedPrize.count === 20 ? 3000 : 2500;

      // Step 2: reveal 2nd character ('휘')
      timer2Ref.current = window.setTimeout(() => {
        setPhase('char_2_revealed');
        sound.playCharLock(2);

        // Step 3: exactly 1.0s (1000ms) later, reveal 3rd character ('명')
        timer3Ref.current = window.setTimeout(() => {
          setPhase('completed');
          sound.playFireworksFanfare();
          fireGrandCelebration();

          // Save winners into history
          const nowStr = new Date().toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          });

          const newWinnerRecords: WinnerRecord[] = chosenWinners.map(winner => ({
            id: `winner-${Date.now()}-${winner.id}`,
            staffId: winner.id,
            name: winner.name,
            prizeId: selectedPrize.id,
            prizeName: selectedPrize.name,
            drawnAt: nowStr,
          }));

          onAddWinners(newWinnerRecords);
        }, 1000);
      }, delayBetween1And2);
    }, 1000);
  };

  const handleResetCurrentDraw = () => {
    sound.stopRolling();
    if (timer1Ref.current) clearTimeout(timer1Ref.current);
    if (timer2Ref.current) clearTimeout(timer2Ref.current);
    if (timer3Ref.current) clearTimeout(timer3Ref.current);
    setPhase('idle');
    setCurrentSelectedCandidates([]);
  };

  const isSpinning = phase !== 'idle' && phase !== 'completed';
  const drawTargetCount = selectedPrize.count;
  const isCompact = drawTargetCount > 6; // Compact grid for 20 people

  // Candidate items to display in grid:
  // If idle and not drawn yet: show placeholders (1..count)
  // If spinning or completed: show chosen candidates
  const displayItems =
    currentSelectedCandidates.length > 0
      ? currentSelectedCandidates
      : Array.from({ length: drawTargetCount }, (_, i) => ({
          id: `placeholder-${i}`,
          name: '???',
        }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50/80 via-orange-50/30 to-amber-100/40 flex flex-col justify-between">
      {/* Top Header Bar */}
      <header className="w-full px-4 sm:px-8 py-3.5 sm:py-4 bg-white/90 backdrop-blur-md border-b border-amber-200/80 shadow-xs flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Sparkles className="w-6 h-6 animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              수원시장애인종합복지관
              <span className="text-xs sm:text-sm font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 hidden sm:inline-block">
                직원 경품 추첨
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              전체 직원 {staffList.length}명 · 추첨 가능 대상자 {eligibleStaff.length}명
            </p>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            onClick={handleToggleMute}
            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
              isMuted
                ? 'bg-slate-100 border-slate-300 text-slate-400'
                : 'bg-amber-50 border-amber-300 text-amber-700 shadow-sm'
            }`}
            title={isMuted ? '음소거 해제' : '음소거'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* History Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-amber-50 shadow-xs transition-colors cursor-pointer"
          >
            <History className="w-4 h-4 text-amber-600" />
            <span className="hidden sm:inline">당첨 현황</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-xs">
              {winners.length}
            </span>
          </button>

          {/* Admin Login Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>관리자 모드</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 flex flex-col justify-center">
        {/* Error notification if eligible staff < needed */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs px-2 py-1 bg-white rounded-lg border border-rose-200 hover:bg-rose-100"
            >
              닫기
            </button>
          </div>
        )}

        {/* Prize Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2 bg-white/95 p-1.5 rounded-2xl shadow-sm border border-amber-200/80 w-full sm:w-auto">
            {prizes.map(prize => {
              const isSelected = prize.id === selectedPrizeId;
              const alreadyWon = winners.filter(w => w.prizeId === prize.id).length;
              const isDone = alreadyWon >= prize.count;

              return (
                <button
                  key={prize.id}
                  disabled={isSpinning}
                  onClick={() => {
                    setSelectedPrizeId(prize.id);
                    setPhase('idle');
                    setCurrentSelectedCandidates([]);
                    setErrorMessage(null);
                  }}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2.5 px-4 sm:px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20 scale-[1.02]'
                      : 'text-slate-600 hover:bg-amber-50 hover:text-slate-900'
                  } ${isSpinning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {prize.id === 'coffee' ? (
                    <Coffee className="w-4 h-4" />
                  ) : (
                    <Sparkle className="w-4 h-4" />
                  )}
                  <span>
                    {prize.name} ({prize.count}명)
                  </span>
                  {isDone && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      완료
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Draw Trigger or Reset */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {phase === 'idle' ? (
              <button
                onClick={handleStartDraw}
                disabled={eligibleStaff.length < drawTargetCount}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-black text-base sm:text-lg shadow-xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5 text-amber-200 animate-spin-slow" />
                <span>추첨 시작하기</span>
              </button>
            ) : phase === 'completed' ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleResetCurrentDraw}
                  className="px-6 py-3 bg-white hover:bg-amber-50 text-slate-700 border border-amber-300 rounded-2xl font-bold text-sm shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>새로 추첨하기</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Display Container: 5 or 20 Cards in a Single Viewport */}
        <div
          className={`w-full bg-white/70 backdrop-blur-md rounded-3xl border border-amber-200/80 shadow-xl transition-all ${
            isCompact ? 'p-3 sm:p-4' : 'p-4 sm:p-8'
          }`}
        >
          {/* Card Grid */}
          <div
            className={`grid gap-2 sm:gap-3 items-stretch ${
              drawTargetCount === 5
                ? 'grid-cols-1 sm:grid-cols-5'
                : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-5'
            }`}
          >
            {displayItems.map((candidate, idx) => (
              <DrawSlotCard
                key={candidate.id || idx}
                index={idx}
                targetName={candidate.name}
                phase={phase}
                compact={isCompact}
              />
            ))}
          </div>

          {/* Celebratory Banner when completed */}
          {phase === 'completed' && (
            <div className="mt-4 sm:mt-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white text-center shadow-lg shadow-orange-500/25 animate-fade-in flex items-center justify-center gap-3">
              <Trophy className="w-6 h-6 animate-bounce" />
              <span className="font-extrabold text-base sm:text-lg">
                축하합니다! 수원시장애인종합복지관 {selectedPrize.name} {drawTargetCount}명 당첨자 발표 완료!
              </span>
              <Trophy className="w-6 h-6 animate-bounce" />
            </div>
          )}
        </div>
      </main>

      {/* Footer info */}
      <footer className="w-full text-center py-3 text-xs text-slate-500 select-none">
        수원시장애인종합복지관 직원 한마음 행사 추첨 시스템 · 공정하고 중복 없는 무작위 추첨
      </footer>

      {/* Winners History Drawer Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">전체 당첨자 현황</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                닫기
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {winners.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  아직 당첨 이력이 없습니다.
                </div>
              ) : (
                winners.map((winner, idx) => (
                  <div
                    key={winner.id}
                    className="flex items-center justify-between py-2.5 px-3 hover:bg-slate-50 rounded-xl"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs text-slate-400 font-mono w-5">
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {winner.prizeName}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {winner.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">{winner.drawnAt}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
