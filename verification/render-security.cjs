// Run the shipped render functions on harmless markup-shaped club data.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const root = path.resolve(__dirname, "..");
const sample = 'Club <b>B</b> & "Friends"';
const encoded = 'Club &lt;b&gt;B&lt;/b&gt; &amp; &quot;Friends&quot;';
const elements = new Map();
function element(id) {
  if (!elements.has(id)) elements.set(id, {innerHTML: "", classList: {toggle() {}, add() {}, remove() {}}, style: {}});
  return elements.get(id);
}
const document = {getElementById: element, querySelectorAll: () => []};
const window = {open: () => { throw Error("Disallowed URL opened"); }};
const context = vm.createContext({
  document, window, URL, sample, location: {href: "https://club.invalid", protocol: "https:"},
  localStorage: {removeItem() {}}, fetch: async () => ({status: 401})
});
const run = code => vm.runInContext(code, context);
const read = name => fs.readFileSync(path.join(root, name), "utf8");
function rendered(markup) {
  assert.ok(markup.includes(encoded), "Expected literal text and quotes in HTML output");
  assert.ok(!markup.includes("<b>B</b>"));
}
for (const folder of ["public", "member-www"]) {
  const ctx = vm.createContext({...context});
  const evaluate = code => vm.runInContext(code, ctx);
  evaluate(read(folder + "/member-v2/member.js"));
  evaluate(read(folder + "/app.js").split("\nbootApp().catch(")[0]);
  evaluate('renderLeaderboardResults({entries:[{rank:1,name:sample,memberNumber:sample,chapter:sample,points:9}]})');
  rendered(element("leaderboardResults").innerHTML);
  evaluate('renderLeaderboardResults({entries:[]})');
  assert.ok(element("leaderboardResults").innerHTML.includes("No entries"));
  evaluate('openClubLink("mailto:qa@example.invalid")');
  evaluate('openClubLink("http://club.invalid")');
  const opened = [];
  ctx.window = {open: href => opened.push(href)};
  evaluate('openClubLink("https://club.invalid/events")');
  assert.deepEqual(opened, ["https://club.invalid/events"]);
}
// Test the seller form with the same real form renderer and an inert DOM.
let seller = read("public/seller.js").replace("  init();", "  window.testProductForm = productForm;");
run(seller);
window.testProductForm({title:sample, description:sample, variants:[{label:sample}]});
rendered(element("mainArea").innerHTML);
run(read("public/admin-v2/dashboard.js"));
run(read("public/admin.js").split('document.getElementById("reloadRecords").onclick =')[0]);
run('renderLeaderboardResults({entries:[{rank:1,name:sample,memberNumber:sample,chapter:sample,points:1}]})');
rendered(element("leaderboardResults").innerHTML);
assert.equal(run('formatValue("pointTransactions", "amount", sample)'), encoded);
console.log("PASS member, packaged member, seller and admin rendering boundaries");
