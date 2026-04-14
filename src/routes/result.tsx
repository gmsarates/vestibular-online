import { createFileRoute } from '@tanstack/react-router';
import { ResultView } from '@/components/ResultView';

export const Route = createFileRoute('/result')({
  head: () => ({
    meta: [
      { title: 'Resultado — Vestibular Online' },
      { name: 'description', content: 'Veja o resultado da sua redação do vestibular.' },
    ],
  }),
  component: ResultPage,
});

function ResultPage() {
  return <ResultView />;
}
