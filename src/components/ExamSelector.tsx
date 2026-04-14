import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from '@tanstack/react-router';

export function ExamSelector() {
  const { exams, selectExam, examState, logout } = useExam();
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Selecione o Vestibular</h1>
          <Button variant="ghost" onClick={logout}>Sair</Button>
        </div>

        <div className="grid gap-4">
          {exams.map(exam => (
            <Card
              key={exam.id}
              className={`cursor-pointer transition-shadow hover:shadow-lg ${examState.selectedExamId === exam.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => selectExam(exam.id)}
            >
              <CardHeader>
                <CardTitle>{exam.name}</CardTitle>
                <CardDescription>{exam.institution}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Duração: {exam.durationMinutes} minutos · {exam.minWords}–{exam.maxWords} palavras
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {examState.selectedExamId && (
          <div className="flex justify-center">
            <Button size="lg" onClick={() => navigate({ to: '/exam' })}>
              Iniciar Prova
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
