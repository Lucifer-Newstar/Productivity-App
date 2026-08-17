import type { EntertainmentEvent, EntertainmentItem, MediaType } from "./entertainmentTypes";
export interface CountValue { label:string;value:number }
export interface MonthlyValue { month:string;count:number;hours:number;avgRating:number }
const avg=(values:number[])=>values.length?values.reduce((a,b)=>a+b,0)/values.length:0;
const isoMonth=(value:string|number|undefined)=>{if(!value)return undefined;const d=typeof value==="number"?new Date(value):new Date(value);return Number.isNaN(d.getTime())?undefined:d.toISOString().slice(0,7)};
const isoDate=(value:string|number|undefined)=>{if(!value)return undefined;const d=typeof value==="number"?new Date(value):new Date(value);return Number.isNaN(d.getTime())?undefined:d.toISOString().slice(0,10)};
export function buildEntertainmentReport(items:EntertainmentItem[],events:EntertainmentEvent[],year=new Date().getFullYear()){
 const completed=items.filter(i=>i.status==="completed"),dropped=items.filter(i=>i.status==="dropped"),terminal=completed.length+dropped.length,ratings=items.map(i=>i.rating).filter((n):n is number=>!!n),totalMinutes=items.reduce((n,i)=>n+(i.minutesConsumed??0),0),totalCost=items.reduce((n,i)=>n+(i.purchasePrice??0),0);
 const byType=(['book','comic','manga','movie','series','anime'] as MediaType[]).map(type=>({label:type,value:completed.filter(i=>i.type===type).length}));
 const histogram=Array.from({length:10},(_,i)=>({label:String(i+1),value:items.filter(x=>Math.round(x.rating??0)===i+1).length}));
 const genreCounts=count(completed.flatMap(i=>i.genres)),moodCounts=count(completed.flatMap(i=>i.tags));
 const genreRatings=groupAverage(completed.flatMap(i=>i.genres.map(g=>({key:g,value:i.rating}))).filter(x=>x.value!=null) as {key:string;value:number}[]);
 const creatorRatings=groupAverage(completed.flatMap(i=>i.creators.map(c=>({key:c,value:i.rating}))).filter(x=>x.value!=null) as {key:string;value:number}[]);
 const decadeRatings=groupAverage(completed.filter(i=>i.releaseYear&&i.rating).map(i=>({key:`${Math.floor(i.releaseYear!/10)*10}s`,value:i.rating!})));
 const monthlyMap=new Map<string,EntertainmentItem[]>();for(const i of completed){const month=isoMonth(i.completedAt??i.updatedAt);if(month)monthlyMap.set(month,[...(monthlyMap.get(month)??[]),i])}
 const monthly:MonthlyValue[]=Array.from(monthlyMap.entries()).sort(([a],[b])=>a.localeCompare(b)).map(([month,list])=>({month,count:list.length,hours:list.reduce((n,i)=>n+(i.minutesConsumed??0),0)/60,avgRating:avg(list.map(i=>i.rating).filter((n):n is number=>!!n))}));
 const backlog=items.filter(i=>i.status==="planned"&&!i.archived).map(i=>({...i,ageDays:Math.max(0,Math.floor((Date.now()-i.createdAt)/86_400_000))})).sort((a,b)=>b.ageDays-a.ageDays);
 const abandoned=count(dropped.map(i=>i.droppedReason?.trim()||"No reason logged"));
 const heat=new Map<string,number>();for(const e of events){const d=isoDate(e.at);if(d)heat.set(d,(heat.get(d)??0)+1)}for(const i of items){for(const l of i.bookDetails?.readingLogs??[])heat.set(l.date,(heat.get(l.date)??0)+1);for(const l of i.seriesDetails?.episodeLogs??[])heat.set(l.date,(heat.get(l.date)??0)+1)}
 const yearItems=completed.filter(i=>Number((i.completedAt??"").slice(0,4))===year),yearMinutes=yearItems.reduce((n,i)=>n+(i.minutesConsumed??0),0),yearGenres=count(yearItems.flatMap(i=>i.genres)),topRated=[...yearItems].filter(i=>i.rating).sort((a,b)=>b.rating!-a.rating!).slice(0,5);
 const timeline=[...completed].sort((a,b)=>String(b.completedAt??"").localeCompare(String(a.completedAt??"")));
 return {completed,dropped,timeline,byType,totalCount:completed.length,totalMinutes,ratings,histogram,genreCounts,moodCounts,genreRatings,creatorRatings,decadeRatings,monthly,completionRate:terminal?completed.length/terminal*100:0,backlog,abandoned,heat,totalCost,costPerHour:totalMinutes?totalCost/(totalMinutes/60):0,satisfaction:monthly.map(m=>({month:m.month,value:m.avgRating})),yearReview:{year,count:yearItems.length,minutes:yearMinutes,topGenres:yearGenres.slice(0,5),topRated},averageRating:avg(ratings)}
}
function count(values:string[]):CountValue[]{const m=new Map<string,number>();for(const raw of values){const x=raw.trim();if(x)m.set(x,(m.get(x)??0)+1)}return Array.from(m,([label,value])=>({label,value})).sort((a,b)=>b.value-a.value||a.label.localeCompare(b.label))}
function groupAverage(values:{key:string;value:number}[]){const m=new Map<string,number[]>();for(const x of values)m.set(x.key,[...(m.get(x.key)??[]),x.value]);return Array.from(m,([label,v])=>({label,value:avg(v),count:v.length})).sort((a,b)=>b.value-a.value||b.count-a.count)}
