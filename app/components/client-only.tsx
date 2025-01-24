import { useEffect, useState } from 'react';

export default function ClientOnly({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return loaded ? <>{children}</> : null;
}
