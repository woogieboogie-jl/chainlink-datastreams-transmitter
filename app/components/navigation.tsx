import { Sheet, SheetTrigger, SheetContent } from '~/components/ui/sheet';
import { Button, buttonVariants } from '~/components/ui/button';
import { Link } from '@remix-run/react';
import { HomeIcon, MenuIcon } from 'lucide-react';

export function Navigation() {
  return (
    <header className="flex h-14 w-full shrink-0 items-center px-4 sticky top-0 z-50 bg-background/90 backdrop-blur-sm">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden">
            <MenuIcon className="size-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <div className="grid gap-2 py-6">
            <Link
              to="/"
              className="flex w-full items-center py-2 text-lg font-semibold"
            >
              Overview
            </Link>
            <Link
              to="/logs"
              className="flex w-full items-center py-2 text-lg font-semibold"
            >
              Logs
            </Link>
            <Link
              to="/feeds"
              className="flex w-full items-center py-2 text-lg font-semibold"
            >
              Feeds
            </Link>
            <Link
              to="/schedule"
              className="flex w-full items-center py-2 text-lg font-semibold"
            >
              Schedule
            </Link>
            <Link
              to="/chain"
              className="flex w-full items-center py-2 text-lg font-semibold"
            >
              Chain
            </Link>
          </div>
        </SheetContent>
      </Sheet>
      <Link to="/" className="hidden lg:block">
        <HomeIcon className="size-6" />
      </Link>
      <h1 className="leading text-xl font-bold ml-4">Datastreams Scheduler</h1>
      <nav className="hidden lg:flex gap-6 grow justify-end">
        <Link to="/" className={buttonVariants({ variant: 'link' })}>
          Overview
        </Link>
        <Link to="/logs" className={buttonVariants({ variant: 'link' })}>
          Logs
        </Link>
        <Link to="/feeds" className={buttonVariants({ variant: 'link' })}>
          Feeds
        </Link>
        <Link to="/schedule" className={buttonVariants({ variant: 'link' })}>
          Schedule
        </Link>
        <Link to="/chain" className={buttonVariants({ variant: 'link' })}>
          Chain
        </Link>
      </nav>
    </header>
  );
}
