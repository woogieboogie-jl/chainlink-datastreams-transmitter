import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigate,
  useRouteError,
} from '@remix-run/react';
import type { LinksFunction, MetaFunction } from '@remix-run/node';

import './tailwind.css';
import { Navigation } from './components/navigation';
import { Footer } from './components/footer';
import {
  accountAddress,
  getTokenBalance,
  getCurrentChain,
  getLinkBalance,
} from 'server/services/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './components/ui/card';
import { Button, buttonVariants } from './components/ui/button';
import { ChevronLeft, Home } from 'lucide-react';

export const meta: MetaFunction = () => {
  return [
    { title: 'Datastreams Transmitter' },
    { name: 'description', content: 'Chainlink Datastreams Transmitter' },
  ];
};

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export default function App() {
  const { address, chain, balance, linkBalance } =
    useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-background text-foreground flex flex-col">
        <Navigation
          address={address}
          chain={chain}
          balance={balance}
          linkBalance={linkBalance}
        />
        <main className="container mx-auto flex flex-col p-4 md:p-10 gap-10 grow">
          <Outlet />
        </main>
        <ScrollRestoration />
        <Scripts />
        <Footer />
      </body>
    </html>
  );
}

export async function loader() {
  const [chain, balance, linkBalance] = await Promise.all([
    getCurrentChain(),
    getTokenBalance(),
    getLinkBalance(),
  ]);
  return { chain, balance, linkBalance, address: accountAddress };
}

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  if (isRouteErrorResponse(error)) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="min-h-screen bg-background text-foreground flex flex-col">
          <main className="container mx-auto flex flex-col p-4 md:p-10 gap-10 grow">
            <Card>
              <CardHeader>
                <CardTitle>{error.status}</CardTitle>
                <CardDescription>{error.statusText}</CardDescription>
              </CardHeader>
              <CardContent>{error.data}</CardContent>
              <CardFooter className="space-x-4">
                <Link to="/" className={buttonVariants({ variant: 'default' })}>
                  <Home />
                  Home
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft /> Back
                </Button>
              </CardFooter>
            </Card>
          </main>
          <Scripts />
        </body>
      </html>
    );
  } else if (error instanceof Error) {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="min-h-screen bg-background text-foreground flex flex-col">
          <main className="container mx-auto flex flex-col p-4 md:p-10 gap-10 grow">
            <Card>
              <CardHeader>
                <CardTitle>Error</CardTitle>
                <CardDescription>{error.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <p>The stack trace is:</p>
                <pre>{error.stack}</pre>
              </CardContent>
              <CardFooter className="space-x-4">
                <Link to="/" className={buttonVariants({ variant: 'default' })}>
                  <Home />
                  Home
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft /> Back
                </Button>
              </CardFooter>
            </Card>
          </main>
          <Scripts />
        </body>
      </html>
    );
  } else {
    return (
      <html lang="en">
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <Meta />
          <Links />
        </head>
        <body className="min-h-screen bg-background text-foreground flex flex-col">
          <main className="container mx-auto flex flex-col p-4 md:p-10 gap-10 grow">
            <Card>
              <CardHeader>
                <CardTitle>Unknown Error</CardTitle>
              </CardHeader>
              <CardFooter className="space-x-4">
                <Link to="/" className={buttonVariants({ variant: 'default' })}>
                  <Home />
                  Home
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft /> Back
                </Button>
              </CardFooter>
            </Card>
          </main>
          <Scripts />
        </body>
      </html>
    );
  }
}
