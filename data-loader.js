(function(){
    var API='https://script.google.com/macros/s/AKfycbzboESyGDt7_E4SHnL3SxddCeQbqKzfCSvmPWriLUyU8ozBIeyOEbob4gjQYBWUmMo0rg/exec';
    var F={CNG:'46,70',DIESEL:'35,10',KM:'574 091',T:'33 581',V:'77'};
    function fmt(v){return v?String(v).replace('.',','):null;}
    function fmtKM(v){return v?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' '):null;}
    function set(id,v){var e=document.getElementById(id);if(e&&v)e.textContent=v;}
    function apply(d){
          var diesel=fmt(d.DIESEL)||F.DIESEL;
          var cng=fmt(d.CNG)||F.CNG;
          set('tb-diesel',diesel+' K\u010d/l s DPH');
          set('tb-cng',cng+' K\u010d/kg s DPH');
          set('diesel-price',diesel+' K\u010d/l s DPH');
          set('cng-price',cng+' K\u010d/kg s DPH');
          set('diesel-price-srv',diesel);
          set('cng-price-srv',cng);
          set('km-month',fmtKM(d.KM)||F.KM);
          set('vehicle-count',d.VEHICLES||F.V);
          set('vehicles-about',d.VEHICLES||F.V);
          set('transit-count',fmtKM(d.TRANSITS)||F.T);
    }
    function load(){
          var x=new XMLHttpRequest();
          x.open('GET',API+'?_ts='+Date.now(),true);
          x.timeout=8000;
          x.onload=function(){try{apply(JSON.parse(x.responseText));}catch(e){apply(F);}};
          x.onerror=x.ontimeout=function(){apply(F);};
          x.send();
    }
    load();
})();