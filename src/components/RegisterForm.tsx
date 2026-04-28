import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { formatCPF, validateCPF } from '@/lib/cpf';
import { useExam } from '@/context/ExamContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { appCandidateApi, setAppToken } from '@gmsarates/vestibular-api-client';
import type { ValidateOtpRequest } from '@gmsarates/vestibular-api-client';

interface RegisterFormProps {
  onBack: () => void;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function RegisterForm({ onBack }: RegisterFormProps) {
  const [cpf, setCpf] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async () => {
    const cpfDigits = cpf.replace(/\D/g, '');
    const phoneDigits = phone.replace(/\D/g, '');

    if (!validateCPF(cpf)) {
      toast.error('CPF inválido. Verifique os dígitos.');
      return;
    }
    if (name.trim().length < 3 || name.trim().length > 255) {
      toast.error('Nome deve ter entre 3 e 255 caracteres.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Email inválido.');
      return;
    }
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast.error('Telefone deve ter 10 ou 11 dígitos.');
      return;
    }

    setLoading(true);
    try {
      const response = await appCandidateApi.create({
        university_id: import.meta.env.VITE_UNIVERSITY_ID,
        document: cpfDigits,
        name: name.trim(),
        email: email.trim(),
        phone: phoneDigits,
      } as any);

      if (response) {
        toast.success('Cadastro realizado com sucesso!');
        // TODO: implementar fluxo pós-cadastro manualmente
      }
    } catch (error: any) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(error?.toString?.() ?? 'Erro ao cadastrar.');
      }
    } finally {
      setLoading(false);
    }
  }, [cpf, name, email, phone]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Criar Cadastro</CardTitle>
          <CardDescription>Preencha seus dados para se cadastrar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reg-name">Nome completo</Label>
            <Input
              id="reg-name"
              placeholder="Seu nome"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={255}
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-cpf">CPF</Label>
            <Input
              id="reg-cpf"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={e => setCpf(formatCPF(e.target.value))}
              maxLength={14}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-email">Email</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              maxLength={255}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reg-phone">Telefone</Label>
            <Input
              id="reg-phone"
              placeholder="(00) 00000-0000"
              value={phone}
              onChange={e => setPhone(formatPhone(e.target.value))}
              maxLength={16}
              autoComplete="tel"
            />
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </Button>
          <Button variant="ghost" className="w-full" onClick={onBack} disabled={loading}>
            Voltar para login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
