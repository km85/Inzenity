const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const repo = process.env.INZENITY_REVIEW_CHECKOUT;
if (!repo) throw new Error('Set INZENITY_REVIEW_CHECKOUT to the patched checkout');
const sandbox = vm.createContext({ URL, window: {}, state: {language: 'en'} });
for (const script of ['config.js','member.js']) {
  vm.runInContext(fs.readFileSync(path.join(repo,'public/member-v2',script),'utf8'), sandbox);
}
const check = () => vm.runInContext('memberApiOrigin()',sandbox);
assert.equal(check(),'');
sandbox.window.Capacitor = { isNativePlatform: () => true };
for (const value of ['', 'http://stage.example.invalid', 'https://stage.example.invalid/path']) {
  sandbox.window.INZENITY_MEMBER_API_ORIGIN = value;
  assert.throws(check,/HTTPS/);
}
sandbox.window.INZENITY_MEMBER_API_ORIGIN='https://stage.example.invalid';
assert.equal(check(),sandbox.window.INZENITY_MEMBER_API_ORIGIN);
console.log('PASS Browser same-origin and four simulated native configuration cases');
