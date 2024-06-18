import typescript from 'rollup-plugin-typescript2';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import fs from 'node:fs';

const info = fs.readFileSync('./package.json', { encoding: 'utf8' });
const packageInfo = JSON.parse(info);

const isEnvDevelopment = process.env.NODE_ENV === 'development';
const extensions = ['.js', '.ts'];

export default {
  input: 'src/index.ts',
  output: [
    {
      format: 'umd',
      file: packageInfo['browser'],
      name: packageInfo.name,
    },
    {
      format: 'esm',
      dir: 'esm',
      sourcemap: false,
      interop: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'src',
      hoistTransitiveImports: false,
    },
    {
      format: 'cjs',
      dir: 'lib',
      sourcemap: false,
      interop: 'auto',
      preserveModules: true,
      preserveModulesRoot: 'src',
      hoistTransitiveImports: false,
    },
  ],
  strictDeprecations: true,
  plugins: [
    json(),
    resolve({ extensions }),
    typescript({
      tsconfig: './tsconfig.json',
      sourcemap: isEnvDevelopment,
      clean: true,
      tsconfigOverride: {
        compilerOptions: {
          target: 'ES5',
          module: 'ESNext',
          declaration: true,
        },
      },
    }),
    commonjs(),
  ],
};