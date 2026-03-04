import { z } from 'zod';

const UserCore = z.object({
  id: z.uuid(),
  name: z.string(),
  email: z.email(),
  picture: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
});

export const UserSchema = UserCore;
export type User = z.infer<typeof UserSchema>;

export const CreateUserSchema = UserCore.omit({ id: true, createdAt: true });
export type CreateUser = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = UserCore.partial().pick({
  name: true,
  picture: true,
});
export type UpdateUser = z.infer<typeof UpdateUserSchema>;
