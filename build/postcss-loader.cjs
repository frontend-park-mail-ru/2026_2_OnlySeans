const postcss = require('postcss');

const aliases = new Map([
  ['(--reduced-motion)', '(prefers-reduced-motion: reduce)'],
  ['(--short-auth)', '(max-height: 860px)'],
]);

const mediaAliases = {
  postcssPlugin: 'frame-media-aliases',
  AtRule: {
    media(rule) {
      rule.params = aliases.get(rule.params) ?? rule.params;
    },
  },
};

module.exports = function processCss(source, map) {
  const done = this.async();
  postcss([mediaAliases])
    .process(source, {
      from: this.resourcePath,
      map: this.sourceMap ? { inline: false, annotation: false, prev: map } : false,
    })
    .then(
      (result) => done(null, result.css, result.map?.toJSON()),
      (error) => done(error),
    );
};
