// Test data-loader.js se stubovaným DOM, localStorage a fetch.
// Nepotřebuje emulátor: node --test test/data-loader.test.mjs
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const SRC = readFileSync(new URL('../data-loader.js', import.meta.url), 'utf8');
const IDS = ['tb-diesel', 'tb-cng', 'diesel-price', 'cng-price', 'diesel-price-srv', 'cng-price-srv',
  'km-month', 'transit-count', 'vehicle-count', 'vehicles-about'];
const VAT = { cs: 's DPH', en: 'incl. VAT', de: 'inkl. MwSt.', pl: 'z VAT' };
const SITE = { prices: { DIESEL: '35.10', CNG: '1234.5' }, stats: { KM: '574091', TRANSITS: '33581', VEHICLES: '77' } };
const LEGACY = { DIESEL: 36.2, CNG: '47.9', KM: 600000, TRANSITS: 34000, VEHICLES: 80 };

async function run(lang, { cache = null, site = SITE, legacy = LEGACY } = {}) {
  const els = Object.fromEntries(IDS.map(id => [id, { textContent: '…' }]));
  const vats = [{ textContent: 'x' }, { textContent: 'y' }];
  const store = new Map(cache ? [['st-site', JSON.stringify(cache)]] : []);
  const urls = [];
  let afterCache = null;
  const ctx = {
    document: {
      documentElement: { lang },
      getElementById: id => els[id] || null,
      querySelectorAll: sel => (sel === '.vat' ? vats : [])
    },
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) },
    fetch: url => {
      // stav DOM v okamžiku prvního požadavku = co uživatel vidí z cache
      if (!afterCache) afterCache = Object.fromEntries(IDS.map(id => [id, els[id].textContent]));
      urls.push(url);
      const body = url.includes('site.json') ? site : legacy;
      return Promise.resolve({ json: () => Promise.resolve(body) });
    }
  };
  vm.runInNewContext(SRC, ctx);
  await new Promise(r => setTimeout(r, 20));
  const text = Object.fromEntries(IDS.map(id => [id, els[id].textContent]));
  return { text, afterCache, vats: vats.map(v => v.textContent), urls, saved: store.get('st-site') };
}

for (const lang of Object.keys(VAT)) {
  test(`${lang}: data z Firebase /site`, async () => {
    const { text, vats, urls, saved } = await run(lang);
    const v = VAT[lang];
    assert.equal(text['tb-diesel'], `35,10 Kč/l ${v}`);
    assert.equal(text['diesel-price'], `35,10 Kč/l ${v}`);
    assert.equal(text['tb-cng'], `1 234,50 Kč/kg ${v}`);
    assert.equal(text['cng-price'], `1 234,50 Kč/kg ${v}`);
    assert.equal(text['diesel-price-srv'], '35,10');
    assert.equal(text['cng-price-srv'], '1 234,50');
    assert.equal(text['km-month'], '574 091');
    assert.equal(text['transit-count'], '33 581');
    assert.equal(text['vehicle-count'], '77');
    assert.equal(text['vehicles-about'], '77');
    assert.deepEqual(vats, [v, v]);
    assert.equal(urls.length, 1);
    assert.match(urls[0], /\/site\.json\?cb=/);
    assert.equal(JSON.parse(saved).DIESEL, '35.10');
  });

  test(`${lang}: cache se zobrazí hned, před fetch`, async () => {
    const { afterCache } = await run(lang, { cache: { DIESEL: '30.00', CNG: '40.00', KM: '1000', TRANSITS: '2', VEHICLES: '3' } });
    assert.equal(afterCache['tb-diesel'], `30,00 Kč/l ${VAT[lang]}`);
    assert.equal(afterCache['cng-price'], `40,00 Kč/kg ${VAT[lang]}`);
    assert.equal(afterCache['diesel-price-srv'], '30,00');
    assert.equal(afterCache['km-month'], '1 000');
  });

  test(`${lang}: prázdné /site → záložní Apps Script`, async () => {
    const { text, urls, saved } = await run(lang, { site: null });
    assert.equal(urls.length, 2);
    assert.match(urls[1], /script\.google\.com/);
    assert.equal(text['tb-diesel'], `36,20 Kč/l ${VAT[lang]}`);
    assert.equal(text['cng-price'], `47,90 Kč/kg ${VAT[lang]}`);
    assert.equal(text['cng-price-srv'], '47,90');
    assert.equal(text['km-month'], '600 000');
    assert.equal(JSON.parse(saved).VEHICLES, 80);
  });
}

test('částečná data ve Firebase: CNG z Firebase, zbytek ze záložní tabulky', async () => {
  const { text, urls, saved } = await run('cs', { site: { prices: { CNG: '48.00' }, meta: { updatedBy: 'x' } } });
  assert.equal(urls.length, 2);
  assert.equal(text['cng-price'], '48,00 Kč/kg s DPH');
  assert.equal(text['tb-cng'], '48,00 Kč/kg s DPH');
  assert.equal(text['tb-diesel'], '36,20 Kč/l s DPH');
  assert.equal(text['km-month'], '600 000');
  assert.equal(JSON.parse(saved).CNG, '48.00');
});

test('Firebase má přednost před tabulkou, i když je záloha dostupná', async () => {
  const { text } = await run('cs', { site: { prices: { DIESEL: '35.10' } } });
  assert.equal(text['tb-diesel'], '35,10 Kč/l s DPH');
  assert.equal(text['tb-cng'], '47,90 Kč/kg s DPH');
});

test('neznámý jazyk → čeština', async () => {
  const { text } = await run('sk');
  assert.equal(text['tb-diesel'], '35,10 Kč/l s DPH');
});
