import SignUpGithubButton from '@/components/signin-githubBtn';
import SignUpGoogleButton from '@/components/signin-googleBtn';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MessageCircleDashedIcon } from 'lucide-react';
import Link from 'next/link';

export default function page() {
  return (
    <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
      <form action="" className="max-w-92 m-auto h-fit w-full">
        <div className="p-6">
          <div>
            <Link href="/" aria-label="go home">
              <MessageCircleDashedIcon className="size-6 animate-pulse" />
            </Link>
            <h1 className="mb-1 mt-4 text-xl font-semibold">
              Sign In to Buddy Chat
            </h1>
            <p>Welcome back! Sign in to continue</p>
          </div>

          <div className="mt-6 w-full grid grid-cols-2 gap-x-2">
            <SignUpGithubButton />
            <SignUpGoogleButton />
          </div>

          <div className="my-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <hr className="border-dashed" />
            <span className="text-muted-foreground text-xs">
              Or continue With
            </span>
            <hr className="border-dashed" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="block text-sm">
                Email
              </Label>
              <Input type="email" required name="email" id="email" />
            </div>

            <Button className="w-full">Continue</Button>
          </div>
        </div>
      </form>
    </section>
  );
}
