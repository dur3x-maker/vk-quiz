'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizzesApi } from '@/lib/api/quizzes';
import { roomsApi } from '@/lib/api/rooms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Play, Edit, Trash2 } from 'lucide-react';

export default function QuizDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const quizId = params.id as string;
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const { data: quiz, isLoading } = useQuery({
    queryKey: ['quiz', quizId],
    queryFn: () => quizzesApi.getById(quizId),
  });

  const createRoomMutation = useMutation({
    mutationFn: () => roomsApi.create({ quizId }),
    onSuccess: (room) => {
      toast.success(`Комната создана: ${room.code}`);
      router.push(`/organizer/quizzes/${quizId}/live?roomId=${room.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка создания комнаты');
      setIsCreatingRoom(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => quizzesApi.delete(quizId),
    onSuccess: () => {
      toast.success('Квиз удалён');
      router.push('/organizer/quizzes');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка удаления');
    },
  });

  const handleStartGame = () => {
    setIsCreatingRoom(true);
    createRoomMutation.mutate();
  };

  const handleDelete = () => {
    if (confirm('Вы уверены, что хотите удалить этот квиз?')) {
      deleteMutation.mutate();
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

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Квиз не найден</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/organizer/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{quiz.title}</h1>
          {quiz.description && (
            <p className="text-muted-foreground">{quiz.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleStartGame}
            disabled={isCreatingRoom}
            size="lg"
          >
            <Play className="w-4 h-4 mr-2" />
            {isCreatingRoom ? 'Создание...' : 'Начать игру'}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {quiz.rounds.map((round, roundIndex) => (
          <Card key={round.id}>
            <CardHeader>
              <CardTitle>
                {round.title} ({round.questions.length} вопросов)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {round.questions.map((question, questionIndex) => (
                <div key={question.id} className="border-l-4 border-indigo-400/60 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {roundIndex + 1}.{questionIndex + 1}. {question.text}
                      </p>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <span>{question.timerSeconds}с</span>
                        <span className="mx-2">•</span>
                        <span>{question.points} баллов</span>
                        <span className="mx-2">•</span>
                        <span>{question.answerMode === 'SINGLE' ? 'Один вариант' : 'Несколько вариантов'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {question.options.map((option) => (
                      <div
                        key={option.id}
                        className={`text-sm px-3 py-2 rounded-lg transition-all duration-200 ${
                          option.isCorrect
                            ? 'bg-emerald-50/70 backdrop-blur-sm border border-emerald-200/50 text-emerald-800'
                            : 'bg-white/40 backdrop-blur-sm border border-white/30'
                        }`}
                      >
                        {option.text}
                        {option.isCorrect && ' ✓'}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
