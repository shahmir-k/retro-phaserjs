// WebGL Triangle Test
// Verifies: canvas, WebGL context, shaders, buffers, rAF

console.log("=== WebGL Triangle Test ===");

var canvas = document.createElement('canvas');
console.log("Canvas:", canvas.width, "x", canvas.height);

var gl = canvas.getContext('webgl');
if (!gl) {
    console.error("Failed to get WebGL context!");
} else {
    console.log("WebGL context obtained");
    console.log("Renderer:", gl.getParameter(gl.RENDERER));
    console.log("Version:", gl.getParameter(gl.VERSION));
}

// Vertex shader
var vsSource = [
    'attribute vec2 aPosition;',
    'attribute vec3 aColor;',
    'varying vec3 vColor;',
    'void main() {',
    '    gl_Position = vec4(aPosition, 0.0, 1.0);',
    '    vColor = aColor;',
    '}'
].join('\n');

// Fragment shader
var fsSource = [
    'precision mediump float;',
    'varying vec3 vColor;',
    'void main() {',
    '    gl_FragColor = vec4(vColor, 1.0);',
    '}'
].join('\n');

function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

var vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
var fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);

var program = gl.createProgram();
gl.attachShader(program, vs);
gl.attachShader(program, fs);
gl.linkProgram(program);

if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(program));
}

gl.useProgram(program);

// Triangle vertices: position (x,y) + color (r,g,b)
var vertices = new Float32Array([
    // x,    y,    r,   g,   b
     0.0,  0.5,  1.0, 0.0, 0.0,  // top - red
    -0.5, -0.5,  0.0, 1.0, 0.0,  // bottom-left - green
     0.5, -0.5,  0.0, 0.0, 1.0   // bottom-right - blue
]);

var buffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

var aPosition = gl.getAttribLocation(program, 'aPosition');
var aColor = gl.getAttribLocation(program, 'aColor');

gl.enableVertexAttribArray(aPosition);
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 20, 0);

gl.enableVertexAttribArray(aColor);
gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, 20, 8);

console.log("Shader program and buffers ready");

// Animation
var frameCount = 0;
var lastFps = performance.now();

function render(timestamp) {
    frameCount++;

    // Log FPS every second
    if (timestamp - lastFps >= 1000) {
        console.log("FPS:", frameCount);
        frameCount = 0;
        lastFps = timestamp;
    }

    // Animate background color
    var t = timestamp * 0.001;
    var r = Math.sin(t) * 0.1 + 0.1;
    var g = Math.sin(t + 2) * 0.1 + 0.1;
    var b = Math.sin(t + 4) * 0.1 + 0.15;

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(r, g, b, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.drawArrays(gl.TRIANGLES, 0, 3);

    requestAnimationFrame(render);
}

requestAnimationFrame(render);
console.log("Render loop started");
