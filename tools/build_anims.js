async function main(){
const L=[];const log=s=>L.push(s);
const tgt=await loadFBX('av/Male_Adult_12.fbx');tgt.updateMatrixWorld(true);
const TB={};tgt.traverse(o=>{if(o.isBone)TB[o.name]=o;});
const keepBone=n=>/^Bip01(_Pelvis|_Spine\d?|_Neck|_Head|_[LR]_(Clavicle|UpperArm|Forearm|Hand|Thigh|Calf|Foot|Toe0|Finger\d+))?$/.test(n);
const clips=[];
// ---------- native Rocketbox clips ----------
const NATIVE=[['idle','m_idle_neutral_01'],['idle_angry','m_idle_angry_01'],['walk','m_walk_neutral_02',1],['walk_cool','m_walk_cool_01',1],['run','m_run_neutral_01',1],['sprint','m_run_fast_01',1],['phone','m_cell_phone_talk_01'],['drink','m_drink_drinking'],['dance','m_dancing_cool'],['dance2','m_dancing_aggressive'],['cheer','m_cheer_01'],['laugh','m_gestic_laugh_loud'],['crouch','m_crouch_idle'],['wave','m_wave_01'],['drunk','m_idle_drunk_01'],['f_walk','f_walk_neutral_01',1],['f_idle','f_idle_neutral_01']];
for(const [name,file,travel] of NATIVE){const a=await loadFBX('anim/'+file+'.fbx');const c=a.animations[0];const tr=[];
  for(const t of c.tracks){const [bn,prop]=t.name.split('.');if(!keepBone(bn)||prop==='scale')continue;if(prop==='position'&&bn!=='Bip01')continue;
    if(prop==='position'&&travel){const v=t.values.slice();const x0=v[0],z0=v[2];for(let i=0;i<v.length;i+=3){v[i]=x0;v[i+2]=z0;}tr.push(new THREE.VectorKeyframeTrack(t.name,t.times,v));}else tr.push(t);}
  const MAXD={idle:7,idle_angry:9,phone:12,drink:11,dance:12,dance2:10,cheer:8,laugh:7,drunk:9,f_idle:7,crouch:5};let cl=new THREE.AnimationClip(name,c.duration,tr);if(MAXD[name]&&c.duration>MAXD[name]){const fps=30;cl=THREE.AnimationUtils.subclip(cl,name,0,Math.round(MAXD[name]*fps),fps);}clips.push(cl);log(name+' dur='+c.duration.toFixed(2)+' tracks='+tr.length);}
// ---------- retarget Quaternius combat clips ----------
const g=await loadGLB('hero.glb');const src=g.scene;src.updateMatrixWorld(true);const SB={};src.traverse(o=>{if(o.isBone)SB[o.name]=o;});
const MAP=[['Hips','Bip01_Pelvis','Abdomen','Bip01_Spine'],['Abdomen','Bip01_Spine','Torso','Bip01_Spine1'],['Torso','Bip01_Spine1','Chest','Bip01_Spine2'],['Chest','Bip01_Spine2','Neck','Bip01_Neck'],['Neck','Bip01_Neck','Head','Bip01_Head'],['Head','Bip01_Head',null,null]];
for(const s of ['L','R']){MAP.push(['Shoulder'+s,'Bip01_'+s+'_Clavicle','UpperArm'+s,'Bip01_'+s+'_UpperArm'],['UpperArm'+s,'Bip01_'+s+'_UpperArm','LowerArm'+s,'Bip01_'+s+'_Forearm'],['LowerArm'+s,'Bip01_'+s+'_Forearm','Wrist'+s,'Bip01_'+s+'_Hand'],['Wrist'+s,'Bip01_'+s+'_Hand','Middle1'+s,'Bip01_'+s+'_Finger2'],
  ['UpperLeg'+s,'Bip01_'+s+'_Thigh','LowerLeg'+s,'Bip01_'+s+'_Calf'],['LowerLeg'+s,'Bip01_'+s+'_Calf','Foot'+s,'Bip01_'+s+'_Foot'],['Foot'+s,'Bip01_'+s+'_Foot',null,null]);}
for(const m of MAP){if(!SB[m[0]])log('missing src '+m[0]);if(!TB[m[1]])log('missing tgt '+m[1]);}
const wq=o=>o.getWorldQuaternion(new THREE.Quaternion()),wp=o=>o.getWorldPosition(new THREE.Vector3());
// source rest
const srcRestW={};for(const m of MAP)srcRestW[m[0]]=wq(SB[m[0]]);const srcHip0=wp(SB.Hips);
// matched target rest: rotate each target bone so its direction to child matches the source direction
const tRestLocal={};for(const n in TB)tRestLocal[n]=TB[n].quaternion.clone();
for(const m of MAP){if(!m[2])continue;const tb=TB[m[1]],tc=TB[m[3]];tgt.updateMatrixWorld(true);
  const sd=wp(SB[m[2]]).sub(wp(SB[m[0]])).normalize(),td=wp(tc).sub(wp(tb)).normalize();const dq=new THREE.Quaternion().setFromUnitVectors(td,sd);
  const w=dq.multiply(wq(tb));const pw=wq(tb.parent);tb.quaternion.copy(pw.invert().multiply(w));}
tgt.updateMatrixWorld(true);const tgtMatchW={};for(const m of MAP)tgtMatchW[m[1]]=wq(TB[m[1]]);
const tgtHip=wp(TB.Bip01_Pelvis).y,srcHip=srcHip0.y,ratio=tgtHip/srcHip;log('hip ratio '+ratio.toFixed(3)+' tgtHip '+tgtHip.toFixed(1)+' srcHip '+srcHip.toFixed(3));
const bip0=TB.Bip01.position.clone();
const order=[];tgt.traverse(o=>{if(o.isBone)order.push(o.name);});const mapT={};for(const m of MAP)mapT[m[1]]=m[0];
const RT=[['gun_aim','Idle_Gun_Pointing'],['gun_shoot','Idle_Gun_Shoot'],['run_shoot','Run_Shoot'],['punch_l','Punch_Left'],['punch_r','Punch_Right'],['kick','Kick_Right'],['hit','HitRecieve'],['death','Death'],['roll','Roll'],['gun_fire','Gun_Shoot']];
const mixer=new THREE.AnimationMixer(src);
for(const [name,cn] of RT){const c=g.animations.find(a=>a.name===cn);if(!c){log('no clip '+cn);continue;}mixer.stopAllAction();const ac=mixer.clipAction(c);ac.play();
  const fps=30,n=Math.max(2,Math.round(c.duration*fps)+1),times=[],Q={},P=[];for(const m of MAP)Q[m[1]]=[];
  for(let f=0;f<n;f++){const t=Math.min(c.duration,f/fps);times.push(t);mixer.setTime(t);src.updateMatrixWorld(true);
    // reset target to rest then apply
    for(const nm of order)TB[nm].quaternion.copy(tRestLocal[nm]);TB.Bip01.position.copy(bip0);
    const hp=wp(SB.Hips).sub(srcHip0).multiplyScalar(ratio);TB.Bip01.position.add(hp);tgt.updateMatrixWorld(true);
    for(const nm of order){const sn=mapT[nm];if(!sn)continue;const tb=TB[nm];
      const d=wq(SB[sn]).multiply(srcRestW[sn].clone().invert());const w=d.multiply(tgtMatchW[nm]);const pw=wq(tb.parent);tb.quaternion.copy(pw.invert().multiply(w));tb.updateMatrixWorld(true);
      Q[nm].push(tb.quaternion.x,tb.quaternion.y,tb.quaternion.z,tb.quaternion.w);}
    P.push(TB.Bip01.position.x,TB.Bip01.position.y,TB.Bip01.position.z);}
  const tracks=[new THREE.VectorKeyframeTrack('Bip01.position',times,P)];for(const nm in Q)tracks.push(new THREE.QuaternionKeyframeTrack(nm+'.quaternion',times,Q[nm]));
  clips.push(new THREE.AnimationClip(name,c.duration,tracks));log(name+' <- '+cn+' frames='+n);}
// restore rest
for(const nm of order)TB[nm].quaternion.copy(tRestLocal[nm]);TB.Bip01.position.copy(bip0);
// export skeleton-only scene with clips
const root=new THREE.Group();root.name='RB';const sk=TB.Bip01;sk.parent.remove(sk);root.add(sk);
const res=await new Promise(r=>new THREE.GLTFExporter().parse(root,r,{binary:true,animations:clips,onlyVisible:false}));
const b64=btoa(Array.from(new Uint8Array(res),c=>String.fromCharCode(c)).join(''));
return {log:L.join('\n'),files:{'rb_anims_raw.glb':b64}};}
