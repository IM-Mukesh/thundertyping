import {
  FallingWordsVisualClock,
  MAX_SCENE_SPRITES,
  MAX_SCENE_VERTICES,
  SCENE_VERTEX_STRIDE,
  clampVisual,
  createSceneSprites,
  crystalScreenPosition,
  fallingWordsCamera,
  projectFallingWordsPoint,
  resolveVisualQuality,
  screenToFallingWordsWorld,
  visualBudget,
  visualRandom,
  visualSize,
  type FallingWordsCamera,
  type FallingWordsRenderMode,
  type FallingWordsRenderQuality,
  type FallingWordsVisualFrame,
  type FallingWordsVisualState,
  type ResolvedVisualQuality,
  type SceneColor,
  type ScenePoint,
  type VisualBudget,
  type VisualDeviceHints,
  type VisualSize,
} from "@/lib/games/falling-words/visual-model";
import {
  MESH_FRAGMENT_SHADER, MESH_VERTEX_SHADER, SKY_FRAGMENT_SHADER, SKY_VERTEX_SHADER,
  SPRITE_FRAGMENT_SHADER, SPRITE_VERTEX_SHADER,
} from "@/lib/games/falling-words/shaders";

export interface FallingWordsRendererOptions {
  readonly quality: FallingWordsRenderQuality;
  readonly reducedMotion: boolean;
  readonly onMode?: (mode: FallingWordsRenderMode) => void;
  readonly deviceHints?: VisualDeviceHints;
  /** Request one coalesced frame after a context transition. */
  readonly onInvalidate?: () => void;
}

export interface FallingWordsSceneRenderer {
  readonly mode: FallingWordsRenderMode;
  readonly quality: ResolvedVisualQuality;
  readonly budget: VisualBudget;
  resize(width: number, height: number, dpr: number): void;
  /** now/sampleAt are monotonic browser timestamps, never engine elapsed time. */
  render(state: FallingWordsVisualState, laneCount: number, now: number, sampleAt?: number): void;
  suspend(): void;
  dispose(): void;
}

interface FrameRenderer extends FallingWordsSceneRenderer {
  draw(frame: FallingWordsVisualFrame): void;
}

const TAU = Math.PI * 2;
const SPRITE_STRIDE = 8;
const QUAD = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);

export function mixSceneColor(a: SceneColor, b: SceneColor, t: number): SceneColor {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function rotatePoint(point: ScenePoint, center: ScenePoint, yaw = 0, tilt = 0): ScenePoint {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), ct = Math.cos(tilt), st = Math.sin(tilt);
  const x = point[0] * cy + point[2] * sy;
  const z = point[2] * cy - point[0] * sy;
  return [center[0] + x * ct - point[1] * st, center[1] + x * st + point[1] * ct, center[2] + z];
}

/** Fixed-capacity, flat-normal triangle batch, reused for every render. */
export class FallingWordsGeometry {
  readonly data: Float32Array;
  readonly capacity: number;
  count = 0;
  opaqueCount = 0;
  clipped = false;

  constructor(capacity = MAX_SCENE_VERTICES) {
    this.capacity = Math.floor(clampVisual(capacity, 3, MAX_SCENE_VERTICES) / 3) * 3;
    this.data = new Float32Array(this.capacity * SCENE_VERTEX_STRIDE);
  }
  clear(): void { this.count = 0; this.opaqueCount = 0; this.clipped = false; }
  triangle(a: ScenePoint, b: ScenePoint, c: ScenePoint, color: SceneColor, emission = 0, alpha = 1): void {
    if (this.count + 3 > this.capacity) { this.clipped = true; return; }
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const length = Math.hypot(nx, ny, nz) || 1;
    for (const p of [a, b, c]) {
      const offset = this.count++ * SCENE_VERTEX_STRIDE;
      this.data[offset] = p[0]; this.data[offset + 1] = p[1]; this.data[offset + 2] = p[2];
      this.data[offset + 3] = nx / length; this.data[offset + 4] = ny / length; this.data[offset + 5] = nz / length;
      this.data[offset + 6] = color[0]; this.data[offset + 7] = color[1]; this.data[offset + 8] = color[2];
      this.data[offset + 9] = emission; this.data[offset + 10] = alpha;
    }
  }
  quad(a: ScenePoint, b: ScenePoint, c: ScenePoint, d: ScenePoint, color: SceneColor, emission = 0, alpha = 1): void {
    this.triangle(a, b, c, color, emission, alpha);
    this.triangle(a, c, d, color, emission, alpha);
  }
}

function box(batch: FallingWordsGeometry, center: ScenePoint, width: number, height: number, depth: number, tint: SceneColor, emission = 0): void {
  const [x, y, z] = center, w = width / 2, h = height / 2, d = depth / 2;
  const p: ScenePoint[] = [[x-w,y-h,z-d],[x+w,y-h,z-d],[x+w,y+h,z-d],[x-w,y+h,z-d],
    [x-w,y-h,z+d],[x+w,y-h,z+d],[x+w,y+h,z+d],[x-w,y+h,z+d]];
  for (const [a, b, c, e] of [[0,3,2,1],[4,5,6,7],[0,4,7,3],[1,2,6,5],[3,7,6,2],[0,1,5,4]]) {
    batch.quad(p[a], p[b], p[c], p[e], tint, emission);
  }
}

function frustum(batch: FallingWordsGeometry, center: ScenePoint, radius: number, topRadius: number, height: number, tint: SceneColor, segments: number, emission = 0): void {
  for (let i = 0; i < segments; i++) {
    const a = i * TAU / segments, b = (i + 1) * TAU / segments;
    const bottomA: ScenePoint = [center[0]+Math.cos(a)*radius, center[1], center[2]+Math.sin(a)*radius];
    const bottomB: ScenePoint = [center[0]+Math.cos(b)*radius, center[1], center[2]+Math.sin(b)*radius];
    const topA: ScenePoint = [center[0]+Math.cos(a)*topRadius, center[1]+height, center[2]+Math.sin(a)*topRadius];
    const topB: ScenePoint = [center[0]+Math.cos(b)*topRadius, center[1]+height, center[2]+Math.sin(b)*topRadius];
    batch.quad(bottomB, bottomA, topA, topB, tint, emission);
    batch.triangle([center[0],center[1]+height,center[2]], topB, topA, mixSceneColor(tint,[0.45,0.55,0.65],0.16), emission);
  }
}

function crystal(batch: FallingWordsGeometry, center: ScenePoint, radius: number, tint: SceneColor, segments: number, yaw: number, tilt: number, emission = 0.16): void {
  const at = (a: number, r: number, y: number) => rotatePoint([Math.cos(a)*r,y,Math.sin(a)*r],center,yaw,tilt);
  const top = rotatePoint([0,radius*1.35,0],center,yaw,tilt);
  const bottom = rotatePoint([0,-radius*1.15,0],center,yaw,tilt);
  for (let i = 0; i < segments; i++) {
    const a = i * TAU / segments, b = (i + 1) * TAU / segments;
    const upperA = at(a,radius*0.78,radius*0.25), upperB = at(b,radius*0.78,radius*0.25);
    const lowerA = at(a,radius*0.65,-radius*0.4), lowerB = at(b,radius*0.65,-radius*0.4);
    const face = mixSceneColor(tint, [0.78,0.91,1], i % 3 === 0 ? 0.23 : 0.02);
    batch.triangle(top,upperB,upperA,face,emission);
    batch.quad(upperA,upperB,lowerB,lowerA,tint,emission*0.75);
    batch.triangle(lowerA,lowerB,bottom,face,emission);
  }
}

function torus(batch: FallingWordsGeometry, center: ScenePoint, radius: number, tube: number, tint: SceneColor, segments: number, tilt = 0, yaw = 0, emission = 0.2): void {
  const at = (a: number, b: number) => {
    const p: ScenePoint = [Math.cos(a)*(radius+Math.cos(b)*tube),Math.sin(b)*tube,Math.sin(a)*(radius+Math.cos(b)*tube)];
    // Tilt the ring plane around X, then spin its shell about Y.
    return rotatePoint([p[0],p[1]*Math.cos(tilt)-p[2]*Math.sin(tilt),p[1]*Math.sin(tilt)+p[2]*Math.cos(tilt)],center,yaw);
  };
  for (let i = 0; i < segments; i++) for (let j = 0; j < 4; j++) {
    const a = i*TAU/segments, b=(i+1)*TAU/segments, c=j*TAU/4, d=(j+1)*TAU/4;
    batch.quad(at(a,c),at(a,d),at(b,d),at(b,c),tint,emission);
  }
}

function terrain(batch: FallingWordsGeometry, frame: FallingWordsVisualFrame, low: boolean): void {
  const columns = low ? 8 : 14, rows = low ? 5 : 8;
  const at = (x: number, z: number): ScenePoint => {
    const px = -30 + x / columns * 60, pz = -40 + z / rows * 48;
    const distance = Math.hypot(px*0.7,pz*0.45);
    const height = distance < 5 ? -0.35 : -0.5 + visualRandom(x*37+z*83)*0.9 + Math.max(0,Math.abs(px)-13)*0.035;
    return [px,height,pz];
  };
  for (let z = 0; z < rows; z++) for (let x = 0; x < columns; x++) {
    const tint = mixSceneColor(frame.palette.ground,frame.palette.secondary,0.03+visualRandom(x*31+z*17)*0.07);
    batch.quad(at(x,z),at(x,z+1),at(x+1,z+1),at(x+1,z),tint);
  }
}

export interface FallingWordsGeometryResult {
  readonly camera: FallingWordsCamera;
  readonly reactor: ScenePoint;
  readonly crystalCenters: readonly ScenePoint[];
  readonly towers: number;
  readonly vertices: number;
}

/** All city, platform, shell and crystals are actual lit, depth-tested meshes. */
export function buildFallingWordsGeometry(frame: FallingWordsVisualFrame, size: VisualSize, budget: VisualBudget, batch: FallingWordsGeometry): FallingWordsGeometryResult {
  batch.clear();
  const low = budget.quality === "low";
  const camera = fallingWordsCamera(size,frame.layout.horizon);
  const accent = frame.palette.accent;
  const stone = mixSceneColor(frame.palette.ground,[0.17,0.23,0.29],0.4);
  terrain(batch,frame,low);
  for (let i = 0; i < budget.towers; i++) {
    const depth = 28 + visualRandom(i*7+12)*19;
    const spread = (i+0.5)/budget.towers;
    const bottom = screenToFallingWordsWorld(0.025+spread*0.95,0.73+visualRandom(i+17)*0.022,depth,camera);
    const height = 1.8+visualRandom(i*23+2)*4.8;
    const width = 0.5+visualRandom(i*41+6)*0.9;
    frustum(batch,bottom,width,width*0.62,height,stone,low?4:6);
    box(batch,[bottom[0],bottom[1]+height+0.13,bottom[2]],width*0.65,0.22,width*0.65,accent,0.7);
    for (let row = 1; row <= (low ? 1 : 3); row++) {
      box(batch,[bottom[0],bottom[1]+height*row/4,bottom[2]+width*0.76],width*0.48,0.065,0.035,mixSceneColor(accent,stone,0.3),0.55);
    }
  }

  const reactor = screenToFallingWordsWorld(0.5,0.94,8.8,camera);
  const platform: ScenePoint = [reactor[0],reactor[1]-0.5,reactor[2]];
  frustum(batch,[platform[0],platform[1]-0.2,platform[2]],3.3,2.75,0.24,stone,low?10:16);
  frustum(batch,[platform[0],platform[1]+0.03,platform[2]],1.18,0.88,0.32,mixSceneColor(stone,accent,0.16),low?8:12);
  torus(batch,[platform[0],platform[1]+0.075,platform[2]],2.6,0.055,accent,low?12:20,0,0,0.6);
  for (let i = 0; i < (low ? 4 : 6); i++) {
    const angle = i*TAU/(low?4:6);
    const p: ScenePoint = [platform[0]+Math.cos(angle)*1.28,platform[1],platform[2]+Math.sin(angle)*1.28];
    frustum(batch,p,0.17,0.10,0.7,stone,4);
    crystal(batch,[p[0],p[1]+0.79,p[2]],0.095,accent,4,angle,0,0.5);
  }
  const pulse = frame.reducedMotion ? 0 : Math.sin(frame.time*2.4)*0.025;
  crystal(batch,reactor,0.40+frame.coreEnergy*0.09+pulse,accent,low?6:8,frame.time*0.32,0.18,0.5+frame.coreEnergy*0.6);
  torus(batch,reactor,0.70,0.055,mixSceneColor(stone,accent,0.3),low?12:20,1.05,frame.time*0.15,0.15);
  torus(batch,reactor,0.90,0.036,frame.palette.secondary,low?12:20,-0.82,-frame.time*0.11,0.45);

  const crystalCenters: ScenePoint[] = [];
  for (const word of frame.words) {
    const symbol = crystalScreenPosition(word,size);
    const depth = 17 - word.progress*6;
    const center = screenToFallingWordsWorld(symbol.x,symbol.y,depth,camera);
    crystalCenters.push(center);
    const radius = symbol.diameter*depth/(size.height*camera.focal*2.5);
    const seed = visualRandom(word.id*17+3);
    const spin = frame.reducedMotion ? seed*TAU : seed*TAU+frame.time*(0.45+seed*0.4);
    crystal(batch,center,radius,word.color,low?4:6,spin,0.18+seed*0.12,word.targeted?0.42:0.14);
    if (word.kind === "golden" || word.targeted) {
      torus(batch,center,radius*0.86,radius*0.06,word.color,low?8:12,0.2,spin,0.65);
    }
  }
  batch.opaqueCount = batch.count;
  const targeted = frame.words.findIndex((word) => word.targeted);
  if (targeted >= 0) {
    const target = crystalCenters[targeted], color = frame.words[targeted].color;
    // A narrow emissive 3D ribbon connects the real reactor and target crystal.
    const width = low ? 0.015 : 0.028;
    const left: ScenePoint = [reactor[0]-width,reactor[1],reactor[2]];
    const right: ScenePoint = [reactor[0]+width,reactor[1],reactor[2]];
    batch.quad(left,right,[target[0]+width,target[1],target[2]],[target[0]-width,target[1],target[2]],color,1,0.24+frame.words[targeted].matched*0.4);
  }
  return { camera,reactor,crystalCenters,towers:budget.towers,vertices:batch.count };
}

interface ProgramResources {
  readonly program: WebGLProgram;
  readonly vertexShader: WebGLShader;
  readonly fragmentShader: WebGLShader;
  readonly attributes: Readonly<Record<string,number>>;
  readonly uniforms: Readonly<Record<string,WebGLUniformLocation>>;
}
interface WebGLResources {
  readonly sky: ProgramResources;
  readonly mesh: ProgramResources;
  readonly sprites: ProgramResources;
  readonly quad: WebGLBuffer;
  readonly geometry: WebGLBuffer;
  readonly particles: WebGLBuffer;
}

function checkGL(gl: WebGLRenderingContext): void {
  if (gl.isContextLost()) throw new Error("Falling Words WebGL context was lost.");
  const error = gl.getError();
  if (error !== gl.NO_ERROR) throw new Error(`Falling Words WebGL error ${error}.`);
}

function deleteProgram(gl: WebGLRenderingContext, resource?: ProgramResources): void {
  if (!resource) return;
  gl.deleteProgram(resource.program);
  gl.deleteShader(resource.vertexShader);
  gl.deleteShader(resource.fragmentShader);
}

function createProgram(gl: WebGLRenderingContext, vertex: string, fragment: string, attributeNames: readonly string[], uniformNames: readonly string[]): ProgramResources {
  let vertexShader: WebGLShader | null = null, fragmentShader: WebGLShader | null = null, program: WebGLProgram | null = null;
  try {
    vertexShader=gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) throw new Error("Could not allocate a vertex shader.");
    gl.shaderSource(vertexShader,vertex); gl.compileShader(vertexShader);
    if (!gl.getShaderParameter(vertexShader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(vertexShader)||"Vertex compile failure.");
    fragmentShader=gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) throw new Error("Could not allocate a fragment shader.");
    gl.shaderSource(fragmentShader,fragment); gl.compileShader(fragmentShader);
    if (!gl.getShaderParameter(fragmentShader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(fragmentShader)||"Fragment compile failure.");
    program=gl.createProgram();
    if (!program) throw new Error("Could not allocate a program.");
    gl.attachShader(program,vertexShader); gl.attachShader(program,fragmentShader);
    gl.bindAttribLocation?.(program, 0, "aPosition");
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program)||"Program link failure.");
    const attributes: Record<string,number> = {}, uniforms: Record<string,WebGLUniformLocation> = {};
    for (const name of attributeNames) {
      const location=gl.getAttribLocation(program,name);
      if (!Number.isInteger(location)||location<0) throw new Error(`Missing WebGL attribute ${name}.`);
      attributes[name]=location;
    }
    for (const name of uniformNames) {
      const location=gl.getUniformLocation(program,name);
      if (location===null) throw new Error(`Missing WebGL uniform ${name}.`);
      uniforms[name]=location;
    }
    checkGL(gl);
    return {program,vertexShader,fragmentShader,attributes,uniforms};
  } catch (error) {
    if(program) gl.deleteProgram(program);
    if(vertexShader) gl.deleteShader(vertexShader);
    if(fragmentShader) gl.deleteShader(fragmentShader);
    throw error;
  }
}

function deleteResources(gl: WebGLRenderingContext, resources: WebGLResources): void {
  gl.deleteBuffer(resources.quad); gl.deleteBuffer(resources.geometry); gl.deleteBuffer(resources.particles);
  deleteProgram(gl,resources.sky); deleteProgram(gl,resources.mesh); deleteProgram(gl,resources.sprites);
}

function createResources(gl: WebGLRenderingContext, budget: VisualBudget): WebGLResources {
  let sky: ProgramResources|undefined, mesh: ProgramResources|undefined, sprites: ProgramResources|undefined;
  let quad: WebGLBuffer|null=null, geometry: WebGLBuffer|null=null, particles: WebGLBuffer|null=null;
  try {
    sky=createProgram(gl,SKY_VERTEX_SHADER,SKY_FRAGMENT_SHADER,["aPosition"],
      ["uResolution","uTime","uHorizon","uFloor","uLaneInset","uLanes","uAccent","uSecondary","uSkyTop","uSkyBottom","uGround","uEnergy","uImpact","uHigh"]);
    mesh=createProgram(gl,MESH_VERTEX_SHADER,MESH_FRAGMENT_SHADER,["aPosition","aNormal","aColor","aEmission","aAlpha"],
      ["uViewProjection","uEye","uAccent","uFog","uEnergy"]);
    sprites=createProgram(gl,SPRITE_VERTEX_SHADER,SPRITE_FRAGMENT_SHADER,["aPosition","aSize","aColor","aRing"],["uDpr","uMaxPointSize"]);
    quad=gl.createBuffer(); geometry=gl.createBuffer(); particles=gl.createBuffer();
    if (!quad||!geometry||!particles) throw new Error("Could not allocate scene buffers.");
    gl.bindBuffer(gl.ARRAY_BUFFER,quad); gl.bufferData(gl.ARRAY_BUFFER,QUAD,gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,geometry); gl.bufferData(gl.ARRAY_BUFFER,budget.geometryVertices*SCENE_VERTEX_STRIDE*4,gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER,particles); gl.bufferData(gl.ARRAY_BUFFER,MAX_SCENE_SPRITES*SPRITE_STRIDE*4,gl.DYNAMIC_DRAW);
    checkGL(gl);
    return {sky,mesh,sprites,quad,geometry,particles};
  } catch(error) {
    if(quad) gl.deleteBuffer(quad); if(geometry) gl.deleteBuffer(geometry); if(particles) gl.deleteBuffer(particles);
    deleteProgram(gl,sky); deleteProgram(gl,mesh); deleteProgram(gl,sprites);
    throw error;
  }
}

abstract class BaseRenderer implements FrameRenderer {
  abstract readonly mode: FallingWordsRenderMode;
  readonly quality: ResolvedVisualQuality;
  readonly budget: VisualBudget;
  protected size: VisualSize;
  protected disposed=false;
  protected readonly reducedMotion: boolean;
  private readonly clock=new FallingWordsVisualClock();

  constructor(quality: ResolvedVisualQuality,reducedMotion:boolean) {
    this.quality=quality; this.reducedMotion=reducedMotion;
    this.budget=visualBudget(quality,reducedMotion); this.size=visualSize(1,1,1,this.budget);
  }
  render(state:FallingWordsVisualState,lanes:number,now:number,sampleAt?:number):void {
    if(!this.disposed) this.draw(this.clock.frame(state,lanes,now,this.reducedMotion,sampleAt));
  }
  suspend():void { this.clock.suspend(); }
  abstract resize(width:number,height:number,dpr:number):void;
  abstract draw(frame:FallingWordsVisualFrame):void;
  abstract dispose():void;
}

class WebGLRenderer extends BaseRenderer {
  readonly mode="webgl" as const;
  private readonly geometry:FallingWordsGeometry;
  private readonly particles=new Float32Array(MAX_SCENE_SPRITES*SPRITE_STRIDE);
  private readonly maxPointSize:number;
  private readonly canvas:HTMLCanvasElement;
  private readonly gl:WebGLRenderingContext;
  private readonly resources:WebGLResources;
  private renderedFrames = 0;

  constructor(canvas:HTMLCanvasElement,gl:WebGLRenderingContext,resources:WebGLResources,quality:ResolvedVisualQuality,reducedMotion:boolean) {
    super(quality,reducedMotion);
    this.canvas=canvas; this.gl=gl; this.resources=resources;
    this.geometry=new FallingWordsGeometry(this.budget.geometryVertices);
    const range=gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array|null;
    this.maxPointSize=clampVisual(range?.[1]??64,1,64);
    checkGL(gl);
  }
  resize(width:number,height:number,dpr:number):void {
    if(this.disposed) return;
    this.size=visualSize(width,height,dpr,this.budget);
    if(this.canvas.width!==this.size.pixelWidth) this.canvas.width=this.size.pixelWidth;
    if(this.canvas.height!==this.size.pixelHeight) this.canvas.height=this.size.pixelHeight;
    this.gl.viewport(0,0,this.size.pixelWidth,this.size.pixelHeight);
    checkGL(this.gl);
  }
  private attribute(program:ProgramResources,name:string,size:number,stride:number,offset:number):void {
    const gl=this.gl, location=program.attributes[name];
    gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride*4,offset*4);
  }
  private disableAttributes(program:ProgramResources):void {
    for(const location of Object.values(program.attributes)) this.gl.disableVertexAttribArray(location);
  }
  draw(frame:FallingWordsVisualFrame):void {
    if(this.disposed) return;
    if (this.gl.isContextLost()) throw new Error("Falling Words context lost.");
    const gl=this.gl, r=this.resources, u=r.sky.uniforms;
    const scene=buildFallingWordsGeometry(frame,this.size,this.budget,this.geometry);
    gl.viewport(0,0,this.size.pixelWidth,this.size.pixelHeight);
    gl.clearColor(0.02,0.03,0.07,1); gl.clearDepth(1); gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.CULL_FACE); gl.disable(gl.BLEND);
    gl.useProgram(r.sky.program); gl.bindBuffer(gl.ARRAY_BUFFER,r.quad);
    this.attribute(r.sky,"aPosition",2,0,0);
    gl.uniform2f(u.uResolution,this.size.width,this.size.height);
    gl.uniform1f(u.uTime,frame.time); gl.uniform1f(u.uHorizon,frame.layout.horizon);
    gl.uniform1f(u.uFloor,frame.layout.floor); gl.uniform1f(u.uLaneInset,frame.layout.laneInset);
    gl.uniform1f(u.uLanes,frame.laneCount); gl.uniform1f(u.uEnergy,frame.coreEnergy);
    gl.uniform1f(u.uImpact,frame.impact); gl.uniform1f(u.uHigh,this.quality==="high"?1:0);
    gl.uniform3fv(u.uAccent,frame.palette.accent); gl.uniform3fv(u.uSecondary,frame.palette.secondary);
    gl.uniform3fv(u.uSkyTop,frame.palette.skyTop); gl.uniform3fv(u.uSkyBottom,frame.palette.skyBottom);
    gl.uniform3fv(u.uGround,frame.palette.ground);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4); this.disableAttributes(r.sky);

    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
    gl.useProgram(r.mesh.program); gl.bindBuffer(gl.ARRAY_BUFFER,r.geometry);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,this.geometry.data.subarray(0,this.geometry.count*SCENE_VERTEX_STRIDE));
    this.attribute(r.mesh,"aPosition",3,SCENE_VERTEX_STRIDE,0);
    this.attribute(r.mesh,"aNormal",3,SCENE_VERTEX_STRIDE,3);
    this.attribute(r.mesh,"aColor",3,SCENE_VERTEX_STRIDE,6);
    this.attribute(r.mesh,"aEmission",1,SCENE_VERTEX_STRIDE,9);
    this.attribute(r.mesh,"aAlpha",1,SCENE_VERTEX_STRIDE,10);
    const m=r.mesh.uniforms;
    gl.uniformMatrix4fv(m.uViewProjection,false,scene.camera.matrix);
    gl.uniform3fv(m.uEye,scene.camera.eye); gl.uniform3fv(m.uAccent,frame.palette.accent);
    gl.uniform3fv(m.uFog,frame.palette.skyBottom); gl.uniform1f(m.uEnergy,frame.coreEnergy);
    gl.drawArrays(gl.TRIANGLES,0,this.geometry.opaqueCount);
    if(this.geometry.count>this.geometry.opaqueCount) {
      gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      gl.drawArrays(gl.TRIANGLES,this.geometry.opaqueCount,this.geometry.count-this.geometry.opaqueCount);
    }
    this.disableAttributes(r.mesh);
    gl.depthMask(false); gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
    const sprites=createSceneSprites(frame,this.size,this.budget);
    if(sprites.length>0) {
      for(let i=0;i<sprites.length;i++) {
        const s=sprites[i], offset=i*SPRITE_STRIDE;
        this.particles[offset]=s.x; this.particles[offset+1]=s.y; this.particles[offset+2]=s.size;
        this.particles[offset+3]=s.color[0]; this.particles[offset+4]=s.color[1]; this.particles[offset+5]=s.color[2];
        this.particles[offset+6]=s.alpha; this.particles[offset+7]=s.ring?1:0;
      }
      gl.useProgram(r.sprites.program); gl.bindBuffer(gl.ARRAY_BUFFER,r.particles);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.particles.subarray(0,sprites.length*SPRITE_STRIDE));
      this.attribute(r.sprites,"aPosition",2,SPRITE_STRIDE,0); this.attribute(r.sprites,"aSize",1,SPRITE_STRIDE,2);
      this.attribute(r.sprites,"aColor",4,SPRITE_STRIDE,3); this.attribute(r.sprites,"aRing",1,SPRITE_STRIDE,7);
      gl.uniform1f(r.sprites.uniforms.uDpr,this.size.dpr);
      gl.uniform1f(r.sprites.uniforms.uMaxPointSize,this.maxPointSize);
      gl.drawArrays(gl.POINTS,0,sprites.length); this.disableAttributes(r.sprites);
    }
    gl.depthMask(true);
    // Driver round-trips can stall input. Check the initial frame and sparse
    // health samples, not twice per animation frame (MDN WebGL best practices).
    if (this.renderedFrames++ % 120 === 0) checkGL(gl);
  }
  dispose():void {
    if(this.disposed) return;
    this.disposed=true; deleteResources(this.gl,this.resources);
    // Release the large implicit color/depth drawing buffers as well.
    this.canvas.width=1; this.canvas.height=1;
  }
}

function cssColor(color:SceneColor,alpha=1):string {
  return `rgba(${color.map((value)=>Math.round(clampVisual(value,0,1)*255)).join(",")},${clampVisual(alpha,0,1)})`;
}

class CanvasRenderer extends BaseRenderer {
  readonly mode="canvas" as const;
  private readonly geometry:FallingWordsGeometry;
  private readonly order:number[]=[];
  private readonly depths:Float32Array;
  private readonly canvas:HTMLCanvasElement;
  private readonly ctx:CanvasRenderingContext2D;

  constructor(canvas:HTMLCanvasElement,ctx:CanvasRenderingContext2D,reducedMotion:boolean) {
    // CPU painter fallback stays bounded at the low mesh/pixel budget.
    super("low",reducedMotion);
    this.canvas=canvas; this.ctx=ctx;
    this.geometry=new FallingWordsGeometry(this.budget.geometryVertices);
    this.depths=new Float32Array(this.geometry.capacity/3);
  }
  resize(width:number,height:number,dpr:number):void {
    if(this.disposed) return;
    this.size=visualSize(width,height,dpr,this.budget);
    if(this.canvas.width!==this.size.pixelWidth) this.canvas.width=this.size.pixelWidth;
    if(this.canvas.height!==this.size.pixelHeight) this.canvas.height=this.size.pixelHeight;
  }
  draw(frame:FallingWordsVisualFrame):void {
    if(this.disposed) return;
    const ctx=this.ctx, {width,height}=this.size;
    ctx.save();
    try {
      ctx.setTransform(this.size.pixelWidth/width,0,0,this.size.pixelHeight/height,0,0);
      ctx.globalAlpha=1;
      const sky=ctx.createLinearGradient(0,0,0,height);
      sky.addColorStop(0,cssColor(frame.palette.skyTop));
      sky.addColorStop(frame.layout.horizon,cssColor(frame.palette.skyBottom));
      sky.addColorStop(1,cssColor(frame.palette.ground));
      ctx.fillStyle=sky; ctx.fillRect(0,0,width,height);
      for(let i=0;i<this.budget.stars;i++) {
        ctx.fillStyle=cssColor([0.61,0.81,0.93],0.25+visualRandom(i*11+6)*0.5);
        ctx.beginPath(); ctx.arc(visualRandom(i*17+1)*width,visualRandom(i*29+4)*height*0.62,0.5+visualRandom(i*31)*0.9,0,TAU); ctx.fill();
      }
      const aurora=ctx.createLinearGradient(0,height*0.12,0,height*0.53);
      aurora.addColorStop(0,cssColor(frame.palette.accent,0.01));
      aurora.addColorStop(0.5,cssColor(frame.palette.accent,0.16+frame.coreEnergy*0.05));
      aurora.addColorStop(1,cssColor(frame.palette.secondary,0.01));
      ctx.fillStyle=aurora; ctx.beginPath(); ctx.moveTo(0,height*0.20);
      ctx.bezierCurveTo(width*0.28,height*(0.30+Math.sin(frame.time*0.08)*0.025),width*0.66,height*0.05,width,height*0.25);
      ctx.lineTo(width,height*0.45); ctx.bezierCurveTo(width*0.60,height*0.29,width*0.26,height*0.60,0,height*0.44); ctx.closePath(); ctx.fill();
      const scene=buildFallingWordsGeometry(frame,this.size,this.budget,this.geometry);
      this.drawMesh(scene.camera,frame);
      ctx.strokeStyle=cssColor(frame.impact>0?[1,0.27,0.33]:frame.palette.accent,0.55);
      ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(0,height*frame.layout.floor); ctx.lineTo(width,height*frame.layout.floor); ctx.stroke();
      for(const sprite of createSceneSprites(frame,this.size,this.budget)) {
        ctx.fillStyle=cssColor(sprite.color,sprite.alpha); ctx.strokeStyle=ctx.fillStyle;
        ctx.beginPath(); ctx.arc(sprite.x*width,sprite.y*height,sprite.size/2,0,TAU);
        if(sprite.ring) ctx.stroke(); else ctx.fill();
      }
    } finally {
      ctx.restore();
    }
  }
  private drawMesh(camera:FallingWordsCamera,frame:FallingWordsVisualFrame):void {
    const data=this.geometry.data, stride=SCENE_VERTEX_STRIDE, count=this.geometry.count/3;
    this.order.length=count;
    for(let i=0;i<count;i++) {
      const base=i*3*stride;
      this.order[i]=i;
      this.depths[i]=(data[base+2]+data[base+stride+2]+data[base+stride*2+2])/3;
    }
    this.order.sort((a,b)=>this.depths[a]-this.depths[b]||a-b);
    const ctx=this.ctx;
    for(const index of this.order) {
      const base=index*3*stride;
      const a=projectFallingWordsPoint([data[base],data[base+1],data[base+2]],camera,this.size);
      const b=projectFallingWordsPoint([data[base+stride],data[base+stride+1],data[base+stride+2]],camera,this.size);
      const c=projectFallingWordsPoint([data[base+stride*2],data[base+stride*2+1],data[base+stride*2+2]],camera,this.size);
      if(!a.visible||!b.visible||!c.visible) continue;
      if(Math.max(a.x,b.x,c.x)<0||Math.min(a.x,b.x,c.x)>this.size.width||Math.max(a.y,b.y,c.y)<0||Math.min(a.y,b.y,c.y)>this.size.height) continue;
      const diffuse=Math.max(0,-data[base+3]*0.5+data[base+4]*0.68+data[base+5]*0.55);
      const brightness=0.4+diffuse*0.8+data[base+9]*0.45;
      const fog=Math.exp(-Math.max(0,a.depth-12)*0.025);
      const tint:SceneColor=[data[base+6]*brightness,data[base+7]*brightness,data[base+8]*brightness];
      ctx.fillStyle=cssColor(mixSceneColor(frame.palette.skyBottom,tint,fog),data[base+10]);
      ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.lineTo(c.x,c.y); ctx.closePath(); ctx.fill();
    }
  }
  dispose():void {
    if(this.disposed) return;
    this.disposed=true; this.order.length=0;
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.canvas.width=1; this.canvas.height=1;
  }
}

class StaticRenderer extends BaseRenderer {
  readonly mode="static" as const;
  resize():void {}
  draw():void {}
  dispose():void { this.disposed=true; }
}

function webGLBackend(canvas:HTMLCanvasElement,options:FallingWordsRendererOptions):FrameRenderer {
  const quality=resolveVisualQuality(options.quality,options.deviceHints);
  const gl=canvas.getContext("webgl",{alpha:true,antialias:false,depth:true,powerPreference:quality==="low"?"low-power":"default",preserveDrawingBuffer:false});
  if(!gl) throw new Error("WebGL is unavailable.");
  const resources=createResources(gl,visualBudget(quality,options.reducedMotion));
  try {
    return new WebGLRenderer(canvas,gl,resources,quality,options.reducedMotion);
  } catch(error) {
    deleteResources(gl,resources); throw error;
  }
}

function canvasBackend(canvas:HTMLCanvasElement,options:FallingWordsRendererOptions):FrameRenderer {
  const context=canvas.getContext("2d",{alpha:false});
  if(!context) throw new Error("Canvas 2D is unavailable.");
  return new CanvasRenderer(canvas,context,options.reducedMotion);
}

export function createWebGLFallingWordsRenderer(canvas:HTMLCanvasElement,options:FallingWordsRendererOptions):FallingWordsSceneRenderer {
  const renderer=webGLBackend(canvas,options);
  options.onMode?.(renderer.mode);
  return renderer;
}

export function createCanvasFallingWordsRenderer(canvas:HTMLCanvasElement,options:FallingWordsRendererOptions):FallingWordsSceneRenderer {
  const renderer=canvasBackend(canvas,options);
  options.onMode?.(renderer.mode);
  return renderer;
}

/** Owns loss/restoration and uses an independent, never-WebGL Canvas 2D node. */
class ResilientRenderer implements FallingWordsSceneRenderer {
  private active:FrameRenderer;
  private readonly clock=new FallingWordsVisualClock();
  private width=1;
  private height=1;
  private dpr=1;
  private disposed=false;
  private readonly glCanvas:HTMLCanvasElement;
  private readonly fallbackCanvas:HTMLCanvasElement|null;
  private readonly options:FallingWordsRendererOptions;
  private readonly onLost=(event:Event)=>{
    event.preventDefault();
    if(this.disposed) return;
    this.toFallback();
    this.options.onInvalidate?.();
  };
  private readonly onRestored=()=>{
    if(this.disposed) return;
    // The original GL node is restored, but every buffer/program is rebuilt.
    try {
      const candidate=webGLBackend(this.glCanvas,this.options);
      try { candidate.resize(this.width,this.height,this.dpr); }
      catch(error) { candidate.dispose(); throw error; }
      this.active.dispose(); this.active=candidate; this.showMode();
    } catch { this.toFallback(); }
    this.options.onInvalidate?.();
  };

  constructor(glCanvas:HTMLCanvasElement,fallbackCanvas:HTMLCanvasElement|null,options:FallingWordsRendererOptions) {
    this.glCanvas=glCanvas; this.fallbackCanvas=fallbackCanvas; this.options=options;
    this.active=new StaticRenderer(resolveVisualQuality(options.quality,options.deviceHints),options.reducedMotion);
    glCanvas.addEventListener("webglcontextlost",this.onLost);
    glCanvas.addEventListener("webglcontextrestored",this.onRestored);
    try { this.active=webGLBackend(glCanvas,options); this.showMode(); }
    catch { this.toFallback(); }
  }
  get mode():FallingWordsRenderMode { return this.active.mode; }
  get quality():ResolvedVisualQuality { return this.active.quality; }
  get budget():VisualBudget { return this.active.budget; }
  private showMode():void {
    this.glCanvas.style.visibility=this.active.mode==="webgl"?"visible":"hidden";
    if(this.fallbackCanvas) this.fallbackCanvas.style.visibility=this.active.mode==="canvas"?"visible":"hidden";
    this.options.onMode?.(this.active.mode);
  }
  private toFallback():void {
    if(this.active.mode==="canvas") return;
    this.active.dispose();
    try {
      if(!this.fallbackCanvas||this.fallbackCanvas===this.glCanvas) throw new Error("Canvas fallback needs a fresh node.");
      this.active=canvasBackend(this.fallbackCanvas,this.options);
      this.active.resize(this.width,this.height,this.dpr);
    } catch {
      this.active.dispose();
      this.active=new StaticRenderer("low",this.options.reducedMotion);
    }
    this.showMode();
  }
  resize(width:number,height:number,dpr:number):void {
    if(this.disposed) return;
    this.width=width; this.height=height; this.dpr=dpr;
    try { this.active.resize(width,height,dpr); }
    catch { if(this.active.mode==="webgl") this.toFallback(); else this.toStatic(); }
  }
  render(state:FallingWordsVisualState,lanes:number,now:number,sampleAt?:number):void {
    if(this.disposed) return;
    const frame=this.clock.frame(state,lanes,now,this.options.reducedMotion,sampleAt);
    try { this.active.draw(frame); }
    catch {
      if(this.active.mode==="webgl") {
        this.toFallback();
        try { this.active.draw(frame); }
        catch { this.toStatic(); }
      } else { this.toStatic(); }
    }
  }
  private toStatic():void {
    this.active.dispose(); this.active=new StaticRenderer("low",this.options.reducedMotion); this.showMode();
  }
  suspend():void { this.clock.suspend(); }
  dispose():void {
    if(this.disposed) return;
    this.disposed=true;
    this.glCanvas.removeEventListener("webglcontextlost",this.onLost);
    this.glCanvas.removeEventListener("webglcontextrestored",this.onRestored);
    this.active.dispose();
    this.glCanvas.style.visibility="hidden";
    if(this.fallbackCanvas) this.fallbackCanvas.style.visibility="hidden";
  }
}

/** Pass both mounted nodes; the fallback must never have acquired WebGL. */
export function createFallingWordsRenderer(canvas:HTMLCanvasElement,options:FallingWordsRendererOptions,fallbackCanvas?:HTMLCanvasElement):FallingWordsSceneRenderer {
  const fresh=fallbackCanvas??canvas.ownerDocument?.createElement("canvas")??null;
  return new ResilientRenderer(canvas,fresh,options);
}

export interface FallingWordsFrameScheduler {
  request(callback:(timestamp:number)=>void):number;
  cancel(id:number):void;
}

/** One coalescing scheduler: React samples state; only this loop draws scenes. */
export class FallingWordsSceneLoop {
  private frameId:number|null=null;
  private state:FallingWordsVisualState|null=null;
  private lanes=1;
  private sampleAt=0;
  private visible=false;
  private dirty=false;
  private disposed=false;
  private lastFrameAt=-Infinity;
  private readonly renderer:FallingWordsSceneRenderer;
  private readonly scheduler:FallingWordsFrameScheduler;
  private readonly reducedMotion:boolean;

  constructor(renderer:FallingWordsSceneRenderer,scheduler:FallingWordsFrameScheduler,reducedMotion:boolean) {
    this.renderer=renderer; this.scheduler=scheduler; this.reducedMotion=reducedMotion;
  }
  update(state:FallingWordsVisualState,lanes:number,now:number):void {
    if(this.disposed) return;
    if(state!==this.state||lanes!==this.lanes) {
      this.state=state; this.lanes=lanes; this.sampleAt=now; this.dirty=true;
    }
    this.request();
  }
  setVisible(visible:boolean):void {
    if(this.disposed||visible===this.visible) return;
    this.visible=visible;
    this.renderer.suspend();
    if(!visible) { this.stop(); return; }
    this.lastFrameAt=-Infinity; this.dirty=true; this.request();
  }
  invalidate():void {
    if(this.disposed) return;
    this.dirty=true; this.request();
  }
  private animated():boolean {
    return !this.reducedMotion&&this.renderer.mode!=="static"&&(this.state?.status==="running"||this.state?.status==="idle");
  }
  private request():void {
    if(this.disposed||!this.visible||!this.state||this.frameId!==null||(!this.dirty&&!this.animated())) return;
    this.frameId=this.scheduler.request(this.tick);
  }
  private readonly tick=(timestamp:number)=>{
    this.frameId=null;
    if(this.disposed||!this.visible||!this.state) return;
    const animate=this.animated();
    const fps=this.state.status==="idle"?this.renderer.budget.idleFps:this.renderer.budget.fps;
    const ready=!animate||timestamp-this.lastFrameAt>=1000/Math.max(1,fps);
    if(ready&&(this.dirty||animate)) {
      this.renderer.render(this.state,this.lanes,timestamp,this.sampleAt);
      this.lastFrameAt=timestamp; this.dirty=false;
    }
    this.request();
  };
  private stop():void {
    if(this.frameId!==null) this.scheduler.cancel(this.frameId);
    this.frameId=null;
  }
  dispose():void { if(this.disposed) return; this.disposed=true; this.stop(); }
}
