export const STATES=['FOLLOW','DRIFT','DETACH','AUTONOMOUS','RETURN'];
const smoothstep=x=>x*x*(3-2*x);
export class PerformanceController{
 constructor(){this.state='FOLLOW';this.changed=performance.now();this.auto=false;this.autoStartedAt=null;this.followSeconds=10;this.transitionSeconds=5;}
 set(s){this.state=s;this.changed=performance.now();}
 configure(follow,transition){this.followSeconds=Math.max(0,Math.min(300,follow));this.transitionSeconds=Math.max(0,Math.min(60,transition));}
 startAuto(){this.auto=true;this.autoStartedAt=null;this.set('FOLLOW');}
 stopAuto(){this.auto=false;this.autoStartedAt=null;}
 update(now,hasPose){if(!this.auto){const elapsed=Math.min(1,(now-this.changed)/1200);const auto=this.state==='FOLLOW'?0:this.state==='DRIFT'?elapsed*.5:this.state==='DETACH'?.5+elapsed*.5:this.state==='AUTONOMOUS'?1:1-elapsed;return {auto,label:this.state};}if(!hasPose){return {auto:0,label:'FOLLOW — WAITING FOR POSE'};}if(this.autoStartedAt===null)this.autoStartedAt=now;const elapsed=(now-this.autoStartedAt)/1000;if(elapsed<this.followSeconds){this.state='FOLLOW';return {auto:0,label:'FOLLOW'};}const progress=this.transitionSeconds===0?1:(elapsed-this.followSeconds)/this.transitionSeconds;if(progress<1){this.state='AUTONOMOUS';return {auto:smoothstep(Math.max(0,progress)),label:'TRANSITION'};}this.state='AUTONOMOUS';return {auto:1,label:'DANCE'};}
}
