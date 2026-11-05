// Dependency-free lunar rendering. Both renderers use the same sphere coordinates
// as the accessible project links, so front/back visibility stays consistent.
export const TAU = Math.PI * 2
export function spherePoint(lon, lat) {
  const c = Math.cos(lat)
  return [c * Math.sin(lon), Math.sin(lat), c * Math.cos(lon)]
}

export function rotatePoint(point, yaw, pitch) {
  const [x, y, z] = point
  const cy = Math.cos(yaw), sy = Math.sin(yaw)
  const cp = Math.cos(pitch), sp = Math.sin(pitch)
  const rx = cy * x + sy * z, rz = -sy * x + cy * z
  return [rx, cp * y - sp * rz, sp * y + cp * rz]
}

export function projectLandings(projects) {
  const initial = [[-.57, .34], [.56, .18], [.04, -.44]]
  return projects.map((project, i) => {
    const [lon, lat] = initial[i] || [((i - 3) * 2.399 + 2.4) % TAU - Math.PI, Math.asin(1 - 2 * ((i - 3 + .5) / Math.max(1, projects.length - 3))) * .75]
    return { project, lon, lat, radius: .16, point: spherePoint(lon, lat), index: i }
  })
}

function lunarTexture(landings) {
  const width = 1024, height = 512
  const elevation = new Float32Array(width * height)
  const tone = new Float32Array(width * height)
  const cosLon = new Float32Array(width), sinLon = new Float32Array(width)
  for (let x = 0; x < width; x++) {
    const lon = (x / width - .5) * TAU
    cosLon[x] = Math.cos(lon); sinLon[x] = Math.sin(lon)
  }
  let seed = 917263
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296)
  const seas = [[.32, .45, .48, .2], [-.72, -.05, .29, .13], [.96, -.25, .4, .16], [-2.3, .3, .54, .13], [2.1, -.45, .3, .15]].map(([lon, lat, radius, depth]) => ({point:spherePoint(lon, lat), radius, depth}))
  for (let y = 0; y < height; y++) {
    const lat = (.5 - y / height) * Math.PI, c = Math.cos(lat), py = Math.sin(lat)
    for (let x = 0; x < width; x++) {
      const px = c * sinLon[x], pz = c * cosLon[x], id = y * width + x
      const broad = Math.sin(px * 12 + py * 7) * Math.sin(pz * 9 - py * 13)
      const fine = Math.sin(px * 63 + pz * 45) * Math.sin(py * 51 - px * 27)
      let value = .62 + broad * .045 + fine * .022 + (random() - .5) * .052
      for (const sea of seas) {
        const dot = px * sea.point[0] + py * sea.point[1] + pz * sea.point[2]
        const rough = 1 + broad * .22 + fine * .06
        value -= sea.depth * Math.exp(-(1 - dot) / (sea.radius * sea.radius * .25 * rough))
      }
      tone[id] = value
      elevation[id] = .5 + fine * .008 + (random() - .5) * .012
    }
  }
  function crater(lon, lat, radius, strength = 1) {
    const center = spherePoint(lon, lat)
    const y0 = Math.max(0, Math.floor((.5 - (lat + radius * 1.5) / Math.PI) * height))
    const y1 = Math.min(height - 1, Math.ceil((.5 - (lat - radius * 1.5) / Math.PI) * height))
    const centerX = (lon / TAU + .5) * width
    const half = Math.ceil(radius * 1.55 / Math.max(.12, Math.cos(lat)) / TAU * width)
    for (let y = y0; y <= y1; y++) {
      const latitude = (.5 - y / height) * Math.PI, c = Math.cos(latitude), py = Math.sin(latitude)
      for (let col = Math.floor(centerX - half); col <= centerX + half; col++) {
        const x = ((col % width) + width) % width
        const dot = c * sinLon[x] * center[0] + py * center[1] + c * cosLon[x] * center[2]
        const distance = Math.sqrt(Math.max(0, 2 * (1 - dot))) / radius
        if (distance > 1.5) continue
        const floor = distance < .94 ? -.115 * (1 - Math.pow(distance / .94, 3)) : 0
        const rim = Math.exp(-Math.pow((distance - 1) / .095, 2)) * .11
        const apron = Math.exp(-Math.pow((distance - 1.16) / .26, 2))
        const id = y * width + x
        elevation[id] += (floor + rim) * strength
        tone[id] += (rim * .23 + floor * .12 + apron * .015) * strength
      }
    }
  }
  for (let i = 0; i < 1800; i++) {
    const lon = (random() - .5) * TAU, lat = Math.asin((random() - .5) * 1.93)
    const radius = i < 100 ? .045 + random() * .07 : .005 + random() * .027
    const point = spherePoint(lon, lat)
    if (landings.some(l => point.reduce((sum, n, j) => sum + n * l.point[j], 0) > Math.cos(l.radius * 1.3 + radius))) continue
    crater(lon, lat, radius, .55 + random() * .5)
  }
  for (const landing of landings) crater(landing.lon, landing.lat, landing.radius, 1.28)
  const albedo = new Uint8Array(width * height * 4), bump = new Uint8Array(albedo.length)
  for (let i = 0; i < tone.length; i++) {
    const value = Math.max(.19, Math.min(.84, tone[i])) * 255
    albedo.set([value * .97, value, value * 1.02, 255], i * 4)
    const h = Math.max(0, Math.min(255, elevation[i] * 255))
    bump.set([h, h, h, 255], i * 4)
  }
  return {width, height, albedo, bump}
}

const vertexSource = `
attribute vec3 aPosition;
attribute vec2 aUV;
uniform mat3 uRotation;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
void main() {
  vec3 p = uRotation * aPosition;
  float lon = (aUV.x - .5) * 6.2831853;
  float lat = (.5 - aUV.y) * 3.1415927;
  vNormal = p;
  vTangent = uRotation * vec3(cos(lon), 0., -sin(lon));
  vBitangent = uRotation * vec3(sin(lat) * sin(lon), -cos(lat), sin(lat) * cos(lon));
  vUV = aUV;
  gl_Position = vec4(p.xy * .91, -p.z * .5, 1.);
}`
const fragmentSource = `
precision mediump float;
uniform sampler2D uAlbedo;
uniform sampler2D uBump;
varying vec2 vUV;
varying vec3 vNormal;
varying vec3 vTangent;
varying vec3 vBitangent;
void main() {
  vec2 pixel = vec2(1./1024., 1./512.);
  float dx = texture2D(uBump, vUV + vec2(pixel.x, 0.)).r - texture2D(uBump, vUV - vec2(pixel.x, 0.)).r;
  float dy = texture2D(uBump, vUV + vec2(0., pixel.y)).r - texture2D(uBump, vUV - vec2(0., pixel.y)).r;
  float latitude = (.5 - vUV.y) * 3.1415927;
  vec3 n = normalize(vNormal - vTangent * dx * 3.8 / max(.22, cos(latitude)) - vBitangent * dy * 3.8);
  vec3 light = normalize(vec3(-.8, .75, 1.3));
  float diffuse = max(0., dot(n, light));
  vec3 color = texture2D(uAlbedo, vUV).rgb * (.12 + diffuse * 1.12);
  float rim = pow(1. - max(0., normalize(vNormal).z), 4.);
  color += vec3(.1, .17, .13) * rim * .13;
  gl_FragColor = vec4(color, 1.);
}`

function webGLRenderer(canvas, texture) {
  const gl = canvas.getContext('webgl', {alpha:true, antialias:true, premultipliedAlpha:false, preserveDrawingBuffer:false})
  if (!gl) return null
  const buffers = [], textures = [], shaders = []
  let program
  const release = () => {
    buffers.forEach(b => gl.deleteBuffer(b)); textures.forEach(t => gl.deleteTexture(t))
    shaders.forEach(s => gl.deleteShader(s)); if (program) gl.deleteProgram(program)
  }
  try {
    function compile(type, source) {
      const shader = gl.createShader(type); shaders.push(shader)
      gl.shaderSource(shader, source); gl.compileShader(shader)
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader))
      return shader
    }
    program = gl.createProgram()
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program))
    gl.useProgram(program)
    const positions = [], uvs = [], indices = [], rows = 80, cols = 160
    for (let y = 0; y <= rows; y++) for (let x = 0; x <= cols; x++) {
      positions.push(...spherePoint((x / cols - .5) * TAU, (.5 - y / rows) * Math.PI))
      uvs.push(x / cols, y / rows)
    }
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      const a = y * (cols + 1) + x, b = a + cols + 1
      indices.push(a, b, a + 1, a + 1, b, b + 1)
    }
    function attribute(name, data, count) {
      const buffer = gl.createBuffer(); buffers.push(buffer)
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
      const location = gl.getAttribLocation(program, name)
      gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, count, gl.FLOAT, false, 0, 0)
    }
    attribute('aPosition', positions, 3); attribute('aUV', uvs, 2)
    const elementBuffer = gl.createBuffer(); buffers.push(elementBuffer)
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, elementBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)
    for (const [unit, name, pixels] of [[0, 'uAlbedo', texture.albedo], [1, 'uBump', texture.bump]]) {
      const map = gl.createTexture(); textures.push(map)
      gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, map)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texture.width, texture.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.generateMipmap(gl.TEXTURE_2D); gl.uniform1i(gl.getUniformLocation(program, name), unit)
    }
    const rotation = gl.getUniformLocation(program, 'uRotation')
    gl.enable(gl.DEPTH_TEST); gl.clearColor(0, 0, 0, 0)
    return {
      kind:'webgl',
      resize(size, ratio) {canvas.width = Math.round(size * ratio); canvas.height = canvas.width; gl.viewport(0, 0, canvas.width, canvas.height)},
      draw(yaw, pitch) {
        const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
        gl.uniformMatrix3fv(rotation, false, new Float32Array([cy, sp * sy, -cp * sy, 0, cp, sp, sy, -sp * cy, cp * cy]))
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0)
      },
      dispose:release
    }
  } catch (error) {
    release()
    // A canvas cannot switch context types after WebGL creation; replace it
    // in the component before starting the CPU renderer.
    throw error
  }
}

function canvasRenderer(canvas, texture) {
  const ctx = canvas.getContext('2d', {alpha:true})
  if (!ctx) throw new Error('Canvas rendering unavailable')
  let image, normals, size
  return {
    kind:'canvas',
    resize(cssSize) {
      size = Math.min(260, Math.round(cssSize)); canvas.width = size; canvas.height = size
      image = ctx.createImageData(size, size); normals = new Float32Array(size * size * 3)
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        const px = (x - size / 2) / (size * .455), py = -(y - size / 2) / (size * .455), d = px * px + py * py
        normals.set([px, py, d < 1 ? Math.sqrt(1 - d) : -1], (y * size + x) * 3)
      }
    },
    draw(yaw, pitch) {
      const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch)
      for (let i = 0; i < size * size; i++) {
        const nx = normals[i * 3], ny = normals[i * 3 + 1], nz = normals[i * 3 + 2]
        if (nz < 0) {image.data[i * 4 + 3] = 0; continue}
        const y = cp * ny + sp * nz, z = -sp * ny + cp * nz
        const px = cy * nx - sy * z, pz = sy * nx + cy * z
        const u = ((Math.atan2(px, pz) / TAU + .5) * texture.width) | 0
        const v = Math.min(texture.height - 1, Math.max(0, ((.5 - Math.asin(Math.max(-1, Math.min(1, y))) / Math.PI) * texture.height) | 0))
        const sample = (v * texture.width + u % texture.width) * 4
        const light = .12 + Math.max(0, (-nx * .8 + ny * .75 + nz * 1.3) / 1.696) * 1.12
        const bump = (texture.bump[sample] / 255 - .5) * .2 + 1
        for (let channel = 0; channel < 3; channel++) image.data[i * 4 + channel] = texture.albedo[sample + channel] * light * bump
        image.data[i * 4 + 3] = 255
      }
      ctx.putImageData(image, 0, 0)
    },
    dispose() {image = null; normals = null}
  }
}

export function createMoonRenderer(canvas, landings, fallback = false) {
  const texture = lunarTexture(landings)
  return (!fallback && webGLRenderer(canvas, texture)) || canvasRenderer(canvas, texture)
}
