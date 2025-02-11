import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const redis = new Redis({
  password: process.env.REDIS_PASSWORD,
});

export const setValue = async (key: string, value: string | number) =>
  await redis.set(key, value);
export const getValue = async (key: string) => await redis.get(key);
export const deleteValue = async (key: string) => await redis.del(key);

export const setList = async (key: string, values: string[]) => {
  await redis.del(key);
  await redis.rpush(key, ...values);
};
export const getList = async (key: string) => await redis.lrange(key, 0, -1);

export const setJson = async <T>(key: string, value: T) => {
  try {
    await redis.call('JSON.SET', key, '.', JSON.stringify(value));
  } catch (error) {
    logger.error('ERROR', { error });
  }
};
export const getJson = async <T>(key: string) => {
  try {
    const json = await redis.call('JSON.GET', key);
    return json ? (JSON.parse(json as string) as T) : null;
  } catch (error) {
    logger.error('ERROR', { error });
    return null;
  }
};

export const getSet = async (key: string) => await redis.smembers(key);
export const addToSet = async (key: string, value: string | number) =>
  await redis.sadd(key, value);
export const removeFromSet = async (key: string, value: string | number) =>
  await redis.srem(key, value);
export const isSetMember = async (key: string, value: string | number) =>
  !!(await redis.sismember(key, value));
