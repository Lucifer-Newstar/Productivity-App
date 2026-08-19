/** Local-calendar date keys that avoid UTC day shifts in persisted UI dates. */
const DATE_KEY=/^(\d{4})-(\d{2})-(\d{2})$/;

export function localDateKey(date=new Date()):string{
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

export function dateFromLocalKey(value:string):Date|null{
  const match=value.match(DATE_KEY);if(!match)return null;
  const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]),date=new Date(year,month-1,day);
  return date.getFullYear()===year&&date.getMonth()===month-1&&date.getDate()===day?date:null;
}

export function addLocalDays(date:Date,days:number):Date{
  return new Date(date.getFullYear(),date.getMonth(),date.getDate()+days);
}
