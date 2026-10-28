'use client';
import {useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
type HazardMode='wind'|'rain'|'cyclone';
type Props={center:[number,number];direction:number;speed:number;playing:boolean;mode:HazardMode;rainProbability:number;rainMm:number};
type Particle={x:number;y:number;age:number;life:number;velocity:number};
export default function MapView({center,direction,speed,playing,mode,rainProbability,rainMm}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),latest=useRef({direction,speed,playing,mode,rainProbability,rainMm});
 useEffect(()=>{latest.current={direction,speed,playing,mode,rainProbability,rainMm}},[direction,speed,playing,mode,rainProbability]);
 useEffect(()=>{
  if(!host.current||map.current)return;
  const m=L.map(host.current,{center:[22,10],zoom:2,zoomControl:false,worldCopyJump:true});map.current=m;
  const street=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'});
  const dark=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap contributors © CARTO'});
  const terrain=L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors, Tiles style © Humanitarian OpenStreetMap Team'});
  street.addTo(m);
  L.control.layers({'Street (no key)':street,'Dark':dark,'Humanitarian':terrain},undefined,{position:'topright',collapsed:true}).addTo(m);
  L.control.zoom({position:'bottomright'}).addTo(m);
  const canvas=L.DomUtil.create('canvas','wind-canvas') as HTMLCanvasElement;
  Object.assign(canvas.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'450'});
  m.getContainer().appendChild(canvas); // Keep the animation canvas in viewport coordinates; overlayPane is transformed during zoom.
  const ctx=canvas.getContext('2d');let w=0,h=0,raf=0,last=0,particles:Particle[]=[];
  const seed=()=>({x:Math.random()*w,y:Math.random()*h,age:Math.random()*90,life:65+Math.random()*100,velocity:.65+Math.random()*1.5});
  const resize=()=>{const s=m.getSize(),dpr=Math.min(window.devicePixelRatio||1,2);w=s.x;h=s.y;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx?.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:Math.min(1500,Math.max(250,Math.floor(w*h/600)))},seed);};
  const animate=(t:number)=>{raf=requestAnimationFrame(animate);if(!ctx||t-last<24)return;last=t;
   ctx.globalCompositeOperation='destination-in';ctx.fillStyle='rgba(0,0,0,.91)';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
   if(!latest.current.playing){ctx.clearRect(0,0,w,h);return;}
   const wind=latest.current,base=(wind.direction+180)*Math.PI/180,drift=Math.min(3.4,.45+wind.speed/19),heat=Math.min(1,wind.speed/45);
   if(wind.mode==='rain'){
    const intensity=Math.max(.08,Math.min(1,wind.rainMm/12));
    ctx.save();ctx.strokeStyle='rgba(137,205,255,'+(.18+intensity*.65)+')';ctx.lineWidth=1;
    for(let i=0;i<Math.floor(28+intensity*390);i++){
     const x=(i*73+t*(.10+intensity*.25))%(w+40)-20;
     const y=(i*127+t*(.40+intensity*1.1))%(h+55)-25;
     ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5-intensity*3,y+8+intensity*15);ctx.stroke();
    }
    ctx.restore();
   }else{
    for(const p of particles){
     if(p.age++>p.life||p.x<0||p.x>w||p.y<0||p.y>h){Object.assign(p,seed());continue;}
     const ox=p.x,oy=p.y;
     const nx=p.x/Math.max(w,1),ny=p.y/Math.max(h,1);
     const curl=(Math.sin(nx*8.5+ny*4.2)+Math.cos(ny*10.2-nx*3.7))*.24;
     const gust=Math.sin(t*.00035+nx*12+ny*5)*.10;
     const angle=base+curl+gust;
     p.x+=Math.cos(angle)*drift*p.velocity;p.y-=Math.sin(angle)*drift*p.velocity;
     const alpha=(1-p.age/p.life)*(.38+heat*.48);
     ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(p.x,p.y);
     ctx.strokeStyle='rgba('+Math.round(78+heat*115)+','+Math.round(195-heat*40)+','+Math.round(226-heat*70)+','+alpha+')';
     ctx.lineWidth=.65+heat*.75;ctx.stroke();
    }
   }
   if(wind.mode==='cyclone'){
    const point=m.latLngToContainerPoint([16.1,82.3]),cx=point.x,cy=point.y;
    const radius=Math.max(26,Math.min(88,38+m.getZoom()*3));
    ctx.save();ctx.lineWidth=2;ctx.strokeStyle='rgba(255,118,105,.8)';ctx.fillStyle='rgba(255,105,92,.10)';
    ctx.beginPath();ctx.arc(cx,cy,radius*(1.05+.06*Math.sin(t*.003)),0,Math.PI*2);ctx.fill();ctx.stroke();
    ctx.setLineDash([5,6]);ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,radius*1.55,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    for(let arm=0;arm<3;arm++){ctx.beginPath();for(let s=0;s<=90;s++){const a=s/90*Math.PI*4+t*.001*(arm%2?1:-1)+arm*Math.PI*2/3,rr=radius*(.08+s/90*.9);const x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;if(s===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.strokeStyle='rgba(255,150,128,.72)';ctx.lineWidth=2;ctx.stroke()}
    ctx.beginPath();ctx.arc(cx,cy,4,0,Math.PI*2);ctx.fillStyle='#fff1e8';ctx.fill();ctx.restore();
   }
  };
  resize();m.on('resize',resize);m.on('moveend',resize);const observer=new ResizeObserver(resize);observer.observe(host.current);raf=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();m.remove();map.current=null};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{const m=map.current;if(!m)return;const layer=L.layerGroup();if(mode==='cyclone'){const alertArea=L.circle([16.1,82.3],{radius:145000,color:'#ffb15c',weight:2,opacity:.8,fillColor:'#ff9b52',fillOpacity:.07,dashArray:'7 8'});const label=L.marker([16.1,82.3],{icon:L.divIcon({className:'cyclone-map-label',html:'<span>⚠ ILLUSTRATIVE AREA</span>',iconSize:[150,26],iconAnchor:[75,42]})});layer.addLayer(alertArea);layer.addLayer(label);layer.addTo(m)}return()=>{layer.remove();}},[mode]);
 useEffect(()=>{if(!map.current)return;if(mode==='cyclone'){if(map.current.getZoom()<4)map.current.setView([16.1,82.3],5,{animate:true})}else{map.current.setView(center,map.current.getZoom(),{animate:true})}},[center,mode]);
 return <div className="map-shell">
  <div className="map-shortcuts">
   <button type="button" onClick={()=>map.current?.setView([22,10],2,{animate:true})}>World</button>
   <button type="button" onClick={()=>map.current?.setView([22,79],4,{animate:true})}>India</button>
  </div>
  <div ref={host} className="map-host" aria-label="Interactive world map with animated wind particles"/>
 </div>;
}
