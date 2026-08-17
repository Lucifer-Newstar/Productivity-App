"use client";
import { Bell } from "lucide-react";
import { usePathname } from "next/navigation";
import { useStore } from "../lib/store";
import { notificationSectionForPath,notificationStillRelevant,notificationVisibleInContext } from "../lib/notificationTypes";
export default function NotificationButton({className="",style,size=16}:{className?:string;style?:React.CSSProperties;size?:number}){const{notifications}=useStore(),section=notificationSectionForPath(usePathname()||"/"),unread=notifications.items.filter(n=>notificationStillRelevant(n,notifications.setup)&&notificationVisibleInContext(n.section,section)&&!n.readAt&&!n.dismissedAt).length;return <button type="button" aria-label={`Notifications${unread?` (${unread} unread)`:""}`} onClick={()=>window.dispatchEvent(new CustomEvent("kaizen:notifications-toggle"))} className={`kaizen-notification-trigger ${className}`} style={style}><Bell size={size}/>{unread>0&&<span>{unread>99?"99+":unread}</span>}</button>}
