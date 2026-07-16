(function(){
    var API='https://script.google.com/macros/s/AKfycbzboESyGDt7_E4SHnL3SxddCeQbqKzfCSvmPWriLUyU8ozBIeyOEbob4gjQYBWUmMo0rg/exec';
    var F={CNG:'46,70',DIESEL:'35,10',KM:'574 091',T:'33 581',V:'77'};
    function set(id,v){var e=document.getElementById(id);if(e&&v)e.textContent=v;}
    function apply(d){
          set('km-month',d.KM||d.KM);
          set('vehicle-count',d.VEHICLES||d.V);
          set('vehicles-about',d.VEHICLES||d.V);
          set('transit-count',d.TRANSITS||d.T);
          set('diesel-price',(d.DIESEL||d.DIESEL)+' Kč/l s DPH');
          set('cng-price',(d.CNG||d.CNG)+' Kč/kg s DPH');
          set('diesel-price-srv',d.DIESEL);
          set('cng-price-srv',d.CNG);
          set('tb-diesel',(d.DIESEL)+' Kč/l s DPH');
          set('tb-cng',(d.CNG)+' Kč/kg s DPH');
    }
    function load(){
          var x=new XMLHttpRequest();
          // cache-busting: unikátní parametr donutí prohlížeč i Google vždy
          // stáhnout čerstvá data, jinak se občas vrací stará (zacachovaná) odpověď
          var url=API+(API.indexOf('?')>-1?'&':'?')+'_ts='+Date.now();
          x.open('GET',url,true);
          x.timeout=5000;
          try{
            x.setRequestHeader('Cache-Control','no-cache, no-store, must-revalidate');
          }catch(e){}
          x.onload=function(){try{apply(JSON.parse(x.responseText));}catch(e){apply(F);}};
          x.onerror=x.ontimeout=function(){apply(F);};
          x.send();
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',load);}else{load();}
})();
