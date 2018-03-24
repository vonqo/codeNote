/* ================================================================== */
/* 
  ASCII base64 to byte encoding and decoding 
  Bluetooth Low Energy transmission in React Native iOS
  */
var tableStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var table = tableStr.split("");

function atob(base64) {
    if (/(=[^=]+|={3,})$/.test(base64)) throw new Error("String contains an invalid character");
    base64 = base64.replace(/=/g, "");
    var n = base64.length & 3;
    if (n === 1) throw new Error("String contains an invalid character");
    for (var i = 0, j = 0, len = base64.length / 4, bin = []; i < len; ++i) {
      var a = tableStr.indexOf(base64[j++] || "A"), b = tableStr.indexOf(base64[j++] || "A");
      var c = tableStr.indexOf(base64[j++] || "A"), d = tableStr.indexOf(base64[j++] || "A");
      if ((a | b | c | d) < 0) throw new Error("String contains an invalid character");
      bin[bin.length] = ((a << 2) | (b >> 4)) & 255;
      bin[bin.length] = ((b << 4) | (c >> 2)) & 255;
      bin[bin.length] = ((c << 6) | d) & 255;
    };
    return String.fromCharCode.apply(null, bin).substr(0, bin.length + n - 4);
};
function btoa(bin) {
    for (var i = 0, j = 0, len = bin.length / 3, base64 = []; i < len; ++i) {
      var a = bin.charCodeAt(j++), b = bin.charCodeAt(j++), c = bin.charCodeAt(j++);
      if ((a | b | c) > 255) throw new Error("String contains an invalid character");
      base64[base64.length] = table[a >> 2] + table[((a << 4) & 63) | (b >> 4)] +
                              (isNaN(b) ? "=" : table[((b << 2) & 63) | (c >> 6)]) +
                              (isNaN(b + c) ? "=" : table[c & 63]);
    }
    return base64.join("");
};
function hexToBase64(str) {
  return btoa(String.fromCharCode.apply(null,
    str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "))
  );
}
function base64ToHex(str) {
  for (var i = 0, bin = atob(str.replace(/[ \r\n]+$/, "")), hex = []; i < bin.length; ++i) {
    var tmp = bin.charCodeAt(i).toString(16);
    if (tmp.length === 1) tmp = "0" + tmp;
    hex[hex.length] = tmp;
  }
  return hex.join("");
}

/* ================================================================== */
/* 
  Byte endian swap / Big-endinan <-> Low-endian
  32bit and 16bit
  */
function swap32(val) {
    return ((val & 0xFF) << 24)
           | ((val & 0xFF00) << 8)
           | ((val >> 8) & 0xFF00)
           | ((val >> 24) & 0xFF);
}
function swap16(val) {
    return ((val & 0xFF) << 8)
           | ((val & 0xFF00) >> 8);
}

/* ================================================================== */
/* 
  Byte endian swap / Big-endinan <-> Low-endian
  32bit and 16bit
  */
function fixedPoint2Float(bytes, q){
  var sign = (bytes & 0x00008000) ? -1 : 1;
  bytes = bytes & (0x00007FFF);
  if(sign == -1){ 
    bytes = (0x00007FFF) ^ bytes;
    bytes *= sign;
  } 
  if(q == 11) q = 2048;
  else if(q == 14) q = 16384;
  else q = Math.pow(2,q);
  return bytes/q;
}

/* ================================================================== */
/* 
  Byte fo 32bit float format
  */
function bytes2Float32(bytes) {
    var sign = (bytes & 0x80000000) ? -1 : 1;
    var exponent = ((bytes >> 23) & 0xFF) - 127;
    var significand = (bytes & ~(-1 << 23));
    if (exponent == 128) 
        return sign * ((significand) ? Number.NaN : Number.POSITIVE_INFINITY);

    if (exponent == -127) {
        if (significand == 0) return sign * 0.0;
        exponent = -126;
        significand /= (1 << 22);
    } else significand = (significand | (1 << 23)) / (1 << 23);
    return sign * significand * Math.pow(2, exponent);
}

/* ================================================================== */
/* 
  ASCII displayed byte string to byte
  */
function unpack(str) {
    var bytes = [];
    var byte = 0;
    for(var i = 0, n = str.length; i < n; i++) {
        var isChar = false;
        var char = str.charCodeAt(i);
        if(char > 96){
            isChar = true;
        }
        if(isChar)
            bytes.push((char >> 0)-87);
        else bytes.push((char >> 0)-48);
        byte = byte << 4;
        byte = byte | bytes[i];
    }
    return byte;
}

/* ================================================================== */
/* 
  Quaternion rotation to Euler Angle conversation
  w - scalar
  x, y, z - vector
  */
function quaternionToEulerAngle(w, x, y, z){
  ysqr = y * y;
	
  t0 = 2.0 * (w * x + y * z);
  t1 = 1.0 - 2.0 * (x * x + ysqr);
  X = toDegrees(Math.atan2(t0, t1));
    
	t2 = 2.0 * (w * y - z * x);
  t2 = (t2>1.0)? 1.0 : t2;
  t2 = (t2<-1.0)? -1.0 : t2;
	Y = toDegrees(Math.asin(t2));
	
	t3 = 2.0 * (w * z + x * y);
	t4 = 1.0 - 2.0 * (ysqr + z * z);
	Z = toDegrees(Math.atan2(t3, t4));
	
	return {x:X, y:Y, z:Z};
}

function toDegrees (angle) {
	return angle * (180 / Math.PI);
}

function toRadians (angle) {
    return angle * (Math.PI / 180);
}

/* ================================================================== */