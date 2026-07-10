(function () {
    var SHEET_ID = '1RCMoSZsfr-HPGX-n8jZs5SKrTrekLzah2Afhu5egmSU';
    var SHEET_NAME = 'Data';
    var CSV_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent(SHEET_NAME);
    var FALLBACK = { CNG_PRICE: '46,70', DIESEL_PRICE: '35,10', KM_MONTH: '574 091', TRANSIT_COUNT: '33 581', VEHICLE_COUNT: '77' };

    function applyData(d) {
          var map = {
                  'km-month': d.KM_MONTH, 'vehicle-count': d.VEHICLE_COUNT, 'vehicles-about': d.VEHICLE_COUNT,
                  'transit-count': d.TRANSIT_COUNT,
                  'diesel-price': d.DIESEL_PRICE ? d.DIESEL_PRICE + ' Kc/l' : null,
                  'cng-price': d.CNG_PRICE ? d.CNG_PRICE + ' Kc/kg' : null
          };
          for (var id in map) { var el = document.getElementById(id); if (el && map[id]) el.textContent = map[id]; }
          var dp = document.getElementById('diesel-price-srv'); if (dp && d.DIESEL_PRICE) dp.textContent = d.DIESEL_PRICE;
          var cp = document.getElementById('cng-price-srv'); if (cp && d.CNG_PRICE) cp.textContent = d.CNG_PRICE;
          var tbd = document.getElementById('tb-diesel'); if (tbd && d.DIESEL_PRICE) tbd.textContent = d.DIESEL_PRICE + ' Kc/l';
          var tbc = document.getElementById('tb-cng'); if (tbc && d.CNG_PRICE) tbc.textContent = d.CNG_PRICE + ' Kc/kg';
    }

    function parseCSV(csv) {
          var data = {}; var lines = csv.trim().split('\n');
          for (var i = 1; i < lines.length; i++) {
                  var parts = lines[i].split(',');
                  if (parts.length >= 2) { var key = parts[0].replace(/"/g, '').trim(); var val = parts[1].replace(/"/g, '').trim(); if (key) data[key] = val; }
          }
          return data;
    }

    function loadData() {
          var xhr = new XMLHttpRequest();
          xhr.open('GET', CSV_URL + '&_=' + Date.now(), true);
          xhr.timeout = 4000;
          xhr.onload = function () { try { applyData(xhr.status === 200 ? parseCSV(xhr.responseText) : FALLBACK); } catch (e) { applyData(FALLBACK); } };
          xhr.onerror = xhr.ontimeout = function () { applyData(FALLBACK); };
          xhr.send();
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', loadData); } else { loadData(); }
})();
