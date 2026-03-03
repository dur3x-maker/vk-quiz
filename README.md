# VK Quiz — Real-time Quiz Platform (MVP)

Платформа для проведения интерактивных квизов в реальном времени.
Организатор создает квиз, запускает комнату — участники подключаются по коду и отвечают на вопросы с таймером, баллами и лидербордом.

## Архитектура

| Слой | Стек |
|------|------|
| **Backend** | NestJS + Prisma + PostgreSQL |
| **Frontend** | Next.js 14 + Zustand + TailwindCSS |
| **Realtime** | Socket.IO (WebSocket) |
| **Auth** | JWT (access + refresh tokens) |

Монорепозиторий: backend в корне, frontend в `apps/frontend`.

```
root/
├── src/                        # Backend (NestJS)
│   ├── auth/                   # Аутентификация (JWT)
│   ├── users/                  # Пользователи
│   ├── quizzes/                # CRUD квизов
│   ├── rooms/                  # Комнаты
│   ├── game/                   # Игровая логика + WebSocket gateway
│   ├── history/                # История игр
│   ├── common/                 # Guards, filters, decorators
│   ├── prisma/                 # Prisma service
│   └── main.ts
├── prisma/
│   └── schema.prisma           # Модель данных
├── apps/frontend/              # Frontend (Next.js 14)
│   └── src/
│       ├── app/                # App Router pages
│       │   ├── (auth)/         # sign-in, sign-up
│       │   ├── (organizer)/    # Управление квизами, live control
│       │   └── (participant)/  # join, lobby, play, results
│       ├── components/         # UI компоненты (Card, Button, Navbar)
│       ├── hooks/              # useGameEvents, useAuth, useRoleGuard
│       ├── lib/                # API client, WebSocket manager
│       ├── store/              # Zustand (auth, game)
│       └── types/              # TypeScript типы (API, WS)
└── README.md
```

## Основной функционал

- Регистрация и авторизация с ролями: `ORGANIZER` / `PARTICIPANT`
- CRUD квизов с раундами и вопросами
- Типы вопросов: текст, изображение
- Режимы ответа: single choice / multiple choice
- Комнаты с подключением по 6-значному коду
- Realtime синхронизация фаз (lobby → question → leaderboard → finished)
- Серверный таймер с drift correction на клиенте
- Подсчет баллов на сервере
- Leaderboard после каждого вопроса и финальный
- История участия и проведенных квизов

## Запуск проекта

### Backend

```bash
npm install
cp .env.example .env        # настроить переменные
npx prisma migrate dev
npm run start:dev            # http://localhost:3000
```

### Frontend

```bash
cd apps/frontend
npm install
npm run dev                  # http://localhost:3001
```

## Переменные окружения

### Backend (`.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/vkquiz"
JWT_ACCESS_SECRET=your-access-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3001
```

### Frontend (`apps/frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

## API

### REST Endpoints

| Метод | Путь | Описание |
|-------|------|----------|
| `POST` | `/auth/sign-up` | Регистрация |
| `POST` | `/auth/sign-in` | Вход |
| `POST` | `/auth/refresh` | Обновление токенов |
| `POST` | `/auth/logout` | Выход |
| `GET`  | `/auth/me` | Текущий пользователь |
| `GET`  | `/quizzes` | Список квизов |
| `GET`  | `/quizzes/:id` | Детали квиза |
| `POST` | `/quizzes` | Создать квиз |
| `PUT`  | `/quizzes/:id` | Обновить квиз |
| `DELETE` | `/quizzes/:id` | Удалить квиз |
| `POST` | `/rooms` | Создать комнату |
| `POST` | `/rooms/join` | Присоединиться по коду |
| `GET`  | `/rooms/:id` | Детали комнаты |
| `GET`  | `/rooms/:id/participants` | Участники |
| `GET`  | `/history/participant` | История участника |
| `GET`  | `/history/organizer` | История организатора |

Swagger: `http://localhost:3000/docs`

### WebSocket Events

**Client → Server:**

| Event | Payload | Описание |
|-------|---------|----------|
| `room.join` | `{ roomId }` | Войти в комнату |
| `quiz.start` | `{ roomId }` | Начать квиз (organizer) |
| `quiz.next_question` | `{ roomId }` | Следующий вопрос (organizer) |
| `quiz.submit_answer` | `{ roomId, questionId, selectedOptionIds, answerTimeMs }` | Ответить (participant) |
| `quiz.end` | `{ roomId }` | Завершить квиз (organizer) |

**Server → Client:**

| Event | Описание |
|-------|----------|
| `room.phase_sync` | Синхронизация состояния при подключении |
| `lobby.update` | Обновление списка участников |
| `room.phase_changed` | Смена фазы комнаты |
| `quiz.next_question` | Новый вопрос (без правильных ответов) |
| `quiz.timer_tick` | Тик таймера |
| `quiz.answer_received` | Ответ получен (broadcast) |
| `quiz.answer_result` | Результат ответа (unicast) |
| `quiz.leaderboard_update` | Обновление лидерборда |
| `quiz.ended` | Квиз завершен + финальный лидерборд |

## MVP Статус

Реализована полная функциональность согласно ТЗ:

- Realtime квиз с WebSocket синхронизацией
- Серверный scoring и leaderboard
- История игр для обеих ролей
- Reconnect и state recovery после F5
- Стабильная работа при cold start

## Макеты

https://www.figma.com/proto/MWzwhWlmvwcERmVYQScH1C/Quiz-room?node-id=1-2&t=DzgFHLFeswYy9GyB-1

## License

MIT
