const EAST=0,SOUTH=1,WEST=2,NORTH=3;
const ANT_MEM_MOD=0x100000000;

//convert big int to i32
function asI32(int){
  int=int&0xffffffffn;
  if(int&0x80000000n){//negative
    int=-(~int&0xffffffffn)-1n;
  }
  return Number(int);
}

let INPUT=17;

class Ant{
  constructor(x,y,facing=EAST,mem=0){
    this.x=x;
    this.y=y;
    this.facing=facing;
    this.memory=mem;
  }
}
class Cell{
  constructor(op){
    this.op=op;
    this.ants=[];
  }
}

let grid=[];
let ants=[];

const binOps=new Map([
  ['+',(x,y)=>[asI32(BigInt(x)+BigInt(y)),y]],
  ['-',(x,y)=>[asI32(BigInt(x)-BigInt(y)),y]],
  ['*',(x,y)=>[asI32(BigInt(x)*BigInt(y)),y]],
  ['%',(x,y)=>y==0?[0,x]:[asI32(BigInt(x)/BigInt(y)),asI32(BigInt(x)%BigInt(y))]],
  ['=',(x,y)=>x==y?[1,y]:[0,y]]
]);
const killIf=new Map([
  ['w',(x,y)=>false],
  ['l',(x,y)=>y>=x],
  ['e',(x,y)=>y!=x],
  ['g',(x,y)=>y<=x]
]);
function mirrorNE(direction){
  switch(direction){
    case EAST:return NORTH;
    case SOUTH:return WEST;
    case WEST:return SOUTH;
    case NORTH:return EAST;
  }
  return direction;
}
function mirrorSE(direction){
  switch(direction){
    case EAST:return SOUTH;
    case SOUTH:return EAST;
    case WEST:return NORTH;
    case NORTH:return WEST;
  }
  return direction;
}
function gridFromString(str){
  lines=str.split('\n');
  let h=lines.length;
  let w=lines.map((x)=>x.length).reduce((x,y)=>Math.max(x,y));
  grid=new Array(h);
  for(let y=0;y<h;y++){
    grid[y]=new Array(w);
    for(let x=0;x<w;x++){
      grid[y][x]=new Cell(x<lines[y].length?lines[y][x]:' ');
    }
  }
  return grid;
}
function gridToString(){
  str="";
  first=true;
  grid.forEach((l)=>{
    if(first)
      first=false;
    else
      str+="\n";
    l.forEach((c)=>{str+=c.op;});
    str=str.replace(/[ ]+$/g,"");//remove training spaces, but keep newline
  });
  return str;
}

function initAnts(){
  for(let y=0;y<grid.length;y++){
    for(let x=0;x<grid[y].length;x++){
      grid[y][x].ants=[];
      if(grid[y][x].op=='#'){
        let ant=new Ant(x,y);
        ants.push(ant);
      }
    }
  }
}
function stepAnt(ant,index){
  let prevIndex=grid[ant.y][ant.x].ants.indexOf(ant);
  if(prevIndex>=0)
    grid[ant.y][ant.x].ants.splice(prevIndex,1);
  switch(ant.facing){
    case EAST: ant.x++; break;
    case SOUTH: ant.y++; break;
    case WEST: ant.x--; break;
    case NORTH: ant.y--; break;
  }
  if(ant.y<0||ant.y>=grid.length||ant.x<0||ant.x>=grid[0].length){
    ants.splice(index,1);
    return true;
  }
  switch(grid[ant.y][ant.x].op){
    case '0':case '1':case '2':case '3':case '4':
    case '5':case '6':case '7':case '8':case '9':
      ant.memory*=10;
      if(ant.memory<0)
        ant.memory-=grid[ant.y][ant.x].op-'0';
      else
        ant.memory+=grid[ant.y][ant.x].op-'0';
      ant.memory=asI32(BigInt(ant.memory));
      break;
    case '&':
      ant.memory=0;
      break;
    case '~':
      ant.memory*=-1;
      break;
    case '>':
      ant.facing=EAST;
      break;
    case '<':
      ant.facing=WEST;
      break;
    case 'v':
      ant.facing=SOUTH;
      break;
    case '^':
      ant.facing=NORTH;
      break;
    case '{':
      switch(ant.facing){
        case EAST:
          ant.facing=NORTH;
          ants.push(new Ant(ant.x,ant.y,SOUTH,ant.memory));
          break;
        case NORTH:case SOUTH:break;
        case WEST:ant.facing=EAST;break;
      }
      break;
    case '}':
      switch(ant.facing){
        case WEST:
          ant.facing=NORTH;
          ants.push(new Ant(ant.x,ant.y,SOUTH,ant.memory));
          break;
        case NORTH:case SOUTH:break;
        case EAST:ant.facing=WEST;break;
      }
      break;
    case '/':
      ant.facing=mirrorNE(ant.facing);
      break;
    case '\\':
      ant.facing=mirrorSE(ant.facing);
      break;
    //XXX? | _ as mirrors ?
    // [] -> queue  (] -> stack
    case '[':
      switch(ant.facing){
        case EAST:case WEST:
          if(grid[ant.y][ant.x].ants.length==0)
            ant.facing=EAST;
          else
            ants.push(grid[ant.y][ant.x].ants.pop());
          break;
        case SOUTH:case NORTH:
          if(grid[ant.y][ant.x].ants.length>0)
            ants.push(grid[ant.y][ant.x].ants.pop());
          ants.splice(index,1);
          grid[ant.y][ant.x].ants.push(ant);//store ant in cell
          return true;
      }
      break;
    case ']':
      switch(ant.facing){
        case EAST:case WEST:
          if(grid[ant.y][ant.x].ants.length==0)
            ant.facing=WEST;
          else
            ants.push(grid[ant.y][ant.x].ants.pop());
          break;
        case SOUTH:case NORTH:
          if(grid[ant.y][ant.x].ants.length>0)
            ants.push(grid[ant.y][ant.x].ants.pop());
          ants.splice(index,1);
          grid[ant.y][ant.x].ants.push(ant);//store ant in cell
          return true;
      }
      break;
    case '(':
      switch(ant.facing){
        case EAST:
          if(grid[ant.y][ant.x].ants.length>0)
            ants.push(grid[ant.y][ant.x].ants.pop());
          ants.splice(index,1);
          grid[ant.y][ant.x].ants.push(ant);//store ant in cell
          return true;
        case WEST:
          if(grid[ant.y][ant.x].ants.length>0)
            ant.facing=EAST;
          break;
        case SOUTH:case NORTH:
          if(grid[ant.y][ant.x].ants.length>0){
            let released=grid[ant.y][ant.x].ants.pop();
            released.facing=ant.facing;
            ants.push(released);
          }
          ants.splice(index,1);
          return true;
      }
      break;
    case ')':
      switch(ant.facing){
        case WEST:
          if(grid[ant.y][ant.x].ants.length>0)
            ants.push(grid[ant.y][ant.x].ants.pop());
          ants.splice(index,1);
          grid[ant.y][ant.x].ants.push(ant);//store ant in cell
          return true;
        case EAST:
          if(grid[ant.y][ant.x].ants.length>0)
            ant.facing=WEST;
          break;
        case SOUTH:case NORTH:
          if(grid[ant.y][ant.x].ants.length>0){
            let released=grid[ant.y][ant.x].ants.pop();
            released.facing=ant.facing;
            ants.push(released);
          }
          ants.splice(index,1);
          return true;
      }
      break;
    case '+':case '-':case '*':case ':':case '%':case '=':{
      if(grid[ant.y][ant.x].ants.length==0){//wait for a second ant
        ants.splice(index,1);
        grid[ant.y][ant.x].ants.push(ant);//store ant in cell
        return true;
      }
      let prev=grid[ant.y][ant.x].ants.splice(0,1)[0];
      let tmp=binOps.get(grid[ant.y][ant.x].op)(prev.memory,ant.memory);
      prev.memory=tmp[0];
      ant.memory=tmp[1];
      if(!ants.includes(prev))
        ants.push(prev);
      }break;
    case 'w':case 'g':case 'e':case 'l':{//wait for second ant, kill second and if it's memory is not greater/equal/less then the memory of the first ant
      if(grid[ant.y][ant.x].ants.length==0){//wait for a second ant
        ants.splice(index,1);
        grid[ant.y][ant.x].ants.push(ant);//store ant in cell
        return true;
      }
      let prev=grid[ant.y][ant.x].ants.splice(0,1)[0];
      if(!ants.includes(prev))//release first ant
        ants.push(prev);
      if(killIf.get(grid[ant.y][ant.x].op)(prev.memory,ant.memory)){
        ants.splice(index,1);//kill ant if condition not satisfied
        return true;
      }
      }break;
    case '@'://kill ant
      ants.splice(index,1);
      return true;
    case ',':
      ant.memory=stdinRead();
      break;
    case '.':
      stdoutWrite(ant.memory);
      break;
    case '!':
      writeNumber(ant.memory);
      break;
    case '?':
      ant.memory=readNumber();
      break;
  }
  return false;
}
function readNumber(){
  let c=stdinRead();
  while((c<('0'.charCodeAt(0))||c>('9'.charCodeAt(0)))&&c!=('-'.charCodeAt(0))&&c!=('+'.charCodeAt(0))){
    if(c==-1)
      return 0;
    c=stdinRead();
    break;
  }
  let negate=c==('-'.charCodeAt(0));
  let x=c-'0'.charCodeAt(0);
  c=stdinRead();
  while(c>=('0'.charCodeAt(0))&&c<=('9'.charCodeAt(0))){
    x*=10;
    x+=(c-('0'.charCodeAt(0)));
    c=stdinRead();
  }
  stdinUnread();
  return negate?-x:x;
}
function writeNumber(x){
  if(x<0){
    stdoutWrite('-'.charCodeAt(0));
    x=-x;
  }
  let str=Array.from(""+x);
  str.forEach((c)=>stdoutWrite((+c)+('0'.charCodeAt(0))));
}

function stepAnts(){
  let oldLen=ants.length;
  for(let i=0;i<oldLen;i++){
    if(stepAnt(ants[i],i)){
      i--;//removed ant
      oldLen--;
    }
  }
}

let editMode=false;
let editX=-1,editY=-1,editDirection=EAST;
const sMin=15,sMax=60;
const xRoot=20,yRoot=20;
let s=45,xOffset=0,yOffset=0;
function zoom(k,x,y,canvas){
  let dx=x-(xRoot+xOffset);
  let dy=y-(yRoot+yOffset);
  let oldS=s;
  s*=Math.pow(1.1,k);
  if(s<sMin)
    s=sMin;
  if(s>sMax)
    s=sMax;
  dx*=s/oldS;
  dy*=s/oldS;
  xOffset=x-(dx+xRoot);
  yOffset=y-(dy+yRoot);
  updateOffset(canvas);
}
function updateOffset(canvas){
  let offsetX=1,offsetY=1,paddingX=1,paddingY=1;
  if(editMode){
    if(editX<0)
      offsetX-=editX;
    if(editY<0)
      offsetY-=editY;
    if(editY>grid.length)
      paddingY=editY-grid.length+1;
    if(editX>grid[0].length)
      paddingX=editX-grid[0].length+1;
  }
  let maxOffsetX=0;
  let maxOffsetY=0;
  let minOffsetX=Math.min(0,canvas.width-2*xRoot-s*(grid[0].length+offsetX+paddingX));
  let minOffsetY=Math.min(0,canvas.height-2*yRoot-s*(grid.length+offsetY+paddingY));
  if(xOffset<minOffsetX)
    xOffset=minOffsetX;
  if(yOffset<minOffsetY)
    yOffset=minOffsetY;
  if(xOffset>maxOffsetX)
    xOffset=maxOffsetX;
  if(yOffset>maxOffsetY)
    yOffset=maxOffsetY;
}

function canvasPosToGridPos(x,y){
  let x0=xRoot+xOffset;
  let y0=yRoot+yOffset;
  return [Math.floor((x-x0)/s)-1,Math.floor((y-y0)/s)-1];
}
function editCell(newOp,reverse=false){
  let addChar=newOp!=" ";
  let newWidth=grid[0].length;
  let editedChar=" ";
  if(addChar){
    if(editX<0){
      newWidth-=editX;
      for(let y=0;y<grid.length;y++){
        grid[y]=new Array(-editX).concat(grid[y]);
        for(let x=0;x<-editX;x++)
          grid[y][x]=new Cell(' ');
      }
      editX=0;
    }
    if(editX>=grid[0].length){
      let oldWidth=grid[0].length;
      newWidth=editX+1;
      for(let y=0;y<grid.length;y++){
        grid[y]=grid[y].concat(new Array(editX-grid[0].length+1));
        for(let x=oldWidth;x<newWidth;x++)
          grid[y][x]=new Cell(' ');
      }
    }
    if(editY<0){
      grid=new Array(-editY).concat(grid);
      for(let y=0;y<-editY;y++){
        grid[y]=new Array(newWidth);
        for(let x=0;x<newWidth;x++)
          grid[y][x]=new Cell(' ');
      }
      editY=0;
    }
    if(editY>=grid.length){
      let oldLen=grid.length;
      grid=grid.concat(new Array(editY-grid.length+1));
      for(let y=oldLen;y<grid.length;y++){
        grid[y]=new Array(newWidth);
        for(let x=0;x<newWidth;x++)
          grid[y][x]=new Cell(' ');
      }
    }
  }
  if(editX>=0&&editY>=0&&editY<grid.length&&editX<grid[editY].length){
    editedChar=reverse?grid[editY][editX].op:newOp;
    grid[editY][editX].op=newOp;
  }
  if(reverse){//XXX? consider () [ ] { } mirrors
    switch(editedChar){//considering characters that explicitly set direction is not necessary when deleting
      case '/':editDirection=mirrorNE(editDirection);break;
      case '\\':editDirection=mirrorSE(editDirection);break;
    }
  }else{
    switch(editedChar){
      case '>':editDirection=EAST;break;
      case '<':editDirection=WEST;break;
      case '^':editDirection=NORTH;break;
      case 'v':editDirection=SOUTH;break;
      case '/':editDirection=mirrorNE(editDirection);break;
      case '\\':editDirection=mirrorSE(editDirection);break;
    }
  }
  let delta=reverse?-1:1;
  switch(editDirection){
    case EAST:editX+=delta;break;
    case SOUTH:editY+=delta;break;
    case WEST:editX-=delta;break;
    case NORTH:editY-=delta;break;
  }
}

const drawOffset=new Map([
  [EAST,[[0.8,0.5],[0.2,0.2],[0.2,0.8]]],
  [SOUTH,[[0.5,0.8],[0.2,0.2],[0.8,0.2]]],
  [WEST,[[0.2,0.5],[0.8,0.2],[0.8,0.8]]],
  [NORTH,[[0.5,0.2],[0.2,0.8],[0.8,0.8]]],
]);
function drawOn(ctx){
  updateOffset(ctx.canvas);
  let x0=xRoot+xOffset;
  let y0=yRoot+yOffset;
  //draw grid + 1 cell boundary
  let offsetX=1,offsetY=1,paddingX=1,paddingY=1;
  if(editMode){
    if(editX<0)
      offsetX-=editX;
    if(editY<0)
      offsetY-=editY;
    if(editY>grid.length)
      paddingY=editY-grid.length+1;
    if(editX>grid[0].length)
      paddingX=editX-grid[0].length+1;
  }
  for(let y=0;y<grid.length+offsetY+paddingY;y++){
    for(let x=0;x<grid[0].length+offsetX+paddingX;x++){
      if(x>=offsetX&&y>=offsetY&&(x-offsetX)<grid[0].length&&(y-offsetY)<grid.length)
        ctx.fillStyle="#101010";
      else
        ctx.fillStyle="#181818";
      ctx.fillRect(x0+(x+0.05)*s,y0+(y+0.05)*s,0.9*s,0.9*s);
      if(editMode&&(x-offsetX==editX&&y-offsetY==editY)){
        ctx.strokeStyle="#00ffff";
        ctx.lineWidth=0.05*s;
        ctx.strokeRect(x0+x*s,y0+y*s,s,s);
        //XXX? arrow indicating direction
      }
    }
  }
  //draw cells
  x0+=s*offsetX;
  y0+=s*offsetY;
  ctx.fillStyle="#ffffff";
  ctx.font=(0.9*s)+"px serif";
  for(let y=0;y<grid.length;y++){
    for(let x=0;x<grid[y].length;x++){
      let op=grid[y][x].op;
      let boxSize=ctx.measureText(op);
      let t_x0=boxSize.actualBoundingBoxLeft,t_x1=boxSize.actualBoundingBoxRight,t_y0=boxSize.actualBoundingBoxDescent,t_y1=boxSize.actualBoundingBoxAscent;
      if(grid[y][x].ants.length>0){
        ctx.fillStyle="#ff8000";
      }else{
        ctx.fillStyle="#ffffff";
      }
      ctx.fillText(op,x0+(x+0.5)*s-(t_x1-t_x0)/2,y0+(y+0.5)*s+(t_y1-t_y0)/2);
    }
  }
  if(editMode)
    return;
  ctx.fillStyle="rgba(0,255,0,0.5)";
  ants.forEach((a)=>{
    ctx.beginPath();
    let pts=drawOffset.get(a.facing);
    ctx.moveTo(x0+s*(a.x+pts[0][0]),y0+s*(a.y+pts[0][1]));
    ctx.lineTo(x0+s*(a.x+pts[1][0]),y0+s*(a.y+pts[1][1]));
    ctx.lineTo(x0+s*(a.x+pts[2][0]),y0+s*(a.y+pts[2][1]));
    ctx.closePath();
    ctx.fill();
  });
}

gridFromString(`
      @.23&! \\
  @.23&<   / {
>#0v/ !{> >(]
#?>g{  >/  ^ /
^& /-<1  <
  } /1  #^
   >    &/
        #0>e<
  >        /
`
);
initAnts();
