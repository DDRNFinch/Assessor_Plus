const encoder=new TextEncoder();
const bytes=value=>value instanceof Uint8Array?value:new Uint8Array(value);
const concat=parts=>{const length=parts.reduce((n,p)=>n+p.length,0),out=new Uint8Array(length);let offset=0;for(const part of parts){out.set(part,offset);offset+=part.length}return out};
const u16=n=>new Uint8Array([n&255,n>>>8&255]);
const u32=n=>new Uint8Array([n&255,n>>>8&255,n>>>16&255,n>>>24&255]);
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
export const crc32=data=>{let c=0xffffffff;for(const value of data)c=crcTable[(c^value)&255]^(c>>>8);return(c^0xffffffff)>>>0};

/** Creates a standards-compliant, store-only ZIP so original evidence bytes are never altered. */
export async function createZip(files){
  const local=[],central=[];let offset=0;
  for(const file of files){const name=encoder.encode(file.name),data=bytes(file.data instanceof Blob?await file.data.arrayBuffer():file.data),crc=crc32(data),header=concat([u32(0x04034b50),u16(20),u16(0x800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),name]),record=concat([header,data]);local.push(record);central.push(concat([u32(0x02014b50),u16(20),u16(20),u16(0x800),u16(0),u16(0),u16(0),u32(crc),u32(data.length),u32(data.length),u16(name.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),name]));offset+=record.length}
  const directory=concat(central),end=concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(directory.length),u32(offset),u16(0)]);
  return new Blob([concat([...local,directory,end])],{type:'application/zip'});
}

const read16=(v,o)=>v[o]|v[o+1]<<8,read32=(v,o)=>(v[o]|v[o+1]<<8|v[o+2]<<16|v[o+3]<<24)>>>0;
/** Strict reader for Assessor+'s deterministic, uncompressed ZIP format. */
export async function readZip(input){const data=bytes(input instanceof Blob?await input.arrayBuffer():input),files=new Map();let offset=0;while(offset+4<=data.length&&read32(data,offset)===0x04034b50){if(offset+30>data.length)throw new Error('Corrupt ZIP header.');const flags=read16(data,offset+6),method=read16(data,offset+8),crc=read32(data,offset+14),size=read32(data,offset+18),compressed=read32(data,offset+22),nameLength=read16(data,offset+26),extraLength=read16(data,offset+28);if(method!==0||size!==compressed||flags&8)throw new Error('Unsupported ZIP compression.');const start=offset+30+nameLength+extraLength,end=start+size;if(end>data.length)throw new Error('Incomplete ZIP entry.');const name=new TextDecoder().decode(data.slice(offset+30,offset+30+nameLength)),content=data.slice(start,end);if(!name||files.has(name)||crc32(content)!==crc)throw new Error('Corrupt or duplicate ZIP entry.');files.set(name,content);offset=end}let end=-1;for(let i=Math.max(offset,data.length-65557);i<=data.length-22;i++)if(read32(data,i)===0x06054b50)end=i;if(!files.size||offset+4>data.length||read32(data,offset)!==0x02014b50||end<0||end+22+read16(data,end+20)!==data.length||read16(data,end+10)!==files.size)throw new Error('Invalid or incomplete ZIP.');return files}
