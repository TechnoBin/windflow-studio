'use client';
import {useEffect,useRef} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
type Props={center:[number,number];direction:number;speed:number;playing:boolean};
type Particle={x:number;y:number;age:number;life:number;velocity:number};
export default function MapView({center,direction,speed,playing}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),latest=useRef({direction,speed,playing});
 useEffect(()=>{latest.current={direction,speed,playing}},[direction,speed,playing]);
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
  m.getPanes().overlayPane.appendChild(canvas);
  const ctx=canvas.getContext('2d');let w=0,h=0,raf=0,last=0,particles:Particle[]=[];
  const seed=()=>({x:Math.random()*w,y:Math.random()*h,age:Math.random()*90,life:65+Math.random()*100,velocity:.65+Math.random()*1.5});
  const resize=()=>{const s=m.getSize(),dpr=Math.min(window.devicePixelRatio||1,2);w=s.x;h=s.y;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx?.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:Math.min(1500,Math.max(250,Math.floor(w*h/600)))},seed);};
  const animate=(t:number)=>{raf=requestAnimationFrame(animate);if(!ctx||t-last<24)return;last=t;
   ctx.globalCompositeOperation='destination-in';ctx.fillStyle='rgba(0,0,0,.91)';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
   if(!latest.current.playing){ctx.clearRect(0,0,w,h);return;}
   const wind=latest.current,base=(wind.direction+180)*Math.PI/180,drift=Math.min(3.4,.45+wind.speed/19),heat=Math.min(1,wind.speed/45);
   for(const p of particles){
    if(p.age++>p.life||p.x<0||p.x>w||p.y<0||p.y>h){Object.assign(p,seed());continue;}
    const ox=p.x,oy=p.y;
    // Smooth, spatially varying curl gives the flow a field-like appearance rather than parallel lines.
    const nx=p.x/Math.max(w,1),ny=p.y/Math.max(h,1);
    const curl=(Math.sin(nx*8.5+ny*4.2)+Math.cos(ny*10.2-nx*3.7))*.24;
    const gust=Math.sin(t*.00035+nx*12+ny*5)*.10;
    const angle=base+curl+gust;
    p.x+=Math.cos(angle)*drift*p.velocity;
    p.y-=Math.sin(angle)*drift*p.velocity;
    const alpha=(1-p.age/p.life)*(.38+heat*.48);
    ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(p.x,p.y);
    ctx.strokeStyle='rgba('+Math.round(78+heat*115)+','+Math.round(195-heat*40)+','+Math.round(226-heat*70)+','+alpha+')';
    ctx.lineWidth=.65+heat*.75;ctx.stroke();
   }
  };
  resize();m.on('resize',resize);m.on('moveend',resize);const observer=new ResizeObserver(resize);observer.observe(host.current);raf=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();m.remove();map.current=null};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{map.current?.setView(center,map.current.getZoom(),{animate:true})},[center]);
 return <div className="map-shell">
  <div className="map-shortcuts">
   <button type="button" onClick={()=>map.current?.setView([22,10],2,{animate:true})}>World</button>
   <button type="button" onClick={()=>map.current?.setView([22,79],4,{animate:true})}>India</button>
  </div>
  <div ref={host} className="map-host" aria-label="Interactive world map with animated wind particles"/>
 </div>;
}
