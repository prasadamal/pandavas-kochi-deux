async function main(args){const [file,out,mode]=args;const L=[];
const o=await loadFBX('av/'+file+'.fbx');let mesh=null;o.traverse(x=>{if(x.isSkinnedMesh&&!mesh)mesh=x;});
const img=u=>new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=u;});
const hsv=(r,g,b)=>{const mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;let h=0;if(d){if(mx===r)h=((g-b)/d)%6;else if(mx===g)h=(b-r)/d+2;else h=(r-g)/d+4;h*=60;if(h<0)h+=360;}return [h,mx?d/mx:0,mx];};
const hsv2rgb=(h,s,v)=>{const c=v*s,x=c*(1-Math.abs((h/60)%2-1)),m=v-c;let r,g,b;[r,g,b]=h<60?[c,x,0]:h<120?[x,c,0]:h<180?[0,c,x]:h<240?[0,x,c]:h<300?[x,0,c]:[c,0,x];return [r+m,g+m,b+m];};
const isSkin=(r,g,b)=>{const [h,s,v]=hsv(r,g,b);return h<=38&&s>.18&&s<.72&&v>.2&&r-g>.07&&g>=b;};
async function tex(name,alpha,recolor){const im=await img('av/tex/'+name+(alpha?'.png':'.jpg'));if(!im){L.push('missing '+name);return null;}
  const S=512,c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d');g.drawImage(im,0,0,S,S);
  if(recolor){const d=g.getImageData(0,0,S,S),p=d.data;for(let i=0;i<p.length;i+=4){const r=p[i]/255,gg=p[i+1]/255,b=p[i+2]/255;
    if(recolor==='tan'||recolor==='tanhair'){if(recolor==='tanhair'){const [h,s,v]=hsv(r,gg,b);if(p[i+3]>10){const k=.22;p[i]=Math.min(255,p[i]*k+12);p[i+1]=Math.min(255,p[i+1]*k+8);p[i+2]=Math.min(255,p[i+2]*k+6);}continue;}
      if(isSkin(r,gg,b)){const L=(r*.3+gg*.59+b*.11)/.78;p[i]=Math.min(255,L*150);p[i+1]=Math.min(255,L*100);p[i+2]=Math.min(255,L*70);}else{const [h,s,v]=hsv(r,gg,b);if(h>=30&&h<=55&&s>.25&&v>.45){p[i]*=.3;p[i+1]*=.27;p[i+2]*=.25;}}continue;}
    if(isSkin(r,gg,b))continue;let [h,s,v]=hsv(r,gg,b);
    if(recolor==='black'){v=Math.min(1,v*.34+.02);s*=.25;}else if(recolor==='khaki'){if(h>170&&h<260&&s>.15){h=40;s=.42;v=Math.min(1,v*1.05);}}else if(recolor==='mundu'){}
    const [R,G,B]=hsv2rgb(h,s,v);p[i]=R*255;p[i+1]=G*255;p[i+2]=B*255;}g.putImageData(d,0,0);}
  const c2=document.createElement('canvas');c2.width=c2.height=S;const g2=c2.getContext('2d');g2.translate(0,S);g2.scale(1,-1);g2.drawImage(c,0,0);const t=new THREE.CanvasTexture(c2);t.format=alpha?THREE.RGBAFormat:THREE.RGBFormat;t.flipY=false;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;return t;}
const mats=[];for(const m of [].concat(mesh.material)){const n=m.name,op=/opacity/.test(n),body=/body/.test(n);
  const map=await tex(n+'_color',op,mode==='tan'?(op?'tanhair':'tan'):(body||(mode==='khaki'&&/head/.test(n))?mode:null));const mm=new THREE.MeshStandardMaterial({name:n,map,color:map?0xffffff:0x1d1d1f,roughness:.8,metalness:0,skinning:true,alphaTest:op?.5:0,transparent:false,side:op?THREE.DoubleSide:THREE.FrontSide});mats.push(mm);}
mesh.material=Array.isArray(mesh.material)?mats:mats[0];if(mesh.geometry.attributes.color)mesh.geometry.deleteAttribute('color');if(!mesh.geometry.index){const n=mesh.geometry.attributes.position.count,ix=new Uint32Array(n);for(let i=0;i<n;i++)ix[i]=i;mesh.geometry.setIndex(new THREE.BufferAttribute(ix,1));}
const root=new THREE.Group();root.name='RB_'+out;const bip=o.getObjectByName('Bip01');o.remove(mesh);o.remove(bip);root.add(bip);root.add(mesh);
L.push(out+' verts='+mesh.geometry.attributes.position.count+' mats='+mats.map(m=>m.name).join('/'));
const res=await new Promise(r=>new THREE.GLTFExporter().parse(root,r,{binary:true,onlyVisible:false}));
// preview render
const sc=new THREE.Scene();sc.background=new THREE.Color(0x8a96a4);sc.add(new THREE.HemisphereLight(0xffffff,0x445566,1));const dl=new THREE.DirectionalLight(0xffffff,.9);dl.position.set(100,200,300);sc.add(dl);sc.add(root);
const r=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});r.setSize(260,520);r.outputEncoding=THREE.sRGBEncoding;const cam=new THREE.PerspectiveCamera(22,.5,1,5000);cam.position.set(0,100,560);cam.lookAt(0,92,0);r.render(sc,cam);
const png=r.domElement.toDataURL('image/png').split(',')[1];
const b64=btoa(Array.from(new Uint8Array(res),c=>String.fromCharCode(c)).join(''));const files={};files['av_raw_'+out+'.glb']=b64;files['prev_'+out+'.png']=png;return {log:L.join('\n'),files};}
