'use client';
import { signIn } from '@/lib/auth-client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

export default function SignUpGoogleButton() {
  const [isPending, startTransition] = useTransition();
  const singInWithGoogle = () => {
    startTransition(async () => {
      await signIn.social({
        provider: 'google',
        callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
        fetchOptions: {
          onSuccess: () => {
            toast.success('Sign in with Google successful.Redirecting...');
          },
          onError: (error) => {
            toast.error('Sign in with Google failed.', {
              description: error.error.message,
            });
          },
        },
      });
    });
  };

  return (
    <Button disabled={isPending} onClick={singInWithGoogle} variant={'outline'}>
      {isPending ? (
        <Spinner />
      ) : (
        <>
          <img src={'/Google.svg'} alt="Google" className="size-4" />
          <span>Google</span>
        </>
      )}
    </Button>
  );
}
