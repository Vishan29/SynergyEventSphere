import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Sparkles } from 'lucide-react';
import { searchEvents } from '@/api/events';
import type { EventStatus } from '@/api/types';
import { EventCard } from '@/components/events/EventCard';
import { EmptyState } from '@/components/common/EmptyState';
import { Paginator } from '@/components/common/Paginator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useUrlState } from '@/hooks/useUrlState';

const STATUS_OPTIONS: { value: 'ALL' | EventStatus; label: string }[] = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'dateTime,asc', label: 'Soonest first' },
  { value: 'dateTime,desc', label: 'Latest first' },
  { value: 'title,asc', label: 'Title A → Z' },
  { value: 'title,desc', label: 'Title Z → A' },
];

const defaultState = {
  q: '',
  status: 'ALL',
  upcomingOnly: 'false',
  page: '0',
  size: '12',
  sort: 'dateTime,asc',
};

export function EventsPage() {
  const [state, setState] = useUrlState(defaultState);

  const queryArgs = useMemo(
    () => ({
      q: state.q || undefined,
      status: state.status === 'ALL' ? undefined : (state.status as EventStatus),
      upcomingOnly: state.upcomingOnly === 'true',
      page: Number(state.page) || 0,
      size: Number(state.size) || 12,
      sort: state.sort,
    }),
    [state],
  );

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['events', 'search', queryArgs],
    queryFn: () => searchEvents(queryArgs),
    placeholderData: (prev) => prev,
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Browse events
        </p>
        <h1 className="text-3xl font-bold tracking-tight">Discover events</h1>
        <p className="text-muted-foreground">
          Search across every event in the sphere — book the ones you love.
        </p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card/50 p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={state.q ?? ''}
            onChange={(e) => setState({ q: e.target.value, page: '0' })}
            placeholder="Search events by title…"
            className="pl-9"
            aria-label="Search events"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={state.status ?? 'ALL'}
            onValueChange={(v) => setState({ status: v, page: '0' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={state.sort ?? 'dateTime,asc'}
            onValueChange={(v) => setState({ sort: v, page: '0' })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={state.upcomingOnly === 'true' ? 'gradient' : 'outline'}
            size="sm"
            onClick={() =>
              setState({
                upcomingOnly: state.upcomingOnly === 'true' ? 'false' : 'true',
                page: '0',
              })
            }
          >
            Upcoming only
          </Button>

          {state.q || state.status !== 'ALL' || state.upcomingOnly === 'true' ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                setState({
                  q: '',
                  status: 'ALL',
                  upcomingOnly: 'false',
                  page: '0',
                })
              }
            >
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-[18rem] rounded-2xl" />
          ))}
        </div>
      ) : data && data.content.length > 0 ? (
        <>
          <div
            className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 ${isFetching ? 'opacity-60' : ''}`}
          >
            {data.content.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
          <Paginator
            page={data.number}
            size={data.size}
            totalPages={data.totalPages}
            totalElements={data.totalElements}
            onPageChange={(p) => setState({ page: String(p) })}
            onSizeChange={(s) => setState({ size: String(s), page: '0' })}
          />
        </>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="No events match your filters"
          description="Try a different search, change the status, or clear the upcoming-only toggle."
        />
      )}
    </div>
  );
}
