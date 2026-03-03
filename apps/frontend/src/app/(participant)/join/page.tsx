'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth';
import { roomsApi } from '@/lib/api/rooms';
import { joinRoomSchema, JoinRoomFormData } from '@/lib/validators/room';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function JoinPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Войдите в систему для присоединения к квизу');
      router.push('/sign-in');
    }
  }, [isAuthenticated, isLoading, router]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinRoomFormData>({
    resolver: zodResolver(joinRoomSchema),
  });

  const joinMutation = useMutation({
    mutationFn: (data: JoinRoomFormData) => roomsApi.join(data),
    onSuccess: (room) => {
      toast.success('Вы присоединились к комнате');
      router.push(`/room/${room.code}/lobby`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Не удалось присоединиться к комнате');
    },
  });

  const onSubmit = (data: JoinRoomFormData) => {
    joinMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto mt-12 animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle>Присоединиться к квизу</CardTitle>
          <CardDescription>
            Введите код комнаты, чтобы начать игру
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Код комнаты</Label>
              <Input
                id="code"
                placeholder="ABC123"
                maxLength={6}
                className="text-center text-2xl font-mono tracking-widest uppercase"
                {...register('code')}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                }}
                disabled={joinMutation.isPending}
              />
              {errors.code && (
                <p className="text-sm text-destructive">{errors.code.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? 'Подключение...' : 'Присоединиться'}
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
}
