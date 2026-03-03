import { PrismaClient, Role, QuestionType, AnswerMode } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const organizerPassword = await bcrypt.hash('organizer123', 10);
  const participantPassword = await bcrypt.hash('participant123', 10);

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@example.com' },
    update: {},
    create: {
      email: 'organizer@example.com',
      passwordHash: organizerPassword,
      role: Role.ORGANIZER,
    },
  });

  const participant1 = await prisma.user.upsert({
    where: { email: 'participant1@example.com' },
    update: {},
    create: {
      email: 'participant1@example.com',
      passwordHash: participantPassword,
      role: Role.PARTICIPANT,
    },
  });

  const participant2 = await prisma.user.upsert({
    where: { email: 'participant2@example.com' },
    update: {},
    create: {
      email: 'participant2@example.com',
      passwordHash: participantPassword,
      role: Role.PARTICIPANT,
    },
  });

  console.log('✅ Users created');

  const quiz = await prisma.quiz.create({
    data: {
      title: 'General Knowledge Quiz',
      description: 'Test your general knowledge with this fun quiz!',
      ownerId: organizer.id,
      rounds: {
        create: [
          {
            title: 'Round 1: Geography',
            order: 0,
            questions: {
              create: [
                {
                  type: QuestionType.TEXT,
                  answerMode: AnswerMode.SINGLE,
                  text: 'What is the capital of France?',
                  timerSeconds: 30,
                  points: 10,
                  order: 0,
                  options: {
                    create: [
                      { text: 'London', isCorrect: false, order: 0 },
                      { text: 'Paris', isCorrect: true, order: 1 },
                      { text: 'Berlin', isCorrect: false, order: 2 },
                      { text: 'Madrid', isCorrect: false, order: 3 },
                    ],
                  },
                },
                {
                  type: QuestionType.TEXT,
                  answerMode: AnswerMode.SINGLE,
                  text: 'Which is the largest ocean on Earth?',
                  timerSeconds: 30,
                  points: 10,
                  order: 1,
                  options: {
                    create: [
                      { text: 'Atlantic Ocean', isCorrect: false, order: 0 },
                      { text: 'Indian Ocean', isCorrect: false, order: 1 },
                      { text: 'Arctic Ocean', isCorrect: false, order: 2 },
                      { text: 'Pacific Ocean', isCorrect: true, order: 3 },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'Round 2: Science',
            order: 1,
            questions: {
              create: [
                {
                  type: QuestionType.TEXT,
                  answerMode: AnswerMode.MULTI,
                  text: 'Which of these are planets in our solar system?',
                  timerSeconds: 45,
                  points: 15,
                  order: 0,
                  options: {
                    create: [
                      { text: 'Mars', isCorrect: true, order: 0 },
                      { text: 'Pluto', isCorrect: false, order: 1 },
                      { text: 'Jupiter', isCorrect: true, order: 2 },
                      { text: 'Moon', isCorrect: false, order: 3 },
                    ],
                  },
                },
                {
                  type: QuestionType.TEXT,
                  answerMode: AnswerMode.SINGLE,
                  text: 'What is the chemical symbol for water?',
                  timerSeconds: 20,
                  points: 10,
                  order: 1,
                  options: {
                    create: [
                      { text: 'H2O', isCorrect: true, order: 0 },
                      { text: 'CO2', isCorrect: false, order: 1 },
                      { text: 'O2', isCorrect: false, order: 2 },
                      { text: 'NaCl', isCorrect: false, order: 3 },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Quiz created with rounds and questions');

  console.log('\n📋 Seed data summary:');
  console.log('-----------------------------------');
  console.log('Organizer:');
  console.log('  Email: organizer@example.com');
  console.log('  Password: organizer123');
  console.log('\nParticipants:');
  console.log('  Email: participant1@example.com');
  console.log('  Password: participant123');
  console.log('  Email: participant2@example.com');
  console.log('  Password: participant123');
  console.log('\nQuiz:');
  console.log(`  Title: ${quiz.title}`);
  console.log(`  ID: ${quiz.id}`);
  console.log('-----------------------------------\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
