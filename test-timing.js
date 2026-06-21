const crypto = require('crypto');
async function timingSafeEqual(a, b) {
  const enc = new TextEncoder()
  const keyA = enc.encode(a)
  const keyB = enc.encode(b)

  try {
    const key = await crypto.subtle.importKey(
      'raw', enc.encode('timing-safe-check'),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sigA = new Uint8Array(await crypto.subtle.sign('HMAC', key, keyA))
    const sigB = new Uint8Array(await crypto.subtle.sign('HMAC', key, keyB))

    if (sigA.length !== sigB.length) return false
    let result = 0
    for (let i = 0; i < sigA.length; i++) {
      result |= sigA[i] ^ sigB[i]
    }
    return result === 0
  } catch(e) {
    console.error(e);
    return false
  }
}
timingSafeEqual('ovijatrik2026', 'ovijatrik2026').then(console.log);
timingSafeEqual('ovijatrik2026', 'wrong').then(console.log);
