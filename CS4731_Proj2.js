
var points = [];
var colors = [];
var gl;
var program;

var file;
var fileString;
var fudgeFactor = -0.1;
var ply_vertices = 0;
var ply_poly = 0;
var isReading = false;
var vao_index = 0;
var poly_index = 0;

var iVertices = [];
var fVertices = [];
var triangles = [];
var normals = [];

var theta = 0;

// Renders one triangle
// Input: 3 vertices
var then = 0;

function render_triangle(a, b, c)
{
    points = [];
    points.push(vec4(fVertices[a][0], fVertices[a][1], fVertices[a][2], 1));
    points.push(vec4(fVertices[b][0], fVertices[b][1], fVertices[b][2], 1));
    points.push(vec4(fVertices[c][0], fVertices[c][1], fVertices[c][2], 1));


    colors = [];
    colors.push(1.0, 1.0, 1.0, 1.0);
    colors.push(1.0, 1.0, 1.0, 1.0);
    colors.push(1.0, 1.0, 1.0, 1.0);

    var pBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    var vPosition = gl.getAttribLocation(program,  "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    var cBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(colors), gl.STATIC_DRAW);

    var vColor= gl.getAttribLocation(program,  "vColor");
    gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vColor);


    gl.drawArrays(gl.LINE_LOOP, 0, points.length); //Draw arrays into triangles
}



// Establishes the event listener for file loading
function main(){

    var inputElement = document.getElementById('input'); //Get input element from the load file button
    inputElement.addEventListener('change', loadFile, false); //Add event listener that calls loadFile

    var rotating = false;
    var direction = 0; //Not moving

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
            if(direction == 1){
                direction = 0;
            } else {
                direction = 1;
            }
        }

        if(event.keyCode == 65){
            if(direction == 3){
                direction = 0;
            } else {
                direction = 3;
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
    });
}

// Iterates through aPoly (list of triangles) and renders them
function render() {
    // var ctMatrix = rotateX(theta);
    // theta +=1;
    //
    // var modelMatrix = gl.getUniformLocation(program, 'modelMatrix');
    // gl.uniformMatrix4fv(modelMatrix, false, flatten(ctMatrix));

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

    //Set the clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    for (var j = 0; j < triangles.length; j++) {
        fVertices.push([triangles[j][0][0], triangles[j][0][1], triangles[j][0][2]]);
        fVertices.push([triangles[j][1][0], triangles[j][1][1], triangles[j][1][2]]);
        fVertices.push([triangles[j][2][0], triangles[j][2][1], triangles[j][2][2]]);
    }

    var data = new plyData(fVertices);

    var transformMatrix = translate(-data.midX, -data.midY, -data.midZ);
    var scaleMatrix = scalem(1 / (data.width / 1.6), 1 / (data.height / 1.6), 1 / (data.depth / 1.6));

    var translateMatrixLocation = gl.getUniformLocation(program, 'translateMatrix');
    var scaleMatrixLocation = gl.getUniformLocation(program, 'scaleMatrix');

    gl.uniformMatrix4fv(scaleMatrixLocation, false, flatten(scaleMatrix));
    gl.uniformMatrix4fv(translateMatrixLocation, false, flatten(transformMatrix));

    var fudgeLocation = gl.getUniformLocation(program, "fudgeFactor");

    gl.uniform1f(fudgeLocation, fudgeFactor);

    for (var k = 0; k < fVertices.length; k += 3) {
        render_triangle(k, k + 1, k + 2);
    }

    //requestAnimationFrame(render);
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

        console.log("ply_vertices: " + ply_vertices);
        console.log("ply_poly: " + ply_poly);
        console.log("Vertices length: " + iVertices.length);
        console.log("Triangles length: " + triangles.length);

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
