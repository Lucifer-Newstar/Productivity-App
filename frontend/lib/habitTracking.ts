/** Pure habit-history normalization and consecutive-streak calculations. */
import { addLocalDays, dateFromLocalKey, localDateKey } from "./localDate";

export function normalizedHabitHistory(history:unknown):string[]{
  if(!Array.isArray(history))return[];
  return Array.from(new Set(history.filter((value):value is string=>typeof value==="string"&&!!dateFromLocalKey(value)))).sort();
}

export function habitStreak(history:unknown,now=new Date()):number{
  const completed=new Set(normalizedHabitHistory(history)),today=localDateKey(now);
  let cursor=completed.has(today)?new Date(now):addLocalDays(now,-1),streak=0;
  while(completed.has(localDateKey(cursor))){streak++;cursor=addLocalDays(cursor,-1)}
  return streak;
}
