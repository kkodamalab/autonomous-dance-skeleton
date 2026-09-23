export const STATES=['FOLLOW','DRIFT','DETACH','AUTONOMOUS','RETURN'];
export class PerformanceController{
 constructor(){this.state='FOLLOW';this.changed=performance.now();this.auto=false;this.durations={FOLLOW:10,DRIFT:5,DETACH:5,AUTONOMOUS:30,RETURN:5};}
 set(s){this.state=s;this.changed=performance.now()}
 update(now){if(this.auto&&(now-this.changed)/1000>this.durations[this.state])this.set(STATES[(STATES.indexOf(this.state)+1)%STATES.length]);let p=Math.min(1,(now-this.changed)/1200);let auto=this.state==='FOLLOW'?0:this.state==='DRIFT'?p*.5:this.state==='DETACH'? .5+p*.5:this.state==='AUTONOMOUS'?1:1-p;return {auto,root:p};}
}
