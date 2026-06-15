(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,3782,e=>{"use strict";var t=e.i(64556),r=e.i(46648),i=e.i(21348);let o=t.forwardRef(({children:e,enabled:o=!0,speed:a=1,rotationIntensity:n=1,floatIntensity:s=1,floatingRange:l=[-.1,.1],autoInvalidate:u=!1,...c},d)=>{let m=t.useRef(null);t.useImperativeHandle(d,()=>m.current,[]);let h=t.useRef(1e4*Math.random());return(0,r.useFrame)(e=>{var t,r;if(!o||0===a)return;u&&e.invalidate();let c=h.current+e.clock.elapsedTime;m.current.rotation.x=Math.cos(c/4*a)/8*n,m.current.rotation.y=Math.sin(c/4*a)/8*n,m.current.rotation.z=Math.sin(c/4*a)/20*n;let d=Math.sin(c/4*a)/10;d=i.MathUtils.mapLinear(d,-.1,.1,null!=(t=null==l?void 0:l[0])?t:-.1,null!=(r=null==l?void 0:l[1])?r:.1),m.current.position.y=d*s,m.current.updateMatrix()}),t.createElement("group",c,t.createElement("group",{ref:m,matrixAutoUpdate:!1},e))});e.s(["Float",0,o])},1020,e=>{"use strict";var t=e.i(44180),r=e.i(1529),i=e.i(46648),o=e.i(26843),a=e.i(3782),n=e.i(64556),s=e.i(21348);let l=`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,u=`
  precision highp float;

  uniform float u_time;
  uniform vec2  u_resolution;
  uniform vec2  u_pointer;     // -1..1 parallax target (smoothed on CPU)
  uniform float u_intensity;   // 0..1 master fade-in
  uniform float u_rise;        // 0..1 SIGNATURE day-arc: scroll raises the sun
  uniform vec3  u_dawn;        // warm low band
  uniform vec3  u_mid;         // daylight blue
  uniform vec3  u_high;        // azure
  uniform vec3  u_deep;        // horizon ink
  uniform vec3  u_blush;       // faint rose accent

  varying vec2 vUv;

  // --- Ashima simplex noise ---
  vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }
  vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0,0.0) : vec2(0.0,1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
           + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
    m = m*m; m = m*m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x  = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  // fractional Brownian motion — layered noise for volumetric softness
  float fbm(vec2 p){
    float total = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 5; i++){
      total += amp * snoise(p * freq);
      freq *= 2.0;
      amp *= 0.5;
    }
    return total;
  }

  void main(){
    // Aspect-correct UV, centered
    vec2 uv = vUv;
    float aspect = u_resolution.x / max(u_resolution.y, 1.0);
    vec2 p = (uv - 0.5);
    p.x *= aspect;

    // SIGNATURE DAY-ARC: scroll raises the sun + brightens the sky ("elevate").
    // rise 0 = low dawn sun, warm + soft; rise 1 = high, luminous clear day.
    float rise = clamp(u_rise, 0.0, 1.0);
    // eased so the climb feels weighted then airy
    float riseE = rise * rise * (3.0 - 2.0 * rise);

    // Gentle parallax: clouds drift toward the cursor (eased on CPU)
    vec2 par = u_pointer * 0.055;

    // Slightly slower base drift for a calmer, more luxe cadence
    float t = u_time * 0.017;

    // Domain-warped fbm for organic cloud structure
    vec2 q = vec2(
      fbm(p * 1.25 + par + vec2(0.0, t)),
      fbm(p * 1.25 + par + vec2(5.2, 1.3 - t))
    );
    vec2 r = vec2(
      fbm(p * 1.25 + 1.55 * q + vec2(1.7, 9.2) + t * 0.8),
      fbm(p * 1.25 + 1.55 * q + vec2(8.3, 2.8) - t * 0.6)
    );
    float clouds = fbm(p * 1.25 + 1.7 * r);
    clouds = clouds * 0.5 + 0.5; // 0..1

    // Vertical clear-sky gradient (luminous crown, soft horizon). As the sun
    // climbs the whole field lifts toward clear daylight blue.
    float v = uv.y;
    vec3 baseDeep = mix(u_deep, u_high, riseE * 0.5);
    vec3 grad = mix(baseDeep, u_high, smoothstep(0.0, 0.55, v));
    grad = mix(grad, u_mid, smoothstep(0.4, 0.92, v));
    // crown brightens with the day
    grad = mix(grad, mix(u_mid, vec3(1.0), 0.35),
               smoothstep(0.55, 1.0, v) * riseE * 0.4);

    // THE SUN — the brand's rising-sun mark made dimensional. It travels in a
    // gentle arc from low-left (dawn) up toward center-high (clear day), with
    // a slow live bob so it reads as a living light, not a sticker.
    float bob = 0.006 * sin(u_time * 0.18);
    vec2 sun = vec2(
      mix(0.17, 0.40, riseE),
      mix(0.13, 0.74, riseE) + bob
    );
    vec2 ad = vec2(aspect, 1.0);
    float sunDist = distance(uv * ad, sun * ad);

    // disc + halo: a crisp warm-white core, a tight gold ring, a wide bloom
    float disc   = smoothstep(0.085, 0.045, sunDist);
    float ring   = smoothstep(0.135, 0.085, sunDist) - smoothstep(0.085, 0.045, sunDist);
    float sunCore = smoothstep(0.30, 0.0, sunDist);
    float sunGlow = smoothstep(0.78, 0.04, sunDist);

    // dawn warmth eases to luminous daylight white as it climbs
    vec3 sunHue = mix(u_dawn, mix(u_dawn, vec3(1.0), 0.55), riseE);
    float palShift = 0.5 + 0.5 * sin(u_time * 0.045);
    grad = mix(grad, sunHue, sunGlow * (0.40 + 0.16 * palShift) * (0.7 + 0.3 * riseE));
    grad = mix(grad, mix(sunHue, vec3(1.0), 0.55), sunCore * 0.5);
    // the gold ring (the logo "rising sun" arc) stays present through the climb
    grad = mix(grad, mix(u_dawn, vec3(1.0), 0.35), ring * (0.55 + 0.25 * (1.0 - riseE)));
    // the bright disc itself
    grad = mix(grad, mix(vec3(1.0), u_dawn, 0.18), disc * (0.78 + 0.18 * riseE));

    // Faint warm rose blush upper-right for atmospheric depth (fades by day)
    float blush = smoothstep(0.62, 0.0, distance(uv, vec2(0.86, 0.9)));
    grad = mix(grad, u_blush, blush * 0.2 * (1.0 - riseE * 0.6));

    // Layer soft volumetric clouds — luminous, low-contrast; warmed near the sun
    float cloudBand = smoothstep(0.44, 0.96, clouds);
    vec3 cloudColor = mix(u_high, vec3(1.0), 0.68 + 0.12 * riseE);
    cloudColor = mix(cloudColor, mix(cloudColor, u_dawn, 0.6), sunGlow * 0.5);
    vec3 col = mix(grad, cloudColor, cloudBand * (0.5 + 0.1 * riseE));

    // A second, higher wisp layer for depth
    float wisp = smoothstep(0.6, 1.0, fbm(p * 2.35 + par * 1.4 + vec2(t * 1.35, -t)));
    col = mix(col, vec3(1.0), wisp * (0.11 + 0.05 * riseE));

    // "Breath": gentle global luminance pulse — the living, serene signature
    float breath = 0.975 + 0.025 * sin(u_time * 0.11);
    col *= breath;
    // overall lift toward bright daylight as the sun reaches its height
    col *= mix(0.94, 1.06, riseE);

    // Subtle vignette to seat the headline (relaxes as the sky opens up)
    float vig = smoothstep(1.25, 0.35, length(p));
    col *= mix(mix(0.88, 0.94, riseE), 1.0, vig);

    // Very light atmospheric grain to kill banding on the smooth gradient
    float grain = fract(sin(dot(uv * u_resolution, vec2(12.9898, 78.233))) * 43758.5453);
    col += (grain - 0.5) * 0.012;

    // Master fade-in
    col = mix(u_deep * 0.62, col, clamp(u_intensity, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;function c({pointer:e,rise:r}){let a=(0,n.useRef)(null),{size:d,viewport:m}=(0,o.useThree)(),h=(0,n.useRef)({x:0,y:0}),v=(0,n.useRef)(0),f=(0,n.useMemo)(()=>({u_time:{value:0},u_resolution:{value:new s.Vector2(d.width,d.height)},u_pointer:{value:new s.Vector2(0,0)},u_intensity:{value:0},u_rise:{value:0},u_dawn:{value:new s.Color("#f6e0bd")},u_mid:{value:new s.Color("#bfd8f1")},u_high:{value:new s.Color("#84b3ea")},u_deep:{value:new s.Color("#5076b4")},u_blush:{value:new s.Color("#f7d6d4")}}),[]);return(0,i.useFrame)(({clock:t},i)=>{let o=a.current;if(!o)return;o.uniforms.u_time.value=t.getElapsedTime(),o.uniforms.u_resolution.value.set(d.width,d.height);let n=e.current??{x:0,y:0},s=1-Math.pow(.001,i);h.current.x+=(n.x-h.current.x)*s,h.current.y+=(n.y-h.current.y)*s,o.uniforms.u_pointer.value.set(h.current.x,h.current.y);let l=r.current??0,u=1-Math.pow(.004,i);v.current+=(l-v.current)*u,o.uniforms.u_rise.value=v.current;let c=o.uniforms.u_intensity.value;o.uniforms.u_intensity.value=c+(1-c)*Math.min(1,1.6*i)}),(0,t.jsxs)("mesh",{scale:[m.width,m.height,1],children:[(0,t.jsx)("planeGeometry",{args:[1,1]}),(0,t.jsx)("shaderMaterial",{ref:a,vertexShader:l,fragmentShader:u,uniforms:f,depthWrite:!1})]})}function d({pointer:e,rise:r}){let o=(0,n.useRef)(null),l=(0,n.useMemo)(()=>{let e=document.createElement("canvas");e.width=e.height=128;let t=e.getContext("2d"),r=t.createRadialGradient(64,64,0,64,64,64);return r.addColorStop(0,"rgba(255,253,247,0.95)"),r.addColorStop(.35,"rgba(238,245,255,0.55)"),r.addColorStop(.7,"rgba(210,228,248,0.16)"),r.addColorStop(1,"rgba(210,228,248,0)"),t.fillStyle=r,t.fillRect(0,0,128,128),new s.CanvasTexture(e)},[]);return(0,i.useFrame)((t,i)=>{let a=o.current;if(!a)return;let n=e.current??{x:0,y:0},s=r.current??0,l=1-Math.pow(.0015,i);a.position.x+=(.5*n.x-a.position.x)*l,a.position.y+=(-.25+.45*s+.3*n.y-a.position.y)*l}),(0,t.jsx)("group",{ref:o,position:[1.25,-.25,1],children:(0,t.jsx)(a.Float,{speed:1,rotationIntensity:0,floatIntensity:.5,children:(0,t.jsx)("sprite",{scale:[1.1,1.1,1],children:(0,t.jsx)("spriteMaterial",{map:l,transparent:!0,depthWrite:!1,blending:s.AdditiveBlending,opacity:.85})})})})}e.s(["default",0,function({showOrb:e=!0,rise:i}){let o=(0,n.useRef)({x:0,y:0}),a=(0,n.useRef)(0),s=i??a,l=(0,n.useRef)(null),[u,m]=(0,n.useState)(!0);(0,n.useEffect)(()=>{let e=l.current;if(!e||"u"<typeof IntersectionObserver)return;let t=new IntersectionObserver(([e])=>m(e.isIntersecting),{rootMargin:"0px",threshold:0});return t.observe(e),()=>t.disconnect()},[]);let h=u?"always":"never";return(0,t.jsxs)("div",{ref:l,className:"absolute inset-0",onPointerMove:e=>{let t=e.currentTarget.getBoundingClientRect();o.current.x=(e.clientX-t.left)/t.width*2-1,o.current.y=-((e.clientY-t.top)/t.height*2-1)},onPointerLeave:()=>{o.current.x=0,o.current.y=0},children:[(0,t.jsx)(r.Canvas,{orthographic:!0,frameloop:h,camera:{zoom:1,position:[0,0,1]},dpr:[1,1.5],gl:{antialias:!1,alpha:!1,powerPreference:"high-performance"},style:{position:"absolute",inset:0},children:(0,t.jsx)(c,{pointer:o,rise:s})}),e&&(0,t.jsx)(r.Canvas,{frameloop:h,camera:{position:[0,0,4],fov:42},dpr:[1,1.5],gl:{antialias:!0,alpha:!0,powerPreference:"high-performance"},style:{position:"absolute",inset:0,pointerEvents:"none"},children:(0,t.jsx)(d,{pointer:o,rise:s})})]})}],1020)},5781,e=>{e.n(e.i(1020))}]);