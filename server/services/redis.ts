import { Redis } from 'ioredis';
import MockRedis from 'ioredis-mock';
import dotenv from 'dotenv';

dotenv.config();

const redis =
  process.env.NODE_ENV === 'test'
    ? new MockRedis()
    : new Redis({
        password: process.env.REDIS_PASSWORD,
        host: process.env.REDIS_HOST || '127.0.0.1',
      });

export const getRedisClient = (): Redis | typeof MockRedis => {
  return redis;
};

export const setValue = async (key: string, value: string | number) =>
  await redis.set(key, value);
export const getValue = async (key: string) => await redis.get(key);
export const deleteValue = async (key: string) => await redis.del(key);

export const setList = async (key: string, values: string[]) => {
  await redis.del(key);
  await redis.rpush(key, ...values);
};
export const getList = async (key: string) => await redis.lrange(key, 0, -1);
export const getSet = async (key: string) => await redis.smembers(key);
export const addToSet = async (key: string, value: string | number) =>
  await redis.sadd(key, value);
export const removeFromSet = async (key: string, value: string | number) =>
  await redis.srem(key, value);
export const isSetMember = async (key: string, value: string | number) =>
  !!(await redis.sismember(key, value));
