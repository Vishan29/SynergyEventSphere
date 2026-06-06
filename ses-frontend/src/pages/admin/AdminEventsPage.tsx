import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cancelEvent, searchEvents } from '@/api/events';
import { listUsers } from '@/api/users';
import { searchVenues } from '@/api/venues';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Paginator } from '@/components/common/Paginator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { useUrlState } from '@/hooks/useUrlState';
import { handleApiError } from '@/lib/errors';
import {
  effectiveStatus,
  formatLocalDateTime,
} from '@/lib/dates';
import type { EventStatus } from '@/api/types';

const defaultState = {
  q: '',
  status: 'ALL',
  organizer: 'ALL',
  venue: 'ALL',
  page: '0',
  size: '20',
  sort: 'dateTime,desc',
};

export function AdminEventsPage() {
  const [state, setState] = useUrlState(defaultState);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState<{
    id: number;
    title: string;
    bookings: number;
  } | null>(null);

  const args = {
    q: state.q || undefined,
    status: state.status === 'ALL' ? undefined : (state.status as EventStatus),
    page: Number(state.page) || 0,
    size: Number(state.size) || 20,
    sort: state.sort,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['events', 'admin', args],
    queryFn: () => searchEvents(args),
    placeholderData: (prev) => prev,
  });

  const usersQuery = useQuery({
    queryKey: ['users', 'organizers'],
    queryFn: listUsers,
  });
  const venuesQuery = useQuery({
    queryKey: ['venues', 'all-list'],
    queryFn: () => searchVenues({ size: 200, sort: 'name,asc' }),
  });

  const organizers = (usersQuery.data ?? []).filter(
    (u) => u.role === 'ORGANIZER',
  );

  const filtered = useMemo(() => {
    const list = data?.content ?? [];
    return list.filter((e) => {
      if (
        state.organizer !== 'ALL' &&
        String(e.organizerId) !== state.organizer
      ) {
        return false;
      }
      if (state.venue !== 'ALL') {
        const venueName = e.venueName ?? '';
        const target = venuesQuery.data?.content.find(
          (v) => String(v.id) === state.venue,
        );
        if (!target || venueName !== target.name) return false;
      }
      return true;
    });
  }, [data, state.organizer, state.venue, venuesQuery.data]);

  const cancelMutation = useMutation({
    mutationFn: (id: number) => cancelEvent(id),
    onSuccess: () => {
      toast.success('Event cancelled');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setConfirmCancel(null);
    },
    onError: (err) => {
      handleApiError(err);
      setConfirmCancel(null);
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">All events</h1>
        <p className="text-muted-foreground">
          Search and manage every event in the system.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={state.q ?? ''}
              onChange={(e) => setState({ q: e.target.value, page: '0' })}
              placeholder="Search by title…"
              className="pl-9"
            />
          </div>
          <Select
            value={state.status ?? 'ALL'}
            onValueChange={(v) => setState({ status: v, page: '0' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={state.organizer ?? 'ALL'}
            onValueChange={(v) => setState({ organizer: v, page: '0' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Organizer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All organizers</SelectItem>
              {organizers.map((o) => (
                <SelectItem key={o.id} value={String(o.id)}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={state.venue ?? 'ALL'}
            onValueChange={(v) => setState({ venue: v, page: '0' })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Venue" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All venues</SelectItem>
              {(venuesQuery.data?.content ?? []).map((v) => (
                <SelectItem key={v.id} value={String(v.id)}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !data || filtered.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No events match"
              description="Try clearing some filters or searching by a different title."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Organizer</TableHead>
                    <TableHead>When</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <Link
                          to={`/events/${e.id}`}
                          className="font-medium hover:underline"
                        >
                          {e.title}
                        </Link>
                      </TableCell>
                      <TableCell>{e.organizerName}</TableCell>
                      <TableCell>{formatLocalDateTime(e.dateTime)}</TableCell>
                      <TableCell>
                        <EventStatusBadge
                          status={e.status}
                          dateTime={e.dateTime}
                        />
                      </TableCell>
                      <TableCell>
                        {e.bookedSeats} / {e.capacity}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              navigate(`/organizer/events/${e.id}/edit`)
                            }
                            disabled={
                              effectiveStatus(e.status, e.dateTime) !==
                              'SCHEDULED'
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={
                              effectiveStatus(e.status, e.dateTime) !==
                              'SCHEDULED'
                            }
                            onClick={() =>
                              setConfirmCancel({
                                id: e.id,
                                title: e.title,
                                bookings: e.bookedSeats,
                              })
                            }
                          >
                            Cancel
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Paginator
                page={data.number}
                size={data.size}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => setState({ page: String(p) })}
                onSizeChange={(s) => setState({ size: String(s), page: '0' })}
              />
            </>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmCancel !== null}
        onOpenChange={(open) => !open && setConfirmCancel(null)}
        title={`Cancel "${confirmCancel?.title ?? ''}"?`}
        description={
          confirmCancel ? (
            <>
              This will <strong>cancel all {confirmCancel.bookings} active
              booking{confirmCancel.bookings === 1 ? '' : 's'}</strong> on this
              event.
            </>
          ) : null
        }
        confirmLabel="Yes, cancel event"
        cancelLabel="Keep event"
        destructive
        loading={cancelMutation.isPending}
        onConfirm={() => {
          if (confirmCancel) cancelMutation.mutate(confirmCancel.id);
        }}
      />
    </div>
  );
}
