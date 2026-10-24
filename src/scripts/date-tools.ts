const DAY=86400000;
export function parseCalendarDate(value:string){
 const match=value.match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!match)throw Error('Calendar date');const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);if(year<1||year>9999||month<1||month>12||day<1||day>31)throw Error('Calendar date');const date=new Date(0);date.setUTCFullYear(year,month-1,day);date.setUTCHours(0,0,0,0);if(date.getUTCFullYear()!==year||date.getUTCMonth()!==month-1||date.getUTCDate()!==day)throw Error('Calendar date');return{year,month,day,milliseconds:date.getTime()};
}
function calendarString(year:number,month:number,day:number){return String(year).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0');}
function anniversary(year:number,month:number,day:number){const leap=year%4===0&&(year%100!==0||year%400===0);return parseCalendarDate(calendarString(year,month,month===2&&day===29&&!leap?28:day));}
export function calculateAge(birth:string,reference:string){
 const b=parseCalendarDate(birth),r=parseCalendarDate(reference);if(r.milliseconds<b.milliseconds)throw Error('Birth after reference');let years=r.year-b.year;let last=anniversary(b.year+years,b.month,b.day);if(last.milliseconds>r.milliseconds){years--;last=anniversary(b.year+years,b.month,b.day);}return{years,days:(r.milliseconds-last.milliseconds)/DAY,totalDays:(r.milliseconds-b.milliseconds)/DAY};
}
export function daysBetween(start:string,end:string,inclusive=false){const a=parseCalendarDate(start),b=parseCalendarDate(end);if(b.milliseconds<a.milliseconds)throw Error('Date order');const days=(b.milliseconds-a.milliseconds)/DAY+(inclusive?1:0);return{days,weeks:Math.floor(days/7),remainingDays:days%7};}
export function parseLocalTarget(value:string){
 const match=value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);if(!match)throw Error('Local target');const d=parseCalendarDate(match[1]),hour=Number(match[2]),minute=Number(match[3]),second=Number(match[4]??0);if(hour>23||minute>59||second>59)throw Error('Local target');const date=new Date(0);date.setFullYear(d.year,d.month-1,d.day);date.setHours(hour,minute,second,0);if(date.getFullYear()!==d.year||date.getMonth()!==d.month-1||date.getDate()!==d.day||date.getHours()!==hour||date.getMinutes()!==minute||date.getSeconds()!==second)throw Error('Nonexistent local time');return date.getTime();
}
export function countdownParts(target:number,now:number){if(!Number.isFinite(target)||!Number.isFinite(now)||Math.abs(target)>8640000000000000||Math.abs(now)>8640000000000000)throw Error('Countdown');const total=Math.max(0,Math.ceil((target-now)/1000));return{days:Math.floor(total/86400),hours:Math.floor(total%86400/3600),minutes:Math.floor(total%3600/60),seconds:total%60,done:target<=now};}
export function setupDateTools(t:(key:string)=>string){
 const get=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T;
 for(const id of ['age','date-diff','countdown'] as const){
  const output=get<HTMLTextAreaElement>(id+'-date-output');if(!output)continue;const feedback=get<HTMLElement>(id+'-date-feedback'),copy=get<HTMLButtonElement>(id+'-date-copy');let interval:number|undefined,target=0;
  const stop=()=>{if(interval!==undefined)window.clearInterval(interval);interval=undefined;if(id==='countdown')get<HTMLButtonElement>('countdown-stop').disabled=true;};
  function clear(){stop();output.value='';copy.disabled=true;feedback.textContent='';feedback.classList.remove('error');if(id==='countdown')for(const part of ['days','hours','minutes','seconds'])get<HTMLElement>('countdown-'+part).textContent='—';}
  function setOutput(parts:[string,number][]){output.value=parts.map(([key,value])=>t(key)+': '+value).join('\n');copy.disabled=false;}
  function error(){clear();feedback.textContent=t('dateInvalid');feedback.classList.add('error');}
  get<HTMLElement>(id+'-date-options').addEventListener('input',clear);
  if(id==='age'){const now=new Date();get<HTMLInputElement>('age-reference').value=calendarString(now.getFullYear(),now.getMonth()+1,now.getDate());}
  function updateCountdown(){const parts=countdownParts(target,Date.now());for(const key of ['days','hours','minutes','seconds'] as const)get<HTMLElement>('countdown-'+key).textContent=String(parts[key]);setOutput([['dateDays',parts.days],['dateHours',parts.hours],['dateMinutes',parts.minutes],['dateSeconds',parts.seconds]]);if(parts.done){stop();feedback.textContent=t('countdownDone');}return parts.done;}
  get<HTMLButtonElement>(id+'-date-apply').addEventListener('click',()=>{clear();try{
   if(id==='age'){const age=calculateAge(get<HTMLInputElement>('age-birth').value,get<HTMLInputElement>('age-reference').value);setOutput([['dateYears',age.years],['dateBirthdayDays',age.days],['dateTotalDays',age.totalDays]]);feedback.textContent=t('ready');}
   else if(id==='date-diff'){const diff=daysBetween(get<HTMLInputElement>('date-diff-start').value,get<HTMLInputElement>('date-diff-end').value,get<HTMLInputElement>('date-diff-inclusive').checked);setOutput([['dateTotalDays',diff.days],['dateWeeks',diff.weeks],['dateRemainingDays',diff.remainingDays]]);feedback.textContent=t('ready');}
   else{target=parseLocalTarget(get<HTMLInputElement>('countdown-target').value);if(!updateCountdown()){feedback.textContent=t('countdownRunning');interval=window.setInterval(updateCountdown,1000);get<HTMLButtonElement>('countdown-stop').disabled=false;}}
  }catch{error();}});
  if(id==='countdown'){
   get<HTMLButtonElement>('countdown-stop').addEventListener('click',()=>{stop();feedback.textContent=t('countdownStopped');});
   document.addEventListener('visibilitychange',()=>{if(interval!==undefined)updateCountdown();});window.addEventListener('pagehide',()=>{if(interval!==undefined){stop();feedback.textContent=t('countdownStopped');}});
  }
  get<HTMLButtonElement>(id+'-date-clear').addEventListener('click',()=>{clear();for(const input of get<HTMLElement>(id+'-date-options').querySelectorAll<HTMLInputElement>('input')){if(input.type==='checkbox')input.checked=false;else input.value='';}});
  copy.addEventListener('click',async()=>{const value=output.value;if(!value)return;try{await navigator.clipboard.writeText(value);if(id!=='countdown'||interval===undefined)feedback.textContent=t('copied');}catch{output.focus();output.select();feedback.textContent=t('dateCopyFailed');}});
 }
}
