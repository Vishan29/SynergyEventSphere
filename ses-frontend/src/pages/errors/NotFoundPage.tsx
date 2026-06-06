import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="rounded-full bg-primary/10 p-3 text-primary">
        <Compass className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold">Lost in the sphere</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Button asChild variant="gradient">
        <Link to="/">Take me home</Link>
      </Button>
    </div>
  );
}
