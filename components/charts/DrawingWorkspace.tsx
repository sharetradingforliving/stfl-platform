"use client";

import { useEffect, useRef, useState } from "react";
import type { IChartApi, ISeriesApi, IPrimitivePaneRenderer, Time } from "lightweight-charts";

type Point = { time: number; price: number };
type Drawing = { id: string; tool: string; points: Point[]; colour: string; text: string; hidden: boolean; locked: boolean };
type Command = "undo" | "redo" | "clear";
type Props = {
  chart: IChartApi;
  series: ISeriesApi<"Candlestick">;
  element: HTMLDivElement;
  candles: {time: Time}[];
  storageKey: string;
  tool: string | null;
  onComplete: () => void;
  isChartAlive: () => boolean;
  command: {action: string; id: number} | null;
};
const tools = ["trendline", "ray", "extended-line", "horizontal-line", "vertical-line", "rectangle", "ellipse", "fibonacci", "measure", "text"];
const name = (tool: string) => tool.replace(/-/g, " ");
function validDrawing(value: unknown): value is Drawing {
  if (!value || typeof value !== "object") return false;
  const d = value as Drawing;
  return typeof d.id === "string" && tools.includes(d.tool) && /^#[0-9a-f]{6}$/i.test(d.colour) &&
    typeof d.text === "string" && d.text.length <= 160 && typeof d.hidden === "boolean" && typeof d.locked === "boolean" &&
    Array.isArray(d.points) && d.points.length === (["horizontal-line", "vertical-line", "text"].includes(d.tool) ? 1 : 2) &&
    d.points.every(p => Number.isFinite(p.time) && Number.isFinite(p.price));
}
function distance(x: number, y: number, a: {x:number;y:number}, b: {x:number;y:number}) {
  const dx=b.x-a.x, dy=b.y-a.y;
  const t=Math.max(0,Math.min(1,((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy || 1)));
  return Math.hypot(x-a.x-t*dx,y-a.y-t*dy);
}

export default function DrawingWorkspace(props: Props) {
  const lastCommand = useRef(props.command?.id);
  const [objects, setObjects] = useState<Drawing[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [text, setText] = useState("Note");
  const [colour, setColour] = useState("#2563eb");
  const api = useRef<{command:(c:Command)=>void;edit:(id:string,patch:Partial<Drawing>)=>void;remove:(id:string)=>void;select:(id:string)=>void;cancel:()=>void} | null>(null);
  const live = useRef({tool:props.tool,complete:props.onComplete,text,colour});
  live.current={tool:props.tool,complete:props.onComplete,text,colour};

  useEffect(() => {
    const {chart,series,element,candles,storageKey}=props;
    let drawings: Drawing[]=[];
    let selectedId: string | null=null;
    let pending: Point | null=null;
    let preview: Point | null=null;
    let requestUpdate: (()=>void) | undefined;
    const undo: Drawing[][]=[]; const redo: Drawing[][]=[];
    let drag: {id:string;handle:number;start:{x:number;y:number};before:Drawing[];original:Drawing;previousOptions:ReturnType<IChartApi["options"]>} | null=null;
    let suppressClick=false;
    let suppressTimer: ReturnType<typeof setTimeout> | undefined;
    const clone=()=>structuredClone(drawings);
    try {
      const saved=JSON.parse(localStorage.getItem(storageKey) || "null");
      if (saved?.version===1 && Array.isArray(saved.drawings)) drawings=saved.drawings.filter(validDrawing).slice(0,150);
    } catch { setNote("Saved drawings could not be read. New drawings are available for this session."); }
    function persist() {
      setObjects(clone()); setSelected(selectedId); requestUpdate?.();
      try {localStorage.setItem(storageKey,JSON.stringify({version:1,drawings}));}
      catch {setNote("Browser storage is unavailable or full. Drawings are not saved.");}
    }
    function checkpoint() {undo.push(clone());if(undo.length>50)undo.shift();redo.length=0;}
    function timeX(time:number) {
      if (time < Number(candles[0].time) || time > Number(candles[candles.length - 1].time)) return null;
      let nearest=candles[0];
      for(const c of candles) if(Math.abs(Number(c.time)-time)<Math.abs(Number(nearest.time)-time)) nearest=c;
      return chart.timeScale().timeToCoordinate(nearest.time);
    }
    function xy(point:Point) {
      const x=timeX(point.time), y=series.priceToCoordinate(point.price);
      return x===null || y===null ? null : {x:Number(x),y:Number(y)};
    }
    function pointAt(x:number,y:number):Point|null {
      const time=chart.timeScale().coordinateToTime(x), price=series.coordinateToPrice(y);
      if(typeof time!=="number" || price===null) return null;
      return {time,price};
    }
    function hit(d:Drawing,x:number,y:number):boolean {
      if(d.hidden) return false;
      const a=xy(d.points[0]), b=d.points[1] && xy(d.points[1]); if(!a)return false;
      if(d.tool==="horizontal-line") return Math.abs(y-a.y)<7;
      if(d.tool==="vertical-line") return Math.abs(x-a.x)<7;
      if(d.tool==="text")return x>=a.x-5 && x<=a.x+Math.max(40,d.text.length*7) && Math.abs(y-a.y)<18;
      if(!b)return false;
      if(["rectangle","ellipse","measure","fibonacci"].includes(d.tool))return x>=Math.min(a.x,b.x)-6 && x<=Math.max(a.x,b.x)+6 && y>=Math.min(a.y,b.y)-6 && y<=Math.max(a.y,b.y)+6;
      return distance(x,y,a,b)<8;
    }
    const renderer:IPrimitivePaneRenderer={draw(target){
      target.useMediaCoordinateSpace(({context:ctx,mediaSize})=>{
        const render=(d:Drawing,isPreview=false)=>{
          if(d.hidden)return;
          const a=xy(d.points[0]),b=d.points[1] && xy(d.points[1]);if(!a)return;
          ctx.save();ctx.strokeStyle=d.colour;ctx.fillStyle=d.colour;ctx.lineWidth=d.id===selectedId?2:1.4;ctx.font="12px system-ui";
          if(isPreview)ctx.setLineDash([4,3]);
          const line=(x1:number,y1:number,x2:number,y2:number)=>{ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();};
          if(d.tool==="horizontal-line") {line(0,a.y,mediaSize.width,a.y);ctx.fillText(d.points[0].price.toFixed(2),8,a.y-5);}
          else if(d.tool==="vertical-line")line(a.x,0,a.x,mediaSize.height);
          else if(d.tool==="text")ctx.fillText(d.text,a.x,a.y);
          else if(b) {
            const left=Math.min(a.x,b.x),top=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
            if(d.tool==="rectangle" || d.tool==="measure"){
              ctx.globalAlpha=.08;ctx.fillRect(left,top,w,h);ctx.globalAlpha=1;ctx.strokeRect(left,top,w,h);
              if(d.tool==="measure"){
                const delta=d.points[1].price-d.points[0].price;
                const percent=d.points[0].price===0?"n/a":`${(delta/d.points[0].price*100).toFixed(2)}%`;
                const days=Math.abs(d.points[1].time-d.points[0].time)/86400;
                ctx.fillText(`${delta.toFixed(2)} (${percent}) · ${days.toFixed(2)} days`,left+5,top+16);
              }
            } else if(d.tool==="ellipse") {ctx.beginPath();ctx.ellipse(left+w/2,top+h/2,Math.max(w/2,.1),Math.max(h/2,.1),0,0,Math.PI*2);ctx.globalAlpha=.08;ctx.fill();ctx.globalAlpha=1;ctx.stroke();}
            else if(d.tool==="fibonacci"){
              [0,.236,.382,.5,.618,.786,1].forEach(r=>{const y=a.y+(b.y-a.y)*r;line(left,y,left+w,y);ctx.fillText(`${(r*100).toFixed(1)}% · ${(d.points[0].price+(d.points[1].price-d.points[0].price)*r).toFixed(2)}`,left+4,y-4);});
            } else if(d.tool==="ray" || d.tool==="extended-line"){
              const dx=b.x-a.x,dy=b.y-a.y;
              if(Math.abs(dx)<.1)line(a.x,d.tool==="extended-line"?0:a.y,a.x,dy>=0?mediaSize.height:0);
              else {const right=dx>0?mediaSize.width:0;const leftX=d.tool==="extended-line"?(dx>0?0:mediaSize.width):a.x;line(leftX,a.y+(leftX-a.x)*dy/dx,right,a.y+(right-a.x)*dy/dx);}
            } else line(a.x,a.y,b.x,b.y);
          }
          if(d.id===selectedId && !d.locked)for(const p of d.points){const c=xy(p);if(c){ctx.beginPath();ctx.arc(c.x,c.y,4,0,Math.PI*2);ctx.fillStyle="#fff";ctx.fill();ctx.stroke();}}
          ctx.restore();
        };
        for(const d of drawings)render(d);
        if(pending && preview && live.current.tool)render({id:"preview",tool:live.current.tool,points:[pending,preview],colour:live.current.colour,text:live.current.text,hidden:false,locked:false},true);
      });
    }};
    const primitive={attached(p:{requestUpdate:()=>void}){requestUpdate=p.requestUpdate;},paneViews:()=>[{renderer:()=>renderer}]};
    series.attachPrimitive(primitive);
    function click(param:Parameters<IChartApi["subscribeClick"]>[0] extends (p:infer P)=>void ? P : never) {
      if(suppressClick || !param.point || param.paneIndex!==0)return;
      const tool=live.current.tool;
      if(!tool){const d=[...drawings].reverse().find(d=>hit(d,param.point!.x,param.point!.y));selectedId=d?.id??null;setSelected(selectedId);requestUpdate?.();return;}
      if(!tools.includes(tool))return;
      const point=pointAt(param.point.x,param.point.y);if(!point)return;
      if(!["horizontal-line","vertical-line","text"].includes(tool) && !pending){pending=point;preview=point;setNote("Choose the second point. Escape cancels.");requestUpdate?.();return;}
      if(drawings.length>=150){setNote("150 drawing limit reached. Delete an object to add another.");return;}
      checkpoint();
      const drawing:Drawing={id:crypto.randomUUID(),tool,points:pending?[pending,point]:[point],colour:live.current.colour,text:live.current.text.slice(0,160),hidden:false,locked:false};
      drawings.push(drawing);selectedId=drawing.id;pending=null;preview=null;setNote("");persist();live.current.complete();
    }
    chart.subscribeClick(click);
    const previewMove:Parameters<IChartApi["subscribeCrosshairMove"]>[0]=(p)=>{if(pending && p.point && p.paneIndex===0){preview=pointAt(p.point.x,p.point.y);requestUpdate?.();}};
    chart.subscribeCrosshairMove(previewMove);
    function local(event:PointerEvent){const rect=element.getBoundingClientRect();return{x:event.clientX-rect.left,y:event.clientY-rect.top};}
    function down(event:PointerEvent){
      if(live.current.tool || event.button!==0)return;
      const p=local(event);
      const d=[...drawings].reverse().find(d=>hit(d,p.x,p.y));
      if(!d)return;
      selectedId=d.id;setSelected(d.id);requestUpdate?.();
      if(d.locked)return;
      const handle=d.points.findIndex(v=>{const c=xy(v);return c && Math.hypot(c.x-p.x,c.y-p.y)<10;});
      drag={id:d.id,handle,start:p,before:clone(),original:structuredClone(d),previousOptions:chart.options()};
      chart.applyOptions({handleScroll:false,handleScale:false});
      element.setPointerCapture(event.pointerId);event.preventDefault();event.stopPropagation();
    }
    function move(event:PointerEvent){
      if(!drag)return;
      const p=local(event), d=drawings.find(d=>d.id===drag!.id);if(!d)return;
      if(drag.handle>=0){const next=pointAt(p.x,p.y);if(next)d.points[drag.handle]=next;}
      else {
        const updated=drag.original.points.map(v=>{const original=xy(v);return original?pointAt(original.x+p.x-drag!.start.x,original.y+p.y-drag!.start.y):null;});
        if(updated.every((v):v is Point=>v!==null))d.points=updated;
      }
      requestUpdate?.();event.preventDefault();event.stopPropagation();
    }
    function up(event:PointerEvent){
      if(!drag)return;
      const previous=drag;drag=null;
      chart.applyOptions({handleScroll:previous.previousOptions.handleScroll,handleScale:previous.previousOptions.handleScale});
      if(JSON.stringify(previous.before)!==JSON.stringify(drawings)){undo.push(previous.before);if(undo.length>50)undo.shift();redo.length=0;persist();}
      suppressClick=true;clearTimeout(suppressTimer);suppressTimer=setTimeout(()=>{suppressClick=false;},0);
      if(element.hasPointerCapture(event.pointerId))element.releasePointerCapture(event.pointerId);
      event.stopPropagation();
    }
    function key(event:KeyboardEvent){
      if((event.target as HTMLElement)?.closest("input,textarea,select,[contenteditable=true]"))return;
      if(event.key==="Escape"){pending=null;preview=null;setNote("");requestUpdate?.();}
      if(event.key==="Delete" && selectedId){const d=drawings.find(d=>d.id===selectedId);if(d&&!d.locked){checkpoint();drawings=drawings.filter(d=>d.id!==selectedId);selectedId=null;persist();}}
    }
    element.addEventListener("pointerdown",down,true);element.addEventListener("pointermove",move,true);
    element.addEventListener("pointerup",up,true);element.addEventListener("pointercancel",up,true);
    window.addEventListener("keydown",key);
    api.current={
      command(c){pending=null;preview=null;if(c==="undo"&&undo.length){redo.push(clone());drawings=undo.pop()!;}else if(c==="redo"&&redo.length){undo.push(clone());drawings=redo.pop()!;}else if(c==="clear"&&drawings.length){checkpoint();drawings=[];}selectedId=null;persist();},
      edit(id,patch){const d=drawings.find(d=>d.id===id);if(!d)return;checkpoint();Object.assign(d,patch);persist();},
      remove(id){const d=drawings.find(d=>d.id===id);if(!d||d.locked)return;checkpoint();drawings=drawings.filter(d=>d.id!==id);selectedId=null;persist();},
      select(id){selectedId=id;setSelected(id);requestUpdate?.();},
      cancel(){pending=null;preview=null;setNote("");requestUpdate?.();},
    };
    setObjects(clone());setSelected(null);requestUpdate?.();
    return()=>{
      clearTimeout(suppressTimer);
      if(props.isChartAlive()) {
        if(drag)chart.applyOptions({handleScroll:drag.previousOptions.handleScroll,handleScale:drag.previousOptions.handleScale});
        chart.unsubscribeClick(click);chart.unsubscribeCrosshairMove(previewMove);series.detachPrimitive(primitive);
      }
      api.current=null;
      element.removeEventListener("pointerdown",down,true);element.removeEventListener("pointermove",move,true);
      element.removeEventListener("pointerup",up,true);element.removeEventListener("pointercancel",up,true);window.removeEventListener("keydown",key);
    };
  }, [props.chart,props.series,props.element,props.candles,props.storageKey]);
  useEffect(()=>{api.current?.cancel();},[props.tool]);
  useEffect(()=>{if(props.command?.id === lastCommand.current)return;lastCommand.current=props.command?.id;const action=props.command?.action;if(action==="undoDrawing")api.current?.command("undo");else if(action==="redoDrawing")api.current?.command("redo");else if(action==="clearDrawings")api.current?.command("clear");},[props.command]);
  const object=objects.find(d=>d.id===selected);
  return <div className="border-t border-slate-200 bg-white px-2 py-2 text-xs text-slate-700">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} className="rounded border border-slate-200 px-3 py-2">Objects ({objects.length})</button>
      <label className="flex items-center gap-2">Drawing colour <input aria-label="New drawing colour" type="color" value={colour} onChange={e=>setColour(e.target.value)} /></label>
      {props.tool==="text" && <label>Note <input value={text} maxLength={160} onChange={e=>setText(e.target.value)} className="ml-2 rounded border border-slate-300 px-2 py-1" /></label>}
      <span>Auto-saved in this browser · {props.tool ? `${name(props.tool)}: click ${["text","horizontal-line","vertical-line"].includes(props.tool)?"once":"two points"}` : "Pointer: select, drag an endpoint or drag the drawing"}</span>
    </div>
    {note && <p role="status" className="mt-2 text-amber-800">{note}</p>}
    {object && <div className="mt-2 flex flex-wrap items-center gap-3 rounded bg-blue-50 p-2">
      <strong className="capitalize">Selected: {name(object.tool)}</strong>
      <input aria-label="Selected drawing colour" type="color" value={object.colour} disabled={object.locked} onChange={e=>api.current?.edit(object.id,{colour:e.target.value})} />
      {object.tool==="text"&&<input aria-label="Edit annotation" maxLength={160} value={object.text} disabled={object.locked} onChange={e=>api.current?.edit(object.id,{text:e.target.value})} className="rounded border px-2 py-1"/>}
      <button type="button" onClick={()=>api.current?.edit(object.id,{locked:!object.locked})}>{object.locked?"Unlock":"Lock"}</button>
      <button type="button" onClick={()=>api.current?.edit(object.id,{hidden:!object.hidden})}>{object.hidden?"Show":"Hide"}</button>
      <button type="button" disabled={object.locked} onClick={()=>api.current?.remove(object.id)} className="text-red-700 disabled:opacity-40">Delete</button>
    </div>}
    {open&&<ul className="mt-2 max-h-40 overflow-auto">{objects.map(d=><li key={d.id} className="flex items-center justify-between border-b border-slate-100 py-2"><button type="button" onClick={()=>api.current?.select(d.id)} className="capitalize">{name(d.tool)} {d.tool==="text"?`· ${d.text}`:""} {d.hidden?"· hidden":""} {d.locked?"· locked":""}</button><button type="button" onClick={()=>api.current?.edit(d.id,{hidden:!d.hidden})}>{d.hidden?"Show":"Hide"}</button></li>)}</ul>}
  </div>;
}
