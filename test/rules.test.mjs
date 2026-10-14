// Testy database.rules.json v emulátoru Realtime Database.
// Spuštění: npm run test:rules
// Všechny e-maily jsou fiktivní (doména example.test).
import { readFileSync } from 'node:fs';
import { before, after, beforeEach, describe, it } from 'node:test';
import {
  initializeTestEnvironment, assertSucceeds, assertFails
} from '@firebase/rules-unit-testing';

const OWNER = 'owner@example.test';
const ADMIN = 'admin@example.test';
const USER = 'user@example.test';
const key = e => e.replace(/\./g, ',');
const TS = { '.sv': 'timestamp' };

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-santatrans',
    database: {
      rules: readFileSync(new URL('../database.rules.json', import.meta.url), 'utf8'),
      host: '127.0.0.1',
      port: 9000
    }
  });
});

after(async () => { await env?.cleanup(); });

// Prázdné /site, nastavený vlastník a admin (jak to zapíše vlastník ručně v konzoli)
beforeEach(async () => {
  await env.clearDatabase();
  await env.withSecurityRulesDisabled(async ctx => {
    await ctx.database().ref().set({
      config: { ownerEmail: OWNER },
      admins: { [key(OWNER)]: true, [key(ADMIN)]: true },
      ceny: { DIESEL: '35.1' }
    });
  });
});

const anon = () => env.unauthenticatedContext().database();
const as = email => env.authenticatedContext(email.split('@')[0], { email }).database();
const noEmail = () => env.authenticatedContext('anon-uid', { firebase: { sign_in_provider: 'anonymous' } }).database();

async function seed(path, value) {
  await env.withSecurityRulesDisabled(ctx => ctx.database().ref(path).set(value));
}

// Stejný tvar zápisu, jaký posílá admin.html
function change(user, field, group, old, val, id = 'h1') {
  return {
    [`site/${group}/${field}`]: val,
    'site/meta': { updatedAt: TS, updatedBy: user },
    [`history/${id}`]: { ts: TS, user, field, old, new: val }
  };
}

describe('veřejné čtení', () => {
  it('anonym čte /site', async () => {
    await assertSucceeds(anon().ref('site').get());
  });
  it('anonym nečte root, /ceny, /history, /admins, /config', async () => {
    await assertFails(anon().ref().get());
    await assertFails(anon().ref('ceny').get());
    await assertFails(anon().ref('history').get());
    await assertFails(anon().ref('admins').get());
    await assertFails(anon().ref('config').get());
  });
});

describe('první uložení do prázdné databáze', () => {
  it('admin uloží všechna pole s old = ""', async () => {
    const db = as(ADMIN);
    await assertSucceeds(db.ref().update({
      'site/prices/DIESEL': '35.10',
      'site/prices/CNG': '46.70',
      'site/stats/KM': '574091',
      'site/stats/TRANSITS': '33581',
      'site/stats/VEHICLES': '77',
      'site/meta': { updatedAt: TS, updatedBy: ADMIN },
      'history/a': { ts: TS, user: ADMIN, field: 'DIESEL', old: '', new: '35.10' },
      'history/b': { ts: TS, user: ADMIN, field: 'CNG', old: '', new: '46.70' },
      'history/c': { ts: TS, user: ADMIN, field: 'KM', old: '', new: '574091' },
      'history/d': { ts: TS, user: ADMIN, field: 'TRANSITS', old: '', new: '33581' },
      'history/e': { ts: TS, user: ADMIN, field: 'VEHICLES', old: '', new: '77' }
    }));
    const site = (await anon().ref('site').get()).val();
    if (site.prices.DIESEL !== '35.10' || site.stats.VEHICLES !== '77') throw new Error('data nesedí');
  });
  it('old = null (chybějící) je zamítnuto', async () => {
    await assertFails(as(ADMIN).ref().update({
      'site/prices/DIESEL': '35.10',
      'history/a': { ts: TS, user: ADMIN, field: 'DIESEL', new: '35.10' }
    }));
  });
  it('old jiné než "" u neexistující hodnoty je zamítnuto', async () => {
    await assertFails(as(ADMIN).ref().update(change(ADMIN, 'DIESEL', 'prices', '30.00', '35.10')));
  });
});

describe('změna existující hodnoty', () => {
  beforeEach(() => seed('site/prices/DIESEL', '35.10'));

  it('admin změní cenu, old = předchozí hodnota', async () => {
    await assertSucceeds(as(ADMIN).ref().update(change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00')));
  });
  it('vlastník (je v /admins) smí měnit data', async () => {
    await assertSucceeds(as(OWNER).ref().update(change(OWNER, 'DIESEL', 'prices', '35.10', '36.00')));
  });
  it('admin s velkými písmeny v e-mailu je rozpoznán', async () => {
    const db = env.authenticatedContext('admin', { email: 'Admin@Example.TEST' }).database();
    await assertSucceeds(db.ref().update(change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00')));
  });
  it('old = "" u existující hodnoty je zamítnuto', async () => {
    await assertFails(as(ADMIN).ref().update(change(ADMIN, 'DIESEL', 'prices', '', '36.00')));
  });
  it('nesprávné old (hodnota se mezitím změnila) je zamítnuto', async () => {
    await assertFails(as(ADMIN).ref().update(change(ADMIN, 'DIESEL', 'prices', '34.00', '36.00')));
  });
  it('new neodpovídající /site je zamítnuto', async () => {
    const u = change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00');
    u['history/h1'].new = '99.99';
    await assertFails(as(ADMIN).ref().update(u));
  });
  it('history bez změny /site je zamítnuta', async () => {
    await assertFails(as(ADMIN).ref('history/x').set({ ts: TS, user: ADMIN, field: 'DIESEL', old: '35.10', new: '40.00' }));
  });
});

describe('zápis do /site bez oprávnění', () => {
  it('nepřihlášený', async () => {
    await assertFails(anon().ref('site/prices/DIESEL').set('35.10'));
  });
  it('anonymní přihlášení (bez e-mailu)', async () => {
    await assertFails(noEmail().ref('site/prices/DIESEL').set('35.10'));
  });
  it('přihlášený, ale není admin', async () => {
    await assertFails(as(USER).ref().update(change(USER, 'DIESEL', 'prices', '', '35.10')));
  });
});

describe('validace formátu /site', () => {
  for (const bad of ['35,10', '35.1', '35', 'abc', '1234.50', '-1.00', 35.1]) {
    it(`cena ${JSON.stringify(bad)} zamítnuta`, async () => {
      await assertFails(as(ADMIN).ref('site/prices/DIESEL').set(bad));
    });
  }
  for (const bad of ['1 000', '12a', '', '1234567890', 77]) {
    it(`statistika ${JSON.stringify(bad)} zamítnuta`, async () => {
      await assertFails(as(ADMIN).ref('site/stats/KM').set(bad));
    });
  }
  it('platné hodnoty projdou', async () => {
    await assertSucceeds(as(ADMIN).ref('site/prices/CNG').set('0.99'));
    await assertSucceeds(as(ADMIN).ref('site/stats/VEHICLES').set('77'));
  });
  it('neznámé klíče zamítnuty', async () => {
    await assertFails(as(ADMIN).ref('site/prices/LPG').set('20.00'));
    await assertFails(as(ADMIN).ref('site/stats/FOO').set('1'));
    await assertFails(as(ADMIN).ref('site/foo').set('x'));
  });
  it('meta s cizím updatedBy nebo starým časem zamítnuta', async () => {
    await assertFails(as(ADMIN).ref('site/meta').set({ updatedAt: TS, updatedBy: OWNER }));
    await assertFails(as(ADMIN).ref('site/meta').set({ updatedAt: Date.now() - 60000, updatedBy: ADMIN }));
  });
});

describe('/history', () => {
  beforeEach(async () => {
    await seed('site/prices/DIESEL', '35.10');
    await seed('history/old1', { ts: 1, user: ADMIN, field: 'DIESEL', old: '', new: '35.10' });
  });

  it('admin čte, neadmin a anonym ne', async () => {
    await assertSucceeds(as(ADMIN).ref('history').orderByChild('ts').limitToLast(50).get());
    await assertFails(as(USER).ref('history').get());
    await assertFails(anon().ref('history').get());
  });
  it('cizí user zamítnut', async () => {
    await assertFails(as(ADMIN).ref().update(change(OWNER, 'DIESEL', 'prices', '35.10', '36.00')));
  });
  it('ts různé od serverového času zamítnuto', async () => {
    const u = change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00');
    u['history/h1'].ts = Date.now() - 60000;
    await assertFails(as(ADMIN).ref().update(u));
  });
  it('chybějící nebo navíc pole zamítnuto', async () => {
    const u = change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00');
    u['history/h1'].extra = 'x';
    await assertFails(as(ADMIN).ref().update(u));
    const v = change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00');
    delete v['history/h1'].field;
    await assertFails(as(ADMIN).ref().update(v));
  });
  it('existující záznam nelze přepsat ani smazat', async () => {
    await assertFails(as(ADMIN).ref().update(change(ADMIN, 'DIESEL', 'prices', '35.10', '36.00', 'old1')));
    await assertFails(as(ADMIN).ref('history/old1').remove());
    await assertFails(as(ADMIN).ref('history/old1/new').set('99.99'));
    await assertFails(as(ADMIN).ref('history').remove());
    await assertFails(as(OWNER).ref('history/old1').remove());
  });
});

describe('/admins', () => {
  it('vlastník přidá a odebere admina', async () => {
    await assertSucceeds(as(OWNER).ref(`admins/${key(USER)}`).set(true));
    await assertSucceeds(as(OWNER).ref(`admins/${key(USER)}`).remove());
  });
  it('vlastník nesmí smazat sám sebe ani celé /admins', async () => {
    await assertFails(as(OWNER).ref(`admins/${key(OWNER)}`).remove());
    await assertFails(as(OWNER).ref('admins').remove());
  });
  it('klíč s velkými písmeny nebo hodnota false zamítnuty', async () => {
    await assertFails(as(OWNER).ref('admins/User@example,test').set(true));
    await assertFails(as(OWNER).ref(`admins/${key(USER)}`).set(false));
  });
  it('admin ani uživatel /admins nespravují', async () => {
    await assertFails(as(ADMIN).ref(`admins/${key(USER)}`).set(true));
    await assertFails(as(USER).ref(`admins/${key(USER)}`).set(true));
  });
  it('čtení: vlastník vše, ostatní jen vlastní klíč', async () => {
    await assertSucceeds(as(OWNER).ref('admins').get());
    await assertFails(as(ADMIN).ref('admins').get());
    await assertSucceeds(as(ADMIN).ref(`admins/${key(ADMIN)}`).get());
    await assertSucceeds(as(USER).ref(`admins/${key(USER)}`).get());
    await assertFails(as(USER).ref(`admins/${key(ADMIN)}`).get());
  });
});

describe('/config', () => {
  it('čte jen vlastník', async () => {
    await assertSucceeds(as(OWNER).ref('config').get());
    await assertFails(as(ADMIN).ref('config').get());
  });
  it('vlastnictví lze předat jen adminovi', async () => {
    await assertFails(as(OWNER).ref('config/ownerEmail').set(USER));
    await assertSucceeds(as(OWNER).ref('config/ownerEmail').set(ADMIN));
  });
  it('vlastník + admin v jednom zápisu', async () => {
    await assertSucceeds(as(OWNER).ref().update({
      [`admins/${key(USER)}`]: true,
      'config/ownerEmail': USER
    }));
  });
  it('velká písmena, smazání a neznámé klíče zamítnuty', async () => {
    await assertFails(as(OWNER).ref('config/ownerEmail').set('Admin@example.test'));
    await assertFails(as(OWNER).ref('config/ownerEmail').remove());
    await assertFails(as(OWNER).ref('config/foo').set('x'));
  });
  it('admin nesmí měnit vlastníka', async () => {
    await assertFails(as(ADMIN).ref('config/ownerEmail').set(ADMIN));
  });
});

describe('ostatní cesty', () => {
  it('/pozice je zavřené (kariéra odkazuje na jobs.cz)', async () => {
    await assertFails(anon().ref('pozice').get());
    await assertFails(as(ADMIN).ref('pozice').get());
    await assertFails(as(OWNER).ref('pozice').set([{ title: 'Řidič' }]));
    await assertFails(as(ADMIN).ref('pozice').set([{ title: 'Řidič' }]));
  });
  it('/ceny (starý admin) je zavřené', async () => {
    await assertFails(as(ADMIN).ref('ceny').set({ DIESEL: '1' }));
    await assertFails(noEmail().ref('ceny').set({ DIESEL: '1' }));
  });
  it('neznámé cesty zavřené', async () => {
    await assertFails(as(OWNER).ref('foo').set(1));
    await assertFails(as(OWNER).ref().get());
  });
});
