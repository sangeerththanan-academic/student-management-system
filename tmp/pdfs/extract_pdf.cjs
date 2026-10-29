const fs = require("fs");
const zlib = require("zlib");
for (const file of process.argv.slice(2)) {
  const data = fs.readFileSync(file);
  const src = data.toString("latin1");
  console.log(`\n===== ${file} =====`);
  let streamNumber = 0;
  const re = /<<(.*?)>>\s*stream\r?\n/g;
  let m;
  while ((m = re.exec(src))) {
    const start = re.lastIndex;
    const end = src.indexOf("endstream", start);
    if (end < 0) break;
    const dict = m[1];
    let bytes = data.subarray(start, end);
    if (bytes.length && bytes[bytes.length - 1] === 10) bytes = bytes.subarray(0, bytes.length - 1);
    if (bytes.length && bytes[bytes.length - 1] === 13) bytes = bytes.subarray(0, bytes.length - 1);
    streamNumber++;
    if (/FlateDecode/.test(dict)) {
      try { bytes = zlib.inflateSync(bytes); }
      catch { try { bytes = zlib.inflateRawSync(bytes); } catch { continue; } }
    }
    const s = bytes.toString("latin1");
    if (!/\bBT\b/.test(s)) continue;
    console.log(`-- stream ${streamNumber} --`);
    const tokens = [...s.matchAll(/\((?:\\.|[^\\)])*\)\s*Tj|\[(?:.|\r|\n)*?\]\s*TJ|<([0-9A-Fa-f\s]+)>\s*Tj/g)];
    for (const t of tokens) {
      let v = t[0];
      v = v.replace(/\)\s*Tj$|\]\s*TJ$|>\s*Tj$/g, "").replace(/^\(/, "").replace(/^\[/, "").replace(/^</, "");
      v = v.replace(/\((?:\\.|[^\\)])*\)/g, x => x.slice(1,-1).replace(/\\([()\\])/g,"$1").replace(/\\n/g," ").replace(/\\r/g," "));
      console.log(v.replace(/\s+/g," ").trim());
    }
  }
}
