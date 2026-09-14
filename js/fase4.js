/* FASE 4 — COBERTURA OPERACIONAL POR CALLES
   Se monta sobre la red y trazados del mapa original. No reemplaza el mapa base.
*/
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const IDS=['c1','c2','c3','c6','c7','c8'];
  const NAMES={c1:'1ª Compañía',c2:'2ª Compañía',c3:'3ª Compañía',c6:'6ª Compañía',c7:'7ª Compañía',c8:'8ª Compañía'};
  const COLORS={c1:'#b3402c',c2:'#2f6fb0',c3:'#3a7d52',c6:'#c68a2e',c7:'#7a539a',c8:'#1f8a86'};
  let panelReady=false;
  function active(){return IDS.filter(id=>$(('toggle-'+id))?.checked)}
  function init(){
    if(panelReady)return;
    const panel=$('panel-cobertura');
    if(!panel)return;
    panelReady=true;
    const section=panel.querySelector('.section');
    if(section){
      const old=section.querySelector('#coverageStatus');
      if(old)old.style.display='none';
      const box=document.createElement('div');box.id='fase4-result';section.appendChild(box);
    }
    const btn=$('recalcCoverage');
    if(btn)btn.onclick=()=>{if(typeof recompute==='function')recompute();setTimeout(render,80)};
    document.querySelectorAll('[data-phase="cobertura"]').forEach(b=>b.addEventListener('click',()=>setTimeout(render,120)));
    IDS.forEach(id=>$('toggle-'+id)?.addEventListener('change',()=>setTimeout(render,120)));
    $('trafficToggle')?.addEventListener('change',()=>setTimeout(render,120));
    $('futureToggle')?.addEventListener('change',()=>setTimeout(render,120));
    setTimeout(render,700);
  }
  function render(){
    const box=$('fase4-result');if(!box)return;
    const total=typeof edges==='object'?edges.length:0;
    const owner=typeof lastOwner==='object'?lastOwner:{};
    const usable=total?edges.filter(e=>owner[e.a]||owner[e.b]).length:0;
    const counts={};IDS.forEach(id=>counts[id]=0);
    let assignedEdges=0;
    if(total){
      edges.forEach(e=>{const a=owner[e.a],b=owner[e.b];const o=a||b;if(o){assignedEdges++;counts[o]=(counts[o]||0)+1}})
    }
    const activeIds=active();
    const rows=activeIds.map(id=>{
      const pct=assignedEdges?counts[id]/assignedEdges*100:0;
      return '<div style="margin:8px 0"><div style="display:flex;justify-content:space-between;font-size:12px"><b>'+NAMES[id]+'</b><b>'+pct.toFixed(1)+'%</b></div><div style="height:9px;background:#e9e5dc;border-radius:5px;overflow:hidden;margin-top:3px"><div style="width:'+Math.min(100,pct)+'%;height:100%;background:'+COLORS[id]+'"></div></div><div class="status">'+counts[id].toLocaleString('es-CL')+' tramos asignados</div></div>';
    }).join('');
    box.innerHTML='<div class="toggle-box"><b>Resultado de cobertura</b><div class="status" style="margin-top:4px">La compañía propietaria de cada tramo es la que obtiene el menor costo de recorrido desde su cuartel, respetando la configuración de tránsito.</div><div style="margin-top:9px;font-size:12px"><b>Red:</b> '+Object.keys(nodes||{}).length.toLocaleString('es-CL')+' nodos · <b>'+total.toLocaleString('es-CL')+'</b> tramos · <b>'+assignedEdges.toLocaleString('es-CL')+'</b> con cobertura</div></div>'+
      '<div style="margin-top:10px">'+(rows||'<div class="status">No hay compañías activas.</div>')+'</div>'+
      '<div class="toggle-box" style="margin-top:10px"><b>Lectura operacional</b><div class="status" style="margin-top:4px">Los colores del mapa siguen siendo la referencia visual principal. Los puntos negros representan cambios de compañía entre tramos. Puedes desactivar una compañía para simular que no está disponible y recalcular.</div></div>';
  }
  const wait=setInterval(()=>{if(typeof window!=='undefined'&&typeof L!=='undefined'&&typeof nodes!=='undefined'){clearInterval(wait);init()}},250);
  setTimeout(()=>clearInterval(wait),20000);
})();
