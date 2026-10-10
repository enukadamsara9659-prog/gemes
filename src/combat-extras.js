export const SCAN_COOLDOWN=20,SCAN_DURATION=5,SCAN_RANGE=45,HEAL_COOLDOWN=25;
export function absorbDamage(health,armor,damage){const absorbed=Math.min(Math.max(0,armor),Math.max(0,damage));return {health:Math.max(0,health-Math.max(0,damage-absorbed)),armor:Math.max(0,armor-absorbed)};}
export function shotDamage(base,hitHeight){return Math.round(base*(hitHeight>=1.65?1.6:1));}
export function accuracy(hits,shots){return shots?Math.round(hits/shots*100):0;}
export function readRecords(storage){try{const r=JSON.parse(storage.getItem('dropzone-records')||'{}');return {matches:Math.max(0,Number(r.matches)||0),wins:Math.max(0,Number(r.wins)||0),bestKills:Math.max(0,Number(r.bestKills)||0)};}catch{return {matches:0,wins:0,bestKills:0};}}
export function recordMatch(storage,win,kills){const r=readRecords(storage);r.matches++;if(win)r.wins++;r.bestKills=Math.max(r.bestKills,kills);try{storage.setItem('dropzone-records',JSON.stringify(r));}catch{}return r;}
