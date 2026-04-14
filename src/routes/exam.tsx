import { createFileRoute } from '@tanstack/react-router';
import { EssayEditor } from '@/components/EssayEditor';

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
  return <EssayEditor />;
}
