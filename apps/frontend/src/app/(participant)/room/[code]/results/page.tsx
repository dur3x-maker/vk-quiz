'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useGameStore } from '@/store/game';
import { useAuthStore } from '@/store/auth';
import { socketManager } from '@/lib/ws/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal, Award } from 'lucide-react';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const { leaderboard, setLeaderboard, reset } = useGameStore();

  useEffect(() => {
    if (leaderboard.length === 0) {
      console.warn('[Results] No leaderboard data - may need to wait for quiz.ended event');
    }
  }, [leaderboard]);

  const myResult = leaderboard.find(entry => entry.userId === user?.id);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return null;
    }
  };

  const handleFinish = () => {
    reset();
    socketManager.disconnect();
    router.push('/join');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-3xl">Квиз завершён!</CardTitle>
        </CardHeader>
        <CardContent>
          {myResult && (
            <div className="text-center p-6 rounded-2xl bg-indigo-50/60 backdrop-blur-sm border border-indigo-200/40 shadow-md shadow-indigo-100/30 mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                {getRankIcon(myResult.rank)}
                <h2 className="text-2xl font-bold">
                  Место: {myResult.rank}
                </h2>
              </div>
              <p className="text-lg text-muted-foreground">
                Набрано баллов: {myResult.totalPoints}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-lg mb-4">Таблица лидеров</h3>
            {leaderboard.map((entry) => (
              <div
                key={entry.userId}
                className={`
                  flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:translate-y-[-1px] hover:shadow-md
                  ${entry.userId === user?.id
                    ? 'bg-indigo-50/60 backdrop-blur-sm border-2 border-indigo-400/60 shadow-md shadow-indigo-100/30'
                    : 'bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60'
                  }
                  ${entry.rank === 1 ? 'ring-2 ring-yellow-400/50 ring-offset-2 ring-offset-transparent' : ''}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank) || (
                      <span className="font-bold text-muted-foreground">
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <span className="font-medium">{entry.email}</span>
                </div>
                <span className="text-lg font-bold">{entry.totalPoints}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <Button onClick={handleFinish} className="w-full" size="lg">
              Завершить
            </Button>
            <Link href="/history" className="block">
              <Button variant="outline" className="w-full">
                Посмотреть историю
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
