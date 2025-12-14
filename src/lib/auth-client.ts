import { createAuthClient } from 'better-auth/react';
export const { signIn, signUp, useSession, listAccounts, signOut } =
  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
  });
