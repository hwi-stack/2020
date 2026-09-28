import React, { useEffect, useState, useMemo } from 'react';
import { DrawPhase } from '../types';

interface DrawSlotCardProps {
  index: number;
  targetName: string;
  phase: DrawPhase;
  compact?: boolean;
}

const RANDOM_HANGUL = [
  '가', '나', '다', '라', '마', '바', '사', '아', '자', '차', '카', '타', '파', '하',
  '민', '서', '도', '윤', '시', '우', '지', '호', '수', '현', '진', '원', '예', '채',
  '태', '건', '찬', '은', '하', '린', '솔', '율', '희', '준', '연', '경', '람', '혁',
  '정', '휘', '명', '승', '유', '재', '성', '주', '혜', '보', '동', '기', '광', '선'
];

function getRandomChar(): string {
  return RANDOM_HANGUL[Math.floor(Math.random() * RANDOM_HANGUL.length)];
}

export const DrawSlotCard: React.FC<DrawSlotCardProps> = ({
  index,
  targetName,
  phase,
  compact = false,
}) => {
  const targetChars = useMemo(() => Array.from(targetName), [targetName]);
  const charCount = targetChars.length;

  // Track the currently displayed characters for this slot
  const [displayedChars, setDisplayedChars] = useState<string[]>(() =>
    Array(charCount).fill('?')
  );

  useEffect(() => {
    // When completed, show full name immediately
    if (phase === 'completed' || phase === 'char_3_revealed') {
      setDisplayedChars(targetChars);
      return;
    }

    if (phase === 'idle') {
      setDisplayedChars(Array(charCount).fill('?'));
      return;
    }

    // Determine how many characters are locked in based on current phase
    let lockedCount = 0;
    if (phase === 'char_1_revealed') {
      lockedCount = 1;
    } else if (phase === 'char_2_revealed') {
      lockedCount = Math.min(2, charCount);
    }

    // Rolling animation for unlocked characters
    const interval = setInterval(() => {
      setDisplayedChars(prev => {
        const next = [...prev];
        for (let i = 0; i < charCount; i++) {
          if (i < lockedCount) {
            next[i] = targetChars[i];
          } else {
            next[i] = getRandomChar();
          }
        }
        return next;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [phase, targetChars, charCount]);

  const isCompleted = phase === 'completed' || phase === 'char_3_revealed';
  const isSpinning = phase !== 'idle' && !isCompleted;
  const isDrawingOrDone = phase !== 'idle';

  return (
    <div
      className={`relative rounded-2xl transition-all duration-300 select-none overflow-hidden ${
        compact ? 'p-2 sm:p-2.5' : 'p-4 sm:p-6'
      } ${
        isDrawingOrDone
          ? 'bg-gradient-to-br from-amber-500/15 via-white to-orange-500/20 border-2 border-amber-400 shadow-xl shadow-amber-500/20 scale-[1.01]'
          : 'bg-white/90 border border-amber-200/70 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Top Header inside card: Index Badge */}
      <div className="flex items-center justify-between mb-1.5 sm:mb-2">
        <span
          className={`font-black rounded-lg ${
            compact ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1'
          } ${
            isDrawingOrDone
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          #{index + 1}
        </span>
        {isCompleted && (
          <span className="text-amber-600 font-extrabold text-xs flex items-center gap-1 animate-bounce">
            🎉 당첨!
          </span>
        )}
      </div>

      {/* Syllable Slots: Unified celebratory gold-amber color palette throughout drawing & reveal */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 my-1">
        {displayedChars.map((char, charIdx) => {
          let isLocked = false;
          if (isCompleted) {
            isLocked = true;
          } else if (phase === 'char_1_revealed' && charIdx === 0) {
            isLocked = true;
          } else if (phase === 'char_2_revealed' && charIdx < 2) {
            isLocked = true;
          }

          return (
            <div
              key={charIdx}
              className={`flex items-center justify-center font-extrabold rounded-xl transition-all ${
                compact
                  ? 'w-9 h-11 sm:w-11 sm:h-13 text-xl sm:text-2xl'
                  : 'w-16 h-20 sm:w-20 sm:h-24 text-3xl sm:text-5xl'
              } ${
                isLocked
                  ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-white shadow-md scale-105 ring-2 ring-amber-300/80'
                  : isSpinning
                  ? 'bg-amber-50 text-amber-900 border-2 border-amber-300/80 shadow-inner'
                  : 'bg-slate-100 text-slate-400 border border-slate-200'
              }`}
            >
              <span className={isLocked ? 'scale-100' : 'opacity-85'}>
                {char}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
