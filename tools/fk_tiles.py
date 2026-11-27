import numpy as np,json,struct
L=np.load('layers.npz');H,W=L['Ground'].shape
st=L['Streets']>0;st2=st.copy();st2[:,1:]|=st[:,:-1];st2[1:,:]|=st[:-1,:]
grid=np.full((H,W),'g');grid[L['Park']>0]='l';grid[L['Playing_Fields']>0]='d'
kinds={'Pale_Roof':'p','Clay_Roof':'c','Tile_Roof':'t','St_Francis_Church_Roof':'F','Santa_Cruz_Cathedral_Basilica_Roof':'B'}
kind=np.full((H,W),'',dtype=object);hgt=np.zeros((H,W))
for k,c in kinds.items():
    m=L[k]>0;kind[m]=c;hgt[m]=np.maximum(hgt[m],L['H_'+k][m])
kind[st2&~np.isin(kind,['F','B'])]=''
grid[st2]='r'
roofs=[]
# churches: one building each
for c in ['F','B']:
    ys,xs=np.where(kind==c);x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
    while st[y0:y1+1,x0:x1+1].any():
        cand=[]
        for side in 'LRTB':
            X0,X1,Y0,Y1=x0+(side=='L'),x1-(side=='R'),y0+(side=='T'),y1-(side=='B')
            if X1<X0 or Y1<Y0:continue
            cand.append((st[Y0:Y1+1,X0:X1+1].sum()-((kind[Y0:Y1+1,X0:X1+1]==c).sum())*0.01,X0,X1,Y0,Y1))
        cand.sort();_,x0,x1,y0,y1=cand[0]
    print(c,'church rect',x0,y0,x1-x0+1,y1-y0+1)
    roofs.append([int(x0),int(y0),int(x1-x0+1),int(y1-y0+1),c,13.0]);kind[kind==c]='';grid[y0:y1+1,x0:x1+1]='b'
grp={'p':'p','c':'c','t':'c'}
seen=np.zeros((H,W),bool)
for y in range(H):
  for x in range(W):
    if seen[y,x] or kind[y,x]=='':continue
    g=grp[kind[y,x]];comp=[];q=[(y,x)];seen[y,x]=True
    while q:
        cy,cx=q.pop();comp.append((cy,cx))
        for dy,dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny,nx=cy+dy,cx+dx
            if 0<=ny<H and 0<=nx<W and not seen[ny,nx] and kind[ny,nx]!='' and grp[kind[ny,nx]]==g:seen[ny,nx]=True;q.append((ny,nx))
    ys=[c[0] for c in comp];xs=[c[1] for c in comp];y0,y1,x0,x1=min(ys),max(ys),min(xs),max(xs)
    area=(y1-y0+1)*(x1-x0+1);hm=float(max(hgt[c] for c in comp));kk=kind[comp[0]]
    if len(comp)/area>=.6 and not st2[y0:y1+1,x0:x1+1].any():
        roofs.append([x0,y0,x1-x0+1,y1-y0+1,kk,round(hm,1)]);continue
    # greedy rectangles inside the component
    cs=set(comp);used=set()
    for (cy,cx) in sorted(comp):
        if (cy,cx) in used:continue
        w=0
        while (cy,cx+w) in cs and (cy,cx+w) not in used:w+=1
        h=1
        while all((cy+h,cx+i) in cs and (cy+h,cx+i) not in used for i in range(w)):h+=1
        for j in range(h):
            for i in range(w):used.add((cy+j,cx+i))
        roofs.append([cx,cy,w,h,kk,round(hm,1)])
for r in roofs:
    x,y,w,h=r[:4];
    for j in range(y,y+h):
        for i in range(x,x+w):
            if grid[j,i]!='r':grid[j,i]='b'
print('roofs',len(roofs))
# street polygons from the model (top faces), in local tile units
b=open('fk.glb','rb').read();l=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+l]);bin0=20+l+8
def acc(i):
    a=j['accessors'][i];bv=j['bufferViews'][a['bufferView']];off=bin0+bv.get('byteOffset',0)+a.get('byteOffset',0)
    nc={'SCALAR':1,'VEC2':2,'VEC3':3}[a['type']];dt={5126:np.float32,5125:np.uint32,5123:np.uint16}[a['componentType']]
    return np.frombuffer(b,dtype=dt,count=a['count']*nc,offset=off).reshape(-1,nc)
tris=[]
for n in j['nodes']:
    if n['name']!='Streets':continue
    for p in j['meshes'][n['mesh']]['primitives']:
        P=acc(p['attributes']['POSITION']);I=acc(p['indices']).reshape(-1,3) if 'indices' in p else np.arange(len(P)).reshape(-1,3)
        for t in I:
            a,b2,c=P[t[0]],P[t[1]],P[t[2]];nrm=np.cross(b2-a,c-a)
            if abs(nrm[1])<1e-6*np.linalg.norm(nrm)+1e-9:continue
            for v in t:tris+= [round(float((P[v][0]+202.84)/4),2),round(float((P[v][2]+182.51)/4),2)]
print('street tris',len(tris)//6)
out={'w':int(W),'h':int(H),'t':''.join(''.join(r) for r in grid),'roofs':[[int(a),int(b_),int(c),int(d),e,f] for a,b_,c,d,e,f in roofs],'st':tris}
s=json.dumps(out,separators=(',',':'));open('fk.json','w').write(s);print(len(s))
