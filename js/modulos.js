/* Arquitectura modular inicial — Cobertura Bomberos Osorno */
window.CoberturaApp = (() => {
  const modulos = {
    mapa: {titulo:'Mapa operacional', icono:'🗺️', fase:'Fase 1', descripcion:'Cuarteles, posiciones y visualización general.'},
    primero: {titulo:'¿Quién llega primero?', icono:'🚨', fase:'Fase 3', descripcion:'Simulación de emergencia y ranking de llegada.'},
    transito: {titulo:'Red vial y tránsito', icono:'🛣️', fase:'Fase 2', descripcion:'Rutas por calles y sentido del tránsito.'},
    cobertura: {titulo:'Cobertura por calles', icono:'🎯', fase:'Fase 4', descripcion:'Compañía que llega primero a cada tramo vial.'},
    limites: {titulo:'Límites entre compañías', icono:'🔀', fase:'Fase 5', descripcion:'Análisis de zonas de transición entre compañías.'},
    futuro: {titulo:'Escenario futuro', icono:'🏗️', fase:'Fase 6', descripcion:'Comparación de situación actual y futuro cuartel 1ª Cía.'},
    moviles: {titulo:'Móviles y carros', icono:'🚒', fase:'Fase 7', descripcion:'Móviles disponibles y, posteriormente, ubicación GPS.'},
    despacho: {titulo:'Simulador de despacho', icono:'📟', fase:'Fase 8', descripcion:'Simulación de despacho operacional.'},
    estadisticas: {titulo:'Estadísticas', icono:'📊', fase:'Fase 9', descripcion:'Distancias, tiempos y distribución de cobertura.'},
    configuracion: {titulo:'Configuración', icono:'⚙️', fase:'Configuración', descripcion:'Escenarios, compañías y parámetros.'}
  };
  function activar(id){
    document.querySelectorAll('[data-modulo]').forEach(x=>x.classList.toggle('activo',x.dataset.modulo===id));
    document.querySelectorAll('.panel-modulo').forEach(x=>x.hidden=x.dataset.modulo!==id);
    const m=modulos[id];
    const titulo=document.getElementById('titulo-modulo');
    const descripcion=document.getElementById('descripcion-modulo');
    if(titulo) titulo.textContent=(m?.icono||'')+' '+(m?.titulo||'Módulo');
    if(descripcion) descripcion.textContent=m?.descripcion||'';
    localStorage.setItem('modulo_activo',id);
    window.dispatchEvent(new CustomEvent('cobertura:modulo',{detail:{id}}));
  }
  function init(){
    const menu=document.getElementById('menu-modulos');
    if(menu){menu.querySelectorAll('[data-modulo]').forEach(b=>b.addEventListener('click',()=>activar(b.dataset.modulo)));}
    activar(localStorage.getItem('modulo_activo')||'mapa');
  }
  return {modulos,activar,init};
})();
