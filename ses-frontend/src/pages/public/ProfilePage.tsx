import { useQuery } from '@tanstack/react-query';
import { CalendarRange, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { getMe } from '@/api/users';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar } from '@/components/brand/Avatar';
import { RoleBadge } from '@/components/admin/RoleBadge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { formatLocalDateTime } from '@/lib/dates';

export function ProfilePage() {
  const { signOut, setUser } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const profile = await getMe();
      // Refresh the lightweight summary the auth store keeps in sync.
      setUser({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        role: profile.role,
      });
      return profile;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground">
          The basics about your SynergyEventSphere account.
        </p>
      </header>

      <Card>
        <CardContent className="flex flex-col items-start gap-6 py-6 md:flex-row md:items-center">
          <Avatar name={data.name} className="h-16 w-16 text-base" />
          <div className="flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold">{data.name}</h2>
              <RoleBadge role={data.role} />
            </div>
            <p className="text-sm text-muted-foreground">{data.email}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm md:grid-cols-2">
          <Detail icon={User} label="Name" value={data.name} />
          <Detail icon={Mail} label="Email" value={data.email} />
          <Detail
            icon={Phone}
            label="Contact number"
            value={data.contactNo || '—'}
          />
          <Detail icon={ShieldCheck} label="Role" value={data.role} />
          <Detail
            icon={CalendarRange}
            label="Member since"
            value={formatLocalDateTime(data.createdAt)}
          />
          <Detail
            icon={CalendarRange}
            label="Last updated"
            value={formatLocalDateTime(data.updatedAt)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Sign out from this device, or from every device where your account
            is signed in.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => signOut()}>
              Sign out
            </Button>
            <Button
              variant="destructive"
              onClick={() => signOut({ everywhere: true })}
            >
              Sign out everywhere
            </Button>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Profile editing, password changes, and password reset are not yet
            supported by the backend. They'll appear here when the API exposes
            them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
