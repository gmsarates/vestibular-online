import { useEffect, useRef, useState } from 'react';
import { formatDuration, useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import toast from 'react-hot-toast';
import { ExamAttemptStatus, ExamConfig } from '@/lib/mock-data';

export function ExamSelector() {
  const { user, exams, selectExam, examState, currentExamState, setActiveExam, viewSubmittedExam, login, refreshExams, logout, startExam, resetExam } = useExam();
  const navigate = useNavigate();
  const [showStartConfirm, setShowStartConfirm] = useState(false);
  const [showMultipleAttempts, setShowMultipleAttempts] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const startRequestedRef = useRef(false);

  const isAttemptSubmitted = (attempt: ExamConfig['attempt']) => {
    if (!attempt) return false;
    if (attempt.status !== 'ATTEMPT_IN_PROGRESS') return true;
    
    return false;
  };

  const selectedExam = exams.find(e => e.id === examState.selectedExamId);
  const currentStartedExam = exams.find(e => e.id === currentExamState?.selectedExamId);
  const inProgressExam = exams.find(e => e.attempt != null && !isAttemptSubmitted(e.attempt));
  const inProgressExamId = inProgressExam?.id ?? null;
  const inProgressAttemptId = inProgressExam?.attempt?.id ?? null;
  const inProgressStartedAt = inProgressExam?.attempt?.created_at_timestamp ?? null;

  useEffect(() => {
    refreshExams();
  }, []);

  useEffect(() => {
    if (!inProgressExamId || !inProgressAttemptId) return;
    if (currentExamState?.attemptId === inProgressAttemptId) return;

    setActiveExam({
      essay: '',
      selectedExamId: inProgressExamId,
      status: 'in_progress',
      startTimestamp: inProgressStartedAt,
      attemptId: inProgressAttemptId,
      tabSwitchCount: 0,
      result: null,
    }, inProgressAttemptId);
  }, [currentExamState?.attemptId, inProgressAttemptId, inProgressExamId, inProgressStartedAt, setActiveExam]);

  function calculateTimeLeft(
    startedDate: number | string | null | undefined,
    durationMinutes: number | null | undefined,
  ) {
    const startedAtMs =
      typeof startedDate === 'number'
        ? startedDate
        : startedDate
          ? new Date(startedDate).getTime()
          : Number.NaN;

    if (!Number.isFinite(startedAtMs)) {
      setTimeLeft(0);
      return;
    }

    const elapsedMinutes = Math.floor((Date.now() - startedAtMs) / (1000 * 60));
    setTimeLeft(Math.max(0, (durationMinutes ?? 0) - elapsedMinutes));
  }

  const handleStart = async () => {
    if (!selectedExam) {
      toast.error('Selecione um vestibular para iniciar.');
      return;
    }
    if (startRequestedRef.current) return;
    startRequestedRef.current = true;

    try {
      await startExam();
      setShowStartConfirm(false);
      navigate({ to: '/exam' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Falha ao iniciar a tentativa.';
      const startedExam = currentStartedExam ?? inProgressExam;
      const startedAttempt = startedExam?.attempt ?? null;
      if (message === 'Multiple attempts' && startedAttempt) {
        // aqui se eu clicar logo depois do login, nao ta pegando a prova que ta em andamento
        calculateTimeLeft(
          currentExamState?.startTimestamp ?? startedAttempt.created_at_timestamp,
          startedExam?.durationMinutes,
        );
        setShowMultipleAttempts(true)
      } else {
        toast.error(message);
      }
      //resetExam();
      startRequestedRef.current = false;
    }
  };

  const handleSubmittedClick = (exam: ExamConfig) => {
    if (viewSubmittedExam(exam.id)) {
      navigate({ to: '/exam' });
    }
  };

  const handleDisabledClick = (exam: ExamConfig) => {
    if (isAttemptSubmitted(exam.attempt)) {
      handleSubmittedClick(exam);
      return;
    }
    calculateTimeLeft(exam?.attempt?.created_at_timestamp, exam.durationMinutes)
    setShowMultipleAttempts(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Olá, {user?.name ?? 'bem vindo!'}</h1>
          <Button variant="ghost" onClick={() => setShowLogoutConfirm(true)}>Sair</Button>
        </div>
        <p className="text-[0.8rem] text-muted-foreground text-center">Verifique abaixo os vestibulares disponíveis para seu perfil.</p>

        <div className="grid gap-4">
          {exams.map(exam => {
            const submitted = isAttemptSubmitted(exam.attempt);
            const hasUnfinishedAttempt = exam.attempt != null && !submitted;
            const clickable = !hasUnfinishedAttempt; // submitted is clickable (view), idle is clickable (select)

            return (
            <Card
              key={exam.id}
              className={`${clickable ? 'cursor-pointer transition-shadow hover:shadow-lg' : ''}  ${examState.selectedExamId === exam.id && !submitted ? 'ring-2 ring-primary' : ''} ${submitted ? 'border-primary/40' : ''}`}
              onClick={() => {
                if (submitted) return handleSubmittedClick(exam);
                if (hasUnfinishedAttempt) return handleDisabledClick(exam);
                return selectExam(exam.id);
              }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                  <span>{exam.name}</span>
                  {submitted && (
                    <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                      {ExamAttemptStatus[exam.attempt?.status as keyof typeof ExamAttemptStatus]}
                    </span>
                  )}
                </CardTitle>
                <CardDescription>{exam.courses.map((c) => {return c.name}).join(', ')}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  <strong>Duração:</strong> {exam.duration}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Conteúdo:</strong> de {exam.minWords} a {exam.maxWords} palavras
                </p>
                {submitted && (
                  <p className="text-xs text-primary mt-2">Clique para visualizar sua redação enviada.</p>
                )}
              </CardContent>
            </Card>
          )
          })}
        </div>

        {examState.selectedExamId && selectedExam && !isAttemptSubmitted(selectedExam.attempt) && (
          <div className="flex justify-center">
            <Button size="lg" onClick={() => setShowStartConfirm(true)}>
              Iniciar Prova
            </Button>
          </div>
        )}
      </div>

      {/* Multiple attempts alert */}
      <AlertDialog open={showMultipleAttempts} onOpenChange={setShowMultipleAttempts}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tentativa em aberto</AlertDialogTitle>
            <AlertDialogDescription>
              Você já iniciou anteriormente a realização da prova <strong>{currentStartedExam?.name}</strong> e não pode
              iniciar novamente. 
              Você precisa esperar o tempo total da prova para poder iniciar um novo teste. 
              Atualmente, faltam <strong>{formatDuration(timeLeft)}</strong> para finalizar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fechar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirm start exam */}
      <AlertDialog open={showStartConfirm} onOpenChange={setShowStartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar Prova</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a iniciar a prova <strong>"{selectedExam?.name}"</strong>.
              O cronômetro de {selectedExam?.duration} começará imediatamente.
              Tem certeza que deseja continuar? <strong>Você pode realizar esta prova apenas uma vez</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStart}>
              Iniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm logout */}
      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair da plataforma</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Sua sessão será encerrada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={logout}>Sair</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
