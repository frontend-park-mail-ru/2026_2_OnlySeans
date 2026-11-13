const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const babel = require('@babel/core');

const MEDIA_EXTENSIONS = /\.(?:mp4|m4v|webm|mov|ogv|mp3|m4a|ogg|oga|wav|aac|flac|opus)$/i;

module.exports = class ServiceWorkerPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('ServiceWorkerPlugin', compilation => {
      const template = path.resolve(__dirname, '../src/service-worker.ts');
      compilation.fileDependencies.add(template);
      compilation.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        },
        () => {
          const assets = compilation.getAssets().filter(a =>
            /^(assets|src\/assets)\//.test(a.name) &&
            !path.basename(a.name).startsWith('.') &&
            !MEDIA_EXTENSIONS.test(a.name) &&
            !a.name.endsWith('.map') &&
            !a.name.endsWith('.txt')
          );
          const shell = compilation.getAsset('index.html');
          const hash = crypto.createHash('sha256')
            .update(shell.source.buffer())
            .update(fs.readFileSync(template));
          for (const a of assets) hash.update(a.name).update(a.source.buffer());
          const version = hash.digest('hex').slice(0, 16);
          const urls = [...assets.map(a => '/' + a.name), '/index.html'];
          const worker = fs.readFileSync(template, 'utf8')
            .replace('__CACHE_VERSION__', version)
            .replace('= __PRECACHE_URLS__', '= ' + JSON.stringify(urls));
          const { code: source } = babel.transformSync(worker, { filename: template });
          compilation.emitAsset('service-worker.js', new compiler.webpack.sources.RawSource(source));
        }
      );
    });
  }
};
