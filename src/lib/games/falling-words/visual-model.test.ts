import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  FALLING_WORDS_VISUAL_LAYOUT, FallingWordsVisualClock, MAX_SCENE_DRAW_CALLS,
  MAX_SCENE_SPRITES, MAX_SCENE_VERTICES, SCENE_VERTEX_STRIDE,
  createFallingWordsVisualFrame, createSceneSprites, crystalLabelOffset, crystalScreenPosition,
  fallingWordScreenPosition, fallingWordsCamera, phasePalette, projectFallingWordsPoint,
  resolveVisualQuality, screenToFallingWordsWorld, visualBudget, visualSize,
  visualRandom,
  type FallingWordsVisualState,
} from "@/lib/games/falling-words/visual-model";
import {
  FallingWordsGeometry, FallingWordsSceneLoop, buildFallingWordsGeometry,
  createFallingWordsRenderer, createWebGLFallingWordsRenderer,
  type FallingWordsFrameScheduler, type FallingWordsSceneRenderer,
} from "@/lib/games/falling-words/renderer";

function visualState(overrides:Partial<FallingWordsVisualState>={}):FallingWordsVisualState {
  return {status:"running",elapsedMs:1000,words:[],destroyed:[],lockedId:null,lastMissMs:null,
    overdriveMs:0,slowdownMs:0,fever:0,...overrides};
}
function crowdedState():FallingWordsVisualState {
  return visualState({phase:4,typed:"g",lockedId:1,fever:80,words:Array.from({length:40},(_,id)=>({
    id,text:"gold",kind:"golden" as const,progress:id/40,fallMs:4000,lane:id,
  })),destroyed:Array.from({length:20},(_,seq)=>({seq,lane:seq,progress:0.5,points:40,kind:"normal" as const,bornMs:850}))});
}
function deepFreeze<T>(value:T):T {
  if(value&&typeof value==="object"&&!Object.isFrozen(value)) {
    Object.freeze(value);
    for(const child of Object.values(value)) deepFreeze(child);
  }
  return value;
}

type Failure="compile"|"link"|"attribute"|"uniform"|"buffer"|"error"|null;

/** Explicit WebGL double checks budgets and lifetimes, not a real driver's pixels. */
function glHarness(initialFailure:Failure=null) {
  let id=0, failure=initialFailure, lost=false, throwDraw=false, glError=0;
  let shaders=0, programs=0, buffers=0, deletedShaders=0, deletedPrograms=0, deletedBuffers=0;
  let twoDRequests=0, uploadAllocations=0, currentProgram=0, boundBuffer=0;
  const listeners=new Map<string,Set<(event:Event)=>void>>();
  const draws:{type:number;count:number;program:number}[]=[];
  const allocations:number[]=[];
  const uploads:{buffer:number;data:Float32Array}[]=[];
  const uniforms=new Map<string,number>();
  const attribs=new Map<string,number>();
  const enabled=new Set<number>();
  const gl={
    VERTEX_SHADER:1,FRAGMENT_SHADER:2,COMPILE_STATUS:3,LINK_STATUS:4,ARRAY_BUFFER:5,DYNAMIC_DRAW:6,STATIC_DRAW:7,
    DEPTH_TEST:8,LEQUAL:9,BLEND:10,CULL_FACE:11,FLOAT:12,TRIANGLES:13,TRIANGLE_STRIP:14,POINTS:15,
    COLOR_BUFFER_BIT:16,DEPTH_BUFFER_BIT:32,SRC_ALPHA:33,ONE_MINUS_SRC_ALPHA:34,ALIASED_POINT_SIZE_RANGE:35,NO_ERROR:0,
    createShader:()=>{shaders++;return {id:++id};},shaderSource(){},compileShader(){},
    getShaderParameter:()=>failure!=="compile",getShaderInfoLog:()=>"compile failed",deleteShader(){deletedShaders++;},
    createProgram:()=>{programs++;return {id:++id};},attachShader(){},linkProgram(){},
    getProgramParameter:()=>failure!=="link",getProgramInfoLog:()=>"link failed",deleteProgram(){deletedPrograms++;},
    getAttribLocation:(p:{id:number},name:string)=>{
      if(failure==="attribute") return -1;
      const key=`${p.id}:${name}`;
      if(!attribs.has(key)) attribs.set(key,Object.keys(Object.fromEntries(attribs)).filter((item)=>item.startsWith(`${p.id}:`)).length);
      return attribs.get(key)!;
    },
    getUniformLocation:(_:unknown,name:string)=>failure==="uniform"?null:({name}),
    createBuffer:()=>{if(failure==="buffer"&&buffers===1)return null;buffers++;return {id:++id};},
    deleteBuffer(){deletedBuffers++;},
    bindBuffer:(_:number,b:{id:number})=>{boundBuffer=b.id;},
    bufferData:(_:number,data:Float32Array|number)=>{uploadAllocations++;allocations.push(typeof data==="number"?data:data.byteLength);},
    bufferSubData:(_:number,__:number,data:Float32Array)=>uploads.push({buffer:boundBuffer,data:new Float32Array(data)}),
    getParameter:()=>new Float32Array([1,64]),isContextLost:()=>lost,
    getError:()=>failure==="error"?1280:glError,
    enable(){},disable(){},blendFunc(){},depthMask(){},depthFunc(){},viewport(){},clearColor(){},clearDepth(){},clear(){},
    useProgram:(p:{id:number})=>{currentProgram=p.id;},
    enableVertexAttribArray:(location:number)=>{enabled.add(location);},
    disableVertexAttribArray:(location:number)=>{enabled.delete(location);},vertexAttribPointer(){},
    uniform1f:(location:{name:string},value:number)=>uniforms.set(location.name,value),uniform2f(){},uniform3fv(){},uniformMatrix4fv(){},
    drawArrays:(type:number,_:number,count:number)=>{
      if(throwDraw) throw new Error("GPU draw failed");
      draws.push({type,count,program:currentProgram});
    },
  };
  const canvas={width:0,height:0,style:{visibility:"hidden"},
    getContext:(kind:string)=>{if(kind==="2d"){twoDRequests++;return null;}return gl;},
    addEventListener:(name:string,callback:(event:Event)=>void)=>{
      const set=listeners.get(name)??new Set();set.add(callback);listeners.set(name,set);
    },
    removeEventListener:(name:string,callback:(event:Event)=>void)=>listeners.get(name)?.delete(callback),
  } as unknown as HTMLCanvasElement;
  return {canvas,
    fail:(next:Failure)=>{failure=next;}, lose:()=>{lost=true;}, restore:()=>{lost=false;throwDraw=false;glError=0;},
    drawFailure:()=>{throwDraw=true;}, error:()=>{glError=1282;},
    emit:(name:string)=>{const event=new Event(name,{cancelable:true});for(const callback of listeners.get(name)??[])callback(event);return event;},
    stats:()=>({shaders,programs,buffers,deletedShaders,deletedPrograms,deletedBuffers,twoDRequests,uploadAllocations,allocations,uploads,draws,uniforms,enabled,
      listeners:[...listeners.values()].reduce((sum,set)=>sum+set.size,0)}),
  };
}

function canvasHarness(available=true) {
  let fills=0,clears=0,saves=0,restores=0,fail=false,requests=0;
  const gradient={addColorStop(){}};
  const ctx={
    save(){saves++;},restore(){restores++;},setTransform(){},clearRect(){clears++;},
    createLinearGradient:()=>gradient,
    fillRect(){if(fail)throw new Error("2D draw failed");fills++;},
    beginPath(){},arc(){},fill(){fills++;},stroke(){},moveTo(){},lineTo(){},bezierCurveTo(){},closePath(){},
    fillStyle:"",strokeStyle:"",globalAlpha:1,lineWidth:1,
  };
  const canvas={width:0,height:0,style:{visibility:"hidden"},getContext:(kind:string)=>{
    requests++;assert.equal(kind,"2d","fallback node never requests WebGL");return available?ctx:null;
  }} as unknown as HTMLCanvasElement;
  return {canvas,fail:()=>{fail=true;},stats:()=>({fills,clears,saves,restores,requests})};
}

function schedulerHarness() {
  let next=0,cancelled=0;
  const queued=new Map<number,(timestamp:number)=>void>();
  const scheduler:FallingWordsFrameScheduler={request:(callback)=>{queued.set(++next,callback);return next;},cancel:(id)=>{if(queued.delete(id))cancelled++;}};
  return {scheduler,step:(time:number)=>{const callbacks=[...queued.values()];queued.clear();for(const callback of callbacks)callback(time);},
    size:()=>queued.size,cancelled:()=>cancelled};
}

function sceneDouble() {
  const frames:{state:FallingWordsVisualState;now:number;sampleAt:number|undefined}[]=[];
  let suspends=0;
  const renderer:FallingWordsSceneRenderer={mode:"webgl",quality:"high",budget:visualBudget("high",false),resize(){},
    render:(state,_lanes,now,sampleAt)=>{frames.push({state,now,sampleAt});},suspend(){suspends++;},dispose(){}};
  return {renderer,frames,suspends:()=>suspends};
}

describe("Falling Words perspective visual model",()=>{
  it("selects explicit/automatic budgets and caps DPR, total pixels and huge parents",()=>{
    assert.equal(resolveVisualQuality("auto",{hardwareConcurrency:2}),"low");
    assert.equal(resolveVisualQuality("auto",{deviceMemory:2}),"low");
    assert.equal(resolveVisualQuality("auto",{saveData:true}),"low");
    assert.equal(resolveVisualQuality("auto",{coarsePointer:true,hardwareConcurrency:12}),"low");
    assert.equal(resolveVisualQuality("auto",{hardwareConcurrency:12,deviceMemory:16}),"high");
    assert.equal(resolveVisualQuality("high",{saveData:true}),"high");
    assert.equal(resolveVisualQuality("high",{coarsePointer:true}),"high");
    assert.ok([NaN,Infinity,Number.MAX_VALUE].map(visualRandom).every(Number.isFinite));
    for(const quality of ["low","high"] as const) for(const [width,height] of [[2400,1400],[9000,1600],[NaN,Infinity]]) {
      const budget=visualBudget(quality,false),size=visualSize(width,height,4,budget);
      assert.ok(size.dpr<=budget.dprCap);
      assert.ok(size.pixelWidth*size.pixelHeight<=budget.maxPixels);
      assert.ok(size.pixelWidth<=4096&&size.pixelHeight<=4096);
      assert.ok(Number.isFinite(size.width+size.height+size.dpr));
    }
  });

  it("keeps shared label coordinates exact and projects 3D symbols 20–35 CSS pixels above them",()=>{
    assert.deepEqual(FALLING_WORDS_VISUAL_LAYOUT,{top:0.12,floor:0.87,laneInset:0.10,horizon:0.66});
    assert.deepEqual(fallingWordScreenPosition(0,0,4),{x:0.2,y:0.12});
    for(const [width,height] of [[390,400],[1440,720],[800,1200]]) {
      const size=visualSize(width,height,2,visualBudget("high",false)),camera=fallingWordsCamera(size);
      for(let lane=0;lane<6;lane++) for(const progress of [0,0.5,1]) {
        const label=fallingWordScreenPosition(lane,progress,6),symbol=crystalScreenPosition(label,size);
        const center=screenToFallingWordsWorld(symbol.x,symbol.y,14,camera);
        const projection=projectFallingWordsPoint(center,camera,size);
        assert.ok(Math.abs(projection.x-label.x*width)<1e-8);
        assert.ok(Math.abs(projection.y-(label.y*height-crystalLabelOffset(height)))<1e-8);
        const offset=label.y*height-projection.y;
        assert.ok(offset>=20-1e-8&&offset<=35+1e-8);
        const m=camera.matrix,w=m[11]*center[2]+m[15];
        const clipY=m[5]*center[1]+m[9]*center[2]+m[13];
        assert.ok(Math.abs((1-clipY/w)*height/2-projection.y)<0.001,"CPU and WebGL perspective agree");
      }
    }
  });

  it("reads hostile values without mutation and reacts to phase, charge, freeze and typing",()=>{
    const state=deepFreeze(visualState({words:[{id:1,text:"sky",kind:"golden",progress:Infinity,fallMs:1000,lane:99}],
      lockedId:1,phase:4,typed:"s",overdriveMs:3000,slowdownMs:2000,fever:80}));
    const before=JSON.stringify(state),frame=createFallingWordsVisualFrame(state,4,false,12);
    assert.equal(JSON.stringify(state),before);
    assert.equal(frame.words[0].x,0.8);assert.equal(frame.words[0].y,0.12);
    assert.equal(frame.words[0].targeted,true);assert.equal(frame.words[0].matched,1/3);
    assert.equal(frame.coreEnergy,1);assert.equal(frame.phase,4);
    assert.equal(new Set([1,2,3,4,5].map((phase)=>JSON.stringify(phasePalette(phase)))).size,5);
    assert.notDeepEqual(phasePalette(2,true),phasePalette(2,false));
    assert.notDeepEqual(phasePalette(2,false,true),phasePalette(2,false));
  });

  it("builds true faceted mesh volumes with finite normals, bounded vertices, city and shell",()=>{
    const state=deepFreeze(crowdedState()),before=JSON.stringify(state);
    const counts:number[]=[];
    for(const quality of ["low","high"] as const) {
      const budget=visualBudget(quality,false),size=visualSize(1100,600,2,budget);
      const batch=new FallingWordsGeometry(budget.geometryVertices),buffer=batch.data.buffer;
      const frame=createFallingWordsVisualFrame(state,6,false,0,FALLING_WORDS_VISUAL_LAYOUT,2000);
      const result=buildFallingWordsGeometry(frame,size,budget,batch);
      assert.equal(result.crystalCenters.length,12);assert.equal(result.towers,budget.towers);
      assert.ok(batch.count>2000&&batch.count<=budget.geometryVertices&&batch.count<=MAX_SCENE_VERTICES);
      assert.equal(batch.clipped,false);assert.equal(batch.count%3,0);
      assert.ok(batch.data.subarray(0,batch.count*SCENE_VERTEX_STRIDE).every(Number.isFinite));
      for(let vertex=0;vertex<batch.count;vertex+=3) {
        const offset=vertex*SCENE_VERTEX_STRIDE;
        const length=Math.hypot(batch.data[offset+3],batch.data[offset+4],batch.data[offset+5]);
        assert.ok(length>0.999&&length<1.001,"flat-shaded triangles have unit normals");
      }
      for(let i=0;i<frame.words.length;i++) {
        const p=projectFallingWordsPoint(result.crystalCenters[i],result.camera,size);
        assert.ok(Math.abs(p.x-frame.words[i].x*size.width)<1e-8);
        assert.ok(Math.abs(p.y-(frame.words[i].y*size.height-crystalLabelOffset(size.height)))<1e-8);
      }
      const geometryBefore=new Float32Array(batch.data);
      buildFallingWordsGeometry(createFallingWordsVisualFrame(state,6,false,0,FALLING_WORDS_VISUAL_LAYOUT,4000),size,budget,batch);
      assert.equal(batch.data.buffer,buffer,"fixed capacity is reused");
      assert.notDeepEqual(batch.data,geometryBefore,"the real facets spin");
      counts.push(result.vertices);
    }
    assert.ok(counts[0]<counts[1]);assert.equal(JSON.stringify(state),before);
  });

  it("enforces a hard batch capacity and expires effects without retaining particle history",()=>{
    const budget=visualBudget("high",false),size=visualSize(640,360,1,budget),state=crowdedState();
    const tiny=new FallingWordsGeometry(30),frame=createFallingWordsVisualFrame(state,6,false);
    buildFallingWordsGeometry(frame,size,budget,tiny);
    assert.equal(tiny.count,30);assert.equal(tiny.clipped,true);
    const moving=createSceneSprites(frame,size,budget);
    const stillFrame=createFallingWordsVisualFrame(state,6,true);
    const still=createSceneSprites(stillFrame,size,visualBudget("high",true));
    assert.ok(moving.length<=MAX_SCENE_SPRITES&&moving.length>still.length);
    assert.equal(still.length,stillFrame.words.length+stillFrame.effects.length);
    assert.equal(createFallingWordsVisualFrame({...state,elapsedMs:1500},6,false).effects.length,0);
    assert.ok(moving.every((sprite)=>Number.isFinite(sprite.x+sprite.y+sprite.size+sprite.alpha)));
  });

  it("rebases cosmetic time to state sample timestamps, freezes paused/reduced, and skips hidden gaps",()=>{
    const clock=new FallingWordsVisualClock(),state=visualState({destroyed:[{seq:1,lane:0,progress:0.5,points:20,kind:"normal",bornMs:1000}]});
    const first=clock.frame(state,6,90_000,false,90_000);
    assert.equal(first.effects[0].age,0,"absolute browser time never ages an engine effect");
    const second=clock.frame(state,6,90_025,false,90_000);
    assert.equal(second.time,0.025);assert.equal(second.effects[0].age,25/420);
    const paused=clock.frame({...state,status:"paused"},6,90_050,false);
    assert.equal(paused.time,second.time);assert.equal(paused.effects[0].age,0);
    clock.suspend();
    const resumed=clock.frame(state,6,190_000,false,190_000);
    assert.equal(resumed.time,paused.time);
    const reduced=clock.frame(state,6,190_050,true,190_000);
    assert.equal(reduced.time,0);assert.equal(reduced.impact,0);
  });
});

describe("Falling Words GPU-free renderer contracts",()=>{
  it("caps draws/uploads, reuses GPU allocations and never mutates game state",()=>{
    const h=glHarness(),state=deepFreeze(crowdedState()),before=JSON.stringify(state);
    const renderer=createWebGLFallingWordsRenderer(h.canvas,{quality:"high",reducedMotion:false});
    renderer.resize(1200,700,4);
    renderer.render(state,6,90_000,90_000);
    renderer.render(state,6,90_050,90_000);
    const stats=h.stats();
    assert.ok(stats.draws.length<=MAX_SCENE_DRAW_CALLS*2);
    assert.ok(stats.draws.filter((draw)=>draw.type===13).every((draw)=>draw.count<=MAX_SCENE_VERTICES));
    assert.ok(stats.draws.filter((draw)=>draw.type===15).every((draw)=>draw.count<=MAX_SCENE_SPRITES));
    assert.equal(stats.uploadAllocations,3,"no new GPU buffer allocations during rendering");
    assert.equal(stats.allocations.reduce((a,b)=>a+b,0),32+12_000*11*4+128*8*4);
    assert.equal(stats.enabled.size,0,"unused vertex attributes are disabled between programs");
    assert.ok(stats.uploads.every((upload)=>upload.data.every(Number.isFinite)));
    assert.equal(JSON.stringify(state),before);
    renderer.dispose();renderer.dispose();
    assert.equal(h.stats().deletedBuffers,3);assert.equal(h.stats().deletedPrograms,3);assert.equal(h.stats().deletedShaders,6);
    assert.equal(h.canvas.width,1);assert.equal(h.canvas.height,1,"drawing-buffer storage is released");
    const draws=h.stats().draws.length;renderer.render(state,6,100_000);assert.equal(h.stats().draws.length,draws);
  });

  it("cleans every partial shader/program/buffer allocation on compile, link, binding or GL error",()=>{
    for(const failure of ["compile","link","attribute","uniform","buffer","error"] as const) {
      const h=glHarness(failure);
      assert.throws(()=>createWebGLFallingWordsRenderer(h.canvas,{quality:"high",reducedMotion:false}));
      const stats=h.stats();
      assert.equal(stats.deletedShaders,stats.shaders,failure);
      assert.equal(stats.deletedPrograms,stats.programs,failure);
      assert.equal(stats.deletedBuffers,stats.buffers,failure);
      assert.equal(stats.listeners,0);
    }
  });

  it("switches to a fresh 2D node on context loss and rebuilds GL on restoration",()=>{
    const gl=glHarness(),fallback=canvasHarness(),modes:string[]=[];
    let invalidations=0;
    const renderer=createFallingWordsRenderer(gl.canvas,{quality:"high",reducedMotion:false,onMode:(mode)=>modes.push(mode),onInvalidate:()=>{invalidations++;}},fallback.canvas);
    renderer.resize(1000,600,3);renderer.render(crowdedState(),6,50_000);
    gl.lose();const event=gl.emit("webglcontextlost");
    assert.equal(event.defaultPrevented,true);assert.equal(renderer.mode,"canvas");
    assert.equal(gl.canvas.style.visibility,"hidden");assert.equal(fallback.canvas.style.visibility,"visible");
    renderer.render(crowdedState(),6,50_050);
    assert.ok(fallback.stats().fills>100);assert.equal(gl.stats().twoDRequests,0);
    assert.equal(gl.stats().deletedPrograms,3);assert.equal(gl.stats().deletedBuffers,3);
    gl.restore();gl.emit("webglcontextrestored");
    assert.equal(renderer.mode,"webgl");assert.equal(gl.canvas.style.visibility,"visible");
    assert.equal(fallback.canvas.style.visibility,"hidden");assert.deepEqual(modes,["webgl","canvas","webgl"]);
    assert.equal(invalidations,2);assert.equal(gl.stats().programs,6);
    renderer.dispose();renderer.dispose();
    assert.equal(gl.stats().listeners,0);assert.equal(gl.stats().deletedPrograms,6);
    assert.equal(gl.stats().deletedBuffers,6);assert.equal(gl.stats().deletedShaders,12);
  });

  it("uses the fresh fallback on allocation failure and detects render exceptions / GL errors",()=>{
    for(const failure of ["compile","uniform","buffer"] as const) {
      const gl=glHarness(failure),fallback=canvasHarness();
      const renderer=createFallingWordsRenderer(gl.canvas,{quality:"auto",reducedMotion:true},fallback.canvas);
      assert.equal(renderer.mode,"canvas");renderer.resize(390,400,4);renderer.render(crowdedState(),4,8000);
      assert.equal(fallback.canvas.width,390);assert.ok(fallback.stats().fills>0);
      renderer.dispose();assert.equal(gl.stats().twoDRequests,0);assert.equal(gl.stats().listeners,0);
    }
    for(const error of ["throw","error"] as const) {
      const gl=glHarness(),fallback=canvasHarness(),renderer=createFallingWordsRenderer(gl.canvas,{quality:"high",reducedMotion:false},fallback.canvas);
      renderer.resize(640,400,1);
      if(error==="throw")gl.drawFailure();else gl.error();
      assert.doesNotThrow(()=>renderer.render(crowdedState(),6,100));
      assert.equal(renderer.mode,"canvas");assert.ok(fallback.stats().fills>0);
      assert.equal(gl.stats().deletedBuffers,3);renderer.dispose();
    }
  });

  it("falls back safely when neither renderer is available or Canvas drawing fails",()=>{
    const gl=glHarness("compile"),fallback=canvasHarness(false);
    const renderer=createFallingWordsRenderer(gl.canvas,{quality:"low",reducedMotion:true},fallback.canvas);
    assert.equal(renderer.mode,"static");assert.doesNotThrow(()=>renderer.render(crowdedState(),6,0));renderer.dispose();
    const brokenGL=glHarness("compile"),brokenCanvas=canvasHarness();
    const broken=createFallingWordsRenderer(brokenGL.canvas,{quality:"low",reducedMotion:false},brokenCanvas.canvas);
    brokenCanvas.fail();assert.doesNotThrow(()=>broken.render(crowdedState(),6,0));
    assert.equal(broken.mode,"static");assert.equal(brokenCanvas.stats().saves,brokenCanvas.stats().restores);
    broken.dispose();assert.equal(brokenGL.stats().listeners,0);
  });

  it("refuses to acquire 2D from the same canvas that already acquired WebGL",()=>{
    const gl=glHarness("buffer");
    const renderer=createFallingWordsRenderer(gl.canvas,{quality:"low",reducedMotion:false},gl.canvas);
    assert.equal(renderer.mode,"static");assert.equal(gl.stats().twoDRequests,0);renderer.dispose();
  });
});

describe("Falling Words single animation scheduler",()=>{
  it("coalesces state samples with RAF rather than double-rendering on React updates",()=>{
    const h=schedulerHarness(),scene=sceneDouble(),loop=new FallingWordsSceneLoop(scene.renderer,h.scheduler,false);
    loop.update(visualState(),6,0);loop.setVisible(true);
    const newest=visualState({typed:"g"});loop.update(newest,6,5);loop.invalidate();
    assert.equal(h.size(),1);assert.equal(scene.frames.length,0);
    h.step(10);assert.equal(scene.frames.length,1);assert.equal(scene.frames[0].state,newest);assert.equal(scene.frames[0].sampleAt,5);
    h.step(16);assert.equal(scene.frames.length,1,"45 fps cap suppresses an early callback");
    h.step(34);assert.equal(scene.frames.length,2);
    loop.dispose();assert.equal(h.size(),0);assert.ok(h.cancelled()>0);
  });

  it("draws paused/reduced state once per update and leaves no perpetual RAF",()=>{
    for(const reduced of [false,true]) {
      const h=schedulerHarness(),scene=sceneDouble(),loop=new FallingWordsSceneLoop(scene.renderer,h.scheduler,reduced);
      const state=visualState({status:reduced?"running":"paused"});
      loop.update(state,6,0);loop.setVisible(true);h.step(1);
      assert.equal(scene.frames.length,1);assert.equal(h.size(),0);
      loop.update(state,6,5);assert.equal(h.size(),0);
      loop.update({...state,fever:50},6,10);h.step(11);
      assert.equal(scene.frames.length,2);assert.equal(h.size(),0);loop.dispose();
    }
  });

  it("animates the idle preview slowly, skips all offscreen frames and cancels on disposal",()=>{
    const h=schedulerHarness(),scene=sceneDouble(),loop=new FallingWordsSceneLoop(scene.renderer,h.scheduler,false);
    loop.update(visualState({status:"idle"}),6,0);loop.setVisible(true);h.step(1);h.step(60);
    assert.equal(scene.frames.length,1);h.step(130);assert.equal(scene.frames.length,2);
    loop.setVisible(false);assert.equal(h.size(),0);
    loop.update(visualState(),6,150);loop.invalidate();h.step(1000);
    assert.equal(scene.frames.length,2);assert.equal(h.size(),0);
    loop.setVisible(true);h.step(1001);assert.equal(scene.frames.length,3);assert.ok(scene.suspends()>=3);
    loop.dispose();assert.equal(h.size(),0);loop.update(visualState(),6,2000);assert.equal(h.size(),0);
  });
});
