/**
 * LZ-Abyss Predictor
 * 
 * Custom LZ-style compression optimized for music repetition patterns
 * Specialized for audio loops and repetitive structures
 */

export class LZAbyss {
  /**
   * Compress audio data using LZ-Abyss predictor
   * Optimized for music patterns
   */
  static compress(data: Float32Array): Uint8Array {
    const windowSize = 4096; // Lookback window
    const minMatchLength = 4;
    const output: number[] = [];
    let i = 0;
    
    while (i < data.length) {
      let bestMatch = { offset: 0, length: 0 };
      
      // Search for matches in lookback window
      const searchStart = Math.max(0, i - windowSize);
      for (let j = searchStart; j < i; j++) {
        let matchLength = 0;
        
        // Find matching sequence
        while (
          i + matchLength < data.length &&
          j + matchLength < i &&
          Math.abs(data[i + matchLength] - data[j + matchLength]) < 0.001 && // Tolerance for float comparison
          matchLength < 255
        ) {
          matchLength++;
        }
        
        if (matchLength >= minMatchLength && matchLength > bestMatch.length) {
          bestMatch = { offset: i - j, length: matchLength };
        }
      }
      
      if (bestMatch.length >= minMatchLength) {
        // Encode as reference
        output.push(0xFF); // Marker for reference
        output.push(bestMatch.offset & 0xFF);
        output.push((bestMatch.offset >> 8) & 0xFF);
        output.push(bestMatch.length);
        i += bestMatch.length;
      } else {
        // Encode as literal
        const value = Math.round((data[i] + 1) * 127.5); // Convert -1..1 to 0..255
        output.push(value);
        i++;
      }
    }
    
    return new Uint8Array(output);
  }

  /**
   * Decompress LZ-Abyss compressed data
   */
  static decompress(compressed: Uint8Array, originalLength: number): Float32Array {
    const output = new Float32Array(originalLength);
    let i = 0;
    let outIndex = 0;
    
    while (i < compressed.length && outIndex < originalLength) {
      if (compressed[i] === 0xFF && i + 3 < compressed.length) {
        // Reference
        const offset = compressed[i + 1] | (compressed[i + 2] << 8);
        const length = compressed[i + 3];
        i += 4;
        
        // Copy from lookback
        for (let j = 0; j < length && outIndex < originalLength; j++) {
          output[outIndex] = output[outIndex - offset];
          outIndex++;
        }
      } else {
        // Literal
        const value = (compressed[i] / 127.5) - 1; // Convert 0..255 to -1..1
        output[outIndex] = value;
        outIndex++;
        i++;
      }
    }
    
    return output;
  }

  /**
   * Prefilter audio for better compression
   * Applies simple delta encoding
   */
  static prefilter(data: Float32Array): Float32Array {
    const filtered = new Float32Array(data.length);
    filtered[0] = data[0];
    
    for (let i = 1; i < data.length; i++) {
      filtered[i] = data[i] - data[i - 1];
    }
    
    return filtered;
  }

  /**
   * Unfilter audio after decompression
   */
  static unfilter(filtered: Float32Array): Float32Array {
    const data = new Float32Array(filtered.length);
    data[0] = filtered[0];
    
    for (let i = 1; i < filtered.length; i++) {
      data[i] = filtered[i] + data[i - 1];
    }
    
    return data;
  }
}

