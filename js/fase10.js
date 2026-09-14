/* FASE 10 — INTEGRACIÓN GPS / VIPER
   Preparación para conectar posiciones reales de móviles. No almacena credenciales.
*/
(function(){
  'use strict';
  const $=id=>document.getElementById(id);let gpsLayer=null;
  function init(){
    const grid=document.querySelector('.phase-grid');if(!grid||$('phase10btn'))return;
    const btn=document.createElement('button');btn.id='phase10btn';btn.dataset.phase='gps';btn.textContent='10 · GPS / Viper';grid.appendChild(btn);
    const panel=document.createElement('div');panel.id='panel-gps';panel.className='phase-panel';panel.innerHTML=`<div class="section"><h2>FASE 10 · GPS / VIPER</h2><div class="status">Módulo preparado para recibir posiciones de móviles desde una API de Viper/GPS. La conexión real requiere el endpoint y autorización entregados por el proveedor.</div><div class="toggle-box"><div class="label">Endpoint de posiciones</div><input id="gpsEndpoint" type="url" placeholder="https://.../vehicles/positions"><div class="sub">No ingreses aquí contraseñas o tokens si el sistema no los protege.</div><button id="gpsTest">PROBAR CONEXIÓN</button><div id="gpsStatus" class="status"></div></div><div class="toggle-box"><div class="label">Prueba local de posiciones</div><div class="sub">Formato JSON: [{"id":"BX-1","lat":-40.57,"lon":-73.14,"estado":"disponible"}]</div><textarea id="gpsJson" rows="5" style="width:100%;margin-top:6px;padding:7px;border:1px solid var(--line);border-radius:5px;font:11px monospace"></textarea><button id="gpsLoad">MOSTRAR MÓVILES EN EL MAPA</button></div></div></div>`;document.getElementById('sidebar').appendChild(panel);
    btn.addEventListener('click',()=>show());
    $('gpsTest').onclick=test; $('gpsLoad').onclick=load;
  }
  function show(){document.querySelectorAll('.phase-panel').forEach(p=>p.classList.remove('active'));$('panel-gps').classList.add('active');document.querySelectorAll('.phase-grid button').forEach(b=>b.classList.remove('active'));$('phase10btn').classList.add('active');}
  async function test(){const u=$('gpsEndpoint').value.trim(),s=$('gpsStatus');if(!u){s.textContent='Ingrese un endpoint para probar.';return}try{const r=await fetch(u,{headers:{Accept:'application/json'}});s.textContent=r.ok?'Conexión HTTP correcta. Falta validar el formato de posiciones y la autorización del proveedor.':'El servidor respondió HTTP '+r.status+'. Revise endpoint, CORS y autorización.';}catch(e){s.textContent='No fue posible acceder desde el navegador. Puede requerirse un backend/proxy por CORS o autenticación.';}}
  function load(){const s=$('gpsStatus');try{const data=JSON.parse($('gpsJson').value||'[]');if(!Array.isArray(data)||!data.length)throw Error('Lista vacía');if(gpsLayer)gpsLayer.clearLayers();else gpsLayer=L.layerGroup().addTo(map);data.forEach(v=>{const lat=Number(v.lat),lon=Number(v.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return;L.circleMarker([lat,lon],{radius:8,color:'#111',fillColor:'#fff',fillOpacity:.95,weight:3}).bindPopup(`<b>${v.id||'Móvil'}</b><br>Estado: ${v.estado||'sin dato'}<br>GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}`).addTo(gpsLayer)});s.textContent=`${data.length} posición(es) cargadas en el mapa.`;}catch(e){s.textContent='JSON no válido. Revise el formato indicado.';}}
  const w=setInterval(()=>{if(typeof L!=='undefined'&&$('sidebar')){clearInterval(w);init()}},250);setTimeout(()=>clearInterval(w),20000);
})();
