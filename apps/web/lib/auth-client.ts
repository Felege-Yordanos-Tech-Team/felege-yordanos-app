'use client';

import { createAuthClient } from 'better-auth/react';
import { emailOTPClient } from 'better-auth/client/plugins';

/** Browser-side auth API: signIn, signUp, signOut, password reset, email code. */
export const authClient = createAuthClient({ plugins: [emailOTPClient()] });
