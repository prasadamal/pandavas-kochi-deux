import json,struct,numpy as np
b=open('fk.glb','rb').read();l=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+l]);bin0=20+l+8
def acc(i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];off=bin0+bv.get('byteOffset',0)+a.get('byteOffset',0)
    nc={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];dt={5126:np.float32,5125:np.uint32,5123:np.uint16}[a['componentType']]
    return np.frombuffer(b,dtype=dt,count=a['count']*nc,offset=off).reshape(-1,nc)
TS=4.0;X0,Z0=-202.84,-182.51;W=int(np.ceil(405.7/TS));H=int(np.ceil(365.1/TS))
print('grid',W,H)
layers={}
for ni,n in enumerate(j['nodes']):
    me=j['meshes'][n['mesh']];name=n['name']
    for p in me['primitives']:
        P=acc(p['attributes']['POSITION']);I=acc(p['indices']).reshape(-1,3) if 'indices' in p else np.arange(len(P)).reshape(-1,3)
        grid=np.zeros((H,W));hgt=np.zeros((H,W))
        cx=(np.arange(W)+.5)*TS+X0;cz=(np.arange(H)+.5)*TS+Z0
        for tri in I:
            a,bb,c=P[tri[0]],P[tri[1]],P[tri[2]]
            # top-facing only for roofs/ground; all for streets
            n_=np.cross(bb-a,c-a);
            if abs(n_[1])<1e-6*np.linalg.norm(n_)+1e-9:continue
            xs=[a[0],bb[0],c[0]];zs=[a[2],bb[2],c[2]]
            i0=max(0,int((min(xs)-X0)/TS));i1=min(W-1,int((max(xs)-X0)/TS));k0=max(0,int((min(zs)-Z0)/TS));k1=min(H-1,int((max(zs)-Z0)/TS))
            for k in range(k0,k1+1):
                for i in range(i0,i1+1):
                    px,pz=cx[i],cz[k]
                    d1=(px-bb[0])*(a[2]-bb[2])-(a[0]-bb[0])*(pz-bb[2]);d2=(px-c[0])*(bb[2]-c[2])-(bb[0]-c[0])*(pz-c[2]);d3=(px-a[0])*(c[2]-a[2])-(c[0]-a[0])*(pz-a[2])
                    neg=(d1<0)or(d2<0)or(d3<0);pos=(d1>0)or(d2>0)or(d3>0)
                    if not(neg and pos):grid[k,i]=1;hgt[k,i]=max(hgt[k,i],(a[1]+bb[1]+c[1])/3)
        layers[name]=(grid,hgt)
        print(name,int(grid.sum()),'maxh',round(hgt.max(),1))
np.savez('layers.npz',**{k.replace(' ','_'):v[0] for k,v in layers.items()},**{'H_'+k.replace(' ','_'):v[1] for k,v in layers.items()})
# preview
img=np.zeros((H,W,3),np.uint8)+[20,60,110]
order=['Ground','Playing Fields','Park','Streets','Walls','Pale Roof','Clay Roof','Tile Roof','St Francis Church Roof','Santa Cruz Cathedral Basilica Roof']
col={'Ground':[176,146,98],'Playing Fields':[118,130,58],'Park':[76,107,45],'Streets':[50,50,55],'Walls':[214,173,109],'Pale Roof':[128,119,98],'Clay Roof':[160,60,30],'Tile Roof':[110,40,25],'St Francis Church Roof':[255,255,255],'Santa Cruz Cathedral Basilica Roof':[255,230,0]}
for k in order:
    if k in layers:img[layers[k][0]>0]=col[k]
import subprocess
subprocess.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','%dx%d'%(W,H),'-i','-','-vf','scale=%d:%d:flags=neighbor'%(W*6,H*6),'preview.png'],input=img.tobytes())
