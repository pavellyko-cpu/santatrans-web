(function(){
    var FIREBASE='https://santatrans-web-default-rtdb.europe-west1.firebasedatabase.app/ceny.json';
    var F={CNG:'46,70',DIESEL:'35,10',KM:'574 091',T:'33 581',V:'77'};
    function fmt(v){return v?String(v).replace('.',','):null;}
    function fmtKM(v){return v?String(v).replace(/\B(?=(\d{3})+(?!\d))/g,' '):null;}
    function set(id,v){var e=document.getElementById(id);if(e&&v)e.textContent=v;}
    function apply(d){
        var diesel=fmt(d.DIESEL);
        var cng=fmt(d.CNG);
        var km=fmtKM(d.KM);
        var t=fmtKM(d.TRANSITS);
        var v=d.VEHICLES;
        set('tb-diesel',diesel);set('tb-cng',cng);
        set('diesel-price',diesel);set('cng-price',cng);
        set('diesel-price-srv',diesel);set('cng-price-srv',cng);
        set('km-month',km);set('vehicle-count',v);
        set('vehicles-about',v);set('transit-count',t);
    }
    fetch(FIREBASE)
        .then(function(r){return r.json();})
        .then(function(d){if(d&&d.DIESEL)apply(d);})
        .catch(function(){});
})();
