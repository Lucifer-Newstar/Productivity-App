import type { HomeIntelligence } from "../homeIntelligence";
import type { KaizenNotification } from "../notificationTypes";
import type { Task } from "../types";
import { BridgeRevisionTracker, type RevisionVector } from "./revisions";

export interface TodaySnapshot {
  contract:"core.today";contractVersion:"1.0";domain:"core";snapshotId:string;revision:RevisionVector;capturedAt:string;timezone:string;sensitivity:"personal";trust:"kaizen-derived";
  data:{localDate:string;tasks:Array<{id:string;title:string;space:string;priority:"low"|"medium"|"high";dueDate?:string;completed:boolean}>;scheduled:Array<{id:string;source:string;title:string;startsAt?:string;estimateMinutes?:number}>;deterministicNextAction?:{sourceId:string;title:string;reason:string;estimateMinutes?:number;algorithmVersion:string};attention:Array<{notificationId:string;section:string;priority:"high"|"critical";title:string}>};
  analytics:Array<{id:string;label:string;value:unknown;algorithm:string;algorithmVersion:string;computedAt:string}>;redactions:Array<{field:string;reason:string}>;
}

const day=(d:Date)=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function idFor(prefix:string,value:string):string{let h=2166136261;for(let i=0;i<value.length;i++){h^=value.charCodeAt(i);h=Math.imul(h,16777619)}return`${prefix}-${(h>>>0).toString(16)}`}

export function buildTodaySnapshot(input:{tasks:Task[];forgeTasks:Array<{id:string;title:string}>;notifications:KaizenNotification[];intelligence:HomeIntelligence;now?:Date;tracker:BridgeRevisionTracker}):TodaySnapshot{
  const now=input.now??new Date(),localDate=day(now),active=input.tasks.filter(t=>!t.completed).slice(0,100),today=input.intelligence.today.filter(x=>!x.done).slice(0,50);
  const scheduled=today.map(x=>({id:idFor("scheduled",`${x.space}|${x.title}|${x.time??""}|${x.href}`),source:x.space.toLowerCase(),title:x.title,startsAt:x.time}));
  const attention=input.intelligence.attention.filter((x:any)=>x.priority==="high"||x.priority==="critical").slice(0,50).map((x:any)=>({notificationId:String(x.id??x.sourceKey??idFor("notice",`${x.section}|${x.title}`)),section:String(x.section??"global"),priority:x.priority as "high"|"critical",title:String(x.title)}));
  let deterministicNextAction:TodaySnapshot["data"]["deterministicNextAction"];
  if(input.intelligence.next){const next=input.intelligence.next,match=[...active,...input.forgeTasks].find(x=>x.title===next.title);deterministicNextAction={sourceId:match?.id??idFor("next",`${next.space}|${next.title}|${next.href}`),title:next.title,reason:next.reason,estimateMinutes:next.minutes,algorithmVersion:"home-intelligence-1"}}
  const values={core:input.tasks.map(({id,title,completed,priority,dueDate,space})=>({id,title,completed,priority,dueDate,space})),forge:input.forgeTasks,notifications:input.notifications.map(({id,sourceKey,priority,section,title,readAt,dismissedAt})=>({id,sourceKey,priority,section,title,readAt,dismissedAt}))};
  const revision=input.tracker.observe(values),capturedAt=now.toISOString(),snapshotId=`${revision.installationEpoch}:${Object.entries(revision.domains).map(([d,n])=>`${d}.${n}`).join("+")}`;
  return{contract:"core.today",contractVersion:"1.0",domain:"core",snapshotId,revision,capturedAt,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",sensitivity:"personal",trust:"kaizen-derived",data:{localDate,tasks:active.map(({id,title,space,priority,dueDate,completed})=>({id,title,space,priority,dueDate,completed})),scheduled,deterministicNextAction,attention},analytics:[{id:"deterministic-next-action",label:"Deterministic next action",value:deterministicNextAction?.title??null,algorithm:"home intelligence ranking",algorithmVersion:"1",computedAt:capturedAt}],redactions:[{field:"notes.content",reason:"not-required"},{field:"health",reason:"consent"}]}
}
