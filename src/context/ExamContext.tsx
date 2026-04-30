import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import { type ExamAttempt, type ExamConfig, type ExamResult, MOCK_RESULT, saveToStorage, loadFromStorage } from '@/lib/mock-data';
import { appCandidateApi, appExamApi, clearAppToken, httpClient, type Exam } from '@gmsarates/vestibular-api-client';
import { armAttemptAccess, getOrCreateExamSessionId } from '@/lib/exam-session';

export type ExamStatus = 'idle' | 'in_progress' | 'submitted' | 'expired';

export interface UserSession {
  cpf: string;
  name: string;
  phone: string;
  email: string;
  loggedInAt: number;
}

interface ExamState {
  essay: string;
  status: ExamStatus;
  selectedExamId: string | null;
  startTimestamp: number | null;
  attemptId: string | null;
  tabSwitchCount: number;
  result: ExamResult | null;
}

interface ExamContextType {
  user: UserSession | null;
  examState: ExamState;
  currentExamState: ExamState | null;
  selectedExam: ExamConfig | null;
  login: (cpf: string) => void;
  logout: () => void;
  selectExam: (id: string) => void;
  startExam: () => Promise<void>;
  setActiveExam: (exam: ExamState, attemptId: string) => void;
  viewSubmittedExam: (examId: string) => boolean;
  updateEssay: (text: string) => void;
  syncEssay: () => Promise<void>;
  submitEssay: () => void;
  expireEssay: () => void;
  incrementTabSwitch: () => void;
  setResult: (result: ExamResult) => void;
  resetExam: () => void;
  exams: ExamConfig[];
}

const ExamContext = createContext<ExamContextType | null>(null);

const DEFAULT_EXAM_STATE: ExamState = {
  essay: '',
  status: 'idle',
  selectedExamId: null,
  startTimestamp: null,
  attemptId: null,
  tabSwitchCount: 0,
  result: MOCK_RESULT,
};

export const formatDuration = (duration: number) => {
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60

  const ret: string[] = []
  
  if (hours > 0) {
    ret.push(`${(hours < 10 ? '0' : '') + hours} hora${hours > 1 ? 's' : ''}`)
  }

  if (minutes > 0) {
    ret.push(`${(minutes < 10 ? '0' : '') + minutes} minuto${minutes > 1 ? 's' : ''}`)
  }

  return ret.join(' e ')
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-7][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractAttemptUuid(payload: unknown): string | null {
  if (typeof payload === 'string') return isUuid(payload) ? payload : null;
  if (!payload || typeof payload !== 'object') return null;

  const obj = payload as Record<string, unknown>;

  if (typeof obj.uuid === 'string' && isUuid(obj.uuid)) return obj.uuid;
  if (typeof obj.id === 'string' && isUuid(obj.id)) return obj.id;

  if (obj.data && typeof obj.data === 'object') {
    const data = obj.data as Record<string, unknown>;
    if (typeof data.uuid === 'string' && isUuid(data.uuid)) return data.uuid;
    if (typeof data.id === 'string' && isUuid(data.id)) return data.id;
  }

  return null;
}

function toInstructions(description: string | null | undefined): string[] {
  if (!description) return [];
  return description
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function toExamConfig(apiExam: Exam & { university?: { name?: string } }): ExamConfig {
  return {
    id: apiExam.id,
    name: apiExam.name,
    institution: apiExam.university?.name ?? '—',
    theme: apiExam.theme,
    instructions: apiExam.description,
    duration: formatDuration(apiExam.duration),
    durationMinutes: apiExam.duration,
    minWords: apiExam.min_words,
    maxWords: apiExam.max_words,
    attempt: (apiExam.attempt as ExamAttempt | null | undefined) ?? null,
  };
}

export function ExamProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [examState, setExamState] = useState<ExamState>(DEFAULT_EXAM_STATE);
  const [currentExamState, setCurrentExamState] = useState<ExamState|null>(null);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [exams, setExams] = useState<ExamConfig[]>([]);
  const examStateRef = useRef(examState);

  const selectedExam = exams.find(e => e.id === examState.selectedExamId) ?? null;

  useEffect(() => {
    examStateRef.current = examState;
  }, [examState]);

  const handleExpiredSession = useCallback((error: unknown): boolean => {
    if (error instanceof Error && error.message === 'Sessão expirada') {
      clearAppToken();
      setUser(null);
      setExamState(DEFAULT_EXAM_STATE);
      setCurrentExamState(null);
      setExams([]);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user_session');
        localStorage.removeItem('exam_state');
      }

      return true;
    }

    return false
  }, []);

  useEffect(() => {
    setUser(loadFromStorage<UserSession>('user_session'));
    setExamState(loadFromStorage<ExamState>('exam_state') ?? DEFAULT_EXAM_STATE);
    setCurrentExamState(loadFromStorage<ExamState>('current_exam_state') ?? null);
    setHasHydratedStorage(true);
  }, []);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    if (!user) {
      setExams([]);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const list = await appExamApi.list();
        if (cancelled) return;

        const mapped = list
          .filter(exam => exam.active)
          .map(exam => toExamConfig(exam as Exam & { university?: { name?: string } }));

        setExams(mapped);

        setExamState(s => {
          if (!s.selectedExamId) return s;
          const stillExists = mapped.some(e => e.id === s.selectedExamId);
          if (stillExists) return s;
          return { ...s, selectedExamId: null, status: 'idle', startTimestamp: null };
        });
      } catch (error) {
        if (cancelled) return;
        if (handleExpiredSession(error)) return;
        console.error('[ExamContext] Falha ao carregar exames:', error);
        setExams([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHydratedStorage, user]);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    saveToStorage('user_session', user);
  }, [hasHydratedStorage, user]);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    saveToStorage('exam_state', examState);
  }, [examState, hasHydratedStorage]);

  useEffect(() => {
    if (!hasHydratedStorage) return;
    saveToStorage('current_exam_state', currentExamState);
  }, [currentExamState, hasHydratedStorage]);

  const login = useCallback(async (cpf: string) => {
    const me = await appCandidateApi.me();
    setUser({ 
      name: me.name,
      email: me.email,
      phone: me.phone,
      cpf, 
      loggedInAt: Date.now() 
    });
  }, []);

  const logout = useCallback(() => {
    clearAppToken();
    setUser(null);
    setExamState(DEFAULT_EXAM_STATE);
    setExams([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_session');
      localStorage.removeItem('exam_state');
    }
  }, []);

  const selectExam = useCallback((id: string) => {
    setExamState(s => ({ ...s, selectedExamId: id }));
  }, []);

  const startExam = useCallback(async () => {
    try {
      const examId = examState.selectedExamId;
      if (!examId) {
        throw new Error('Selecione um vestibular para iniciar a tentativa.');
      }

      const sessionId = getOrCreateExamSessionId();
      if (!sessionId) {
        throw new Error('Não foi possível iniciar a prova nesta aba.');
      }

      const started = await appExamApi.start(examId, { session_id: sessionId });
      const attemptUuid = extractAttemptUuid(started);
      if (!attemptUuid) {
        throw new Error('Falha ao iniciar a prova: tentativa inválida.');
      }

      const now = Date.now();
      const attemptId = attemptUuid;

      armAttemptAccess(attemptId);
      setExamState(s => ({ ...s, status: 'in_progress', startTimestamp: now, attemptId }));
      setActiveExam(examState, attemptId);
    } catch (error) {
      if (handleExpiredSession(error)) return;
      throw error;
    }
  }, [examState, handleExpiredSession]);

  const setActiveExam = useCallback((exam: ExamState, attemptId: string) => {
    const now = Date.now();
    const startTimestamp = exam.startTimestamp ?? now;

    setCurrentExamState(() => ({
      ...exam,
      status: 'in_progress',
      startTimestamp,
      attemptId,
    }) as ExamState);
  }, []);

  const calculateTimeTaken = useCallback(() => {
    const state = examStateRef.current;
    if (!state.startTimestamp) return 0;
    return Date.now() - state.startTimestamp;
  }, []);

  const syncEssay = useCallback(async () => {
    try {
      const state = examStateRef.current;
      const examId = state.selectedExamId;
      if (!examId) {
        throw new Error('Selecione um vestibular para atualizar.');
      }

      const sessionId = getOrCreateExamSessionId();
      if (!sessionId) {
        throw new Error('Sessão da prova inválida.');
      }

      const words = state.essay.trim() ? state.essay.trim().split(/\s+/).length : 0;

      await appExamApi.update(examId, {
        attempt_id: state.attemptId ?? '',
        session_id: sessionId,
        text: state.essay,
        words_count: words,
        time_taken: calculateTimeTaken(),
        tabs_count: state.tabSwitchCount
      });
    } catch (error) {
      if (handleExpiredSession(error)) return;
      throw error;
    }
  }, [calculateTimeTaken, handleExpiredSession]);

  const updateEssay = useCallback((text: string) => {
    setExamState(s => s.status === 'in_progress' ? { ...s, essay: text } : s);
  }, []);

  const submitEssay = useCallback(async () => {
    try {
      const state = examStateRef.current;
      const examId = state.selectedExamId;
      if (!examId) {
        throw new Error('Selecione um vestibular para atualizar.');
      }

      const sessionId = getOrCreateExamSessionId();
      if (!sessionId) {
        throw new Error('Sessão da prova inválida.');
      }

      await appExamApi.submit(examId, {
        attempt_id: state.attemptId ?? '',
        session_id: sessionId,
      });

      setExamState(s => ({ ...s, status: 'submitted' }));
      
    } catch (error) {
      if (handleExpiredSession(error)) return;
      throw error;
    }
  }, []);

  const expireEssay = useCallback(() => {
    setExamState(s => ({ ...s, status: 'expired' }));
    console.log('[MOCK WEBHOOK] Essay expired:', { timestamp: Date.now() });
  }, []);

  const incrementTabSwitch = useCallback(() => {
    setExamState(s => ({ ...s, tabSwitchCount: s.tabSwitchCount + 1 }));
  }, []);

  const setResult = useCallback((result: ExamResult) => {
    setExamState(s => ({ ...s, result }));
  }, []);

  const resetExam = useCallback(() => {
    setExamState(DEFAULT_EXAM_STATE);
  }, []);

  const viewSubmittedExam = useCallback((examId: string): boolean => {
    const exam = exams.find(e => e.id === examId);
    if (!exam || !exam.attempt) return false;
    const attempt = exam.attempt;
    setExamState({
      essay: typeof attempt.text === 'string' ? attempt.text : '',
      status: 'submitted',
      selectedExamId: examId,
      startTimestamp: attempt.created_at_timestamp ?? null,
      attemptId: attempt.id,
      tabSwitchCount: 0,
      result: MOCK_RESULT,
    });
    return true;
  }, [exams]);

  return (
    <ExamContext.Provider value={{
      user, examState, currentExamState, selectedExam, login, logout, selectExam, startExam, setActiveExam,
      viewSubmittedExam,
      updateEssay, syncEssay, submitEssay, expireEssay, incrementTabSwitch, setResult, resetExam,
      exams,
    }}>
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error('useExam must be used within ExamProvider');
  return ctx;
}
