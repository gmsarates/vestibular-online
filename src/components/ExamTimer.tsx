import { useState, useEffect, useCallback } from 'react';
import { useExam } from '@/context/ExamContext';

export function ExamTimer() {
  const { examState, selectedExam, expireEssay } = useExam();
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const calculateTimeLeft = useCallback(() => {
    if (!examState.startTimestamp || !selectedExam) return 0;
    const elapsed = Date.now() - examState.startTimestamp;
    const total = selectedExam.durationMinutes * 60 * 1000;
    return Math.max(0, total - elapsed);
  }, [examState.startTimestamp, selectedExam]);

  useEffect(() => {
    if (examState.status !== 'in_progress') return;

    const update = () => {
      const left = calculateTimeLeft();
      setTimeLeft(left);
      if (left <= 0) {
        expireEssay();
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [examState.status, calculateTimeLeft, expireEssay]);

  if (examState.status !== 'in_progress') return null;

  const totalSeconds = Math.ceil(timeLeft / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const isLow = totalSeconds < 300; // less than 5 minutes
  const isCritical = totalSeconds < 60;

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className={`
      flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-lg font-bold transition-colors
      ${isCritical ? 'bg-destructive text-destructive-foreground animate-pulse' :
        isLow ? 'bg-destructive/20 text-destructive' :
        'bg-secondary text-secondary-foreground'}
    `}>
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
      </svg>
      {hours > 0 && `${pad(hours)}:`}{pad(minutes)}:{pad(seconds)}
    </div>
  );
}
