import { Feed, Interval } from 'server/types';

const url = `${process.env.API_URL || 'http://localhost:3000'}/api`;
const postOptions = <T>(body?: T) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export async function addFeed(feed: Feed) {
  return await fetch(`${url}/feeds/add`, postOptions<Feed>(feed));
}

export async function removeFeed(feed: { feedId: string }) {
  return await fetch(
    `${url}/feeds/remove`,
    postOptions<{ feedId: string }>(feed)
  );
}

export async function setInterval(interval: Interval) {
  return await fetch(`${url}/interval`, postOptions<Interval>(interval));
}

export async function fetchLogs() {
  const result = await fetch(`${url}/logs`);
  const data: { log: string } = await result.json();
  return data;
}

export async function startStreams() {
  return await fetch(`${url}/start`, postOptions());
}

export async function stopStreams() {
  return await fetch(`${url}/stop`, postOptions());
}
