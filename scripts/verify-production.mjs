import assert from "node:assert/strict";

const url = process.env.PRODUCTION_URL ?? process.argv[2];

if (!url) {
  throw new Error("PRODUCTION_URL or a URL argument is required.");
}

const response = await fetch(url, { redirect: "follow" });
const html = await response.text();

assert.equal(response.status, 200, `Expected HTTP 200, received ${response.status}`);
assert.match(html, /AI営業リード発掘エージェント/u);
assert.match(html, /Demo Dataset/u);
assert.match(html, /Human Review/u);
assert.equal(response.headers.get("x-frame-options"), "DENY");
assert.equal(response.headers.get("x-content-type-options"), "nosniff");

console.log(`Production verified: ${response.url}`);
