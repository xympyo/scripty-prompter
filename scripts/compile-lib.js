/**
 * Compile lib/*.ts to lib/*.js (CommonJS) for Vercel serverless functions.
 * Vercel only compiles api/*.ts, not lib/*.ts, so we do it here.
 */
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const libDir = path.join(__dirname, '..', 'lib');
const files = fs.readdirSync(libDir).filter((f) => f.endsWith('.ts'));

for (const file of files) {
  const inputPath = path.join(libDir, file);
  const outputPath = inputPath.replace(/\.ts$/, '.js');
  const source = fs.readFileSync(inputPath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      strict: false,
    },
  });
  fs.writeFileSync(outputPath, result.outputText);
  console.log(`Compiled lib/${file} -> lib/${file.replace('.ts', '.js')}`);
}
