import { readFileSync } from 'fs';
import path from 'path';
import { load } from 'js-yaml';
import { Config } from '../types';

const __dirname = import.meta.dirname;

export const config = load(
  readFileSync(
    path.resolve(
      __dirname,
      process.env.NODE_ENV === 'production'
        ? '../../../config.yml'
        : '../../config.yml'
    ),
    'utf8'
  )
) as Config;
