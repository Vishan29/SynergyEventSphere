import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, Search, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  createVenue,
  deleteVenue,
  searchVenues,
} from '@/api/venues';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Paginator } from '@/components/common/Paginator';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { FormField } from '@/components/common/FormField';
import { useUrlState } from '@/hooks/useUrlState';
import { venueSchema, type VenueFormValues } from '@/lib/validation';
import { handleApiError } from '@/lib/errors';

const defaultState = { q: '', page: '0', size: '20' };

export function AdminVenuesPage() {
  const [state, setState] = useUrlState(defaultState);
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const args = {
    q: state.q || undefined,
    page: Number(state.page) || 0,
    size: Number(state.size) || 20,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['venues', 'search', args],
    queryFn: () => searchVenues(args),
    placeholderData: (prev) => prev,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteVenue,
    onSuccess: () => {
      toast.success('Venue deleted');
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      setConfirmDelete(null);
    },
    onError: (err) => {
      handleApiError(err);
      setConfirmDelete(null);
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Venues</h1>
          <p className="text-muted-foreground">
            Curated venues that organizers can pick when creating events.
          </p>
        </div>
        <Button variant="gradient" onClick={() => setCreateOpen(true)}>
          <Plus />
          Add venue
        </Button>
      </header>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All venues</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={state.q ?? ''}
              onChange={(e) => setState({ q: e.target.value, page: '0' })}
              placeholder="Search by name or location…"
              className="w-72 pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !data || data.content.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No venues yet"
              description="Add your first venue to make it pickable when creating events."
              action={
                <Button variant="gradient" onClick={() => setCreateOpen(true)}>
                  Add venue
                </Button>
              }
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.content.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.location}</TableCell>
                      <TableCell>{v.capacity}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete(v.id)}
                        >
                          <Trash2 />
                          Delete
                        </Button>
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

      <CreateVenueDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title="Delete this venue?"
        description="If any events still reference this venue, the backend will refuse the delete and tell you which events to migrate first."
        confirmLabel="Delete venue"
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (confirmDelete !== null) deleteMutation.mutate(confirmDelete);
        }}
      />
    </div>
  );
}

interface CreateVenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateVenueDialog({ open, onOpenChange }: CreateVenueDialogProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VenueFormValues>({
    resolver: zodResolver(venueSchema),
    defaultValues: { name: '', location: '', capacity: 1 },
  });

  const mutation = useMutation({
    mutationFn: createVenue,
    onSuccess: () => {
      toast.success('Venue created');
      queryClient.invalidateQueries({ queryKey: ['venues'] });
      reset();
      onOpenChange(false);
    },
    onError: (err) => handleApiError(err, { setError }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : onOpenChange(false))}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a venue</DialogTitle>
          <DialogDescription>
            Venues are reusable across events; their capacity is inherited
            when an organizer picks them.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit((v) => mutation.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <FormField id="name" label="Name" error={errors.name?.message} required>
            <Input id="name" placeholder="The Atrium" {...register('name')} />
          </FormField>
          <FormField
            id="location"
            label="Location"
            error={errors.location?.message}
            required
          >
            <Input
              id="location"
              placeholder="123 Main St, Springfield"
              {...register('location')}
            />
          </FormField>
          <FormField
            id="capacity"
            label="Capacity"
            error={errors.capacity?.message}
            required
          >
            <Input
              id="capacity"
              type="number"
              min={1}
              {...register('capacity', { valueAsNumber: true })}
            />
          </FormField>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isSubmitting}>
              {isSubmitting ? 'Creating…' : 'Create venue'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
