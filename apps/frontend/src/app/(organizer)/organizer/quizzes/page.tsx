'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizzesApi } from '@/lib/api/quizzes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Play } from 'lucide-react';

export default function QuizzesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: quizzes, isLoading } = useQuery({
    queryKey: ['quizzes'],
    queryFn: () => quizzesApi.getAll(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quizzesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success('Квиз удалён');
      setDeletingId(null);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка удаления');
      setDeletingId(null);
    },
  });

  const handleDelete = (id: string) => {
    if (confirm('Вы уверены, что хотите удалить этот квиз?')) {
      setDeletingId(id);
      deleteMutation.mutate(id);
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мои квизы</h1>
          <p className="text-muted-foreground">Управление вашими квизами</p>
        </div>
        <Link href="/organizer/quizzes/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Создать квиз
          </Button>
        </Link>
      </div>

      {!quizzes || quizzes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/50 backdrop-blur-sm border border-white/40 flex items-center justify-center mx-auto">
                <Play className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Нет квизов</h3>
                <p className="text-muted-foreground">Создайте свой первый квиз</p>
              </div>
              <Link href="/organizer/quizzes/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать квиз
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="cursor-pointer hover:shadow-xl hover:translate-y-[-2px] transition-all duration-200">
              <div onClick={() => router.push(`/organizer/quizzes/${quiz.id}`)}>
                <CardHeader>
                  <CardTitle>{quiz.title}</CardTitle>
                  <CardDescription>
                    {quiz.description || 'Без описания'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="font-medium">{quiz.roundsCount}</span> раундов
                    </div>
                    <div>
                      <span className="font-medium">{quiz.questionsCount}</span> вопросов
                    </div>
                  </div>
                </CardContent>
              </div>
              <CardContent className="pt-0">
                <div className="flex gap-2">
                  <Link 
                    href={`/organizer/quizzes/${quiz.id}`} 
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button variant="outline" className="w-full">
                      <Edit className="w-4 h-4 mr-2" />
                      Редактировать
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(quiz.id);
                    }}
                    disabled={deletingId === quiz.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
