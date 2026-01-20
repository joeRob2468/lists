import { z } from 'zod';
import { UserSchema } from './user.schemas';

export type User = z.infer<typeof UserSchema>;
