import { isRegExp } from '../../utils/isomorphic/rtti.js';
import { isString } from '../../utils/isomorphic/stringUtils.js';

function serializeExpectedTextValues(items, options = {}) {
  return items.map((i) => ({
    string: isString(i) ? i : void 0,
    regexSource: isRegExp(i) ? i.source : void 0,
    regexFlags: isRegExp(i) ? i.flags : void 0,
    matchSubstring: options.matchSubstring,
    ignoreCase: options.ignoreCase,
    normalizeWhiteSpace: options.normalizeWhiteSpace
  }));
}

export { serializeExpectedTextValues };
