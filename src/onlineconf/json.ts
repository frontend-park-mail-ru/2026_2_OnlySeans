import parse from 'core-js-pure/actual/json/parse.js';
import rawJSON from 'core-js-pure/actual/json/raw-json.js';
import stringify from 'core-js-pure/actual/json/stringify.js';

export function parseJson(text: string): unknown {
  return parse(text, (_key: string, value: unknown, context: { source?: string }) => {
    if (typeof value === 'number' && JSON.stringify(value) !== context.source) {
      // Keep the original numeric token when a JS number cannot reproduce it.
      return rawJSON(context.source);
    }
    return value;
  });
}

export function stringifyJson(value: unknown, indent?: number): string | undefined {
  return stringify(value, null, indent);
}

export const adminJson = { parse: parseJson, stringify: stringifyJson };
