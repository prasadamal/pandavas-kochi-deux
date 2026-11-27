# Original "Gangs of Mollywood" theme. Key: D phrygian dominant (D Eb F# G A Bb C).
import numpy as np, subprocess, os, sys
SR=44100; rng=np.random.default_rng(7)
OUT=os.path.dirname(os.path.abspath(__file__))+'/cues/'; os.makedirs(OUT,exist_ok=True)
def mtof(m): return 440*2**((m-69)/12)
N={'C':0,'C#':1,'Db':1,'D':2,'Eb':3,'E':4,'F':5,'F#':6,'G':7,'Ab':8,'A':9,'Bb':10,'B':11}
def note(s): # 'D4'
    return 12*(int(s[-1])+1)+N[s[:-1]]
def env(n,a,d,s,r,hold):
    t=np.arange(n)/SR; e=np.ones(n)*s
    ai=int(a*SR); di=int(d*SR); hi=int(hold*SR)
    e[:ai]=np.linspace(0,1,max(ai,1))[:len(e[:ai])]
    e[ai:ai+di]=np.linspace(1,s,max(di,1))[:len(e[ai:ai+di])]
    ri=int(r*SR); 
    if hi<n: e[hi:]=e[hi]*np.exp(-np.arange(n-hi)/(max(ri,1)))
    return e
def lp(x,fc):  # one-pole x2
    a=np.exp(-2*np.pi*fc/SR); y=np.empty_like(x); z=0.
    for _ in range(2):
        y=np.empty_like(x); z=0.
        # vectorised via lfilter-like recursion is slow in python; use FFT filter instead
        break
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); H=1/(1+(f/fc)**4)**.5
    return np.fft.irfft(X*H,len(x))
def hp(x,fc):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); H=1/(1+(fc/np.maximum(f,1e-3))**4)**.5
    return np.fft.irfft(X*H,len(x))
def bp(x,fc,q=1.):
    X=np.fft.rfft(x); f=np.fft.rfftfreq(len(x),1/SR); H=np.exp(-((np.log2(np.maximum(f,1)/fc))*q*1.6)**2)
    return np.fft.irfft(X*H,len(x))
def saw(f,n,ph=0):
    t=np.arange(n)/SR; p=(t*f+ph)%1; return 2*p-1
def sq(f,n): return np.sign(np.sin(2*np.pi*f*np.arange(n)/SR))
# ---------- instruments (return arrays) ----------
def kick(v=1.):
    n=int(.5*SR);t=np.arange(n)/SR;f=45+90*np.exp(-t*28);ph=2*np.pi*np.cumsum(f)/SR
    return v*(np.sin(ph)*np.exp(-t*7)+.3*rng.standard_normal(n)*np.exp(-t*120))
def snare(v=1.):
    n=int(.35*SR);t=np.arange(n)/SR;nz=bp(rng.standard_normal(n),2400,.6)*np.exp(-t*16)
    return v*(.9*nz/np.abs(nz).max()+.5*np.sin(2*np.pi*190*t)*np.exp(-t*30))
def clap(v=1.):
    n=int(.3*SR);t=np.arange(n)/SR;nz=bp(rng.standard_normal(n),1600,.8);e=np.exp(-t*22)
    for d in (0.0,0.012,0.024): e+= (t>=d)*np.exp(-np.maximum(t-d,0)*90)*.6
    return v*nz/np.abs(nz).max()*e*.8
def hat(v=1.,open_=False):
    n=int((.25 if open_ else .06)*SR);t=np.arange(n)/SR;nz=hp(rng.standard_normal(n),7000)
    return v*.7*nz/np.abs(nz).max()*np.exp(-t*(9 if open_ else 60))
def chenda(v=1.,pitch=1.):   # Kerala temple drum flavour: sharp stick hit on a tight skin
    n=int(.25*SR);t=np.arange(n)/SR;f=(330*pitch)*(1+.6*np.exp(-t*60));ph=2*np.pi*np.cumsum(f)/SR
    nz=bp(rng.standard_normal(n),3000,.5)
    return v*(.7*np.sin(ph)*np.exp(-t*18)+.5*nz/np.abs(nz).max()*np.exp(-t*45))
def tabla(v=1.,kind='na'):
    n=int(.4*SR);t=np.arange(n)/SR
    if kind=='ge':f=95*(1+.5*np.exp(-t*8));e=np.exp(-t*6)
    else:f=520*(1+.05*np.exp(-t*30));e=np.exp(-t*22)
    ph=2*np.pi*np.cumsum(f)/SR;return v*np.sin(ph)*e
def bass808(m,dur,v=1.,glide=None):
    n=int((dur+.3)*SR);t=np.arange(n)/SR;f0=mtof(m);f=np.full(n,f0)
    if glide is not None:f=f0*(mtof(glide)/f0)**np.clip(t/dur,0,1)
    ph=2*np.pi*np.cumsum(f)/SR;x=np.sin(ph)+.25*np.tanh(3*np.sin(ph))
    e=env(n,.005,.1,.85,.12,dur);return v*x*e
def sawbass(m,dur,v=1.,cut=600):
    n=int((dur+.15)*SR);f=mtof(m);x=saw(f,n)+saw(f*1.005,n)
    x=lp(x,cut);return v*.4*x*env(n,.004,.15,.6,.06,dur)
def whistle(m,dur,v=1.,slide_from=None):
    n=int((dur+.25)*SR);t=np.arange(n)/SR;f=np.full(n,mtof(m))
    if slide_from is not None:f=mtof(slide_from)+(mtof(m)-mtof(slide_from))*np.clip(t/.07,0,1)
    vib=1+.012*np.sin(2*np.pi*5.6*t)*np.clip((t-.18)/.2,0,1);ph=2*np.pi*np.cumsum(f*vib)/SR
    breath=bp(rng.standard_normal(n),mtof(m),2.5)*.08
    x=np.sin(ph)+.08*np.sin(2*ph)+breath/np.abs(breath).max()*.15
    return v*x*env(n,.03,.1,.85,.09,dur)
def brass(ms,dur,v=1.,bright=1800):
    n=int((dur+.3)*SR);t=np.arange(n)/SR;x=np.zeros(n)
    for m in ms:
        for d in (-.006,0,.007):x+=saw(mtof(m)*(1+d),n,rng.random())
    cut=bright*(0.35+.65*np.exp(-t*3.5));X=x
    # time-varying filter approximation: blend bright and dark versions
    hi=lp(X,bright);lo=lp(X,bright*.3);k=np.exp(-t*3.0);y=hi*k+lo*(1-k)
    return v*.18*y*env(n,.02,.25,.7,.15,dur)/max(1,len(ms)**.5)
def strings(ms,dur,v=1.):
    n=int((dur+1.)*SR);x=np.zeros(n)
    for m in ms:
        for d in (-.008,-.003,.003,.009):x+=saw(mtof(m)*(1+d),n,rng.random())
    x=lp(x,2200);return v*.06*x*env(n,.6,.5,.9,.6,dur)/max(1,len(ms)**.5)
def drone(dur,v=1.,root=38):
    n=int(dur*SR);t=np.arange(n)/SR;x=np.zeros(n)
    for m,a in ((root,1),(root+7,.6),(root+12,.5),(root+19,.25)):
        for d in (-.004,.004):x+=a*saw(mtof(m)*(1+d),n,rng.random())
    sweep=lp(x,900)*(.6+.4*np.sin(2*np.pi*t/7.3))
    return v*.06*sweep*np.clip(t/1.2,0,1)*np.clip((dur-t)/1.0,0,1)
def riser(dur,v=1.):
    n=int(dur*SR);t=np.arange(n)/SR;nz=rng.standard_normal(n);y=np.zeros(n)
    for k in range(8):
        seg=slice(k*n//8,(k+1)*n//8);y[seg]=bp(nz[seg],400*2**(k*.5),1.2)
    return v*.25*y/np.abs(y).max()*(t/dur)**2
def impact(v=1.):
    n=int(2.5*SR);t=np.arange(n)/SR;f=30+60*np.exp(-t*6);ph=2*np.pi*np.cumsum(f)/SR
    nz=lp(rng.standard_normal(n),1200)
    return v*(np.sin(ph)*np.exp(-t*1.6)+.4*nz/np.abs(nz).max()*np.exp(-t*4))
# ---------- mixing ----------
class Track:
    def __init__(s,dur):s.n=int(dur*SR);s.d=np.zeros((2,s.n));s.rev=np.zeros(s.n)
    def add(s,x,t,pan=0.,rev=0.):
        i=int(t*SR);
        if i>=s.n:return
        x=x[:s.n-i];l=np.cos((pan+1)*np.pi/4);r=np.sin((pan+1)*np.pi/4)
        s.d[0,i:i+len(x)]+=x*l*1.41;s.d[1,i:i+len(x)]+=x*r*1.41;s.rev[i:i+len(x)]+=x*rev
    def render(s,path,rv=.35):
        ir_n=int(2.2*SR);t=np.arange(ir_n)/SR;ir=rng.standard_normal(ir_n)*np.exp(-t*2.6);ir=lp(ir,5000);ir/=np.sqrt((ir**2).sum())
        L=1<<int(np.ceil(np.log2(s.n+ir_n)));R=np.fft.irfft(np.fft.rfft(s.rev,L)*np.fft.rfft(ir,L),L)[:s.n]
        out=s.d.copy();out[0]+=R*rv;out[1]+=np.roll(R,int(.013*SR))*rv
        out=np.tanh(out*1.1)/1.1
        fade=int(.3*SR);out[:,-fade:]*=np.linspace(1,0,fade);out[:,:int(.01*SR)]*=np.linspace(0,1,int(.01*SR))
        pk=np.abs(out).max();out=out/pk*.89
        raw=(out.T*32767).astype('<i2').tobytes()
        subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar',str(SR),'-ac','2','-i','-','-af','loudnorm=I=-15:TP=-1.2:LRA=9','-ar','44100','-b:a','96k',path],input=raw,check=True)
# ---------- music ----------
D=38 # D2
def beat_hiphop(tr,t0,bars,spb,var=0,vel=1.,chenda_fill=False):
    # half-time swagger beat, 16 steps per bar
    K=[0,7,10] if var==0 else [0,3,7,10,14]; S=[8]; 
    for b in range(bars):
        bt=t0+b*16*spb
        for k in K:tr.add(kick(.95*vel),bt+k*spb,0,.05)
        for s in S:tr.add(clap(.75*vel),bt+s*spb,.05,.25);tr.add(snare(.4*vel),bt+s*spb,-.05,.2)
        for h in range(16):
            if h%2==0 or (var and h in (7,15)):tr.add(hat(.35*vel*(1 if h%4 else .7)),bt+h*spb+(.012 if h%4==2 else 0),.3)
        if b%2==1:tr.add(hat(.3*vel,True),bt+14*spb,.35,.2)
        tr.add(tabla(.35*vel,'ge'),bt+5*spb,-.4,.1);tr.add(tabla(.3*vel,'na'),bt+6*spb,-.4,.1);tr.add(tabla(.25*vel,'na'),bt+13*spb,-.45,.1)
        if chenda_fill and b%4==3:
            for k in range(8):tr.add(chenda(.35*vel*(0.6+k/12),1+(k%2)*.12),bt+(12+k*.5)*spb,.45*(1 if k%2 else -1),.2)
THEME=[ # (step in 8ths, length in 8ths, note) — the whistle hook, 4 bars
 (0,1,'D5'),(1,1,'D5'),(3,1,'F#5'),(4,2,'G5'),(6,2,'A5'),
 (8,1,'Bb5'),(9,1,'A5'),(10,1,'G5'),(11,1,'F#5'),(12,4,'G5'),
 (16,1,'D5'),(17,1,'D5'),(19,1,'F#5'),(20,2,'G5'),(22,1,'A5'),(23,1,'C6'),
 (24,3,'Bb5'),(27,1,'A5'),(28,2,'Eb5'),(30,2,'D5')]
ANSWER=[(0,2,'A4'),(2,1,'Bb4'),(3,1,'A4'),(4,2,'G4'),(6,2,'F#4'),(8,3,'G4'),(11,1,'A4'),(12,4,'D4')]
BASSLINE=[(0,3,D),(3,1,D),(6,1,D+12),(8,3,D+1),(11,1,D),(14,2,D-2)]  # 8ths per bar pattern (D, Eb, C)
def play_bass(tr,t0,bars,s8,v=1.,kind='808'):
    for b in range(bars):
        for st,ln,m in BASSLINE:
            mm=m+(5 if b%4==2 else 0)
            x=bass808(mm,ln*s8*.95,.6*v) if kind=='808' else sawbass(mm+12,ln*s8*.9,.8*v,500)
            tr.add(x,t0+(b*16+st)*s8/2,0,.0)
def play_mel(tr,t0,mel,s8,inst='whistle',v=1.,trans=0,pan=0.,rev=.35,oct_brass=False):
    for st,ln,nn in mel:
        m=note(nn)+trans
        if inst=='whistle':x=whistle(m,ln*s8*.92,.68*v,slide_from=m-2 if ln>=2 else None)
        else:x=brass([m-12,m-5] if oct_brass else [m-12],ln*s8*.9,1.2*v,2200)
        tr.add(x,t0+st*s8,pan,rev)
def section_theme_a(dur,bpm=83,parts=('intro',)): pass
def build_set(bpm,root_names):
    pass
# ===== SET A (83 BPM, swagger) =====
def A_intro():
    bpm=83;b=60/bpm;s8=b/2;dur=9.45;tr=Track(dur)
    tr.add(drone(dur,1.),0,0,.3)
    play_mel(tr,.4,THEME[:9],s8,'whistle',.95,0,-.1,.6)
    for k in range(12):tr.add(chenda(.25+.04*k,1+(k%3)*.1),5.6+k*s8/2,.4*(1 if k%2 else -1),.25)
    tr.add(riser(2.6,.7),5.4,0,.3);tr.add(impact(1.),8.15,0,.5);tr.add(brass([note('D3'),note('A3'),note('D4')],1.1,1.4,2600),8.15,0,.4)
    tr.render(OUT+'o_a_intro.mp3')
def A_theme():
    bpm=83;b=60/bpm;s8=b/2;bar=4*b;dur=40.15;tr=Track(dur);s16=b/4
    tr.add(drone(dur,.7),0,0,.3)
    beat_hiphop(tr,0,14,s16,0,1.,True)
    play_bass(tr,0,14,s8)
    for rep in range(3):
        t0=rep*4*bar
        play_mel(tr,t0+0*bar,THEME,s8,'whistle',1.,0,-.1)
        play_mel(tr,t0+0*bar+2*bar,ANSWER,s8,'brass',.75 if rep==0 else 1.,0,.2,.25,rep>0)
        if rep>=1:
            for k,ch in enumerate([['D3','A3','D4'],['Eb3','G3','Bb3'],['C3','G3','C4'],['D3','F#3','A3']]):tr.add(strings([note(c) for c in ch],bar*.98,.9),t0+k*bar,0,.5)
    t0=12*bar;play_mel(tr,t0,THEME[:9],s8,'brass',1.2,0,0,.4,True);tr.add(impact(.6),dur-1.9,0,.5)
    tr.render(OUT+'o_a_theme.mp3')
def A_tension():
    bpm=83;b=60/bpm;dur=12.5;tr=Track(dur)
    tr.add(drone(dur,1.2,D-12),0,0,.4)
    t=0.;gap=b
    while t<dur-1.2:
        tr.add(kick(.6),t,0,.1);tr.add(kick(.35),t+.18,0,.1);t+=gap;gap=max(.32,gap*.93)
    t=0.;g=b/2
    while t<dur-.8:tr.add(hat(.25),t,.4);t+=g;g=max(.07,g*.95)
    for k,ch in enumerate([['D3','A3'],['Eb3','Bb3'],['D3','A3'],['Eb3','A3','C4']]):tr.add(strings([note(c) for c in ch],3.0,1.1),k*3.0,0,.6)
    tr.add(riser(4.5,.9),dur-4.6,0,.4)
    play_mel(tr,3.,[(0,6,'A5'),(6,6,'Bb5'),(12,10,'A5')],.34,'whistle',.5,0,0,.8)
    tr.render(OUT+'o_a_tension.mp3')
def A_break():
    bpm=83;b=60/bpm;s16=b/4;dur=9.05;tr=Track(dur)
    pat=[0,3,6,8,10,11,14]
    for bar in range(2):
        for st in pat:
            t=bar*16*s16+st*s16
            if (bar,st) in ((1,10),(1,11)):continue
            tr.add(brass([note('D3'),note('Eb4')],s16*.8,1.3,2600),t,0,.2);tr.add(kick(.9),t,0,.05)
        tr.add(clap(.8),bar*16*s16+8*s16,0,.4)
    t2=2*16*s16;tr.add(impact(.9),t2,0,.6)
    for k in range(10):tr.add(chenda(.3+.05*k,1.1),t2+.4+k*s16,.3*(1 if k%2 else -1),.3)
    play_mel(tr,t2+.3,[(0,2,'D6'),(2,2,'C6'),(4,4,'Bb5'),(8,6,'A5')],s16*2,'whistle',.7,0,0,.7)
    tr.render(OUT+'o_a_break.mp3')
def A_climax():
    bpm=83;b=60/bpm;s8=b/2;s16=b/4;bar=4*b;dur=12.55;tr=Track(dur)
    beat_hiphop(tr,0,4,s16,1,1.1,True);play_bass(tr,0,4,s8,1.1)
    play_mel(tr,0,THEME,s8,'brass',1.3,0,0,.35,True);play_mel(tr,0,THEME,s8,'whistle',.8,12,-.2,.4)
    for k,ch in enumerate([['D3','A3','D4'],['Eb3','G3','Bb3'],['C3','G3','C4'],['D3','F#3','A3']]):tr.add(strings([note(c) for c in ch],bar*.98,1.1),k*bar,0,.5)
    tr.add(impact(1.1),dur-1.0,0,.6);tr.add(brass([note('D3'),note('A3'),note('D4'),note('F#4')],1.,1.6,3000),dur-1.0,0,.5)
    tr.render(OUT+'o_a_climax.mp3')
# ===== SET B (99 BPM, drive) =====
GROOVE=[(0,1,'D4'),(2,1,'F#4'),(3,1,'G4'),(4,1,'A4'),(6,2,'G4'),(8,1,'F#4'),(9,1,'G4'),(10,2,'Eb4'),(12,4,'D4')]
HOOK_B=[(0,2,'A5'),(2,1,'Bb5'),(3,1,'A5'),(4,2,'G5'),(6,1,'A5'),(7,1,'C6'),(8,4,'D6'),(12,2,'C6'),(14,2,'Bb5'),
        (16,2,'A5'),(18,1,'G5'),(19,1,'F#5'),(20,4,'G5'),(24,2,'Eb5'),(26,2,'F#5'),(28,4,'D5')]
def beat_drive(tr,t0,bars,s16,vel=1.,full=True):
    for b in range(bars):
        bt=t0+b*16*s16
        for k in (0,6,8,11) if full else (0,8):tr.add(kick(.9*vel),bt+k*s16,0,.05)
        for s in (4,12):tr.add(snare(.6*vel),bt+s*s16,0,.25);tr.add(clap(.45*vel),bt+s*s16,.1,.25)
        for h in range(16):tr.add(hat(.28*vel*(1.2 if h%2 else .8)),bt+h*s16,.3)
        for k in (2,7,10,15):tr.add(tabla(.28*vel,'na' if k%2 else 'ge'),bt+k*s16,-.4,.1)
        if full and b%4==3:
            for k in range(8):tr.add(chenda(.32*vel*(0.7+k/14),1+(k%2)*.1),bt+(8+k)*s16,.45*(1 if k%2 else -1),.2)
def bass_drive(tr,t0,bars,s16,v=1.):
    roots=[D,D,D+1,D-2]
    for b in range(bars):
        r=roots[b%4]
        for k in range(16):
            if k in (0,3,6,8,10,11,14):tr.add(sawbass(r+12+(12 if k==10 else 0),s16*.85,.85*v,700),t0+(b*16+k)*s16)
def B_set():
    bpm=99;b=60/bpm;s16=b/4;s8=b/2;bar=4*b
    # groove 27.35s ~ 11 bars
    dur=27.35;tr=Track(dur);tr.add(drone(dur,.55),0,0,.3)
    for k in range(4):tr.add(hat(.3),k*b,0.3)
    beat_drive(tr,b*1,10,s16,.9,False);bass_drive(tr,b*1,10,s16,.9)
    for rep in range(2):play_mel(tr,b+(2+rep*4)*bar,GROOVE+[(16+st,ln,n) for st,ln,n in GROOVE],s8,'whistle',.75,12,-.2,.35)
    tr.render(OUT+'o_b_groove.mp3')
    # build 48s ~ 19.8 bars
    dur=48.;tr=Track(dur);tr.add(drone(dur,.6),0,0,.3)
    beat_drive(tr,0,19,s16,1.,True);bass_drive(tr,0,19,s16)
    for rep in range(4):
        t0=rep*4*bar;play_mel(tr,t0,HOOK_B,s8,'whistle' if rep%2==0 else 'brass',1. if rep%2==0 else 1.1,0,0,.35,rep>=2)
        if rep>=1:
            for k,ch in enumerate([['D3','A3','D4'],['D3','F#3','A3'],['Eb3','G3','Bb3'],['C3','G3','C4']]):tr.add(strings([note(c) for c in ch],bar*.98,.8),t0+k*bar,0,.45)
    tr.add(riser(bar*2,.8),16*bar,0,.3);tr.add(impact(.8),18*bar,0,.5)
    tr.render(OUT+'o_b_build.mp3')
    # peak 47.6s
    dur=47.6;tr=Track(dur);beat_drive(tr,0,19,s16,1.15,True);bass_drive(tr,0,19,s16,1.1)
    for rep in range(4):
        t0=rep*4*bar;play_mel(tr,t0,HOOK_B,s8,'brass',1.3,0,0,.35,True);play_mel(tr,t0,HOOK_B,s8,'whistle',.7,12,-.25,.45)
        for k,ch in enumerate([['D3','A3','D4'],['D3','F#3','A3'],['Eb3','G3','Bb3'],['C3','G3','C4']]):tr.add(strings([note(c) for c in ch],bar*.98,1.),t0+k*bar,0,.45)
        play_mel(tr,t0+2*bar,ANSWER,s8,'brass',.8,12,.3,.3)
    tr.add(impact(1.),dur-1.4,0,.6)
    tr.render(OUT+'o_b_peak.mp3')
which=sys.argv[1:] or ['all']
if 'all' in which or 'a' in which:A_intro();A_theme();A_tension();A_break();A_climax()
if 'all' in which or 'b' in which:B_set()
print('ok')
