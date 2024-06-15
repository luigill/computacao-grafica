var vertexShaderSource = `#version 300 es
 
// an attribute is an input (in) to a vertex shader.
// It will receive data from a buffer
in vec2 a_position;

// Used to pass in the resolution of the canvas
uniform vec2 u_resolution;

// all shaders have a main function
void main() {

  // convert the position from pixels to 0.0 to 1.0
  vec2 zeroToOne = a_position / u_resolution;

  // convert from 0->1 to 0->2
  vec2 zeroToTwo = zeroToOne * 2.0;

  // convert from 0->2 to -1->+1 (clipspace)
  vec2 clipSpace = zeroToTwo - 1.0;

  gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
}
`;

var fragmentShaderSource = `#version 300 es
 
precision highp float;

uniform vec4 u_color;

// we need to declare an output for the fragment shader
out vec4 outColor;

void main() {
  outColor = u_color;
}
`;

// Fill the buffer with the values that define a rectangle.
function setRectangle(gl, x, y, width, height) {
  var x1 = x;
  var x2 = x + width;
  var y1 = y;
  var y2 = y + height;
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
}

function main() {
  // Acha a tag HTML Canvas
  let canvas = document.querySelector("#paint");
  // Inicia o WebGL2
  let gl = canvas.getContext("webgl2");
  if (!gl) {
    console.log("Erro ao iniciar o WebGL2");
    return;
  }

  //boilerplate
  var program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  //boilerplate
  var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // look up uniform locations
  var resolutionUniformLocation = gl.getUniformLocation(
    program,
    "u_resolution"
  );
  var colorLocation = gl.getUniformLocation(program, "u_color");

  // three 2d points
  var positions = [0, 0, 0, 0.5, 0.9, 0, 0.5, 0];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  //boilerplate
  var vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  gl.enableVertexAttribArray(positionAttributeLocation);

  var size = 2; // 2 components per iteration
  var type = gl.FLOAT; // the data is 32bit floats
  var normalize = false; // don't normalize the data
  var stride = 0; // 0 = move forward size * sizeof(type) each iteration to get the next position
  var offset = 0; // start at the beginning of the buffer
  gl.vertexAttribPointer(
    positionAttributeLocation,
    size,
    type,
    normalize,
    stride,
    offset
  );

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // Clear the canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Tell it to use our program (pair of shaders)
  gl.useProgram(program);

  // Bind the attribute/buffer set we want.
  gl.bindVertexArray(vao);

  // First let's make some variables
  // to hold the translation, width and height of the rectangle
  var translation = [0, 0];
  var width = 40;
  var height = 20;
  var color = [Math.random(), Math.random(), Math.random(), 1];

  // Animation variables
  var speed = [1, 1]; // speed in x and y direction

  drawScene();

  function updatePosition(index) {
    return function (event, ui) {
      translation[index] = ui.value;
      drawScene();
    };
  }

  function drawScene() {
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    // Tell WebGL how to convert from clip space to pixels
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // Clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Tell it to use our program (pair of shaders)
    gl.useProgram(program);

    // Bind the attribute/buffer set we want.
    gl.bindVertexArray(vao);

    // Pass in the canvas resolution so we can convert from
    // pixels to clipspace in the shader
    gl.uniform2f(resolutionUniformLocation, gl.canvas.width, gl.canvas.height);

    // Update the position buffer with rectangle positions
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    setRectangle(gl, translation[0], translation[1], width, height);

    // Set a random color.
    gl.uniform4fv(colorLocation, color);

    // Draw the rectangle.
    function spawnRectangle() {
      var primitiveType = gl.TRIANGLES;
      var offset = 0;
      var count = 6;
      gl.drawArrays(primitiveType, offset, count);
    }

    spawnRectangle();
  }

  function updatePosition() {
    // Update the rectangle's position
    translation[0] += speed[0];

    // Check for boundaries and reverse direction if needed
    if (translation[0] < 0 || translation[0] + width > gl.canvas.width) {
      speed[0] = -speed[0];
    }
    // Draw the scene with the new position
    drawScene();

    // Request the next frame
    requestAnimationFrame(updatePosition);
  }

  // Start the animation
  updatePosition();
}

drawScene();
