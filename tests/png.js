// Decode Chromium's non-interlaced RGB/RGBA PNG screenshots without npm deps.
const { inflateSync } = require('zlib');
module.exports = function decode(buf) {
  if(!buf.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw Error('Not PNG');
  let width,height,channels;const chunks=[];
  for(let off=8;off<buf.length;) {
    const len=buf.readUInt32BE(off),type=buf.toString('ascii',off+4,off+8),data=buf.subarray(off+8,off+8+len);
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[12]!==0)throw Error('Unsupported PNG');channels=data[9]===6?4:data[9]===2?3:0;if(!channels)throw Error('Unsupported color type');}
    if(type==='IDAT')chunks.push(data);off+=len+12;
  }
  const raw=inflateSync(Buffer.concat(chunks)),stride=width*channels,pixels=Buffer.alloc(height*stride);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];if(filter>4)throw Error('PNG filter');for(let i=0;i<stride;i++){
    const j=y*stride+i,a=i>=channels?pixels[j-channels]:0,b=y?pixels[j-stride]:0,c=y&&i>=channels?pixels[j-stride-channels]:0;
    pixels[j]=(raw[y*(stride+1)+1+i]+[0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter])&255;
  }}return {width,height,channels,pixels};
};
