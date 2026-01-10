# QOR Shader Library
## Custom GLSL Shaders for the Glass Engine

**Version:** 1.0.0  
**GLSL Version:** 4.40+  
**Framework:** Qt Quick ShaderEffect

---

## Table of Contents

1. [Noise Shaders](#1-noise-shaders)
2. [Blur & Glass Effects](#2-blur--glass-effects)
3. [Distortion Effects](#3-distortion-effects)
4. [Glow & Light](#4-glow--light)
5. [Particle Systems](#5-particle-systems)
6. [Audio Reactive Shaders](#6-audio-reactive-shaders)

---

## 1. Noise Shaders

### Perlin Noise

Classic Perlin noise for organic textures.

**File:** `assets/shaders/perlin_noise.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    float scale;
    float strength;
};

// Perlin noise implementation
vec2 random2(vec2 p) {
    return fract(sin(vec2(
        dot(p, vec2(127.1, 311.7)),
        dot(p, vec2(269.5, 183.3))
    )) * 43758.5453);
}

float perlinNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    
    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    // Four corners
    float a = dot(random2(i) - 0.5, f);
    float b = dot(random2(i + vec2(1.0, 0.0)) - 0.5, f - vec2(1.0, 0.0));
    float c = dot(random2(i + vec2(0.0, 1.0)) - 0.5, f - vec2(0.0, 1.0));
    float d = dot(random2(i + vec2(1.0, 1.0)) - 0.5, f - vec2(1.0, 1.0));
    
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

void main() {
    vec2 uv = qt_TexCoord0 * scale;
    uv += time * 0.01;
    
    float noise = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    
    // Octaves
    for (int i = 0; i < 5; i++) {
        noise += perlinNoise(uv * frequency) * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    noise = noise * 0.5 + 0.5; // Normalize to 0-1
    noise *= strength;
    
    fragColor = vec4(vec3(noise), noise * qt_Opacity);
}
```

**QML Usage:**

```qml
ShaderEffect {
    anchors.fill: parent
    property real time: 0.0
    property real scale: 4.0
    property real strength: 0.15
    
    fragmentShader: "qrc:/shaders/perlin_noise.frag"
    
    NumberAnimation on time {
        from: 0; to: 100
        duration: 100000
        loops: Animation.Infinite
    }
}
```

### Simplex Noise (Optimized)

More efficient than Perlin for real-time applications.

**File:** `assets/shaders/simplex_noise.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    float scale;
};

vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}

float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                        0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                       -0.577350269189626,  // -1.0 + 2.0 * C.x
                        0.024390243902439); // 1.0 / 41.0
    
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v -   i + dot(i, C.xx);
    
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                + i.x + vec3(0.0, i1.x, 1.0));
    
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    
    return 130.0 * dot(m, g);
}

void main() {
    vec2 uv = qt_TexCoord0 * scale;
    
    float noise = 0.0;
    float amplitude = 1.0;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        noise += snoise((uv + time * 0.01) * frequency) * amplitude;
        frequency *= 2.0;
        amplitude *= 0.5;
    }
    
    noise = noise * 0.5 + 0.5;
    
    fragColor = vec4(vec3(noise), qt_Opacity);
}
```

---

## 2. Blur & Glass Effects

### Dual Kawase Blur

High-performance blur for glassmorphism.

**File:** `assets/shaders/kawase_blur_down.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    vec2 texelSize;
    float offset;
};

void main() {
    vec4 sum = vec4(0.0);
    
    // Downsample with 4 bilinear samples
    sum += texture(source, qt_TexCoord0 + vec2(-offset, -offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2( offset, -offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2(-offset,  offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2( offset,  offset) * texelSize);
    
    fragColor = sum * 0.25 * qt_Opacity;
}
```

**File:** `assets/shaders/kawase_blur_up.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    vec2 texelSize;
    float offset;
};

void main() {
    vec4 sum = vec4(0.0);
    
    // Upsample with 9 samples
    sum += texture(source, qt_TexCoord0) * 4.0;
    sum += texture(source, qt_TexCoord0 + vec2(-offset, -offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2( offset, -offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2(-offset,  offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2( offset,  offset) * texelSize);
    sum += texture(source, qt_TexCoord0 + vec2(-offset,  0.0) * texelSize) * 2.0;
    sum += texture(source, qt_TexCoord0 + vec2( offset,  0.0) * texelSize) * 2.0;
    sum += texture(source, qt_TexCoord0 + vec2( 0.0, -offset) * texelSize) * 2.0;
    sum += texture(source, qt_TexCoord0 + vec2( 0.0,  offset) * texelSize) * 2.0;
    
    fragColor = sum / 16.0 * qt_Opacity;
}
```

### Chromatic Aberration Glass

Adds RGB split for a glitch aesthetic.

**File:** `assets/shaders/chromatic_glass.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float aberrationStrength;
    vec2 center;
};

void main() {
    vec2 direction = qt_TexCoord0 - center;
    float distance = length(direction);
    direction = normalize(direction);
    
    vec2 offset = direction * aberrationStrength * distance;
    
    float r = texture(source, qt_TexCoord0 + offset).r;
    float g = texture(source, qt_TexCoord0).g;
    float b = texture(source, qt_TexCoord0 - offset).b;
    
    fragColor = vec4(r, g, b, qt_Opacity);
}
```

---

## 3. Distortion Effects

### Wave Distortion

Animated wave effect for backgrounds.

**File:** `assets/shaders/wave_distortion.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    float frequency;
    float amplitude;
};

void main() {
    vec2 uv = qt_TexCoord0;
    
    // Create wave distortion
    uv.x += sin(uv.y * frequency + time) * amplitude;
    uv.y += cos(uv.x * frequency + time * 0.5) * amplitude;
    
    fragColor = texture(source, uv) * qt_Opacity;
}
```

### Ripple Effect

Interactive ripple distortion.

**File:** `assets/shaders/ripple.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    vec2 center;
    float strength;
};

void main() {
    vec2 uv = qt_TexCoord0;
    vec2 toCenter = uv - center;
    float distance = length(toCenter);
    
    // Calculate ripple
    float ripple = sin(distance * 30.0 - time * 5.0) * strength / (distance * 10.0 + 1.0);
    
    // Apply distortion
    uv += normalize(toCenter) * ripple;
    
    fragColor = texture(source, uv) * qt_Opacity;
}
```

---

## 4. Glow & Light

### Neon Glow

Multi-pass glow for neon text and borders.

**File:** `assets/shaders/neon_glow.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(binding = 1) uniform sampler2D source;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    vec3 glowColor;
    float intensity;
    float threshold;
};

void main() {
    vec4 color = texture(source, qt_TexCoord0);
    
    // Extract bright areas
    float brightness = dot(color.rgb, vec3(0.299, 0.587, 0.114));
    
    if (brightness > threshold) {
        vec3 glow = glowColor * intensity * (brightness - threshold);
        fragColor = vec4(color.rgb + glow, color.a * qt_Opacity);
    } else {
        fragColor = color * qt_Opacity;
    }
}
```

### Radial Light Burst

Emanating light effect from center.

**File:** `assets/shaders/light_burst.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    vec2 center;
    vec3 color;
    float intensity;
};

void main() {
    vec2 uv = qt_TexCoord0 - center;
    float distance = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Create rotating rays
    float rays = abs(sin(angle * 8.0 + time * 2.0));
    
    // Fade with distance
    float fade = 1.0 - smoothstep(0.0, 0.5, distance);
    
    vec3 light = color * rays * fade * intensity;
    
    fragColor = vec4(light, fade * qt_Opacity);
}
```

---

## 5. Particle Systems

### Star Field

Procedural star field for backgrounds.

**File:** `assets/shaders/starfield.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    float speed;
    float density;
};

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

void main() {
    vec2 uv = qt_TexCoord0 * density;
    uv.y += time * speed;
    
    vec2 id = floor(uv);
    vec2 gv = fract(uv);
    
    float starChance = hash(id);
    
    if (starChance > 0.95) {
        vec2 starPos = vec2(hash(id + 1.0), hash(id + 2.0));
        float dist = length(gv - starPos);
        
        float brightness = 1.0 - smoothstep(0.0, 0.02, dist);
        brightness *= (sin(time * 5.0 + hash(id) * 100.0) * 0.5 + 0.5);
        
        vec3 starColor = vec3(1.0, 0.9, 0.8);
        fragColor = vec4(starColor * brightness, brightness * qt_Opacity);
    } else {
        fragColor = vec4(0.0);
    }
}
```

### Energy Particles

Flowing energy particles.

**File:** `assets/shaders/energy_particles.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float time;
    vec3 color1;
    vec3 color2;
};

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec2 uv = qt_TexCoord0;
    
    vec3 finalColor = vec3(0.0);
    
    for (int i = 0; i < 5; i++) {
        float fi = float(i);
        float offset = fi * 0.2 + time * (0.5 + fi * 0.1);
        vec2 particleUV = uv + vec2(noise(vec2(fi)), offset);
        particleUV = fract(particleUV);
        
        float dist = length(particleUV - 0.5);
        float particle = 1.0 - smoothstep(0.0, 0.1, dist);
        
        vec3 color = mix(color1, color2, fi / 5.0);
        finalColor += color * particle;
    }
    
    fragColor = vec4(finalColor, qt_Opacity);
}
```

---

## 6. Audio Reactive Shaders

### Frequency Bars

Visualize audio frequency spectrum.

**File:** `assets/shaders/frequency_bars.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float frequencies[32];
    vec3 lowColor;
    vec3 midColor;
    vec3 highColor;
};

void main() {
    vec2 uv = qt_TexCoord0;
    
    int barIndex = int(uv.x * 32.0);
    float barHeight = frequencies[barIndex];
    
    float brightness = smoothstep(0.0, barHeight, 1.0 - uv.y);
    
    // Color gradient based on frequency range
    vec3 color;
    if (barIndex < 10) {
        color = lowColor;
    } else if (barIndex < 22) {
        color = midColor;
    } else {
        color = highColor;
    }
    
    fragColor = vec4(color * brightness, brightness * qt_Opacity);
}
```

### Bass Pulse

Reactive circular pulse from bass frequencies.

**File:** `assets/shaders/bass_pulse.frag`

```glsl
#version 440

layout(location = 0) in vec2 qt_TexCoord0;
layout(location = 0) out vec4 fragColor;

layout(std140, binding = 0) uniform buf {
    mat4 qt_Matrix;
    float qt_Opacity;
    float bassIntensity;
    float time;
    vec2 center;
    vec3 color;
};

void main() {
    vec2 uv = qt_TexCoord0;
    vec2 toCenter = uv - center;
    float distance = length(toCenter);
    
    // Create expanding rings based on bass
    float ring = fract(distance * 10.0 - time * 2.0 - bassIntensity * 5.0);
    ring = smoothstep(0.8, 1.0, ring) * smoothstep(0.0, 0.2, ring);
    
    float alpha = ring * bassIntensity;
    
    fragColor = vec4(color, alpha * qt_Opacity);
}
```

---

## Shader Integration in QML

### Multi-Pass Shader Effect

```qml
Item {
    id: glassEffect
    
    // Pass 1: Blur
    ShaderEffectSource {
        id: blurPass
        sourceItem: backgroundItem
        live: true
        
        ShaderEffect {
            anchors.fill: parent
            fragmentShader: "qrc:/shaders/kawase_blur_down.frag"
            property size texelSize: Qt.size(1.0 / width, 1.0 / height)
            property real offset: 2.0
        }
    }
    
    // Pass 2: Noise overlay
    ShaderEffect {
        anchors.fill: parent
        property variant source: blurPass
        fragmentShader: "qrc:/shaders/perlin_noise.frag"
        property real time: 0.0
        blending: true
        
        NumberAnimation on time {
            from: 0; to: 100
            duration: 100000
            loops: Animation.Infinite
        }
    }
}
```

### Audio-Reactive Shader

```qml
ShaderEffect {
    anchors.fill: parent
    fragmentShader: "qrc:/shaders/bass_pulse.frag"
    
    property real bassIntensity: AudioColors.bassIntensity
    property real time: 0.0
    property point center: Qt.point(0.5, 0.5)
    property color color: AudioColors.primaryAccent
    
    NumberAnimation on time {
        from: 0; to: 100
        duration: 50000
        loops: Animation.Infinite
    }
}
```

---

## Performance Tips

1. **Texture Sampling:** Minimize texture lookups in fragment shaders
2. **Branching:** Avoid `if` statements in shaders when possible
3. **Precision:** Use `mediump` or `lowp` for mobile targets
4. **Caching:** Use `ShaderEffectSource` to cache expensive effects
5. **LOD:** Implement level-of-detail for distant objects

---

## Debugging Shaders

### Enable shader debugging in main.cpp:

```cpp
// main.cpp
qputenv("QSG_INFO", "1");                    // Scene graph info
qputenv("QSG_VISUALIZE", "overdraw");        // Visualize overdraw
qputenv("QSG_RENDER_LOOP", "basic");         // Use basic render loop
```

### Shader error handling:

```qml
ShaderEffect {
    id: shader
    
    onStatusChanged: {
        if (status === ShaderEffect.Error) {
            console.error("Shader compilation failed:", shader.log)
        }
    }
}
```

---

**Document Version:** 1.0.0  
**Last Updated:** January 7, 2026  
**Status:** 🎨 SHADER REFERENCE
