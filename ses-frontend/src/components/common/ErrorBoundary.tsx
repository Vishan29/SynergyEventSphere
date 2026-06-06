import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled error in render tree:', error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Something went wrong</h2>
          <p className="max-w-md text-sm text-muted-foreground">
            An unexpected error occurred while rendering this page. The error
            has been logged.
          </p>
          <pre className="max-w-xl overflow-auto rounded-lg bg-muted p-3 text-left text-xs">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2">
            <Button variant="outline" onClick={this.reset}>
              Try again
            </Button>
            <Button onClick={() => window.location.assign('/')}>
              Go home
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
