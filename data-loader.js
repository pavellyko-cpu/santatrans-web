(function(){
    var SITE='https://santatrans-web-default-rtdb.europe-west1.firebasedatabase.app/site.json';
    // Záložní zdroj jen pro položky, které ještě nejsou ve Firebase /site. Po úplném naplnění odstranit.
    var LEGACY='https://script.google.com/macros/s/AKfycbzboESyGDt7_E4SHnL3SxddCeQbqKzfCSvmPWriLUyU8ozBIeyOEbob4gjQYBWUmMo0rg/exec';
    var CACHE='st-site';
    var VAT={cs:'s DPH',en:'incl. VAT',de:'inkl. MwSt.',pl:'z VAT'};

    function group(s){return s.replace(/\B(?=(\d{3})+(?!\d))/g,' ');}
    function price(v){
        var n=parseFloat(String(v).replace(',','.'));
        if(isNaN(n))return null;
        var p=n.toFixed(2).split('.');
        return group(p[0])+','+p[1];
    }
    function count(v){
        var s=String(v==null?'':v).replace(/\D/g,'');
        return s?group(String(Number(s))):null;
    }
    function set(id,v){var e=document.getElementById(id);if(e&&v)e.textContent=v;}
    function unit(p,u){return p?p+' '+u+' '+vat:null;}

    // d = {DIESEL,CNG,KM,TRANSITS,VEHICLES}
    function apply(d){
        if(!d)return;
        var diesel=d.DIESEL!=null?price(d.DIESEL):null;
        var cng=d.CNG!=null?price(d.CNG):null;
        var v=count(d.VEHICLES);
        set('tb-diesel',unit(diesel,'Kč/l'));set('tb-cng',unit(cng,'Kč/kg'));
        set('diesel-price',unit(diesel,'Kč/l'));set('cng-price',unit(cng,'Kč/kg'));
        set('diesel-price-srv',diesel);set('cng-price-srv',cng);
        set('km-month',count(d.KM));set('transit-count',count(d.TRANSITS));
        set('vehicle-count',v);set('vehicles-about',v);
    }
    var KEYS=['DIESEL','CNG','KM','TRANSITS','VEHICLES'];
    function flatten(site){
        if(!site||(!site.prices&&!site.stats))return null;
        var p=site.prices||{},s=site.stats||{};
        return {DIESEL:p.DIESEL,CNG:p.CNG,KM:s.KM,TRANSITS:s.TRANSITS,VEHICLES:s.VEHICLES};
    }
    function complete(d){for(var i=0;i<KEYS.length;i++){if(!d||d[KEYS[i]]==null)return false;}return true;}
    function hasAny(d){for(var i=0;i<KEYS.length;i++){if(d&&d[KEYS[i]]!=null)return true;}return false;}
    function save(d){try{localStorage.setItem(CACHE,JSON.stringify(d));}catch(e){}}

    var lang=(document.documentElement.lang||'cs').slice(0,2).toLowerCase();
    var vat=VAT[lang]||VAT.cs;
    var vats=document.querySelectorAll('.vat');
    for(var i=0;i<vats.length;i++)vats[i].textContent=vat;

    try{apply(JSON.parse(localStorage.getItem(CACHE)));}catch(e){}

    fetch(SITE+'?cb='+Date.now())
        .then(function(r){return r.json();})
        .then(function(site){
            var d=flatten(site);
            if(complete(d))return d;
            // Chybějící položky doplní dočasně původní tabulka; co je ve Firebase, má vždy přednost.
            return fetch(LEGACY+'?cb='+Date.now())
                .then(function(r){return r.json();})
                .then(function(l){
                    d=d||{};
                    if(l)for(var i=0;i<KEYS.length;i++){var k=KEYS[i];if(d[k]==null&&l[k]!=null)d[k]=l[k];}
                    return d;
                })
                .catch(function(){return d;});
        })
        .then(function(d){if(hasAny(d)){apply(d);save(d);}})
        .catch(function(){});
})();
