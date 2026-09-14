/* FASE 3 ROBUSTA — ¿QUIÉN LLEGA PRIMERO?
   No reemplaza el mapa base. Usa directamente la red vial ya cargada por app.js.
*/
(function(){
  'use strict';
  let active=false, marker=null, routeLayer=null;
  const $=id=>document.getElementById(id);
  const wait=setInterval(()=>{
    if(typeof L!=='undefined' && typeof map!=='undefined' && map && typeof nodes!=='undefined' && typeof adj!=='undefined'){
      clearInterval(wait); init();
    }
  },250);
  setTimeout(()=>clearInterval(wait),20000);

  function init(){
    const btn=$('firstActivate'), box=$('firstBox'), clear=$('clearSimulation');
    if(!btn || !box) return;
    btn.onclick=()=>{active=!active; box.style.display=active?'block':'none'; btn.textContent=active?'SIMULACIÓN ACTIVA — CLIC EN EL MAPA':'ACTIVAR SIMULACIÓN'; if(active) bind(); else unbind(); diagnose();};
    if(clear) clear.onclick=clearRoutes;
    const phaseButtons=document.querySelectorAll('[data-phase="primero"]');
    phaseButtons.forEach(b=>b.addEventListener('click',()=>{setTimeout(()=>{active=true;box.style.display='block';btn.textContent='SIMULACIÓN ACTIVA — CLIC EN EL MAPA';bind();diagnose();},100);}));
    bind();
    diagnose();
  }
  function bind(){
    if(!map) return;
    map.off('click',onMapClick);
    map.on('click',onMapClick);
  }
  function unbind(){ if(map) map.off('click',onMapClick); }
  async function onMapClick(e){ if(!active)return; await run(e.latlng); }

  function activeCompanies(){
    const out=[];
    ['c1','c2','c3','c6','c7','c8'].forEach(id=>{
      const cb=$('toggle-'+id);
      if(cb && cb.checked) out.push(id);
    });
    return out;
  }
  function nearestNode(p){
    let best=null,bd=Infinity;
    for(const id in nodes){
      const n=nodes[id];
      const d=haversine(n.lat,n.lon,p.lat,p.lng);
      if(d<bd){bd=d;best=id;}
    }
    return {id:best,meters:bd};
  }
  function haversine(a,b,c,d){
    const R=6371000,rad=x=>x*Math.PI/180;
    const la1=rad(a),la2=rad(c),dl=rad(c-a),do_=rad(d-b);
    return 2*R*Math.asin(Math.sqrt(Math.sin(dl/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(do_/2)**2));
  }
  function dijkstra(source,target){
    if(!source || !nodes[source] || !nodes[target])return null;
    const dist={[source]:0},prev={},heap=[[0,source]];
    while(heap.length){
      heap.sort((a,b)=>a[0]-b[0]);
      const [d,u]=heap.shift();
      if(d!==dist[u])continue;
      if(u===target)break;
      for(const e of (adj[u]||[])){
        const nd=d+e.dist;
        if(nd<(dist[e.to]??Infinity)){
          dist[e.to]=nd;prev[e.to]=u;heap.push([nd,e.to]);
        }
      }
    }
    if(dist[target]===undefined)return null;
    const path=[];let cur=target;let guard=0;
    while(cur!==undefined && guard++<100000){path.push(cur);if(cur===source)break;cur=prev[cur];}
    if(path[path.length-1]!==source)return null;
    path.reverse();
    return {distance:dist[target],path};
  }
  function stationNodeFor(id){
    const future=$('futureToggle')?.checked;
    if(id==='c1' && future && typeof futureNode!=='undefined' && futureNode) return futureNode;
    if(typeof stationNode!=='undefined' && stationNode[id]) return stationNode[id];
    return null;
  }
  function name(id){return ({c1:'1ª Compañía',c2:'2ª Compañía',c3:'3ª Compañía',c6:'6ª Compañía',c7:'7ª Compañía',c8:'8ª Compañía'})[id]||id;}
  function col(id){return ({c1:'#b3402c',c2:'#2f6fb0',c3:'#3a7d52',c6:'#c68a2e',c7:'#7a539a',c8:'#1f8a86'})[id]||'#333';}
  function run(p){
    clearRoutes(false);
    marker=L.circleMarker([p.lat,p.lng],{radius:9,color:'#111',fillColor:'#fff',fillOpacity:1,weight:3}).addTo(map).bindPopup('🚨 <b>Emergencia seleccionada</b>').openPopup();
    const status=$('firstStatus'), ranking=$('firstRanking');
    if(status)status.textContent='Calculando rutas sobre la red vial…';
    const companies=activeCompanies();
    const target=nearestNode(p);
    if(!target.id){fail('La red vial no contiene nodos.');return;}
    const speed=Math.max(5,Number($('speed')?.value)||45);
    const results=[];
    companies.forEach(id=>{
      const sn=stationNodeFor(id);
      if(!sn){results.push({id,reason:'sin nodo de cuartel'});return;}
      const r=dijkstra(sn,target.id);
      if(!r){results.push({id,reason:'sin conexión vial'});return;}
      results.push({id,r,km:r.distance/1000,eta:r.distance/1000/speed*60});
    });
    const ok=results.filter(x=>x.r).sort((a,b)=>a.eta-b.eta);
    if(!ok.length){
      fail('No se encontró ninguna ruta conectada. Revisa el diagnóstico mostrado debajo.');
      renderRanking(results);
      return;
    }
    routeLayer=L.layerGroup().addTo(map);
    ok.forEach((x,i)=>{
      const latlngs=x.r.path.map(n=>[nodes[n].lat,nodes[n].lon]);
      L.polyline(latlngs,{color:col(x.id),weight:i===0?6:3,opacity:i===0?1:.55,dashArray:i===0?null:'7 6'}).addTo(routeLayer);
    });
    if(status)status.innerHTML='<b>🏆 Primera llegada: '+name(ok[0].id)+'</b> · '+ok[0].km.toFixed(2)+' km · ETA '+ok[0].eta.toFixed(1)+' min';
    renderRanking(results,ok);
    if(marker)marker.bindPopup('🚨 <b>Emergencia</b><br>Primera llegada: <b>'+name(ok[0].id)+'</b><br>'+ok[0].km.toFixed(2)+' km · '+ok[0].eta.toFixed(1)+' min').openPopup();
  }
  function renderRanking(all,ok=[]){
    const box=$('firstRanking');if(!box)return;
    const good=ok.length?ok:all.filter(x=>x.r);
    let html=good.map((x,i)=>'<div class="rank '+(i===0?'first':'')+'"><b>#'+(i+1)+' '+name(x.id)+(i===0?' 🏆':'')+'</b><br>'+x.km.toFixed(2)+' km · ETA '+x.eta.toFixed(1)+' min</div>').join('');
    const bad=all.filter(x=>!x.r).map(x=>'<div class="rank"><b>'+name(x.id)+'</b><br><span class="status">⚠ '+x.reason+'</span></div>').join('');
    box.innerHTML=html+bad;
  }
  function diagnose(){
    const box=$('firstStatus');if(!box)return;
    const n=typeof nodes==='object'?Object.keys(nodes).length:0;
    const e=typeof adj==='object'?Object.values(adj).reduce((a,v)=>a+v.length,0):0;
    const cs=activeCompanies();
    const detail=cs.map(id=>name(id)+': '+(stationNodeFor(id)?'OK':'SIN NODO')).join(' · ');
    if(!active) box.innerHTML='Haga clic en <b>ACTIVAR SIMULACIÓN</b> y luego seleccione una emergencia.<br><small>Red: '+n.toLocaleString('es-CL')+' nodos · '+e.toLocaleString('es-CL')+' conexiones · '+cs.length+' compañías activas</small>';
    else box.innerHTML='<b>Listo para seleccionar emergencia.</b><br><small>Red: '+n.toLocaleString('es-CL')+' nodos · '+e.toLocaleString('es-CL')+' conexiones<br>'+detail+'</small>';
  }
  function fail(msg){
    const s=$('firstStatus');if(s)s.innerHTML='<b>⚠ '+msg+'</b>';
  }
  function clearRoutes(resetStatus=true){
    if(marker){map.removeLayer(marker);marker=null;}
    if(routeLayer){map.removeLayer(routeLayer);routeLayer=null;}
    if($('firstRanking'))$('firstRanking').innerHTML='';
    if(resetStatus)diagnose();
  }
})();
