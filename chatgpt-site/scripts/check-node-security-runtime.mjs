import assert from "node:assert/strict";
import { constants } from "node:zlib";

const minimumByMajor = new Map([
  [22, [22, 23, 4]],
  [24, [24, 22, 1]],
  [26, [26, 12, 1]],
]);
const current = process.versions.node.split(".").map(Number);
const minimum = minimumByMajor.get(current[0]);
const firstDifference = minimum?.findIndex((value, index) => current[index] !== value) ?? -1;
const meetsMinimum = Boolean(minimum) && (
  firstDifference === -1 || current[firstDifference] > minimum[firstDifference]
);

assert.ok(
  meetsMinimum,
  `Patched Node.js 22.23.4+, 24.22.1+, or 26.12.1+ is required; current runtime is ${process.versions.node}.`,
);
assert.equal(
  constants.BROTLI_DECODER_ERROR_FORMAT_BLOCK_SWITCH,
  -17,
  "This Node.js runtime does not include the required Brotli decoder security fix.",
);

console.log(`Node.js ${process.versions.node} includes the required Brotli decoder fix.`);
