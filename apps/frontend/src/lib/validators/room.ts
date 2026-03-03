import { z } from 'zod';

export const joinRoomSchema = z.object({
  code: z.string()
    .length(6, 'Код должен содержать 6 символов')
    .regex(/^[A-Z0-9]+$/, 'Код может содержать только буквы и цифры'),
});

export type JoinRoomFormData = z.infer<typeof joinRoomSchema>;
