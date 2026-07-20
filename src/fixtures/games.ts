import { parseRenderEnvelope } from "@/src/core";
import type { KnownRenderEnvelope, RenderEnvelopeInput } from "@/src/schema";

function fixture(input: RenderEnvelopeInput): KnownRenderEnvelope {
  const result = parseRenderEnvelope(input);
  if (!result.success || result.unknownType)
    throw new Error("Invalid game.canvas fixture");
  return result.data as KnownRenderEnvelope;
}

export const tetrisGameEnvelope = fixture({
  id: "demo-game-tetris",
  type: "game.canvas",
  version: "1.0.0",
  source: {
    provider: "ModelCanvas Demo Provider",
    model: "fixture-v1",
    createdAt: "2026-07-20T00:00:00.000Z",
  },
  presentation: {
    title: "Neon Blocks · playable canvas game",
    description:
      "A real-time falling-block game with keyboard and touch input.",
    height: 640,
    theme: "dark",
  },
  security: {
    trusted: false,
    sandbox: true,
    allowScripts: true,
    allowNetwork: false,
    allowedOrigins: [],
  },
  payload: {
    width: 960,
    height: 640,
    touch: true,
    allowedOrigins: [],
    timeoutMs: 5_000,
    controls: [
      { keys: ["←", "→"], action: "Move" },
      { keys: ["↑"], action: "Rotate" },
      { keys: ["↓"], action: "Soft drop" },
      { keys: ["Space"], action: "Hard drop" },
      { keys: ["P"], action: "Pause" },
    ],
    html: `<style>
:root{color-scheme:dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif;background:#070b16;color:#f7f8ff}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;overflow:hidden;background:radial-gradient(circle at 25% 15%,#172554 0,transparent 36%),radial-gradient(circle at 80% 70%,#3b0764 0,transparent 34%),#070b16}
button{font:inherit;color:inherit}
.game{width:min(900px,100%);min-height:100vh;display:grid;grid-template-columns:minmax(220px,300px) minmax(170px,220px);gap:28px;align-items:center;justify-content:center;padding:20px}
.board-wrap{position:relative;padding:12px;border:1px solid #334155;border-radius:22px;background:linear-gradient(145deg,#111827,#080d19);box-shadow:0 24px 80px #000a,0 0 42px #22d3ee18}
canvas{display:block;width:min(100%,300px);height:auto;aspect-ratio:1/2;border-radius:12px;background:#050815;outline:none}
.panel{display:grid;gap:14px}.eyebrow{margin:0;color:#67e8f9;font-size:11px;font-weight:800;letter-spacing:.2em;text-transform:uppercase}
h1{margin:0;font-size:clamp(28px,5vw,48px);line-height:.92;letter-spacing:-.05em;background:linear-gradient(120deg,#fff,#a5f3fc 45%,#c4b5fd);-webkit-background-clip:text;color:transparent}
.stats{display:grid;grid-template-columns:1fr 1fr;gap:8px}.stat{padding:12px;border:1px solid #26324a;border-radius:14px;background:#0f172acc}.stat strong{display:block;font-size:22px}.stat span{color:#94a3b8;font-size:10px;text-transform:uppercase;letter-spacing:.12em}
.actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.actions button,.touch button{min-height:42px;border:1px solid #334155;border-radius:12px;background:#172033;cursor:pointer}.actions button:hover,.touch button:hover{border-color:#67e8f9;background:#1e293b}.actions button:focus-visible,.touch button:focus-visible{outline:2px solid #67e8f9;outline-offset:2px}
.hint{margin:0;color:#94a3b8;font-size:11px;line-height:1.6}.touch{display:grid;grid-template-columns:repeat(4,1fr);gap:7px}.touch button{font-size:18px;touch-action:manipulation;user-select:none}.touch .wide{grid-column:span 2;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}
.status{min-height:18px;margin:0;color:#c4b5fd;font-size:11px;font-weight:700}
@media(max-width:620px){body{overflow:auto}.game{grid-template-columns:minmax(210px,280px);gap:14px;padding:12px}.board-wrap{padding:8px}.panel{grid-template-columns:1fr 1fr}.panel h1,.panel .eyebrow,.panel .hint,.panel .status,.panel .touch{grid-column:1/-1}.stat{padding:8px}.stat strong{font-size:17px}}
</style>
<main class="game">
  <div class="board-wrap"><canvas id="board" width="240" height="480" tabindex="0" aria-label="Playable Tetris board"></canvas></div>
  <section class="panel">
    <p class="eyebrow">ModelCanvas / game.canvas</p><h1>NEON<br>BLOCKS</h1>
    <div class="stats"><div class="stat"><strong id="score">0</strong><span>Score</span></div><div class="stat"><strong id="lines">0</strong><span>Lines</span></div><div class="stat"><strong id="level">1</strong><span>Level</span></div><div class="stat"><strong id="best">0</strong><span>Best</span></div></div>
    <div class="actions"><button id="pause" type="button">Pause</button><button id="restart" type="button">Restart</button></div>
    <p class="status" id="status" aria-live="polite">Playing</p>
    <p class="hint">Arrow keys move and rotate. Space drops instantly. Use the controls below on touch screens.</p>
    <div class="touch" aria-label="Touch controls"><button data-action="left" aria-label="Move left">←</button><button data-action="rotate" aria-label="Rotate">↻</button><button data-action="right" aria-label="Move right">→</button><button data-action="down" aria-label="Soft drop">↓</button><button class="wide" data-action="drop">Hard drop</button><button class="wide" data-action="pause">Pause</button></div>
    <output id="game-state" class="sr-only" aria-live="polite" data-x="0" data-y="0" data-running="true">Game running</output>
  </section>
</main>
<script>(()=>{
  const COLS=10,ROWS=20,SIZE=24;
  const canvas=document.getElementById('board'),ctx=canvas.getContext('2d');
  const scoreEl=document.getElementById('score'),linesEl=document.getElementById('lines'),levelEl=document.getElementById('level'),bestEl=document.getElementById('best'),statusEl=document.getElementById('status'),stateEl=document.getElementById('game-state'),pauseEl=document.getElementById('pause');
  const SHAPES={I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],J:[[1,0,0],[1,1,1],[0,0,0]],L:[[0,0,1],[1,1,1],[0,0,0]],O:[[1,1],[1,1]],S:[[0,1,1],[1,1,0],[0,0,0]],T:[[0,1,0],[1,1,1],[0,0,0]],Z:[[1,1,0],[0,1,1],[0,0,0]]};
  const COLORS={I:'#22d3ee',J:'#60a5fa',L:'#fb923c',O:'#facc15',S:'#4ade80',T:'#c084fc',Z:'#fb7185'};
  let board,piece,score,lines,level,running,over,lastTime,dropTimer,best=0,bag=[];
  function matrixCopy(value){return value.map(row=>row.slice())}
  function refill(){bag=Object.keys(SHAPES);for(let i=bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[bag[i],bag[j]]=[bag[j],bag[i]]}}
  function nextPiece(){if(!bag.length)refill();const type=bag.pop(),matrix=matrixCopy(SHAPES[type]);return{type,matrix,x:Math.floor((COLS-matrix[0].length)/2),y:-1}}
  function hits(test,dx=0,dy=0,matrix=test.matrix){for(let y=0;y<matrix.length;y++)for(let x=0;x<matrix[y].length;x++)if(matrix[y][x]){const nx=test.x+x+dx,ny=test.y+y+dy;if(nx<0||nx>=COLS||ny>=ROWS||(ny>=0&&board[ny][nx]))return true}return false}
  function rotate(){const next=piece.matrix[0].map((_,i)=>piece.matrix.map(row=>row[i]).reverse());for(const kick of [0,-1,1,-2,2])if(!hits(piece,kick,0,next)){piece.matrix=next;piece.x+=kick;sync();return}}
  function merge(){piece.matrix.forEach((row,y)=>row.forEach((cell,x)=>{const py=piece.y+y;if(cell&&py>=0)board[py][piece.x+x]=piece.type}));let cleared=0;for(let y=ROWS-1;y>=0;y--)if(board[y].every(Boolean)){board.splice(y,1);board.unshift(Array(COLS).fill(''));cleared++;y++}if(cleared){lines+=cleared;score+=[0,100,300,500,800][cleared]*level;level=1+Math.floor(lines/10);best=Math.max(best,score);window.ModelCanvasGame?.emit('score',{score,lines,level})}piece=nextPiece();if(hits(piece)){over=true;running=false;statusEl.textContent='Game over · press Restart';window.ModelCanvasGame?.emit('gameover',{score,lines})}sync()}
  function step(){if(hits(piece,0,1)){merge()}else{piece.y++;score+=1;sync()}}
  function move(dx){if(running&&!over&&!hits(piece,dx,0)){piece.x+=dx;sync()}}
  function softDrop(){if(running&&!over)step()}
  function hardDrop(){if(!running||over)return;let distance=0;while(!hits(piece,0,1)){piece.y++;distance++}score+=distance*2;merge()}
  function togglePause(){if(over)return;running=!running;pauseEl.textContent=running?'Pause':'Resume';statusEl.textContent=running?'Playing':'Paused';sync()}
  function sync(){scoreEl.textContent=score.toLocaleString();linesEl.textContent=lines;levelEl.textContent=level;bestEl.textContent=best.toLocaleString();stateEl.dataset.x=piece?.x??0;stateEl.dataset.y=piece?.y??0;stateEl.dataset.running=String(running);stateEl.dataset.score=String(score);stateEl.textContent=over?'Game over':running?'Game running':'Game paused'}
  function cell(x,y,color,alpha=1){ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.fillRect(x*SIZE+1,y*SIZE+1,SIZE-2,SIZE-2);ctx.fillStyle='#ffffff35';ctx.fillRect(x*SIZE+3,y*SIZE+3,SIZE-6,3);ctx.globalAlpha=1}
  function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#050815';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.strokeStyle='#172036';ctx.lineWidth=1;for(let x=0;x<=COLS;x++){ctx.beginPath();ctx.moveTo(x*SIZE,0);ctx.lineTo(x*SIZE,canvas.height);ctx.stroke()}for(let y=0;y<=ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*SIZE);ctx.lineTo(canvas.width,y*SIZE);ctx.stroke()}board.forEach((row,y)=>row.forEach((type,x)=>{if(type)cell(x,y,COLORS[type])}));if(piece){let ghost=piece.y;while(!hits({...piece,y:ghost},0,1))ghost++;piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v&&ghost+y>=0)cell(piece.x+x,ghost+y,COLORS[piece.type],.18)}));piece.matrix.forEach((row,y)=>row.forEach((v,x)=>{if(v&&piece.y+y>=0)cell(piece.x+x,piece.y+y,COLORS[piece.type])}))}if(!running){ctx.fillStyle='#050815bb';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#f8fafc';ctx.textAlign='center';ctx.font='700 22px system-ui';ctx.fillText(over?'GAME OVER':'PAUSED',canvas.width/2,canvas.height/2)}}
  function frame(time=0){const delta=Math.min(100,time-lastTime);lastTime=time;if(running&&!over){dropTimer+=delta;if(dropTimer>Math.max(90,700-(level-1)*55)){step();dropTimer=0}}draw();requestAnimationFrame(frame)}
  function reset(){board=Array.from({length:ROWS},()=>Array(COLS).fill(''));score=0;lines=0;level=1;running=true;over=false;dropTimer=0;piece=nextPiece();pauseEl.textContent='Pause';statusEl.textContent='Playing';sync();canvas.focus();window.ModelCanvasGame?.emit('start',{game:'neon-blocks'})}
  function action(name){if(name==='left')move(-1);else if(name==='right')move(1);else if(name==='rotate'&&running)rotate();else if(name==='down')softDrop();else if(name==='drop')hardDrop();else if(name==='pause')togglePause()}
  addEventListener('keydown',event=>{const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'rotate',ArrowDown:'down',' ':'drop',p:'pause',P:'pause'};const name=map[event.key];if(name){event.preventDefault();action(name)}});
  document.querySelectorAll('[data-action]').forEach(button=>button.addEventListener('pointerdown',event=>{event.preventDefault();action(button.dataset.action);canvas.focus()}));
  pauseEl.addEventListener('click',togglePause);document.getElementById('restart').addEventListener('click',reset);
  reset();requestAnimationFrame(frame);
})()</script>`,
  },
});
