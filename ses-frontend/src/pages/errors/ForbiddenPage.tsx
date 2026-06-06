import { Link } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, roleHomePath } from '@/hooks/useAuth';

export function ForbiddenPage() {
  const { role } = useAuth();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-amber-500/15 p-3">
        <ShieldOff className="h-8 w-8 text-amber-600" />
      </div>
      <h1 className="text-3xl font-bold">Access denied</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Your account doesn't have permission to view this page. If you think
        this is a mistake, please contact your administrator.
      </p>
      <Button asChild variant="gradient">
        <Link to={role ? roleHomePath(role) : '/'}>Go to your dashboard</Link>
      </Button>
    </div>
  );
}
