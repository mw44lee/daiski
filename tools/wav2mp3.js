// WAV(16-bit PCM) → MP3. 사용: npm install lamejs@1.2.1 (아무 폴더) 후
//   NODE_PATH=<그 폴더>/node_modules node tools/wav2mp3.js in.wav out.mp3 [kbps=64]
// lamejs 의 node 진입점 버그(MPEGMode is not defined) 때문에 번들 파일(lame.all.js)을 vm으로 읽는다.
const fs = require('fs');
const vm = require('vm');
const lamePath = require.resolve('lamejs/lame.all.js');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(lamePath, 'utf8') + ';this.lamejs = lamejs;', ctx);
const lamejs = ctx.lamejs;

const [, , inp, out, kbpsArg] = process.argv;
const kbps = Number(kbpsArg || 64);
const buf = fs.readFileSync(inp);
let pos = 12, fmt = null, data = null;
while (pos < buf.length) {
  const id = buf.toString('ascii', pos, pos + 4);
  const size = buf.readUInt32LE(pos + 4);
  if (id === 'fmt ') fmt = { ch: buf.readUInt16LE(pos + 10), rate: buf.readUInt32LE(pos + 12), bits: buf.readUInt16LE(pos + 22) };
  if (id === 'data') data = buf.subarray(pos + 8, pos + 8 + size);
  pos += 8 + size + (size % 2);
}
if (!fmt || !data || fmt.bits !== 16) throw new Error('need 16-bit PCM wav');
const samples = new Int16Array(data.buffer, data.byteOffset, data.length / 2);
const mono = fmt.ch === 1 ? samples : samples.filter((_, i) => i % fmt.ch === 0);
const enc = new lamejs.Mp3Encoder(1, fmt.rate, kbps);
const chunks = [];
for (let i = 0; i < mono.length; i += 1152) {
  const b = enc.encodeBuffer(mono.subarray(i, i + 1152));
  if (b.length) chunks.push(Buffer.from(b));
}
chunks.push(Buffer.from(enc.flush()));
fs.writeFileSync(out, Buffer.concat(chunks));
console.log('rate', fmt.rate, 'ch', fmt.ch, 'sec', (mono.length / fmt.rate).toFixed(2), 'bytes', Buffer.concat(chunks).length);
