import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FormField } from '@/components/common/FormField';
import { handleApiError } from '@/lib/errors';
import {
  adminCreateUserSchema,
  type AdminCreateUserFormValues,
} from '@/lib/validation';
import { register as registerApi } from '@/api/auth';

export function AdminCreateUserPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateUserFormValues>({
    resolver: zodResolver(adminCreateUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      contactNo: '',
      role: 'ORGANIZER',
    },
  });

  const role = watch('role');

  const onSubmit = async (values: AdminCreateUserFormValues) => {
    try {
      await registerApi({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
        contactNo: values.contactNo || undefined,
      });
      toast.success(`${values.role.toLowerCase()} account created`);
      navigate('/admin/users', { replace: true });
    } catch (err) {
      handleApiError(err, { setError });
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <Link
          to="/admin/users"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to users
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">
          Create organizer or admin account
        </h1>
        <p className="text-muted-foreground">
          Public sign-up only creates standard user accounts. Organizer and
          admin accounts must be created here.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            noValidate
          >
            <FormField
              id="role"
              label="Role"
              error={errors.role?.message}
              required
            >
              <Select
                value={role}
                onValueChange={(v) =>
                  setValue('role', v as 'ORGANIZER' | 'ADMIN', {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIZER">
                    Organizer — can create and manage events
                  </SelectItem>
                  <SelectItem value="ADMIN">
                    Admin — full access (use sparingly)
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField
              id="name"
              label="Full name"
              error={errors.name?.message}
              required
            >
              <Input id="name" {...register('name')} />
            </FormField>

            <FormField
              id="email"
              label="Email"
              error={errors.email?.message}
              required
            >
              <Input
                id="email"
                type="email"
                placeholder="organizer@example.com"
                {...register('email')}
              />
            </FormField>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="password"
                label="Temporary password"
                hint="The user will sign in with this. 8-72 characters."
                error={errors.password?.message}
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
              hint="Optional"
              error={errors.contactNo?.message}
            >
              <Input
                id="contactNo"
                inputMode="tel"
                placeholder="+1 555 0100"
                {...register('contactNo')}
              />
            </FormField>

            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" variant="gradient" disabled={isSubmitting}>
                {role === 'ADMIN' ? <ShieldCheck /> : <UserPlus />}
                {isSubmitting ? 'Creating…' : `Create ${role.toLowerCase()}`}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
