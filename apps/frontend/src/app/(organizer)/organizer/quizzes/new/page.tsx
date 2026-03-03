'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { quizzesApi } from '@/lib/api/quizzes';
import { createQuizSchema, CreateQuizFormData } from '@/lib/validators/quiz';
import { QuestionType, AnswerMode } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewQuizPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateQuizFormData>({
    resolver: zodResolver(createQuizSchema),
    defaultValues: {
      title: '',
      description: '',
      rounds: [
        {
          title: 'Раунд 1',
          order: 0,
          questions: [
            {
              type: QuestionType.TEXT,
              answerMode: AnswerMode.SINGLE,
              text: '',
              imageUrl: '',
              timerSeconds: 30,
              points: 10,
              order: 0,
              options: [
                { text: '', isCorrect: false, order: 0 },
                { text: '', isCorrect: false, order: 1 },
              ],
            },
          ],
        },
      ],
    },
  });

  const { fields: rounds, append: appendRound, remove: removeRound } = useFieldArray({
    control,
    name: 'rounds',
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateQuizFormData) => quizzesApi.create(data),
    onSuccess: (quiz) => {
      toast.success('Квиз создан');
      router.push(`/organizer/quizzes/${quiz.id}`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ошибка создания');
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CreateQuizFormData) => {
    setIsSubmitting(true);
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/organizer/quizzes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Создать квиз</h1>
          <p className="text-muted-foreground">Заполните информацию о квизе</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Основная информация</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Название квиза</Label>
              <Input
                id="title"
                {...register('title')}
                placeholder="Введите название"
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание (опционально)</Label>
              <Input
                id="description"
                {...register('description')}
                placeholder="Краткое описание квиза"
                disabled={isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {rounds.map((round, roundIndex) => (
          <RoundCard
            key={round.id}
            roundIndex={roundIndex}
            control={control}
            register={register}
            errors={errors}
            onRemove={() => removeRound(roundIndex)}
            canRemove={rounds.length > 1}
            isSubmitting={isSubmitting}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            appendRound({
              title: `Раунд ${rounds.length + 1}`,
              order: rounds.length,
              questions: [
                {
                  type: QuestionType.TEXT,
                  answerMode: AnswerMode.SINGLE,
                  text: '',
                  imageUrl: '',
                  timerSeconds: 30,
                  points: 10,
                  order: 0,
                  options: [
                    { text: '', isCorrect: false, order: 0 },
                    { text: '', isCorrect: false, order: 1 },
                  ],
                },
              ],
            })
          }
          disabled={isSubmitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить раунд
        </Button>

        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Создание...' : 'Создать квиз'}
          </Button>
          <Link href="/organizer/quizzes">
            <Button type="button" variant="outline" disabled={isSubmitting}>
              Отмена
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}

function RoundCard({
  roundIndex,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  isSubmitting,
}: any) {
  const { fields: questions, append: appendQuestion, remove: removeQuestion } = useFieldArray({
    control,
    name: `rounds.${roundIndex}.questions`,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Раунд {roundIndex + 1}</CardTitle>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Название раунда</Label>
          <Input
            {...register(`rounds.${roundIndex}.title`)}
            placeholder="Название раунда"
            disabled={isSubmitting}
          />
          {errors.rounds?.[roundIndex]?.title && (
            <p className="text-sm text-destructive">
              {errors.rounds[roundIndex].title.message}
            </p>
          )}
        </div>

        {questions.map((question, questionIndex) => (
          <QuestionCard
            key={question.id}
            roundIndex={roundIndex}
            questionIndex={questionIndex}
            control={control}
            register={register}
            errors={errors}
            onRemove={() => removeQuestion(questionIndex)}
            canRemove={questions.length > 1}
            isSubmitting={isSubmitting}
          />
        ))}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendQuestion({
              type: QuestionType.TEXT,
              answerMode: AnswerMode.SINGLE,
              text: '',
              imageUrl: '',
              timerSeconds: 30,
              points: 10,
              order: questions.length,
              options: [
                { text: '', isCorrect: false, order: 0 },
                { text: '', isCorrect: false, order: 1 },
              ],
            })
          }
          disabled={isSubmitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить вопрос
        </Button>
      </CardContent>
    </Card>
  );
}

function QuestionCard({
  roundIndex,
  questionIndex,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  isSubmitting,
}: any) {
  const { fields: options, append: appendOption, remove: removeOption } = useFieldArray({
    control,
    name: `rounds.${roundIndex}.questions.${questionIndex}.options`,
  });

  return (
    <div className="rounded-xl bg-white/30 backdrop-blur-sm border border-white/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Вопрос {questionIndex + 1}</h4>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={isSubmitting}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Тип</Label>
          <select
            {...register(`rounds.${roundIndex}.questions.${questionIndex}.type`)}
            className="w-full h-10 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-3 transition-all duration-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 outline-none"
            disabled={isSubmitting}
          >
            <option value={QuestionType.TEXT}>Текст</option>
            <option value={QuestionType.IMAGE}>Изображение</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label>Режим ответа</Label>
          <select
            {...register(`rounds.${roundIndex}.questions.${questionIndex}.answerMode`)}
            className="w-full h-10 rounded-lg border border-white/40 bg-white/60 backdrop-blur-sm px-3 transition-all duration-200 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200/50 outline-none"
            disabled={isSubmitting}
          >
            <option value={AnswerMode.SINGLE}>Один вариант</option>
            <option value={AnswerMode.MULTI}>Несколько вариантов</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Текст вопроса</Label>
        <Input
          {...register(`rounds.${roundIndex}.questions.${questionIndex}.text`)}
          placeholder="Введите вопрос"
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <Label>URL изображения (опционально)</Label>
        <Input
          {...register(`rounds.${roundIndex}.questions.${questionIndex}.imageUrl`)}
          placeholder="https://example.com/image.jpg"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Время (сек)</Label>
          <Input
            type="number"
            {...register(`rounds.${roundIndex}.questions.${questionIndex}.timerSeconds`, {
              valueAsNumber: true,
            })}
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label>Баллы</Label>
          <Input
            type="number"
            {...register(`rounds.${roundIndex}.questions.${questionIndex}.points`, {
              valueAsNumber: true,
            })}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Варианты ответа</Label>
        {options.map((option, optionIndex) => (
          <div key={option.id} className="flex gap-2">
            <Input
              {...register(
                `rounds.${roundIndex}.questions.${questionIndex}.options.${optionIndex}.text`
              )}
              placeholder={`Вариант ${optionIndex + 1}`}
              disabled={isSubmitting}
            />
            <label className="flex items-center gap-2 px-3 rounded-lg border border-white/40 bg-white/50 backdrop-blur-sm">
              <input
                type="checkbox"
                {...register(
                  `rounds.${roundIndex}.questions.${questionIndex}.options.${optionIndex}.isCorrect`
                )}
                disabled={isSubmitting}
              />
              <span className="text-sm">Правильный</span>
            </label>
            {options.length > 2 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOption(optionIndex)}
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            appendOption({
              text: '',
              isCorrect: false,
              order: options.length,
            })
          }
          disabled={isSubmitting}
        >
          <Plus className="w-4 h-4 mr-2" />
          Добавить вариант
        </Button>
      </div>
    </div>
  );
}
