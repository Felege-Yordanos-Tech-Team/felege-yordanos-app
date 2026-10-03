'use client';

import { createAuthClient } from 'better-auth/react';

/** Browser-side auth API: signIn, signUp, signOut, password reset. */
export const authClient = createAuthClient();
