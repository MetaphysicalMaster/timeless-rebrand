(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,38835,e=>{"use strict";var t=e.i(44180),a=e.i(1529),r=e.i(46648),i=e.i(26843),n=e.i(64556),s=e.i(21348),o=e.i(88287);let l=`
  uniform float uTime;
  uniform float uFlow;     // 1 = full storm, eases toward calm as you scroll
  uniform vec2  uPointer;  // -1..1, gentle breeze deflection
  uniform float uPointerStr;
  uniform float uGust;     // 0..1 scroll-wind strength (fast scroll = gust)
  uniform float uSweep;    // signed scroll-wind impulse (direction of travel)

  attribute vec3 aOffset;   // base position in the field
  attribute vec3 aAxis;     // tumble axis (normalized)
  attribute float aPhase;   // per-petal time offset
  attribute float aSpeed;   // per-petal fall speed
  attribute float aScale;   // per-petal size
  attribute float aDepth;   // 0 = far, 1 = near (depth layer)
  attribute float aColorMix;// 0..1 along the sakura ramp
  attribute float aFlutter; // 0..1 per-petal flutter amplitude/character
  attribute float aTexIndex;// which of the 3 atlas petal variants this instance uses

  varying vec2  vUv;
  varying float vDepth;
  varying float vColorMix;
  varying float vFade;
  varying float vFacing;    // |n\xb7view| — how broadside the petal faces us (light)
  varying float vTexIndex;  // -> fragment: select the atlas cell

  // cheap rotation matrix about an arbitrary axis
  mat3 rotAxis(vec3 a, float angle) {
    float s = sin(angle);
    float c = cos(angle);
    float oc = 1.0 - c;
    return mat3(
      oc*a.x*a.x + c,      oc*a.x*a.y - a.z*s, oc*a.z*a.x + a.y*s,
      oc*a.x*a.y + a.z*s,  oc*a.y*a.y + c,     oc*a.y*a.z - a.x*s,
      oc*a.z*a.x - a.y*s,  oc*a.y*a.z + a.x*s, oc*a.z*a.z + c
    );
  }

  // Euler rotation (pitch X, yaw Y, roll Z) — composed for a true 3D tumble.
  mat3 rotXYZ(vec3 e) {
    float cx = cos(e.x), sx = sin(e.x);
    float cy = cos(e.y), sy = sin(e.y);
    float cz = cos(e.z), sz = sin(e.z);
    mat3 rx = mat3(1.0,0.0,0.0, 0.0,cx,-sx, 0.0,sx,cx);
    mat3 ry = mat3(cy,0.0,sy, 0.0,1.0,0.0, -sy,0.0,cy);
    mat3 rz = mat3(cz,-sz,0.0, sz,cz,0.0, 0.0,0.0,1.0);
    return rz * ry * rx;
  }

  void main() {
    vUv = uv;
    vDepth = aDepth;
    vColorMix = aColorMix;
    vTexIndex = aTexIndex;

    // --- wind field: down-and-across drift, eased by uFlow ---
    float t = uTime * (0.35 + aSpeed * 0.55) * mix(0.45, 1.0, uFlow) + aPhase * 6.2831;

    // parallax: near petals fall faster + travel further across
    float par = mix(0.55, 1.4, aDepth);

    // vertical fall wraps within the field height (~ 16 units), so it loops.
    float fallH = 16.0;
    float fall = mod(aOffset.y - t * aSpeed * par, fallH) - fallH * 0.5;

    // lateral sway — a breeze that gusts; near petals sway wider, and the
    // scroll-gust widens everyone's arc (the wind leaning into the field).
    float sway = (sin(t * 0.6 + aPhase * 10.0) * (0.6 * par)
               + cos(t * 0.27 + aOffset.x) * 0.35 * par)
               * (1.0 + uGust * 1.4);

    // pointer breeze — a soft, eased push in the cursor direction.
    vec2 breeze = uPointer * uPointerStr * (0.9 * par);

    vec3 pos = aOffset;
    pos.y = fall;
    pos.x += sway + breeze.x;
    pos.y += breeze.y * 0.5;
    pos.z += sin(t * 0.4 + aPhase * 4.0) * 0.4 * par; // depth wobble

    // scroll-wind sweep — the visitor's own motion is the wind. Scrolling down
    // lifts the field past the eye and shears it across (a diagonal gust);
    // scrolling up reverses it. Near petals travel furthest, so the parallax
    // depth holds even mid-gust. Per-petal phase keeps the sweep organic.
    float swayBias = 0.85 + 0.3 * sin(aPhase * 12.566);
    pos.y += uSweep * (1.5 * par) * swayBias;
    pos.x -= uSweep * (0.7 * par) * swayBias;

    // --- FLUTTER: a real cherry-blossom tumble, NOT a 2D sliver spin ---
    // A falling sakura petal does not spin flat on one axis — it flutters: it
    // PITCHES (rocks forward/back over its width), ROLLS (rocks side to side),
    // and YAWS (turns to face you, then away) on three INDEPENDENT slow waves at
    // incommensurate rates, with a slow continuous base tumble underneath. The
    // gust deepens the rocking. This is what makes it read as a 3D petal on air.
    float fl = 0.6 + aFlutter * 0.9;                 // per-petal flutter character
    float gustFl = 1.0 + uGust * 1.1;                // wind deepens the rocking
    // base slow tumble about the petal's own axis — keeps motion non-repeating
    float baseSpin = t * (0.28 + aSpeed * 0.42) + aPhase * 9.0;
    vec3 euler = vec3(
      // pitch: the dominant rocking, broadside ↔ edge-on (the "flutter")
      sin(t * (0.9 * fl) + aPhase * 6.0) * (1.15 * gustFl),
      // yaw: turns the face toward / away from the eye
      baseSpin + sin(t * (0.55 * fl) + aPhase * 3.7) * 0.7,
      // roll: gentle side-to-side rock
      sin(t * (0.7 * fl) + aPhase * 11.0) * (0.85 * gustFl)
    );
    mat3 rot = rotXYZ(euler);

    // petal billows: a faint membrane flex as it rocks; a gust deepens it.
    vec3 local = position;
    local.x *= 1.0 + (0.08 + 0.08 * uGust) * sin(t * 1.3 + aPhase * 7.0);

    vec3 vtx = rot * (local * aScale * mix(0.62, 1.22, aDepth));
    vec3 world = pos + vtx;

    // Light-catching: how broadside the petal faces the camera (+z view dir).
    // The cupped, tessellated surface gives a real normal; we read its facing so
    // the fragment can flash the petal brighter when it turns flat to the eye and
    // dim it toward translucency when it tips edge-on — that catch-the-light beat.
    vec3 n = normalize(rot * normalize(normal));
    vFacing = abs(n.z);

    // soft-focus fade for the far layer (bokeh) + edge fade near field bounds.
    float edge = smoothstep(8.0, 5.5, abs(fall));
    vFade = edge * mix(0.5, 1.0, aDepth);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);
  }
`,u=`
  precision highp float;

  uniform sampler2D uPetalTex; // 3-petal ATLAS (real photographed sakura cutouts)
  uniform float uFlow;
  uniform bool  uBokeh;

  varying vec2  vUv;
  varying float vDepth;
  varying float vFade;
  varying float vFacing;       // |n\xb7view| — broadside (1) vs edge-on (0)
  varying float vTexIndex;     // 0..2 — which atlas petal this instance carries

  void main() {
    // ── COLOUR + SILHOUETTE come straight from the photographed petal ──
    // Three real petal variants are packed left→right in one atlas; pick this
    // instance's cell and inset the UV so linear filtering never bleeds across
    // the cell seam. The photo carries the shape + white→rose gradient + veins.
    float cell = floor(vTexIndex + 0.5);
    vec2 auv = vec2((clamp(vUv.x, 0.04, 0.96) + cell) / 3.0, clamp(vUv.y, 0.02, 0.98));
    vec4 tex = texture2D(uPetalTex, auv);
    if (tex.a < 0.04) discard;

    vec3 col = tex.rgb;

    // Catch-the-light from the cupped geometry's rotated normal: the petal reads
    // a touch brighter when it turns broadside to the eye and dims slightly as it
    // tips edge-on — the dimensional shimmer that sells a real petal on the wind.
    col *= mix(0.80, 1.14, vFacing);
    // a faint broadside sheen so a flat-facing petal glints over the sumi-black.
    col += vec3(0.05, 0.035, 0.04) * smoothstep(0.74, 1.0, vFacing);

    // ── ALPHA: the photo's own cutout, modulated by depth + facing + fade ──
    float alpha = tex.a * vFade * mix(0.86, 1.0, vDepth);

    // edge-on petals go MORE translucent (light through a thin membrane);
    // broadside petals stay more opaque — realistic flutter translucency.
    alpha *= mix(0.62, 1.0, smoothstep(0.06, 0.85, vFacing));

    // far-layer soft focus (bokeh): soften far-petal alpha for depth.
    if (uBokeh) {
      alpha *= mix(0.78, 1.0, vDepth);
    }

    gl_FragColor = vec4(col, alpha);
  }
`;function c({pointer:e,flowRef:a,lite:i}){let f=(0,n.useRef)(null),h=(0,n.useRef)({x:0,y:0,s:0}),d=(0,n.useRef)(1),p=(0,n.useRef)(0),m=(0,n.useRef)(0),v=(0,n.useRef)(0),g=i?1100:2400,{geometry:w,uniforms:x}=(0,n.useMemo)(()=>{let e=new s.InstancedBufferGeometry,t=function(){let e=new s.PlaneGeometry(1,1,6,6),t=e.attributes.position;for(let e=0;e<t.count;e++){let a=t.getX(e),r=t.getY(e)+.5,i=a*a*.62*(.35+.65*r),n=.12*Math.sin(r*Math.PI);t.setZ(e,i-n)}return t.needsUpdate=!0,e.computeVertexNormals(),e}();e.index=t.index,e.attributes.position=t.attributes.position,e.attributes.uv=t.attributes.uv,e.attributes.normal=t.attributes.normal;let a=new Float32Array(3*g),r=new Float32Array(3*g),n=new Float32Array(g),o=new Float32Array(g),l=new Float32Array(g),u=new Float32Array(g),c=new Float32Array(g),f=new Float32Array(g),h=new Float32Array(g),d=1337,p=()=>{d|=0;let e=Math.imul((d=d+0x6d2b79f5|0)^d>>>15,1|d);return(((e=e+Math.imul(e^e>>>7,61|e)^e)^e>>>14)>>>0)/0x100000000};for(let e=0;e<g;e++){let t=p(),i=t<.34?.33*p():t<.7?.33+.34*p():.67+.33*p();u[e]=i;let s=9+7*i;a[3*e]=(p()-.5)*s,a[3*e+1]=(p()-.5)*16,a[3*e+2]=-4+7*i+(p()-.5)*1.5;let d=p()-.5,m=p()-.5,v=p()-.5,g=Math.hypot(d,m,v)||1;r[3*e]=d/g,r[3*e+1]=m/g,r[3*e+2]=v/g,n[e]=p();let w=p();o[e]=w<.7?.32+.4*p():.9+.7*p(),l[e]=.14+.34*Math.pow(p(),1.7),f[e]=p(),c[e]=Math.pow(p(),3),h[e]=Math.floor(3*p())}e.setAttribute("aOffset",new s.InstancedBufferAttribute(a,3)),e.setAttribute("aAxis",new s.InstancedBufferAttribute(r,3)),e.setAttribute("aPhase",new s.InstancedBufferAttribute(n,1)),e.setAttribute("aSpeed",new s.InstancedBufferAttribute(o,1)),e.setAttribute("aScale",new s.InstancedBufferAttribute(l,1)),e.setAttribute("aDepth",new s.InstancedBufferAttribute(u,1)),e.setAttribute("aColorMix",new s.InstancedBufferAttribute(c,1)),e.setAttribute("aFlutter",new s.InstancedBufferAttribute(f,1)),e.setAttribute("aTexIndex",new s.InstancedBufferAttribute(h,1)),e.instanceCount=g;let m=new s.TextureLoader().load("/timeless-rebrand/clients/hanami/petals-atlas.png");return m.colorSpace=s.SRGBColorSpace,m.anisotropy=4,m.wrapS=s.ClampToEdgeWrapping,m.wrapT=s.ClampToEdgeWrapping,m.generateMipmaps=!1,m.minFilter=s.LinearFilter,m.magFilter=s.LinearFilter,{geometry:e,uniforms:{uTime:{value:0},uFlow:{value:1},uGust:{value:0},uSweep:{value:0},uPointer:{value:new s.Vector2(0,0)},uPointerStr:{value:0},uPetalTex:{value:m},uBokeh:{value:!i}}}},[g,i]);return(0,r.useFrame)((t,r)=>{let i=f.current;if(!i)return;let n=Math.min(r,1/30),s=o.windBus.velocity,l=Math.min(1,Math.abs(s)/55),u=l>m.current?Math.min(1,7*n):Math.min(1,1.15*n);m.current+=(l-m.current)*u;let c=Math.max(-1,Math.min(1,s/70));v.current+=(c-v.current)*Math.min(1,4.5*n),p.current+=n*(1+2.4*m.current),o.windBus.velocity*=Math.exp(-(3.2*n)),o.windBus.gust=m.current,i.uniforms.uTime.value=p.current,i.uniforms.uGust.value=m.current,i.uniforms.uSweep.value=v.current;let g=e.current??{x:0,y:0,active:0},w=1-Math.pow(.0022,n);h.current.x+=(g.x-h.current.x)*w,h.current.y+=(g.y-h.current.y)*w,h.current.s+=(g.active-h.current.s)*Math.min(1,2.5*n),i.uniforms.uPointer.value.set(h.current.x,h.current.y),i.uniforms.uPointerStr.value=h.current.s;let x=a.current??1;d.current+=(x-d.current)*Math.min(1,1.6*n),i.uniforms.uFlow.value=d.current}),(0,t.jsx)("mesh",{geometry:w,frustumCulled:!1,children:(0,t.jsx)("shaderMaterial",{ref:f,vertexShader:l,fragmentShader:u,uniforms:x,transparent:!0,depthWrite:!1,depthTest:!0,side:s.DoubleSide,blending:s.NormalBlending})})}function f({children:e}){let a=(0,n.useRef)(null),i=(0,n.useRef)(0);return(0,r.useFrame)(({clock:e},t)=>{let r=a.current;if(!r)return;let n=e.getElapsedTime(),s=Math.min(t,1/30);i.current+=(o.windBus.gust-i.current)*Math.min(1,2.5*s),r.rotation.z=.03*Math.sin(.08*n)-.055*i.current,r.position.x=.3*Math.sin(.05*n)}),(0,t.jsx)("group",{ref:a,children:e})}function h({lite:e}){let{gl:t}=(0,i.useThree)();return(0,n.useEffect)(()=>{t.setPixelRatio(Math.min(window.devicePixelRatio,e?1.5:2))},[t,e]),null}e.s(["default",0,function({lite:e=!1,flowRef:r}){let i=(0,n.useRef)({x:0,y:0,active:0}),s=(0,n.useRef)(null),[o,l]=(0,n.useState)(!0);return(0,n.useEffect)(()=>{let e=s.current;if(!e||"u"<typeof IntersectionObserver)return;let t=new IntersectionObserver(([e])=>l(e.isIntersecting),{rootMargin:"140px"});t.observe(e);let a=()=>l("visible"===document.visibilityState);return document.addEventListener("visibilitychange",a),()=>{t.disconnect(),document.removeEventListener("visibilitychange",a)}},[]),(0,t.jsx)("div",{ref:s,className:"absolute inset-0",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();i.current.x=(e.clientX-t.left)/t.width*2-1,i.current.y=-((e.clientY-t.top)/t.height*2-1),i.current.active=1},onPointerLeave:()=>{i.current.active=0},children:(0,t.jsxs)(a.Canvas,{frameloop:o?"always":"never",camera:{position:[0,0,9],fov:46},dpr:[1,2],gl:{antialias:!0,alpha:!0,powerPreference:"high-performance"},style:{position:"absolute",inset:0},children:[(0,t.jsx)(h,{lite:e}),(0,t.jsx)(f,{children:(0,t.jsx)(c,{pointer:i,flowRef:r,lite:e})})]})})}])},15922,e=>{e.n(e.i(38835))}]);