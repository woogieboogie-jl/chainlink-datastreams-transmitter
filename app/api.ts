import { Feed, Interval } from './types';

const url = `${process.env.API_URL || 'http://localhost:3000'}/api`;
const postOptions = <T>(body: T) => ({
  method: 'POST',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(body),
});

export async function fetchFeeds() {
  const result = await fetch(`${url}/feeds`);
  const data: Feed[] = await result.json();
  return data;
}

export async function fetchInterval() {
  const result = await fetch(`${url}/interval`);
  const data: Interval = await result.json();
  return data;
}

export async function addFeed(feed: Feed) {
  return await fetch(`${url}/add`, postOptions<Feed>(feed));
}

export async function removeFeed(feed: { feedId: string }) {
  return await fetch(`${url}/remove`, postOptions<{ feedId: string }>(feed));
}

export async function setInterval(interval: Interval) {
  return await fetch(`${url}/interval`, postOptions<Interval>(interval));
}

export async function fetchLogs() {
  const result = await fetch(`${url}/logs`);
  const data = await result.json();
  return data;
}
