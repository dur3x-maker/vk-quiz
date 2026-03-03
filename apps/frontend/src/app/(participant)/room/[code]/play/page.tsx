'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { socketManager } from '@/lib/ws/socket';
import { useGameEvents } from '@/hooks/use-game-events';
import { useGameTimer } from '@/hooks/use-game-timer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Timer, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;
  const { accessToken } = useAuthStore();
  
  useGameEvents(code);
  const timerSeconds = useGameTimer();
  const {
    roomId,
    currentQuestion,
    canSubmitAnswer,
    submitAnswer,
    submittedAnswers,
  } = useGameStore();

  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  
  const hasSubmittedAnswer = currentQuestion 
    ? !!submittedAnswers[currentQuestion.question.id]
    : false;

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOptions([]);
      setStartTime(Date.now());
    }
  }, [currentQuestion?.question.id]);

  const handleOptionToggle = (optionId: string) => {
    if (hasSubmittedAnswer) return;

    if (currentQuestion?.question.answerMode === 'SINGLE') {
      setSelectedOptions([optionId]);
    } else {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    }
  };

  const handleSubmit = () => {
    if (!currentQuestion || !roomId || selectedOptions.length === 0) return;

    const questionId = currentQuestion.question.id;
    
    if (!canSubmitAnswer(questionId)) {
      toast.error('Вы уже отвечали на этот вопрос');
      return;
    }

    const answerTimeMs = Date.now() - startTime;
    
    const answerData = {
      questionId,
      selectedOptionIds: selectedOptions,
      answerTimeMs,
      submittedAt: Date.now(),
    };
    
    submitAnswer(answerData);
    
    const success = socketManager.submitAnswer({
      roomId,
      questionId,
      selectedOptionIds: selectedOptions,
      answerTimeMs,
    });

    if (success) {
      toast.success('Ответ отправлен');
    } else {
      toast.error('Ответ уже отправляется');
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Ожидание вопроса...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Раунд {currentQuestion.roundIndex + 1} • Вопрос {currentQuestion.questionIndex + 1}
        </div>
        <div className="flex items-center gap-2 text-lg font-bold">
          <Timer className="w-5 h-5" />
          <span className={timerSeconds <= 5 ? 'text-destructive' : ''}>
            {timerSeconds}с
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{currentQuestion.question.text}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.question.imageUrl && (
            <img
              src={currentQuestion.question.imageUrl}
              alt="Question"
              className="w-full rounded-lg"
            />
          )}

          <div className="space-y-3">
            {currentQuestion.question.options.map((option) => {
              const isSelected = selectedOptions.includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => handleOptionToggle(option.id)}
                  disabled={hasSubmittedAnswer || timerSeconds === 0}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all duration-200
                    ${isSelected
                      ? 'border-indigo-400 bg-indigo-50/60 backdrop-blur-sm shadow-md shadow-indigo-100/40'
                      : 'border-white/40 bg-white/40 backdrop-blur-sm hover:border-indigo-200 hover:bg-white/60'
                    }
                    ${hasSubmittedAnswer || timerSeconds === 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer active:scale-[0.98]'
                    }
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option.text}</span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              );
            })}
          </div>

          {!hasSubmittedAnswer && timerSeconds > 0 && (
            <Button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0}
              className="w-full"
              size="lg"
            >
              Отправить ответ
            </Button>
          )}

          {hasSubmittedAnswer && (
            <div className="text-center p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/30">
              <p className="text-muted-foreground">
                Ответ отправлен. Ожидание других участников...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
