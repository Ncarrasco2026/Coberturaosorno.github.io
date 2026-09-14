(function(){
  function ready(){
    if(!window.L || !window.map || !window.nodes || !window.adj) return setTimeout(ready,300);
    const btn=document.getElementById('firstActivate');
    const box=document.getElementById('firstBox');
    const status=document.getElementById('firstStatus');
    const ranking=document.getElementById('firstRanking');
    const clearBtn=document.getElementById('clearSimulation');
    if(!btn || !box || !status || !ranking) return setTimeout(ready,300);

    window.map.off('click');
    let active=false, marker=null, routes=null;

    function clear(){
      if(marker){window.map.removeLayer(marker);marker=null;}
      if(routes){window.map.removeLayer(routes);routes=null;}
      ranking.innerHTML='';
      status.textContent='Haga clic en el mapa para elegir una emergencia.';
    }

    function heapPush(h,x){
      h.push(x);let i=h.length-1;
      while(i){let p=(i-1)>>1;if(h[p].d<=h[i].d)break;[h[p],h[i]]=[h[i],h[p]];i=p;}
    }
    function heapPop(h){
      const top=h[0],last=h.pop();
      if(h.length){h[0]=last;let i=0;
        while(true){let l=i*2+1,r=l+1,m=i;
          if(l<h.length&&h[l].d<h[m].d)m=l;
          if(r<h.length&&h[r].d<h[m].d)m=r;
          if(m===i)break;[h[m],h[i]]=[h[i],h[m]];i=m;
        }
      }
      return top;
    }

    // Ruta sobre EXACTAMENTE la misma red vial usada para las coberturas.
    // Esto evita que Phase 3 dependa de OSRM y respeta calles de un solo sentido.
    function localRoute(source,target){
      if(!source||!target||!window.nodes[source]||!window.nodes[target])return null;
      const dist={},prev={},heap=[];dist[source]=0;heapPush(heap,{id:source,d:0});
      while(heap.length){
        const cur=heapPop(heap);if(cur.d!==dist[cur.id])continue;
        if(cur.id===target)break;
        (window.adj[cur.id]||[]).forEach(e=>{
          const nd=cur.d+e.dist;
          if(nd<(dist[e.to]??Infinity)){dist[e.to]=nd;prev[e.to]=cur.id;heapPush(heap,{id:e.to,d:nd});}
        });
      }
      if(dist[target]===undefined)return null;
      const ids=[];let at=target;
      while(at!==undefined){ids.push(at);if(at===source)break;at=prev[at];}
      if(ids[ids.length-1]!==source)return null;
      ids.reverse();
      return {distance:dist[target],ids,geometry:{type:'LineString',coordinates:ids.map(id=>[window.nodes[id].lon,window.nodes[id].lat])}};
    }

    function activeStations(){
      return window.STATIONS.filter(s=>document.getElementById('toggle-'+s.id)?.checked);
    }

    function run(p){
      if(!active)return;
      if(marker)window.map.removeLayer(marker);
      if(routes)window.map.removeLayer(routes);
      marker=L.circleMarker([p.lat,p.lng],{radius:9,color:'#111',fillColor:'#fff',fillOpacity:1,weight:3})
        .bindPopup('<b>🚨 Emergencia simulada</b><br>Ubicación seleccionada').addTo(window.map).openPopup();
      ranking.innerHTML='';
      status.textContent='Calculando sobre la red vial local…';

      try{
        const target=window.nearest(p.lat,p.lng);
        if(!target){status.textContent='No se encontró una calle cercana al punto seleccionado.';return;}
        const speed=Math.max(5,+document.getElementById('speed')?.value||45);
        const results=[];
        activeStations().forEach(s=>{
          const nid=s.id==='c1'&&document.getElementById('futureToggle')?.checked?window.futureNode:window.stationNode[s.id];
          const r=localRoute(nid,target);
          if(r)results.push({s,r,eta:r.distance/1000/speed*60});
        });
        results.sort((a,b)=>a.eta-b.eta);
        if(!results.length){
          status.textContent='No hay rutas disponibles desde las compañías activas hacia esta calle.';
          ranking.innerHTML='<div class="status">La ubicación seleccionada no está conectada a la red vial cargada.</div>';
          return;
        }
        routes=L.layerGroup().addTo(window.map);
        results.forEach((x,i)=>L.geoJSON(x.r.geometry,{style:{color:x.s.color,weight:i===0?7:3,opacity:i===0?1:.45,dashArray:i===0?null:'7 6'}}).addTo(routes));
        status.innerHTML='<b>Primera llegada: '+results[0].s.name+'</b> · '+results[0].eta.toFixed(1)+' min';
        ranking.innerHTML=results.map((x,i)=>'<div class="rank '+(i===0?'first':'')+'"><b>#'+(i+1)+' '+x.s.name+(i===0?' 🏆':'')+'</b><br>'+ (x.r.distance/1000).toFixed(2)+' km · ETA '+x.eta.toFixed(1)+' min</div>').join('');
      }catch(err){
        console.error('Fase 3:',err);
        status.textContent='Error al calcular la ruta: '+(err.message||err);
      }
    }

    btn.onclick=function(){
      active=!active;
      box.style.display=active?'block':'none';
      btn.textContent=active?'🛑 DESACTIVAR SIMULACIÓN':'ACTIVAR SIMULACIÓN';
      window.map.getContainer().style.cursor=active?'crosshair':'';
      if(!active)clear();else status.textContent='Simulación activa. Haga clic en una calle del mapa.';
    };
    if(clearBtn)clearBtn.onclick=clear;
    window.map.on('click',e=>{if(active)run(e.latlng);});
    document.querySelector('[data-phase="primero"]')?.addEventListener('click',()=>{if(!active)btn.click();});
    console.log('Fase 3: motor de rutas local activo.');
  }
  ready();
})();