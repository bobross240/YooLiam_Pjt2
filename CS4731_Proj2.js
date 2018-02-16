
var points = [];
var colors = [];
var gl;
var program;

var file;
var fileString;
var ply_vertices = 0;
var ply_poly = 0;
var isReading = false;
var vao_index = 0;
var poly_index = 0;

var iVertices = [];
var fVertices = [];
var triangles = [];
var normals = [];

var thetaX = 0;
var thetaY = 0;
var thetaZ = 0;
var thetaN = 0;
var rotation = 0;
var pulsing = false;
var rotating = false;
var direction = 0; //Not moving

var near = -1.0;
var far = 1;
var radius = 4.0;
var theta  = 90.0;
var phi    =0.0;
var dr = 5.0 * Math.PI/180.0;

var  fovy = 60.0;  // Field-of-view in Y direction angle (in degrees)
var  aspect;       // Viewport aspect ratio

var mvMatrix, pMatrix, animationMatrix, rotationMatrix, transformMatrix, scaleMatrix;
var modelView, projection;
var rotationMatrixLocation, animationMatrixLocation, scaleMatrixLocation, translateMatrixLocation;
var eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

// Renders one triangle
// Input: 3 vertices
var then = 0;

function render_triangles(vertices)
{
    for(var i = 0; i < vertices.length; i+=3) {
        points = [];
        points.push(vec4(fVertices[i][0], fVertices[i][1], fVertices[i][2], 1));
        points.push(vec4(fVertices[i + 1][0], fVertices[i + 1][1], fVertices[i + 1][2], 1));
        points.push(vec4(fVertices[i + 2][0], fVertices[i + 2][1], fVertices[i + 2][2], 1));

        var pBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

        var vPosition = gl.getAttribLocation(program,  "vPosition");
        gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);

        gl.drawArrays(gl.LINE_LOOP, 0, points.length); //Draw arrays into triangles
    }
}



// Establishes the event listener for file loading
function main(){

    //Retrieve the <canvas> element
    var canvas = document.getElementById('webgl');
    document.getElementById('input').addEventListener('change', loadFile, false);
    //Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);


    //Check that the rendering context isn't null
    if (!gl) {
        console.log('Failed to get the rendering context for WebGL.');
        return;
    }

    //Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    //Initialize viewport
    gl.viewport(0, 0, 400, 400);
    aspect = canvas.width/canvas.height;

    gl.enable(gl.DEPTH_TEST);
    //Set the clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    colors = [];
    colors.push(1.0, 1.0, 1.0, 1.0);
    colors.push(1.0, 1.0, 1.0, 1.0);
    colors.push(1.0, 1.0, 1.0, 1.0);


    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor= gl.getAttribLocation(program,  "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);

    var inputElement = document.getElementById('input'); //Get input element from the load file button
    inputElement.addEventListener('change', loadFile, false); //Add event listener that calls loadFile



    document.addEventListener('keydown', function(event){
        if(event.keyCode == 88){
            if(direction == 1){
                direction = 0;
            } else {
                direction = 1;
            }
        }

        if(event.keyCode == 67){
            if(direction == -1){
                direction = 0;
            } else {
                direction = -1;
            }
        }

        if(event.keyCode == 89){
            if(direction == 2){
                direction = 0;
            } else {
                direction = 2;
            }
        }

        if(event.keyCode == 85){
            if(direction == -2){
                direction = 0;
            } else {
                direction = -2;
            }
        }

        if(event.keyCode == 90){
            if(direction == 3){
                direction = 0;
            } else {
                direction = 3;
            }
        }

        if(event.keyCode == 65){
            if(direction == -3){
                direction = 0;
            } else {
                direction = -3;
            }
        }

        if(event.keyCode == 82){
            if(direction == -3){
                direction = 0;
            } else {
                direction = -3;
            }
        }

        if(event.keyCode == 66){
            if(rotating){
                rotating = false;
            } else {
                rotating = true;
            }
        }

        if(event.keyCode == 66){
            if(pulsing){
                rotating = false;
            } else {
                rotating = true;
            }
        }
    });
}

// Iterates through aPoly (list of triangles) and renders them
function render() {
    eye = vec3(2, 2, 2);

    for (var j = 0; j < triangles.length; j++) {
        fVertices.push([triangles[j][0][0], triangles[j][0][1], triangles[j][0][2]]);
        fVertices.push([triangles[j][1][0], triangles[j][1][1], triangles[j][1][2]]);
        fVertices.push([triangles[j][2][0], triangles[j][2][1], triangles[j][2][2]]);
    }

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    var data = new plyData(fVertices);

    transformMatrix = translate(-data.midX, -data.midY, -data.midZ);
    scaleMatrix = scalem(1 / (data.width / 1.1), 1 / (data.height / 1.1), 1 / (data.depth / 1.1));

    if(direction == 1){
        thetaX += 0.2;
    }
    if(direction == -1){
        thetaX -= 0.2;
    }
    if(direction == 2){
        thetaY += 0.2;
    }
    if(direction == -2){
        thetaY -= 0.2;
    }
    if(direction == 3){
        thetaZ += 0.2;
    }
    if(direction == -3){
        thetaZ -= 0.2;
    }
    if(rotating){
        rotation += 2;
    }

    mvMatrix = lookAt(eye, at, up);
    pMatrix = perspective(fovy, aspect, -1, 1);
    animationMatrix = translate(thetaX, thetaY, thetaZ);
    rotationMatrix = rotate(rotation, [1, 0, 0]);

    projection = gl.getUniformLocation(program, 'projectionMatrix');
    modelView = gl.getUniformLocation(program, 'modelMatrix');

    rotationMatrixLocation = gl.getUniformLocation(program, 'rotationMatrix');
    animationMatrixLocation = gl.getUniformLocation(program, 'animationMatrix');
    translateMatrixLocation = gl.getUniformLocation(program, 'translateMatrix');
    scaleMatrixLocation = gl.getUniformLocation(program, 'scaleMatrix');

    gl.uniformMatrix4fv(projection, false, flatten(pMatrix));
    gl.uniformMatrix4fv(modelView, false, flatten(mvMatrix));
    gl.uniformMatrix4fv(rotationMatrixLocation, false, flatten(rotationMatrix));
    gl.uniformMatrix4fv(animationMatrixLocation, false, flatten(animationMatrix));
    gl.uniformMatrix4fv(scaleMatrixLocation, false, flatten(scaleMatrix));
    gl.uniformMatrix4fv(translateMatrixLocation, false, flatten(transformMatrix));

    render_triangles(fVertices);


    requestAnimationFrame(render);
}


// Loads file and captures data
// Calls render function
function loadFile(event) {

    file = event.target.files[0];       //Store the file
    var reader = new FileReader();  //Make new FileReader
    reader.readAsText(file);        //Turn the file into text
    reader.onload = function (event) {
        fileString = reader.result;     //Store text in string

        var lines = fileString.split(/\r?\n/);   //Split by line

        var ply_index = 0;

        console.log("# of lines in file: " + lines.length);

        for (var i = 0; i < lines.length; i++){
            if(isReading){  //Done with header
                var e = lines[i].split(" ");

                //Read vertices from file
                if(ply_index < ply_vertices){
                    iVertices[ply_index] = [parseFloat(e[0]), parseFloat(e[1]), parseFloat(e[2])];

                //Read faces from file
                } else {
                    //Reset indices
                    if(ply_index == ply_vertices){
                        console.log("Setting indices to 0...");

                        poly_index = 0;

                        vao_index = 0;
                    }

                    //Store face data
                    if(poly_index < ply_poly){
                        triangles[poly_index] = [iVertices[e[1]], iVertices[e[2]], iVertices[e[3]]];
                        normals[poly_index] = calculateNormal(triangles[poly_index]);
                    }

                    poly_index++;
                }

                ply_index++;
            } else {    //For reading header
                //Read number of vertices
                if(lines[i].substr(0, "element vertex".length) == "element vertex")
                    ply_vertices = lines[i].split(" ")[2];
                //Read number of faces
                if(lines[i].substr(0, "element face".length) == "element face")
                    ply_poly = lines[i].split(" ")[2];
            }
            // Done with header
            if (lines[i] == "end_header"){
                isReading = true;
            }
        }

        render();
    };

    console.log("Loading file: <" + file.name + ">...");

}

function plyData(v){
    this.minXpos = 1;
    this.maxXpos = -1;
    this.minYpos = 1;
    this.maxYpos = -1;
    this.minZpos = 1;
    this.maxZpos = -1;


    for(var i = 0; i < v.length; i++){
        if(v[i][0] < this.minXpos)
            this.minXpos = v[i][0];
        if(v[i][0]> this.maxXpos)
            this.maxXpos = v[i][0];
        if(v[i][1] < this.minYpos)
            this.minYpos = v[i][1];
        if(v[i][1] > this.maxYpos)
            this.maxYpos = v[i][1];
        if(v[i][2] < this.minZpos)
            this.minZpos = v[i][2];
        if(v[i][2] > this.maxZpos)
            this.maxZpos = v[i][2];
    }

    this.midX = (this.maxXpos+this.minXpos)/2;
    this.midY = (this.maxYpos+this.minYpos)/2;
    this.midZ = (this.maxZpos+this.minZpos)/2;


    this.width = this.maxXpos-this.minXpos;
    this.height = this.maxYpos-this.minYpos;
    this.depth = this.maxZpos-this.minZpos;
}

// Calculates normals using Newell method
function calculateNormal(triangle){
    var n = [0.0, 0.0, 0.0];
    for( var i = 0; i < triangle.length; i++){
        var vCurrent = triangle[i];
        var vNext = triangle[(i+1) % triangle.length];

        n[0] = n[0] + ((vCurrent[1] - vNext[1])*(vCurrent[2] + vNext[2]));
        n[1] = n[1] + ((vCurrent[2] - vNext[2])*(vCurrent[0] + vNext[0]));
        n[2] = n[2] + ((vCurrent[2] - vNext[2])*(vCurrent[1] + vNext[1]));
    }

    return normalize(n);
}
