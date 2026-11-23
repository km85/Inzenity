/* Targeted unit regression for the APK scripts. The DOM fixture intentionally
   implements only the operations these three paths need. Run with Node. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = process.argv[2];
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
class TestNode {
  constructor(tag = 'div') {
    this.tag = tag;
    this.children = [];
    this.value = '';
    this.selectors = new Map();
    const classes = new Set();
    this.classList = {
      add: key => classes.add(key),
      remove: key => classes.delete(key),
      toggle: (key, enabled) => enabled ? classes.add(key) : classes.delete(key),
      contains: key => classes.has(key),
    };
  }
  set textContent(value) { this.children = []; this.text = value; }
  get textContent() { return this.text || ''; }
  appendChild(node) { this.children.push(node); return node; }
  append(node) { this.appendChild(node); }
  querySelector(key) {
    if (!this.selectors.has(key)) this.selectors.set(key, new TestNode(key));
    return this.selectors.get(key);
  }
}
const doc = new TestNode();
doc.createElement = tag => new TestNode(tag);
doc.getElementById = id => doc.querySelector('#' + id);
const screens = ['tools', 'merchant-detail', 'home'].map(n => doc.getElementById('screen-' + n));
doc.querySelectorAll = key => key === '.screen' ? screens : [];
const window = {scrollTo() {}};
const sandbox = vm.createContext({document: doc, window, URL, clearTimeout});
function evaluate(code) { return vm.runInContext(code, sandbox); }
for (const name of ['member-v2/config.js','member-v2/member.js']) evaluate(read(name));
const controller = read('app.js');
const entry = '\nbootApp().catch(';
assert.equal(controller.split(entry).length,2);
evaluate(controller.slice(0,controller.indexOf(entry)));
async function run() {
  evaluate('state.language = "en"');
  assert.throws(() => evaluate('memberApiOrigin()'), /HTTPS/);
  for (const screen of screens) {
    assert.equal(typeof screen.replaceChildren, 'undefined');
    screen.appendChild(new TestNode('prior-content'));
  }
  doc.getElementById('loginPassword').value = 'fixture';
  evaluate('showLogin()');
  assert(screens.every(node => node.children.length === 0));
  assert.equal(doc.getElementById('loginPassword').value, '');
  assert(doc.getElementById('appView').classList.contains('hidden'));
  console.log('PASS login reset clears stale screens and password');
  const merchant = screens[1];
  merchant.appendChild(new TestNode('prior-product'));
  evaluate('state.selectedMerchant = {id: 1, name: "Fixture"}');
  await evaluate('renderMerchantDetail(1)');
  assert.equal(merchant.children.length, 1);
  assert.equal(merchant.children[0].tag,'p');
  assert.match(merchant.children[0].textContent, /approved HTTPS/);
  assert.equal(doc.querySelector('#connectionNotice').querySelector('span').textContent, merchant.children[0].textContent);
  console.log('PASS disconnected merchant error replaces stale product content and displays the reason');
  const tools = screens[0];
  tools.appendChild(new TestNode('prior-tool'));
  assert(evaluate('navigateMemberTool("#plate")'));
  assert.equal(tools.children.length,1);
  const previous = tools.children[0];
  assert.equal(previous.tag, 'article');
  assert.match(previous.querySelector('form').innerHTML, /plateQuery/);
  assert(evaluate('navigateMemberTool("#sos")'));
  assert.equal(tools.children.length,1);
  assert.notEqual(tools.children[0],previous);
  assert.equal(tools.children[0].querySelector('form').children[0].textContent, 'Send SOS');
  console.log('PASS switching member tools replaces the old article with one working form');
}
run().catch(e => { console.error(e); process.exitCode=1; });
