import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useState } from 'react';
import { appExamApi } from '@gmsarates/vestibular-api-client';
import toast from 'react-hot-toast';
import { texts, config } from '../../configs';
import { sanitizeExamInstructionHtml } from '@/lib/html';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  REVIEW_PENDING: { label: 'Aguardando correção', color: 'text-muted-foreground' },
  REVIEW_IN_PROGRESS: { label: 'Correção em andamento', color: 'text-primary' },
  AI_REVIEWED: { label: 'Corrigida', color: 'text-info' },
  MANUAL_REVIEWED: { label: 'Corrigida', color: 'text-info' },
};

export function ResultView() {
  const { examState, selectedExam, logout } = useExam();
  const [attempt, setAttempt] = useState<any>();
  const navigate = useNavigate();

  
  const fetchData = useCallback(() => {
    console.log(examState)
    console.log('attemptId', examState.attemptId)

    if (examState.attemptId === null) {
      throw new Error('Não foi possível carregar o resultado, tente novamente.')
    }
    

    Promise.all([appExamApi.info(examState.attemptId)])
      .then((a) => { 
        console.log(a[0])
        setAttempt(a[0])
      })
      .catch(() => toast.error("Erro ao carregar dados"))
      .finally(() => {

      });
  }, [examState, setAttempt]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  

  // const statusInfo = STATUS_LABELS.REVIEW_PENDING;
  const statusInfo = attempt ? (STATUS_LABELS[attempt.status] ?? STATUS_LABELS.REVIEW_PENDING) : STATUS_LABELS.REVIEW_PENDING;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{texts.result.title}</CardTitle>
          {/* {selectedExam && (
            <p className="text-sm text-muted-foreground">{selectedExam.name} — {selectedExam.theme}</p>
            )} */}
          <p className="text-sm text-muted-foreground">{texts.result.description}</p>
          
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Status da correção</p>
            <p className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
          </div>

          {/* result */}
          {attempt?.score != null && (
            <div className="rounded-lg border p-4 text-center">
              <p className="text-sm font-medium text-foreground mb-1">{attempt.score >= config.min_score ? texts.result.approved.title : texts.result.reproved.title}</p>
              <p className="text-sm text-muted-foreground">{attempt.score >= config.min_score ? texts.result.approved.description : texts.result.reproved.description}</p>
            </div>
          )}

          {/* Grade */}
          {attempt?.score != null && attempt?.score != undefined && (attempt?.score ?? 0) >= config.min_score && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Nota</p>
              <p className="text-4xl font-bold text-foreground">{attempt.score}<span className="text-lg text-muted-foreground">/1000</span></p>
            </div>
          )}

          {/* feedback */}
          {attempt?.feedback != null && attempt?.feedback != undefined && (attempt?.score ?? 0) >= config.min_score && (
            <div className="rounded-lg bg-secondary p-4 text-center">
              <p className="text-sm text-muted-foreground">Feedback</p>
              <div
                className="text-foreground text-sm text-left [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_p]:my-2"
                dangerouslySetInnerHTML={{ __html: sanitizeExamInstructionHtml(String(attempt.feedback)) }}
              />
            </div>
          )}


          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate({ to: '/' })}>
              Voltar
            </Button>
            <Button variant="ghost" onClick={logout}>
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
