"use client";
import { useEffect, useRef, useState } from "react";
import { MousePointer2, TrendingUp, Shapes, ListFilter, Ruler, Type, ChevronRight } from "lucide-react";
const groups = [
  {label:"Lines",icon:TrendingUp,items:[{tool:"trendline",label:"Trend line"},{tool:"ray",label:"Ray"},{tool:"extended-line",label:"Extended line"},{tool:"horizontal-line",label:"Horizontal level"},{tool:"vertical-line",label:"Vertical line"}]},
  {label:"Shapes",icon:Shapes,items:[{tool:"rectangle",label:"Rectangle / zone"},{tool:"ellipse",label:"Ellipse"}]},
  {label:"Fibonacci",icon:ListFilter,items:[{tool:"fibonacci",label:"Fibonacci retracement"}]},
  {label:"Measure",icon:Ruler,items:[{tool:"measure",label:"Price and date range"}]},
  {label:"Text",icon:Type,items:[{tool:"text",label:"Text annotation"}]},
];
export default function DrawingTools({activeTool,onSelect}:{activeTool:string|null;onSelect:(tool:string|null)=>void}) {
  const [menu,setMenu]=useState<string|null>(null);
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const close=(e:PointerEvent)=>{if(!ref.current?.contains(e.target as Node))setMenu(null);};
    const escape=(e:KeyboardEvent)=>{if(e.key==="Escape")setMenu(null);};
    document.addEventListener("pointerdown",close);document.addEventListener("keydown",escape);
    return()=>{document.removeEventListener("pointerdown",close);document.removeEventListener("keydown",escape);};
  },[]);
  return <div ref={ref} className="relative flex shrink-0 flex-row border-b border-slate-200 bg-white p-1 md:w-12 md:flex-col md:border-b-0 md:border-r">
    <button type="button" title="Pointer · select and move objects" aria-label="Pointer · select and move objects" aria-pressed={!activeTool} onClick={()=>{onSelect(null);setMenu(null);}} className={`flex h-10 w-10 items-center justify-center rounded ${!activeTool?"bg-orange-100 text-orange-900":"text-slate-700 hover:bg-slate-100"}`}><MousePointer2 size={18}/></button>
    {groups.map(({label,icon:Icon,items})=><div key={label} className="relative">
      <button type="button" title={label} aria-label={label} aria-expanded={menu===label} onClick={()=>setMenu(menu===label?null:label)} className={`relative flex h-10 w-10 items-center justify-center rounded ${items.some(i=>i.tool===activeTool)?"bg-orange-100 text-orange-900":"text-slate-700 hover:bg-slate-100"}`}><Icon size={18}/><ChevronRight size={8} className="absolute bottom-1 right-0"/></button>
      {menu===label&&<div className="absolute left-0 top-full z-30 w-60 rounded-md border border-slate-200 bg-white p-2 shadow-lg md:left-full md:top-0">
        <p className="px-2 py-2 text-xs text-slate-500">{label}</p>
        {items.map(item=><button key={item.tool} type="button" onClick={()=>{onSelect(item.tool);setMenu(null);}} className={`flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm ${activeTool===item.tool?"bg-slate-100 text-slate-900":"text-slate-700 hover:bg-slate-50"}`}><Icon size={16}/>{item.label}</button>)}
      </div>}
    </div>)}
  </div>;
}
