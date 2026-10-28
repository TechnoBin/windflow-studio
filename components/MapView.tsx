'use client';
import {useEffect,useRef,useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type HazardMode='wind'|'rain'|'cyclone';
type BaseLayer='light'|'dark'|'humanitarian';
type CyclonePoint={name:string;validTime:string;date:string;lat:number;lon:number;windSpeed:string;category:string;type:'observed'|'forecast'};
type Props={center:[number,number];direction:number;speed:number;playing:boolean;mode:HazardMode;rainProbability:number;rainMm:number;cyclonePoints:CyclonePoint[];selectedDate:string};
type Particle={x:number;y:number;age:number;life:number;velocity:number};

export default function MapView({center,direction,speed,playing,mode,rainProbability,rainMm,cyclonePoints,selectedDate}:Props){
 const host=useRef<HTMLDivElement>(null),map=useRef<L.Map|null>(null),layers=useRef<Record<BaseLayer,L.TileLayer>>({}),latest=useRef({direction,speed,playing,mode,rainProbability,rainMm});
 const [baseLayer,setBaseLayer]=useState<BaseLayer>('light');
 useEffect(()=>{latest.current={direction,speed,playing,mode,rainProbability,rainMm}},[direction,speed,playing,mode,rainProbability,rainMm]);
 useEffect(()=>{
  if(!host.current||map.current)return;
  const m=L.map(host.current,{center:[22,10],zoom:2,zoomControl:false,worldCopyJump:true,preferCanvas:true});map.current=m;
  const light=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'});
  const dark=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',{subdomains:'abcd',maxZoom:19,attribution:'© OpenStreetMap contributors © CARTO'});
  const humanitarian=L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors, Tiles style © Humanitarian OpenStreetMap Team'});
  layers.current={light,dark,humanitarian};light.addTo(m);
  L.control.zoom({position:'bottomright'}).addTo(m);
  const canvas=L.DomUtil.create('canvas','wind-canvas') as HTMLCanvasElement;
  Object.assign(canvas.style,{position:'absolute',inset:'0',pointerEvents:'none',zIndex:'450'});
  m.getContainer().appendChild(canvas);
  const ctx=canvas.getContext('2d');let w=0,h=0,raf=0,last=0,particles:Particle[]=[];
  const seed=()=>({x:Math.random()*w,y:Math.random()*h,age:Math.random()*90,life:65+Math.random()*100,velocity:.65+Math.random()*1.5});
  const resize=()=>{const s=m.getSize(),dpr=Math.min(window.devicePixelRatio||1,2);w=s.x;h=s.y;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+'px';canvas.style.height=h+'px';ctx?.setTransform(dpr,0,0,dpr,0,0);particles=Array.from({length:Math.min(1200,Math.max(200,Math.floor(w*h/700)))},seed);};
  const animate=(t:number)=>{raf=requestAnimationFrame(animate);if(!ctx||t-last<24)return;last=t;
   ctx.globalCompositeOperation='destination-in';ctx.fillStyle='rgba(0,0,0,.91)';ctx.fillRect(0,0,w,h);ctx.globalCompositeOperation='source-over';
   if(!latest.current.playing){ctx.clearRect(0,0,w,h);return;}
   const wind=latest.current,base=(wind.direction+180)*Math.PI/180,drift=Math.min(3.4,.45+wind.speed/19),heat=Math.min(1,wind.speed/45);
   if(wind.mode==='rain'){
    const intensity=Math.max(.08,Math.min(1,wind.rainMm/12));
    ctx.save();ctx.strokeStyle='rgba(137,205,255,'+(.18+intensity*.65)+')';ctx.lineWidth=1;
    for(let i=0;i<Math.floor(28+intensity*390);i++){const x=(i*73+t*(.10+intensity*.25))%(w+40)-20;const y=(i*127+t*(.40+intensity*1.1))%(h+55)-25;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-5-intensity*3,y+8+intensity*15);ctx.stroke();}
    ctx.restore();
   }else{
    for(const p of particles){if(p.age++>p.life||p.x<0||p.x>w||p.y<0||p.y>h){Object.assign(p,seed());continue;}
     const ox=p.x,oy=p.y,nx=p.x/Math.max(w,1),ny=p.y/Math.max(h,1),curl=(Math.sin(nx*8.5+ny*4.2)+Math.cos(ny*10.2-nx*3.7))*.24,gust=Math.sin(t*.00035+nx*12+ny*5)*.10,angle=base+curl+gust;
     p.x+=Math.cos(angle)*drift*p.velocity;p.y-=Math.sin(angle)*drift*p.velocity;
     const alpha=(1-p.age/p.life)*(.38+heat*.48);ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(p.x,p.y);
     ctx.strokeStyle='rgba('+Math.round(78+heat*115)+','+Math.round(195-heat*40)+','+Math.round(226-heat*70)+','+alpha+')';ctx.lineWidth=.65+heat*.75;ctx.stroke();
    }
   }
  };
  resize();m.on('resize',resize);m.on('moveend',resize);const observer=new ResizeObserver(resize);observer.observe(host.current);raf=requestAnimationFrame(animate);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();m.remove();map.current=null;layers.current={};};
  // eslint-disable-next-line react-hooks/exhaustive-deps
 },[]);
 useEffect(()=>{const m=map.current,layer=layers.current[baseLayer];if(!m||!layer)return;Object.values(layers.current).forEach(item=>{if(m.hasLayer(item))m.removeLayer(item)});layer.addTo(m);},[baseLayer]);
 useEffect(()=>{const m=map.current;if(!m)return;const track=L.layerGroup();
  if(mode==='cyclone'&&cyclonePoints.length){
   const ordered=[...cyclonePoints].sort((a,b)=>a.validTime.localeCompare(b.validTime));
   if(ordered.length>1){track.addLayer(L.polyline(ordered.map(p=>[p.lat,p.lon] as L.LatLngTuple),{color:'#ff806f',weight:3,opacity:.9,dashArray:'7 6'}));}
   ordered.forEach(point=>{const marker=L.circleMarker([point.lat,point.lon],{radius:point.type==='forecast'?7:5,color:point.type==='forecast'?'#ffd0a1':'#fff1e8',weight:2,fillColor:point.type==='forecast'?'#ff806f':'#d94b43',fillOpacity:1});
    marker.bindPopup('<strong>'+point.name.replace(/[<>]/g,'')+'</strong><br/>'+point.type.toUpperCase()+' · '+new Date(point.validTime).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})+' IST<br/>Wind: '+(point.windSpeed||'not reported')+' km/h<br/>'+(point.category||'Category not reported'));track.addLayer(marker);
   });
   track.addTo(m);
  }
  return()=>{track.remove()};
 },[mode,cyclonePoints,selectedDate]);
 useEffect(()=>{const m=map.current;if(!m)return;if(mode!=='cyclone')m.panTo(center,{animate:true,duration:.5});},[center,mode]);
 const viewWorld=()=>map.current?.setView([22,10],2,{animate:true});
 const viewIndia=()=>map.current?.setView([22,79],4,{animate:true});
 return <div className="map-shell">
  <div className="map-shortcuts" role="group" aria-label="Map extent"><button type="button" onClick={viewWorld}>World</button><button type="button" onClick={viewIndia}>India</button></div>
  <div className="map-layer-shortcuts" role="group" aria-label="Map appearance"><button className={baseLayer==='light'?'active':''} type="button" onClick={()=>setBaseLayer('light')}>Light</button><button className={baseLayer==='dark'?'active':''} type="button" onClick={()=>setBaseLayer('dark')}>Dark</button><button className={baseLayer==='humanitarian'?'active':''} type="button" onClick={()=>setBaseLayer('humanitarian')}>Terrain</button></div>
  <div ref={host} className="map-host" aria-label="Interactive weather map with selectable basemap, zoom, and official cyclone track points"/>
 </div>;
}
