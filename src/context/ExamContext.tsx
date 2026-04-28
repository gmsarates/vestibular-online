import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { type ExamConfig, type ExamResult, MOCK_RESULT, saveToStorage, loadFromStorage } from '@/lib/mock-data';
import { appCandidateApi, appExamApi, clearAppToken, type Exam } from '@gmsarates/vestibular-api-client';

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
  tabSwitchCount: number;
  result: ExamResult | null;
}

interface ExamContextType {
  user: UserSession | null;
  examState: ExamState;
  selectedExam: ExamConfig | null;
  login: (cpf: string) => void;
  logout: () => void;
  selectExam: (id: string) => void;
  startExam: () => void;
  updateEssay: (text: string) => void;
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
  tabSwitchCount: 0,
  result: MOCK_RESULT,
};

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
    instructions: toInstructions(apiExam.description),
    durationMinutes: apiExam.duration,
    minWords: apiExam.min_words,
    maxWords: apiExam.max_words,
  };
}

export function ExamProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [examState, setExamState] = useState<ExamState>(DEFAULT_EXAM_STATE);
  const [hasHydratedStorage, setHasHydratedStorage] = useState(false);
  const [exams, setExams] = useState<ExamConfig[]>([]);

  const selectedExam = exams.find(e => e.id === examState.selectedExamId) ?? null;

  useEffect(() => {
    setUser(loadFromStorage<UserSession>('user_session'));
    setExamState(loadFromStorage<ExamState>('exam_state') ?? DEFAULT_EXAM_STATE);
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
        if (error instanceof Error && error.message === 'Sessão expirada') {
          clearAppToken();
          setUser(null);
          setExamState(DEFAULT_EXAM_STATE);
          setExams([]);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('user_session');
            localStorage.removeItem('exam_state');
          }
          return;
        }
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

  const startExam = useCallback(() => {
    setExamState(s => ({ ...s, status: 'in_progress', startTimestamp: Date.now() }));
  }, []);

  const updateEssay = useCallback((text: string) => {
    setExamState(s => s.status === 'in_progress' ? { ...s, essay: text } : s);
  }, []);

  const submitEssay = useCallback(() => {
    setExamState(s => ({ ...s, status: 'submitted' }));
    // NOTE: In production, this would POST to a secure backend
    console.log('[MOCK WEBHOOK] Essay submitted:', { timestamp: Date.now() });
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

  return (
    <ExamContext.Provider value={{
      user, examState, selectedExam, login, logout, selectExam, startExam,
      updateEssay, submitEssay, expireEssay, incrementTabSwitch, setResult, resetExam,
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
