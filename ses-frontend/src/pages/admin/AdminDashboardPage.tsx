import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Building2,
  CalendarDays,
  Plus,
  ShieldCheck,
  Ticket,
  UserPlus,
  Users,
} from 'lucide-react';
import { listUsers } from '@/api/users';
import { searchEvents } from '@/api/events';
import { searchVenues } from '@/api/venues';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function AdminDashboardPage() {
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: listUsers });
  const eventsQuery = useQuery({
    queryKey: ['events', 'count'],
    queryFn: () => searchEvents({ size: 1 }),
  });
  const venuesQuery = useQuery({
    queryKey: ['venues', 'count'],
    queryFn: () => searchVenues({ size: 1 }),
  });

  const users = usersQuery.data ?? [];
  const userCount = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const organizerCount = users.filter((u) => u.role === 'ORGANIZER').length;
  const standardUserCount = users.filter((u) => u.role === 'USER').length;
  const eventCount = eventsQuery.data?.totalElements ?? 0;
  const venueCount = venuesQuery.data?.totalElements ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>
          <p className="text-muted-foreground">
            High-level health of SynergyEventSphere.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/venues">
              <Plus />
              Add venue
            </Link>
          </Button>
          <Button asChild variant="gradient">
            <Link to="/admin/users/new">
              <UserPlus />
              Create organizer
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total users"
          value={userCount}
          loading={usersQuery.isLoading}
        />
        <StatCard
          icon={ShieldCheck}
          label="Admins"
          value={adminCount}
          loading={usersQuery.isLoading}
        />
        <StatCard
          icon={Ticket}
          label="Organizers"
          value={organizerCount}
          loading={usersQuery.isLoading}
        />
        <StatCard
          icon={Users}
          label="Users"
          value={standardUserCount}
          loading={usersQuery.isLoading}
        />
        <StatCard
          icon={CalendarDays}
          label="Total events"
          value={eventCount}
          loading={eventsQuery.isLoading}
        />
        <StatCard
          icon={Building2}
          label="Venues"
          value={venueCount}
          loading={venuesQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/admin/users">Manage users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/venues">Manage venues</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/events">All events</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/events">Browse as a user</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-5">
        <div className="rounded-full bg-primary/10 p-2.5 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="text-2xl font-bold">
            {loading ? <Skeleton className="h-7 w-12" /> : value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
