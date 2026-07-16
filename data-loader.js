(function(){
  var DB='https://santatrans-web-default-rtdb.europe-west1.firebasedatabase.app/ceny.json';
  var F={CNG:'46,70',DIESEL:'35,10',KM:'574 091',T:'33 581',V:'77'};
  function fmt(v){return v?String(v).replace('.',','):null;}
  function fmtKM(v){return v?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' '):null;}
  function set(id,v){var e=document.getElementById(id);if(e&&v)e.textContent=v;}
  function apply(d){
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
    x.open('GET',DB+'?_ts='+Date.now(),true);
    x.timeout=5000;
    x.onload=function(){try{apply(JSON.parse(x.responseText)||F);}catch(e){apply(F);}};
    x.onerror=x.ontimeout=function(){apply(F);};
    x.send();
  }
  load();
})();
