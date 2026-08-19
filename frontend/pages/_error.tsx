/** Pages Router fallback for full-screen space render/server errors. */
import type { NextPageContext } from "next";
import Link from "next/link";
export default function SpaceError({statusCode}:{statusCode?:number}){return <main className="min-h-screen grid place-items-center bg-[#07070b] text-white p-6"><section className="max-w-lg text-center"><p className="text-xs tracking-[.2em] text-red-300">SPACE RECOVERY · {statusCode??"CLIENT"}</p><h1 className="text-2xl font-bold mt-3">This Kaizen space could not load.</h1><p className="text-sm text-gray-400 mt-2">Return Home, then retry. Your browser-owned records are not intentionally removed by this error screen.</p><div className="flex justify-center gap-2 mt-5"><button onClick={()=>location.reload()} className="btn-primary">Retry</button><Link href="/" className="btn-ghost">Home</Link></div></section></main>}
SpaceError.getInitialProps=({res,err}:NextPageContext)=>({statusCode:res?.statusCode??err?.statusCode});
