import { LazyLog, ScrollFollow } from 'react-lazylog';

export function Logger({ text }: { text: string }) {
  return (
    <ScrollFollow
      startFollowing
      render={({ follow }) => (
        <LazyLog enableSearch text={text} stream follow={follow} />
      )}
    />
  );
}
