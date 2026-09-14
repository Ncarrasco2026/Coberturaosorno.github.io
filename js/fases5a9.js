/* FASES 5–9 — límites, escenario futuro, móviles, despacho y estadísticas.
   Se integran sobre el mapa y la red vial existentes, sin reemplazar el trazado original.
*/
(function(){
  'use strict';
  const IDS=['c1','c2','c3','c6','c7','c8'];
  const N={c1:'1ª Compañía',c2:'2ª Compañía',c3:'3ª Compañía',c6:'6ª Compañía',c7:'7ª Compañía',c8:'8ª Compañía'};
  const C={c1:'#b3402c',c2:'#2f6fb0',c3:'#3a7d52',c6:'#c68a2e',c7:'#7a539a',c8:'#1f8a86'};
  const $=id=>document.getElementById(id);
  const active=()=>IDS.filter(id=>$('toggle-'+id)?.checked);
  let boundaryLayer=null,futureSnapshot=null,dispatchLayer=null;

  function boundaryData(a,b){
    const out=[]; if(!a||!b||a===b)return out;
    const wanted=new Set([a,b]);
    (edges||[]).forEach(e=>{
      const oa=lastOwner?.[e.a],ob=lastOwner?.[e.b];
      if(!wanted.has(oa)||!wanted.has(ob)||oa===ob)return;
      const p=nodes[e.a],q=nodes[e.b]; if(!p||!q)return;
      out.push({e,p,q,oa,ob,d:Math.round(hav(p,q))});
    });
    return out;
  }
  function phase5(){
    const a=$('pairA')?.value,b=$('pairB')?.value,box=$('boundary-summary');
    if(!a||!b||a===b){if(box)box.innerHTML='<div class="status">Seleccione dos compañías distintas.</div>';return}
    if(typeof render==='function')render();
    const rows=boundaryData(a,b);
    if(box)box.innerHTML=`<div class="toggle-box"><b>${N[a]} × ${N[b]}</b><div class="status" style="margin-top:4px">Se detectaron <b>${rows.length}</b> tramos de transición en la red vial.</div><div class="status">Los puntos negros y los cambios de color del mapa representan el límite operacional calculado.</div></div>`;
  }
  function init5(){
    $('pairA')?.addEventListener('change',phase5); $('pairB')?.addEventListener('change',phase5);
    $('focusBoundary')?.addEventListener('click',phase5);
    document.querySelectorAll('[data-phase="limites"]').forEach(b=>b.addEventListener('click',()=>setTimeout(phase5,150)));
  }

  async function compareFuture(){
    const box=$('futureStatus');
    if(!futureNode){if(box)box.innerHTML='<b>Primero active el cuartel futuro.</b>';return}
    if(!lastOwner||!Object.keys(lastOwner).length){if(typeof recompute==='function')recompute();}
    const before={...lastOwner};
    const was=$('futureToggle')?.checked;
    if(!was && $('futureToggle'))$('futureToggle').checked=true;
    if(typeof recompute==='function')recompute();
    const after={...lastOwner};
    let changed=0,from={};
    Object.keys(after).forEach(id=>{if(before[id]&&after[id]&&before[id]!==after[id]){changed++;const k=before[id]+'>'+after[id];from[k]=(from[k]||0)+1;}});
    futureSnapshot={changed,from};
    const detail=Object.entries(from).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>{const [x,y]=k.split('>');return `<div class="stat"><span>${N[x]} → ${N[y]}</span><b>${v}</b></div>`}).join('');
    if(box)box.innerHTML=`<div class="toggle-box"><b>Comparación actual → futura</b><div class="stat"><span>Nodos que cambian de compañía</span><b>${changed.toLocaleString('es-CL')}</b></div><div class="status" style="margin-top:6px">El resultado se calcula sobre la misma red vial y respeta el sentido del tránsito seleccionado.</div></div><div style="margin-top:8px">${detail||'<div class="status">No se detectaron cambios de propietario.</div>'}</div>`;
  }
  function init6(){$('compareFuture')?.addEventListener('click',compareFuture);document.querySelectorAll('[data-phase="futuro"]').forEach(b=>b.addEventListener('click',()=>setTimeout(()=>{},50)));}

  function init7(){
    document.querySelectorAll('[data-phase="moviles"]').forEach(b=>b.addEventListener('click',()=>typeof renderVehicles==='function'&&renderVehicles()));
  }

  async function dispatch(){
    const box=$('dispatchResult'),units=Math.max(1,Math.min(10,Number($('dispatchUnits')?.value)||1));
    if(!emergencyPoint){if(box)box.innerHTML='<b>Primero seleccione una emergencia en Fase 3.</b>';return;}
    const available=(vehicles||[]).filter(v=>v.available&&active().includes(v.company));
    if(!available.length){if(box)box.innerHTML='No hay móviles disponibles de compañías activas.';return;}
    box.innerHTML='Calculando propuesta de despacho por red vial…';
    const ranked=[];
    for(const v of available){
      const s=STATIONS.find(x=>x.id===v.company);const nid=v.company==='c1'&&$('futureToggle')?.checked?futureNode:stationNode[v.company];
      if(!s||!nid||!nodes[nid])continue;
      try{const r=await osrmRoute(nodes[nid],{lat:emergencyPoint.lat,lng:emergencyPoint.lng});if(r)ranked.push({v,s,r,eta:r.distance/1000/Math.max(5,Number($('speed')?.value)||45)*60});}catch(e){console.warn(e)}
    }
    ranked.sort((a,b)=>a.eta-b.eta);
    const chosen=ranked.slice(0,units);
    if(dispatchLayer)dispatchLayer.clearLayers(); else dispatchLayer=L.layerGroup().addTo(map);
    chosen.forEach((x,i)=>L.geoJSON(x.r.geometry,{style:{color:x.s.color,weight:i===0?6:4,opacity:.9,dashArray:i?'7 5':null}}).addTo(dispatchLayer));
    box.innerHTML=chosen.length?`<div class="toggle-box"><b>Despacho propuesto · ${chosen.length} unidad(es)</b><div class="status" style="margin-top:5px">Ordenado por tiempo estimado de llegada. Esta es una simulación, no una pauta oficial de despacho.</div></div>`+chosen.map((x,i)=>`<div class="rank ${i===0?'first':''}"><b>#${i+1} ${x.v.name} · ${x.s.name}</b><br>${x.v.kind} · ${(x.r.distance/1000).toFixed(2)} km · ETA ${x.eta.toFixed(1)} min</div>`).join(''):'No fue posible calcular rutas para los móviles disponibles.';
  }
  function init8(){$('dispatchRun')?.addEventListener('click',dispatch);document.querySelectorAll('[data-phase="despacho"]').forEach(b=>b.addEventListener('click',()=>typeof renderVehicles==='function'&&renderVehicles()));}

  function stats(){
    const box=$('stats');if(!box)return;
    const assigned=Object.keys(lastOwner||{}).length,total=(nodes&&Object.keys(nodes).length)||0,trans=(edges||[]).filter(e=>lastOwner?.[e.a]&&lastOwner?.[e.b]&&lastOwner[e.a]!==lastOwner[e.b]).length;
    box.innerHTML=`<div class="stat"><span>Nodos viales</span><b>${total.toLocaleString('es-CL')}</b></div><div class="stat"><span>Nodos asignados</span><b>${assigned.toLocaleString('es-CL')}</b></div><div class="stat"><span>Tramos con transición</span><b>${trans.toLocaleString('es-CL')}</b></div><div class="stat"><span>Compañías activas</span><b>${active().length}/6</b></div><div class="stat"><span>Móviles disponibles</span><b>${(vehicles||[]).filter(v=>v.available&&active().includes(v.company)).length}</b></div><div class="stat"><span>Simulaciones guardadas</span><b>${(history||[]).length}</b></div>`;
  }
  function init9(){document.querySelectorAll('[data-phase="estadisticas"]').forEach(b=>b.addEventListener('click',()=>setTimeout(stats,100)));setInterval(stats,3000);}

  function boot(){init5();init6();init7();init8();init9();}
  const wait=setInterval(()=>{if(typeof L!=='undefined'&&typeof nodes!=='undefined'&&typeof render==='function'){clearInterval(wait);boot();}},250);
  setTimeout(()=>clearInterval(wait),20000);
})();
