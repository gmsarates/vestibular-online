import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  awaiting: { label: 'Aguardando correção', color: 'text-muted-foreground' },
  approved: { label: 'Aprovado', color: 'text-primary' },
  rejected: { label: 'Reprovado', color: 'text-destructive' },
};

export function ResultView() {
  const { examState, selectedExam, logout } = useExam();
  const navigate = useNavigate();
  const result = examState.result;

  const statusInfo = result ? STATUS_LABELS[result.status] ?? STATUS_LABELS.awaiting : STATUS_LABELS.awaiting;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Resultado da Redação</CardTitle>
          {selectedExam && (
            <p className="text-sm text-muted-foreground">{selectedExam.name} — {selectedExam.institution}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Status</p>
            <p className={`text-xl font-bold ${statusInfo.color}`}>{statusInfo.label}</p>
          </div>

          {/* Exam status */}
          <div className="rounded-lg bg-secondary p-4 text-center">
            <p className="text-sm text-muted-foreground">Status da prova</p>
            <p className="font-semibold text-foreground capitalize">
              {examState.status === 'submitted' ? '✓ Enviada' :
               examState.status === 'expired' ? '⏱ Expirada' :
               examState.status === 'in_progress' ? 'Em andamento' : 'Não iniciada'}
            </p>
          </div>

          {/* Grade */}
          {result?.grade !== null && result?.grade !== undefined && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Nota</p>
              <p className="text-4xl font-bold text-foreground">{result.grade}<span className="text-lg text-muted-foreground">/1000</span></p>
            </div>
          )}

          {/* Feedback */}
          {result?.feedback && (
            <div className="rounded-lg border p-4">
              <p className="text-sm font-medium text-foreground mb-1">Feedback</p>
              <p className="text-sm text-muted-foreground">{result.feedback}</p>
            </div>
          )}

          {/* Simulate result button (for demo) */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const { setResult } = require('@/context/ExamContext');
                // Demo: cycle through mock results
              }}
              className="hidden"
            >
              Simular resultado
            </Button>
          </div>

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
