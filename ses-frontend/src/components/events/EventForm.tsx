import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import { searchVenues } from '@/api/venues';
import { createEvent, updateEvent } from '@/api/events';
import type { EventResponse, VenueSummary } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/common/FormField';
import { eventSchema, type EventFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';
import {
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
  toLocalDateTimeString,
} from '@/lib/dates';

interface EventFormProps {
  mode: 'create' | 'edit';
  initial?: EventResponse;
}

export function EventForm({ mode, initial }: EventFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [venueQuery, setVenueQuery] = useState('');

  const defaults: EventFormValues = useMemo(
    () => ({
      title: initial?.title ?? '',
      description: initial?.description ?? '',
      dateTime: toDatetimeLocalValue(initial?.dateTime),
      venueMode: initial?.venue ? 'existing' : initial ? 'custom' : 'existing',
      venueId: initial?.venue?.id ?? null,
      customVenueName: initial?.customVenueName ?? '',
      customLocation: initial?.customLocation ?? '',
      capacity: initial?.capacity ?? null,
    }),
    [initial],
  );

  const {
    register,
    handleSubmit,
    setError,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: defaults,
  });

  useEffect(() => {
    // Reset form values when the loaded event changes (edit page).
    Object.entries(defaults).forEach(([k, v]) => {
      setValue(k as keyof EventFormValues, v as never, { shouldDirty: false });
    });
  }, [defaults, setValue]);

  const venueMode = watch('venueMode');
  const selectedVenueId = watch('venueId');

  const venuesQuery = useQuery({
    queryKey: ['venues', 'search', { q: venueQuery }],
    queryFn: () => searchVenues({ q: venueQuery || undefined, size: 50 }),
  });

  const venueOptions: VenueSummary[] = useMemo(() => {
    const list = venuesQuery.data?.content ?? [];
    if (
      initial?.venue &&
      !list.some((v) => v.id === initial.venue?.id) &&
      initial.venue
    ) {
      return [initial.venue, ...list];
    }
    return list;
  }, [venuesQuery.data, initial]);

  const selectedVenue =
    venueOptions.find((v) => v.id === selectedVenueId) ?? null;

  const createMutation = useMutation({
    mutationFn: createEvent,
    onSuccess: (event) => {
      toast.success('Event created');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(`/events/${event.id}`);
    },
    onError: (err) => handleApiError(err, { setError }),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: number; values: EventFormValues }) =>
      updateEvent(payload.id, toRequestBody(payload.values)),
    onSuccess: (event) => {
      toast.success('Event updated');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(`/events/${event.id}`);
    },
    onError: (err) => handleApiError(err, { setError }),
  });

  const onSubmit = (values: EventFormValues) => {
    if (mode === 'create') {
      createMutation.mutate(toRequestBody(values));
    } else if (initial) {
      updateMutation.mutate({ id: initial.id, values });
    }
  };

  const minCapacity = initial?.bookedSeats ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create event' : 'Edit event'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <FormField
            id="title"
            label="Title"
            error={errors.title?.message}
            required
          >
            <Input
              id="title"
              placeholder="Annual product summit"
              {...register('title')}
            />
          </FormField>

          <FormField
            id="description"
            label="Description"
            error={errors.description?.message}
            hint="Up to 5000 characters. Optional."
          >
            <Textarea
              id="description"
              rows={5}
              placeholder="What's the event about? Agenda, speakers, what attendees should bring."
              {...register('description')}
            />
          </FormField>

          <FormField
            id="dateTime"
            label="Date & time"
            error={errors.dateTime?.message}
            required
          >
            <Input
              id="dateTime"
              type="datetime-local"
              {...register('dateTime')}
            />
          </FormField>

          <Controller
            name="venueMode"
            control={control}
            render={({ field }) => (
              <FormField label="Venue source" required>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={field.value === 'existing' ? 'gradient' : 'outline'}
                    onClick={() => field.onChange('existing')}
                  >
                    Pick existing venue
                  </Button>
                  <Button
                    type="button"
                    variant={field.value === 'custom' ? 'gradient' : 'outline'}
                    onClick={() => field.onChange('custom')}
                  >
                    Custom venue
                  </Button>
                </div>
              </FormField>
            )}
          />

          {venueMode === 'existing' ? (
            <div className="space-y-3">
              <FormField label="Search venues" hint="Matches name or location">
                <Input
                  value={venueQuery}
                  onChange={(e) => setVenueQuery(e.target.value)}
                  placeholder="Search by name or location…"
                />
              </FormField>
              <Controller
                name="venueId"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Venue"
                    error={errors.venueId?.message as string | undefined}
                    required
                  >
                    <Select
                      value={field.value ? String(field.value) : ''}
                      onValueChange={(v) => field.onChange(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a venue" />
                      </SelectTrigger>
                      <SelectContent>
                        {venueOptions.length === 0 ? (
                          <div className="px-2 py-2 text-sm text-muted-foreground">
                            No venues match.
                          </div>
                        ) : null}
                        {venueOptions.map((v) => (
                          <SelectItem key={v.id} value={String(v.id)}>
                            {v.name} • {v.location} ({v.capacity} cap)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              {selectedVenue ? (
                <p className="text-xs text-muted-foreground">
                  Capacity will be set to <strong>{selectedVenue.capacity}</strong>{' '}
                  from the chosen venue.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                id="customVenueName"
                label="Venue name"
                error={errors.customVenueName?.message}
                required
              >
                <Input
                  id="customVenueName"
                  placeholder="The Atrium"
                  {...register('customVenueName')}
                />
              </FormField>
              <FormField
                id="customLocation"
                label="Location"
                error={errors.customLocation?.message}
                required
              >
                <Input
                  id="customLocation"
                  placeholder="123 Main St, Springfield"
                  {...register('customLocation')}
                />
              </FormField>
              <FormField
                id="capacity"
                label="Capacity"
                error={errors.capacity?.message as string | undefined}
                required
                hint={
                  minCapacity > 0
                    ? `Must be at least ${minCapacity} (current active bookings)`
                    : 'Total seats available'
                }
                className="sm:col-span-2"
              >
                <Input
                  id="capacity"
                  type="number"
                  inputMode="numeric"
                  min={Math.max(1, minCapacity)}
                  {...register('capacity', {
                    setValueAs: (v) =>
                      v === '' || v === null ? null : Number(v),
                  })}
                />
              </FormField>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="submit"
              variant="gradient"
              disabled={isSubmitting}
            >
              <Save />
              {mode === 'create' ? 'Create event' : 'Save changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              <X />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function toRequestBody(values: EventFormValues) {
  // Translate the form's discriminated shape (existing vs custom venue)
  // into the flat shape the backend expects.
  if (values.venueMode === 'existing') {
    return {
      title: values.title.trim(),
      description: values.description?.trim() || undefined,
      dateTime: toLocalDateTimeString(
        new Date(fromDatetimeLocalValue(values.dateTime)),
      ),
      venueId: values.venueId!,
    };
  }
  return {
    title: values.title.trim(),
    description: values.description?.trim() || undefined,
    dateTime: toLocalDateTimeString(
      new Date(fromDatetimeLocalValue(values.dateTime)),
    ),
    customVenueName: values.customVenueName?.trim(),
    customLocation: values.customLocation?.trim(),
    capacity: values.capacity ?? undefined,
  };
}
