export function scanRegions(canvas,createCanvas=()=>document.createElement('canvas')){
 const crop=(x,y,w,h)=>{const out=createCanvas();out.width=Math.max(1,Math.ceil(canvas.width*w));out.height=Math.max(1,Math.ceil(canvas.height*h));out.getContext('2d').drawImage(canvas,canvas.width*x,canvas.height*y,canvas.width*w,canvas.height*h,0,0,out.width,out.height);return out;};
 const header=crop(.4,0,.6,.075),line=crop(.4,0,.6,.025),rightLine=crop(.57,0,.43,.035),left=crop(0,.18,.46,.55),barcodeLabel=crop(0,.52,.46,.055);
 const rotated=createCanvas();rotated.width=canvas.width;rotated.height=canvas.height;const c=rotated.getContext('2d');c.translate(rotated.width,rotated.height);c.rotate(Math.PI);c.drawImage(canvas,0,0);
 return {headers:[line,rightLine,header],variants:[barcodeLabel,left,rotated],all:[header,line,rightLine,barcodeLabel,left,rotated]};
}
export function headerRegions(canvas,createCanvas=()=>document.createElement('canvas')){
 const crop=(x,w,h)=>{const out=createCanvas();out.width=Math.ceil(canvas.width*w);out.height=Math.ceil(canvas.height*h);out.getContext('2d').drawImage(canvas,canvas.width*x,0,canvas.width*w,canvas.height*h,0,0,out.width,out.height);return out;};
 const line=crop(0,1,1/3),right=crop(.17/.6,.43/.6,.035/.075);return {headers:[line,right,canvas],all:[line,right]};
}
