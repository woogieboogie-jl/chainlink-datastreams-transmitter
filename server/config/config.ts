import { readFileSync } from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import { Config } from '../types';

const CONFIG_PATH = path.resolve(import.meta.dirname, '../../config.yml');

export const config: Config = (() => {
  try {
    return load(readFileSync(CONFIG_PATH, 'utf8')) as Config;
  } catch {
    console.log('No config file provided - proceeding with empty config.');
    return {} as Config;
  }
})();
