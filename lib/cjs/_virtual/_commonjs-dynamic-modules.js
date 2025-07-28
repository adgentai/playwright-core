'use strict';

Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

exports.commonjsRequire = commonjsRequire;
