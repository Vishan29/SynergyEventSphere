import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/FormField';
import { BrandHero } from '@/components/brand/BrandHero';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Wordmark } from '@/components/brand/Wordmark';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { useAuth, roleHomePath } from '@/hooks/useAuth';
import { handleApiError } from '@/lib/errors';
import { loginSchema, type LoginFormValues } from '@/lib/validation';
import { Separator } from '@/components/ui/separator';

export function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const session = await signIn(values);
      navigate(from ?? roleHomePath(session.user.role), { replace: true });
    } catch (err) {
      handleApiError(err, { setError });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandHero />
      <div className="flex min-h-screen flex-col">
        <div className="flex items-center justify-between border-b px-6 py-4 lg:hidden">
          <Wordmark size="sm" />
          <ThemeToggle />
        </div>
        <div className="hidden items-center justify-end px-8 py-4 lg:flex">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
              <p className="text-sm text-muted-foreground">
                Sign in to manage your events and bookings.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                id="email"
                label="Email"
                error={errors.email?.message}
                required
              >
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </FormField>
              <FormField
                id="password"
                label="Password"
                error={errors.password?.message}
                required
              >
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                />
              </FormField>
              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                <LogIn />
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            <div className="relative">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-3 text-xs uppercase tracking-wide text-muted-foreground">
                or
              </span>
            </div>

            <SocialAuthButtons />

            <p className="text-center text-sm text-muted-foreground">
              New here?{' '}
              <Link to="/register" className="font-medium text-primary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
