const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

module.exports = class ServiceWorkerPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap('ServiceWorkerPlugin', compilation => {
      const template = path.resolve(__dirname, '../public/service-worker.js');
      compilation.fileDependencies.add(template);
      compilation.fileDependencies.add(path.resolve(__dirname, '../public/offline.html'));
      compilation.hooks.processAssets.tap(
        {
          name: 'ServiceWorkerPlugin',
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
        },
        () => {
          const assets = compilation.getAssets().filter(a =>
            /^(assets|src\/assets)\//.test(a.name) &&
            !a.name.endsWith('.map') &&
            !a.name.endsWith('.txt')
          );
          const offline = fs.readFileSync(path.resolve(__dirname, '../public/offline.html'));
          compilation.emitAsset('offline.html', new compiler.webpack.sources.RawSource(offline));
          const hash = crypto.createHash('sha256')
            .update(fs.readFileSync(template))
            .update(offline);
          for (const a of assets) hash.update(a.name).update(a.source.buffer());
          const version = hash.digest('hex').slice(0, 16);
          const urls = [...assets.map(a => '/' + a.name), '/offline.html'];
          const source = fs.readFileSync(template, 'utf8')
            .replace('__CACHE_VERSION__', version)
            .replace('__PRECACHE_URLS__', JSON.stringify(urls));
          compilation.emitAsset('service-worker.js', new compiler.webpack.sources.RawSource(source));
        }
      );
    });
  }
};
