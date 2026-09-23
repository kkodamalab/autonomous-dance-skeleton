const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
// A compact phrase vocabulary: each style maps beat-phase to joint offsets. Add phrases here without renderer changes.
export const PHRASES={
 'HOUSE':['jack-step','cross-footwork','side-bounce'], 'HIP-HOP':['groove-rock','shoulder-accent','weight-shift'], JAZZ:['reach-kick','wide-arms','pose-accent'], BREAKING:['toprock','freeze','low-footwork'],'FUNK / DISCO':['point','arm-swing','disco-step'],CONTEMPORARY:['sway','release','long-reach']};
export function dancePose(base,t,bpm,genre,intensity,features){let g=genre==='AUTO'?['HOUSE','HIP-HOP','JAZZ','FUNK / DISCO'][Math.floor(t/(60000/bpm*32))%4]:genre;let q=t/(60000/bpm),p=q%1,beat=Math.sin(q*Math.PI*2),bar=Math.floor(q/4),k=intensity*(1+features.bass*.45);let cx=base.cx,cy=base.cy,scale=base.scale, j=structuredClone(base.joints);const move=(name,x,y)=>{j[name].x+=x*scale*k;j[name].y+=y*scale*k};
 let sway=Math.sin(q*Math.PI)*.22, kick=Math.max(0,Math.sin(q*Math.PI*2))*0.32;
 if(g==='HOUSE'){move('hipL',sway,-beat*.05);move('hipR',sway,beat*.05);move('ankleL',-.28*Math.sin(q*Math.PI),Math.abs(beat)*.12);move('ankleR',.28*Math.sin(q*Math.PI),Math.abs(beat)*.12);move('wristL',-.1,beat*.16);move('wristR',.1,-beat*.16)}
 if(g==='HIP-HOP'){for(const n of ['shoulderL','shoulderR'])move(n,0,Math.abs(beat)*.14);move('wristL',-.18,beat*.1);move('wristR',.18,-beat*.1);move('hipL',sway*.25,.09);move('hipR',sway*.25,.09)}
 if(g==='JAZZ'){move('wristL',-.45*Math.sin(q*Math.PI),-.25*Math.cos(q*Math.PI));move('wristR',.45*Math.sin(q*Math.PI),-.25*Math.cos(q*Math.PI));move('ankleR',.1,kick)}
 if(g==='BREAKING'){let low=(bar%4===3)? .35:0;for(const n of ['hipL','hipR','kneeL','kneeR','ankleL','ankleR'])move(n,0,low);move('wristL',-.25,low);move('wristR',.25,low)}
 if(g==='FUNK / DISCO'){move('wristL',-.12,-.52*Math.max(0,beat));move('wristR',.45*Math.max(0,-beat),-.25);move('ankleL',-.22*Math.sin(q*Math.PI),0)}
 if(g==='CONTEMPORARY'){for(const n of ['wristL','wristR'])move(n,n==='wristL'?-.28:.28,-.18*Math.cos(q*Math.PI));move('hipL',sway*.35,.03);move('hipR',sway*.35,.03)}
 return {cx,cy,scale,joints:j,genre:g,phrase:PHRASES[g][bar%PHRASES[g].length]};}
export function blend(a,b,x){let joints={};for(const k in a.joints)joints[k]={x:a.joints[k].x+(b.joints[k].x-a.joints[k].x)*x,y:a.joints[k].y+(b.joints[k].y-a.joints[k].y)*x};return {...a,joints};}
