(function(){
  function ready(){
    if(!window.L || !window.map) return setTimeout(ready,300);
    const btn=document.getElementById('firstActivate');
    const box=document.getElementById('firstBox');
    const status=document.getElementById('firstStatus');
    if(!btn || !box) return;

    // Reemplaza el manejador de clic del mapa de la versión anterior.
    window.map.off('click');
    let active=false;
    let marker=null;
    let routes=null;

    function clear(){
      if(marker){window.map.removeLayer(marker);marker=null;}
      if(routes){window.map.removeLayer(routes);routes=null;}
      document.getElementById('firstRanking').innerHTML='';
      status.textContent='Haga clic en el mapa para elegir una emergencia.';
    }

    async function run(p){
      if(!active) return;
      if(marker) window.map.removeLayer(marker);
      if(routes) window.map.removeLayer(routes);
      marker=L.circleMarker([p.lat,p.lng],{radius:9,color:'#111',fillColor:'#fff',fillOpacity:1,weight:3})
        .bindPopup('<b>🚨 Emergencia simulada</b><br>Seleccione una ubicación sobre el mapa.')
        .addTo(window.map).openPopup();
      status.textContent='Calculando rutas reales desde los cuarteles…';
      document.getElementById('firstRanking').innerHTML='';
      try{
        const ranked=await window.rankEmergency(p);
        if(!ranked.length){status.textContent='No fue posible calcular rutas. Verifique que la red vial esté cargada y que haya compañías activas.';return;}
        routes=L.layerGroup().addTo(window.map);
        ranked.forEach((x,i)=>{
          if(x.r && x.r.geometry) L.geoJSON(x.r.geometry,{style:{color:x.s.color,weight:i===0?7:3,opacity:i===0?1:.55,dashArray:i===0?null:'7 6'}}).addTo(routes);
        });
        status.innerHTML='<b>Primera llegada: '+ranked[0].s.name+'</b> · '+ranked[0].eta.toFixed(1)+' min';
        document.getElementById('firstRanking').innerHTML=ranked.map((x,i)=>
          '<div class="rank '+(i===0?'first':'')+'"><b>#'+(i+1)+' '+x.s.name+(i===0?' 🏆':'')+'</b><br>'+
          (x.r.distance/1000).toFixed(2)+' km · ETA '+x.eta.toFixed(1)+' min</div>'
        ).join('');
      }catch(err){
        console.error(err);
        status.textContent='Error al calcular la llegada: '+(err.message||err);
      }
    }

    btn.onclick=function(){
      active=!active;
      box.style.display=active?'block':'none';
      btn.textContent=active?'🛑 DESACTIVAR SIMULACIÓN':'ACTIVAR SIMULACIÓN';
      window.map.getContainer().style.cursor=active?'crosshair':'';
      if(!active) clear();
      else status.textContent='Simulación activa. Haga clic en cualquier punto del mapa.';
    };

    document.getElementById('clearSimulation').onclick=clear;

    // Un solo manejador de clic para Fase 3.
    window.map.on('click',function(e){ if(active) run(e.latlng); });

    // Al entrar a Fase 3, queda lista para usar inmediatamente.
    document.querySelector('[data-phase="primero"]')?.addEventListener('click',function(){
      if(!active) btn.click();
    });

    console.log('Fase 3 corregida: clic en mapa -> rutas -> ranking -> ETA.');
  }
  ready();
})();