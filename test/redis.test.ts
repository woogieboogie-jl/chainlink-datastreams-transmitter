import { describe, beforeEach, it, expect } from '@jest/globals';
import {
  setValue,
  getValue,
  deleteValue,
  setList,
  getList,
  addToSet,
  getSet,
  removeFromSet,
  isSetMember,
} from '../server/services/redis';

describe('Redis Store Utils', () => {
  const testKey = 'test-key';

  beforeEach(async () => {
    // Clean up keyspace between tests
    await deleteValue(testKey);
  });

  describe('Key-Value operations', () => {
    it('sets and gets a string value', async () => {
      await setValue(testKey, 'hello');
      const value = await getValue(testKey);
      expect(value).toBe('hello');
    });

    it('sets and gets a numeric value', async () => {
      await setValue(testKey, 123);
      const value = await getValue(testKey);
      expect(value).toBe('123'); // Redis stores everything as strings
    });

    it('deletes a key', async () => {
      await setValue(testKey, 'to-delete');
      await deleteValue(testKey);
      const value = await getValue(testKey);
      expect(value).toBe(null);
    });
  });

  describe('List operations', () => {
    it('sets and gets a list', async () => {
      await setList(testKey, ['a', 'b', 'c']);
      const list = await getList(testKey);
      expect(list).toEqual(['a', 'b', 'c']);
    });

    it('overwrites an existing list', async () => {
      await setList(testKey, ['x']);
      await setList(testKey, ['y', 'z']);
      const list = await getList(testKey);
      expect(list).toEqual(['y', 'z']);
    });
  });

  describe('Set operations', () => {
    it('adds and gets a set', async () => {
      await addToSet(testKey, 'apple');
      await addToSet(testKey, 'banana');
      const set = await getSet(testKey);
      expect(set.sort()).toEqual(['apple', 'banana']); // unordered
    });

    it('removes a value from a set', async () => {
      await addToSet(testKey, 'apple');
      await removeFromSet(testKey, 'apple');
      const set = await getSet(testKey);
      expect(set).toEqual([]);
    });

    it('checks if value is in set', async () => {
      await addToSet(testKey, 'grape');
      const isMember = await isSetMember(testKey, 'grape');
      const isNotMember = await isSetMember(testKey, 'orange');
      expect(isMember).toBe(true);
      expect(isNotMember).toBe(false);
    });
  });
});
