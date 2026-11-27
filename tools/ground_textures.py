import numpy as np,subprocess
N=256;rng=np.random.default_rng(3)
def pnoise(scale,oct=5,pers=.55):  # periodic fractal noise via FFT band filtering
    out=np.zeros((N,N));amp=1;tot=0
    f=np.fft.fftfreq(N)[:,None];g=np.fft.fftfreq(N)[None,:];r=np.sqrt(f*f+g*g)+1e-9
    for o in range(oct):
        fc=scale*2**o/N;W=np.exp(-((r-fc)/(fc*.7))**2)
        n=np.real(np.fft.ifft2(np.fft.fft2(rng.standard_normal((N,N)))*W));n/=n.std()+1e-9
        out+=n*amp;tot+=amp;amp*=pers
    return out/tot
def save(name,rgb):
    rgb=np.clip(rgb,0,255).astype(np.uint8)
    subprocess.run(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s','%dx%d'%(N,N),'-i','-','-q:v','4',name+'.jpg'],input=rgb.tobytes(),check=True)
def col(base,n,k):return np.array(base)[None,None,:]*(1+k*n[...,None])
# asphalt: grey base, aggregate speckle, tar patches, faint cracks
n1=pnoise(4);n2=pnoise(40,3);sp=rng.random((N,N))
a=col([62,63,67],n1*.12+n2*.06,1)
a+=((sp>.93)*rng.uniform(15,40,(N,N)))[...,None]; a-=((sp<.05)*18)[...,None]
tar=pnoise(3,2);a*= (1-.18*np.clip(tar-.6,0,1))[...,None]
cr=np.abs(pnoise(6,3));a*=(1-.35*(cr<.03))[...,None]
save('asphalt',a)
# laterite red earth with pebbles
n1=pnoise(5);n2=pnoise(30,3);sp=rng.random((N,N))
d=col([150,74,44],n1*.16+n2*.08,1);d+=((sp>.965)*rng.uniform(20,50,(N,N)))[...,None]*np.array([1,.8,.6]);d-=((sp<.03)*25)[...,None]
save('laterite',d)
# grass: two greens + blade noise + dry patches
n1=pnoise(6);n2=pnoise(70,2);dry=pnoise(3,2)
gr=np.array([70,118,48])[None,None,:]*(1+.18*n1[...,None]+.22*n2[...,None])
gr=gr*(1-np.clip(dry[...,None]-.5,0,1)*.3)+np.clip(dry[...,None]-.5,0,1)*np.array([60,50,20])
save('grass',gr)
# beach sand
n1=pnoise(5);n2=pnoise(90,2);sp=rng.random((N,N))
s=col([214,196,152],n1*.06+n2*.05,1);s-=((sp<.04)*30)[...,None];s+=((sp>.97)*25)[...,None]
save('sand',s)
# concrete slabs
n1=pnoise(4);n2=pnoise(50,3);c=col([166,162,152],n1*.07+n2*.05,1)
st=pnoise(2,2);c*=(1-.12*np.clip(st-.4,0,1))[...,None]
y,x=np.mgrid[0:N,0:N];c*=(1-.25*(((x%128)<2)|((y%128)<2)))[...,None]
save('concrete',c)
# interlock pavers (zigzag "I-shape" approximated by offset bricks), grey with some red rows
n2=pnoise(60,2);p=np.zeros((N,N,3))
bw,bh=32,16
for yy in range(N):
    row=yy//bh;off=(bw//2)*(row%2)
    for xx in range(N):
        bx=((xx+off)//bw);seed=(bx*73+row*31)%97
        base=np.array([150,146,140]) if (row%6) not in (2,3) else np.array([150,82,64])
        p[yy,xx]=base*(0.92+0.1*((seed%10)/10))
edge=((y%bh)<1)|(((x+(bw//2)*((y//bh)%2))%bw)<1)
p=p*(1+.06*n2[...,None]);p*= (1-.4*edge)[...,None]
save('pavers',p)
