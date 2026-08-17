export type BridgeDomain = "core" | "forge" | "career" | "workout" | "health" | "entertainment" | "notifications";
export interface RevisionVector { installationEpoch: string; domains: Partial<Record<BridgeDomain, number>> }
interface RevisionState { schemaVersion: 1; installationEpoch: string; domains: Record<BridgeDomain, number>; fingerprints: Partial<Record<BridgeDomain, string>> }
interface WriterLease { owner: string; expiresAt: number }
export interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem(key: string): void }

const META_KEY="kaizen.ai.bridge-revisions", WRITER_KEY="kaizen.ai.bridge-writer", OWNER_KEY="kaizen.ai.bridge-owner";
const DOMAINS:BridgeDomain[]=["core","forge","career","workout","health","entertainment","notifications"];

function fresh():RevisionState{return{schemaVersion:1,installationEpoch:crypto.randomUUID(),domains:Object.fromEntries(DOMAINS.map(d=>[d,0])) as Record<BridgeDomain,number>,fingerprints:{}}}
function parseState(raw:string|null):RevisionState{if(!raw)return fresh();try{const x=JSON.parse(raw);if(x.schemaVersion!==1||typeof x.installationEpoch!=="string"||DOMAINS.some(d=>!Number.isSafeInteger(x.domains?.[d])||x.domains[d]<0))return fresh();return x}catch{return fresh()}}
function stable(value:unknown):string{if(value===null||typeof value!=="object")return JSON.stringify(value);if(Array.isArray(value))return`[${value.map(stable).join(",")}]`;return`{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${stable(v)}`).join(",")}}`}
function fingerprint(value:unknown):string{const text=stable(value);let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}return(h>>>0).toString(16).padStart(8,"0")}

export class BridgeRevisionTracker{
  private readonly owner:string;
  constructor(private readonly local:StorageLike,private readonly session:StorageLike,private readonly clock=()=>Date.now()){
    this.owner=session.getItem(OWNER_KEY)||crypto.randomUUID();session.setItem(OWNER_KEY,this.owner)
  }
  private acquire():void{const now=this.clock();let lease:WriterLease|null=null;try{lease=JSON.parse(this.local.getItem(WRITER_KEY)||"null")}catch{}if(lease&&lease.owner!==this.owner&&lease.expiresAt>now)throw new Error("AI_BRIDGE_WRITER_CONFLICT");this.local.setItem(WRITER_KEY,JSON.stringify({owner:this.owner,expiresAt:now+30_000}))}
  observe(values:Partial<Record<BridgeDomain,unknown>>):RevisionVector{this.acquire();const state=parseState(this.local.getItem(META_KEY));for(const [domain,value] of Object.entries(values) as [BridgeDomain,unknown][]){const next=fingerprint(value);if(state.fingerprints[domain]!==next){state.domains[domain]++;state.fingerprints[domain]=next}}this.local.setItem(META_KEY,JSON.stringify(state));return{installationEpoch:state.installationEpoch,domains:Object.fromEntries(Object.keys(values).map(d=>[d,state.domains[d as BridgeDomain]]))}}
  isStale(vector:RevisionVector):boolean{const current=parseState(this.local.getItem(META_KEY));return current.installationEpoch!==vector.installationEpoch||Object.entries(vector.domains).some(([d,n])=>current.domains[d as BridgeDomain]!==n)}
  release():void{try{const lease=JSON.parse(this.local.getItem(WRITER_KEY)||"null") as WriterLease|null;if(lease?.owner===this.owner)this.local.removeItem(WRITER_KEY)}catch{}}
}
