(function(){
    var API='https://script.google.com/macros/s/AKfycbzboESyGDt7_E4SHnL3SxddCeQbqKzfCSvmPWriLUyU8ozBIeyOEbob4gjQYBWUmMo0rg/exec';
    var F={CNG:'46,70',DIESEL:'35,10',KM:'574 091',T:'33 581',V:'77'};
    function fmt(v){return v?String(v).replace('.',','):null;}
    function fmtKM(v){return v?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' '):null;}
    function set(id,v){var e=document.getElementById(id);if(e&&v)e.textContent=v;}
    function apply(d){
          set('km-month',fmtKM(d.KM)||F.KM);
          set('vehicle-count',d.VEHICLES||d.V||F.V);
          set('vehicles-about',d.VEHICLES||d.V||F.V);
          set('transit-count',fmtKM(d.TRANSITS||d.T)||F.T);
          var diesel=fmt(d.DIESEL)||F.DIESEL;
          var cng=fmt(d.CNG)||F.CNG;
          set('diesel-price',diesel+' Kč/l s DPH');
          set('cng-price',cng+' Kč/kg s DPH');
          set('diesel-price-srv',diesel);
          set('cng-price-srv',cng);
          set('tb-diesel',diesel+' Kč/l s DPH');
          set('tb-cng',cng+' Kč/kg s DPH');
    }
    function load(){
          var x=new XMLHttpRequest();
          var url=API+'?_ts='+Date.now();
          x.open('GET',url,true);
          x.timeout=5000;
          try{x.setRequestHeader('Cache-Control','no-cache, no-store, must-revalidate');}catch(e){}
          x.onload=function(){try{apply(JSON.parse(x.responseText));}catch(e){apply(F);}};
          x.onerror=x.ontimeout=function(){apply(F);};
          x.send();
    }
    if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',load);}else{load();}
})();
