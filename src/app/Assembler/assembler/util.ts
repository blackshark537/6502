/**
 * Converts an array of bytes into a string of hexadecimal digits.
 * @param {Uint8Array} uint8Bytes Bytes to convert.
 * @return {string} The hexadecimal string representation of the bytes.
 */
export function bytesToHex(uint8Bytes: Uint8Array) {
    return Array.from(uint8Bytes)
        .map(b => b.toString(16))
        .map(s => s.length < 2 ? `0${s}` : s)
        .join('')
        .toUpperCase()
}
