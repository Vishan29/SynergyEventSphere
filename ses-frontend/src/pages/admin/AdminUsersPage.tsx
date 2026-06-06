import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, ShieldAlert, UserPlus } from 'lucide-react';
import { listUsers } from '@/api/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EmptyState } from '@/components/common/EmptyState';
import { RoleBadge } from '@/components/admin/RoleBadge';
import { useUrlState } from '@/hooks/useUrlState';
import type { Role } from '@/api/types';

const defaultState = { q: '', role: 'ALL' };

export function AdminUsersPage() {
  const [state, setState] = useUrlState(defaultState);
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
  });

  const filtered = useMemo(() => {
    const list = data ?? [];
    const q = (state.q ?? '').trim().toLowerCase();
    return list.filter((u) => {
      if (state.role !== 'ALL' && u.role !== state.role) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        String(u.id).includes(q)
      );
    });
  }, [data, state]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Browse every account in SynergyEventSphere.
          </p>
        </div>
        <Button asChild variant="gradient">
          <Link to="/admin/users/new">
            <UserPlus />
            Create organizer / admin
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>All users</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={state.q ?? ''}
                onChange={(e) => setState({ q: e.target.value })}
                placeholder="Search by name or email…"
                className="w-64 pl-9"
              />
            </div>
            <Select
              value={state.role ?? 'ALL'}
              onValueChange={(v) => setState({ role: v as Role | 'ALL' })}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="ORGANIZER">Organizers</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ShieldAlert}
              title="No users match"
              description="Adjust the filters or clear the search."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{u.id}
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Editing names, changing roles, deleting accounts, and listing active
        sessions are not yet supported by the backend. They'll appear here
        when the API exposes them.
      </p>
    </div>
  );
}
