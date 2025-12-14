'use client';
import { signIn } from '@/lib/auth-client';
import { GithubIcon } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Spinner } from './ui/spinner';

export default function SignUpGithubButton() {
  const [isPending, startTransition] = useTransition();
  const singInWithGithub = () => {
    startTransition(async () => {
      await signIn.social({
        provider: 'github',
        callbackURL: `${process.env.NEXT_PUBLIC_API_URL}/chat`,
        fetchOptions: {
          onSuccess: () => {
            toast.success('Sign in with Github successful.Redirecting...');
          },
          onError: (error) => {
            toast.error('Sign in with Github failed.', {
              description: error.error.message,
            });
          },
        },
      });
    });
  };

  return (
    <Button disabled={isPending} onClick={singInWithGithub} variant={'outline'}>
      {isPending ? (
        <Spinner />
      ) : (
        <>
          <GithubIcon />
          <span>GitHub</span>
        </>
      )}
    </Button>
  );
}
