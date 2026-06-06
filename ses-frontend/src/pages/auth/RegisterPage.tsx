import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/common/FormField';
import { BrandHero } from '@/components/brand/BrandHero';
import { SocialAuthButtons } from '@/components/auth/SocialAuthButtons';
import { Wordmark } from '@/components/brand/Wordmark';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { Separator } from '@/components/ui/separator';
import { handleApiError } from '@/lib/errors';
import { registerSchema, type RegisterFormValues } from '@/lib/validation';
import { register as registerApi } from '@/api/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      contactNo: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      // Public registration always creates a USER role. Organizer/Admin
      // accounts are created from the Admin > Users page.
      await registerApi({
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'USER',
        contactNo: values.contactNo || undefined,
      });
      toast.success('Account created. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      handleApiError(err, { setError });
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <BrandHero subtitle="Create your account in seconds and start exploring events." />
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
              <h2 className="text-3xl font-bold tracking-tight">Create account</h2>
              <p className="text-sm text-muted-foreground">
                Public sign-up creates a standard user account. You can browse
                and book events right away.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField id="name" label="Name" error={errors.name?.message} required>
                <Input
                  id="name"
                  autoComplete="name"
                  placeholder="Your full name"
                  {...register('name')}
                />
              </FormField>
              <FormField id="email" label="Email" error={errors.email?.message} required>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register('email')}
                />
              </FormField>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  id="password"
                  label="Password"
                  error={errors.password?.message}
                  hint="8 to 72 characters"
                  required
                >
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    {...register('password')}
                  />
                </FormField>
                <FormField
                  id="confirmPassword"
                  label="Confirm"
                  error={errors.confirmPassword?.message}
                  required
                >
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                  />
                </FormField>
              </div>
              <FormField
                id="contactNo"
                label="Contact number"
                error={errors.contactNo?.message}
                hint="Optional"
              >
                <Input
                  id="contactNo"
                  inputMode="tel"
                  placeholder="+1 555 0100"
                  {...register('contactNo')}
                />
              </FormField>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                <UserPlus />
                {isSubmitting ? 'Creating account…' : 'Create account'}
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
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
