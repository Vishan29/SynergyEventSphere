import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut, Menu, ShieldCheck, UserCircle, Users } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wordmark } from '@/components/brand/Wordmark';
import { ThemeToggle } from '@/components/brand/ThemeToggle';
import { Avatar } from '@/components/brand/Avatar';
import { RoleBadge } from '@/components/admin/RoleBadge';
import { useAuth, roleHomePath } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';
import type { Role } from '@/api/types';

interface NavItem {
  to: string;
  label: string;
  roles: Role[];
  public?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/events', label: 'Events', roles: ['USER', 'ORGANIZER', 'ADMIN'], public: true },
  { to: '/bookings', label: 'My bookings', roles: ['USER', 'ORGANIZER', 'ADMIN'] },
  { to: '/organizer', label: 'Dashboard', roles: ['ORGANIZER'] },
  { to: '/admin', label: 'Admin', roles: ['ADMIN'] },
];

export function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const items = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : Boolean(item.public),
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center gap-4">
        <Wordmark size="md" to={role ? roleHomePath(role) : '/'} />
        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground',
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="ml-1 flex items-center gap-2 rounded-full p-1 outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} />
                  <span className="hidden text-sm font-medium sm:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-1">
                  <span className="text-sm font-semibold">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                  <span className="pt-1">
                    <RoleBadge role={user.role} />
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/profile')}>
                  <UserCircle /> Profile
                </DropdownMenuItem>
                {role === 'ADMIN' ? (
                  <DropdownMenuItem onSelect={() => navigate('/admin/users')}>
                    <Users /> Manage users
                  </DropdownMenuItem>
                ) : null}
                {role === 'ADMIN' ? (
                  <DropdownMenuItem onSelect={() => navigate('/admin/venues')}>
                    <ShieldCheck /> Manage venues
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => signOut()}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => signOut({ everywhere: true })}
                >
                  <LogOut /> Sign out everywhere
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="gradient" size="sm">
              <Link to="/login">Sign in</Link>
            </Button>
          )}
          {user ? (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>
          ) : null}
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              <Wordmark size="sm" asLink={false} />
            </DialogTitle>
          </DialogHeader>
          <nav className="flex flex-col gap-1">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-secondary text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </DialogContent>
      </Dialog>
    </header>
  );
}
