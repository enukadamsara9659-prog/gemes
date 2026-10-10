export const HELMETS=[
 {id:'helmet',name:'TACTICAL',description:'Curved shell · visor · chin straps'},
 {id:'hood',name:'RECON',description:'Enclosed shell · padded ear covers'},
 {id:'cap',name:'SCOUT CAP',description:'Lightweight cap · curved brim'}
];
export const WEAPONS=[
 {id:'rifle',name:'AR–01',type:'ASSAULT RIFLE',magazine:30,damage:34,interval:.14,reload:1.6,recoil:1,barrel:.48,muzzle:-.69},
 {id:'smg',name:'VX–9',type:'COMPACT SMG',magazine:40,damage:22,interval:.085,reload:1.3,recoil:.65,barrel:.28,muzzle:-.49},
 {id:'marksman',name:'MR–7',type:'MARKSMAN RIFLE',magazine:12,damage:70,interval:.48,reload:2,recoil:1.4,barrel:.72,muzzle:-.93}
];
export function getWeapon(id){return WEAPONS.find(w=>w.id===id)||WEAPONS[0];}
export function normalizeLoadout(value={}){return {operator:['ranger','ghost','nomad','viper'].includes(value.operator)?value.operator:'ranger',helmet:HELMETS.some(h=>h.id===value.helmet)?value.helmet:'helmet',weapon:getWeapon(value.weapon).id};}
export function loadSavedLoadout(storage){try{return normalizeLoadout(JSON.parse(storage.getItem('dropzone-loadout')||'{}'));}catch{return normalizeLoadout();}}
export function saveLoadout(storage,value){try{storage.setItem('dropzone-loadout',JSON.stringify(normalizeLoadout(value)));}catch{}}
