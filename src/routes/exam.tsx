import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { EssayEditor } from '@/components/EssayEditor';
import { useExam } from '@/context/ExamContext';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getOrCreateExamSessionId } from '@/lib/exam-session';
import { appExamApi, httpClient } from '@gmsarates/vestibular-api-client';
import { consumeAttemptAccess } from '@/lib/exam-session';

export const Route = createFileRoute('/exam')({
  head: () => ({
    meta: [
      { title: 'Prova de Redação — Vestibular Online' },
      { name: 'description', content: 'Editor de redação do vestibular online.' },
    ],
  }),
  component: ExamPage,
});

function ExamPage() {
  const { examState } = useExam();
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationDone, setValidationDone] = useState(false);
  const [isReopenBlocked, setIsReopenBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (examState.status !== 'in_progress') {
      setIsReopenBlocked(false);
      setBlockedReason(null);
      setValidationDone(true);
      return;
    }

    if (!examState.selectedExamId || !examState.attemptId) return;

    const sessionId = getOrCreateExamSessionId();
    if (!sessionId) {
      setIsReopenBlocked(true);
      setBlockedReason('Sessão da prova indisponível nesta aba.');
      return;
    }

    let cancelled = false;
    setIsValidating(true);
    setValidationDone(false);

    (async () => {
      try {
        // Backend must validate that this `session_id` matches the one used on attempt creation.
        await appExamApi.update(examState.selectedExamId ?? '', {
          attempt_id: examState.attemptId,
          session_id: sessionId,
        });

        if (cancelled) return;
        if (!consumeAttemptAccess(examState.attemptId)) {
          setIsReopenBlocked(true);
          setBlockedReason('Esta tentativa já foi aberta (ou a aba foi recarregada).');
          return;
        }
        setIsReopenBlocked(false);
        setBlockedReason(null);
        setValidationDone(true);
      } catch (error) {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Sessão inválida.';
        setIsReopenBlocked(true);
        setBlockedReason(message);
        setValidationDone(true);
      } finally {
        if (!cancelled) setIsValidating(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, examState.status, examState.selectedExamId, examState.attemptId]);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (examState.status === 'in_progress' && (!validationDone || isValidating)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (examState.status === 'in_progress' && isReopenBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>Acesso bloqueado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Por segurança, a sessão desta tentativa não é válida nesta aba e o editor foi bloqueado.
            </p>
            {blockedReason && (
              <p className="text-xs text-muted-foreground">
                Motivo: <span className="font-mono">{blockedReason}</span>
              </p>
            )}
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate({ to: '/' })}>
                Voltar ao início
              </Button>
              <Button onClick={() => navigate({ to: '/result' })}>
                Ver resultado
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <EssayEditor />;
}
