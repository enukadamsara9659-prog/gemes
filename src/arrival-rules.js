export const ARRIVAL_DURATION=15;
export const CRASH_TIME=5;
export function arrivalPhase(t){return t<5?'INCOMING':t<7?'CRASH':t<9?'HATCH OPENING':t<15?'DISEMBARK':'READY';}
export function shipPose(t){const p=Math.max(0,Math.min(1,t/5)),ease=p*p;return {x:p===1?0:-80*(1-p),y:2.4+48*(1-ease),z:80*(1-p),roll:Math.sin(p*Math.PI)*.38};}
export function exitProgress(t,index){return Math.max(0,Math.min(1,(t-9-index*.15)/3.2));}
