import { z } from 'zod';

export const UserSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  picture: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserSchema.omit({ id: true });
export type CreateUser = z.infer<typeof CreateUserSchema>;
