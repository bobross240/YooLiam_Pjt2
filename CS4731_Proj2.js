
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

var aVertex= [];
var aPoly = [];
var aIndex = [];

var vertices = [];
var triangles = [];

// Renders one triangle
// Input:
function render_triangle(a, b, c)
{
    for(var i = 0; i < vertices.length; i++){
        vertices[i] = scale(1, vertices[i]);
    }

    points = [];
    points.push(vec4(vertices[a][0], vertices[a][1], vertices[a][2], 1));
    points.push(vec4(vertices[b][0], vertices[b][1], vertices[b][2], 1));
    points.push(vec4(vertices[c][0], vertices[c][1], vertices[c][2], 1));


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
}

// Iterates through aPoly (list of triangles) and renders them
function render(){
    //Retrieve the <canvas> element
    var canvas = document.getElementById('webgl');
    document.getElementById('input').addEventListener('change', loadFile, false);
    //Get the rendering context for WebGL
    gl = WebGLUtils.setupWebGL(canvas, undefined);

    //Check that the rendering context isn't null
    if(!gl)
    {
        console.log('Failed to get the rendering context for WebGL.');
        return;
    }

    //Initialize shaders
    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);

    //Initialize viewport
    gl.viewport( 0, 0, 400, 400);

    //Set the clear color
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);

    for(var j = 0; j < aPoly.length; j++){
        vertices.push([parseFloat(aPoly[j].a.x), parseFloat(aPoly[j].a.y), parseFloat(aPoly[j].a.z)]);
        vertices.push([parseFloat(aPoly[j].b.x), parseFloat(aPoly[j].b.y), parseFloat(aPoly[j].b.z)]);
        vertices.push([parseFloat(aPoly[j].c.x), parseFloat(aPoly[j].c.y), parseFloat(aPoly[j].c.z)]);
    }

    var data = new plyData(vertices);

    var transformMatrix = translate(-data.midX, -data.midY, -data.midZ);

    var scaleMatrix = scalem(1/(data.width/2), 1/(data.height/2), 1/(data.depth/2));


    var translateMatrixLocation = gl.getUniformLocation(program, 'translateMatrix');
    var scaleMatrixLocation = gl.getUniformLocation(program, 'scaleMatrix');

    gl.uniformMatrix4fv(scaleMatrixLocation, false, flatten(scaleMatrix));
    gl.uniformMatrix4fv(translateMatrixLocation, false, flatten(transformMatrix));

    for(var k = 0;k < vertices.length; k+=3){
        render_triangle(k, k+1, k+2);
    }
}

// Loads file and captures data
// Calls render function
function loadFile(event) {
    aVertex = [];
    aPoly = [];

    file = event.target.files[0];       //Store the file
    var reader = new FileReader();  //Make new FileReader
    reader.readAsText(file);        //Turn the file into text
    reader.onload = function (event) {
        fileString = reader.result;     //Store text in string

        var lines = fileString.split(/\r?\n/);   //Split by line

        var ply_index = 0;

        var vertices = [];
        var polys = [];

        console.log("# of lines in file: " + lines.length);

        for (var i = 0; i < lines.length; i++){
            if(isReading){  //Done with header
                var e = lines[i].split(" ");

                //Read vertices from file
                if(ply_index < ply_vertices){
                    vertices[ply_index] = new plyVertex();
                    vertices[ply_index].x = e[0];
                    vertices[ply_index].y = e[1];
                    vertices[ply_index].z = e[2];

                    aVertex.push(vertices[ply_index]);


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
                        polys[poly_index] = new plyPoly();
                        polys[poly_index].a = vertices[e[1]];
                        polys[poly_index].b = vertices[e[2]];
                        polys[poly_index].c = vertices[e[3]];

                        aPoly.push(polys[poly_index]);

                        // index
                        aIndex.push(poly_index);
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
            // Done with header, allocate space for data
            if (lines[i] == "end_header"){
                vertices = new Array(ply_vertices);

                polys = new Array(ply_poly);

                aVertex = new Array();
                aPoly = new Array();
                aIndex = new Array();

                isReading = true;
            }
        }

        console.log("ply_vertices: " + ply_vertices);
        console.log("ply_poly: " + ply_poly);
        console.log("aVertex length: " + aVertex.length);
        console.log("aPoly length: " + aPoly.length);
        console.log("aIndex length: " + aIndex.length);

        render();
    };

    console.log("Loading file: <" + file.name + ">...");

}

// PLY file vertex format
function plyVertex(x, y, z){
    this.x = 0;     //Position
    this.y = 0;
    this.z = 0;
}

// PLY file polygon format
function plyPoly(a, b, c){
    this.a = a;     // 3 vertices
    this.b = b;
    this.c = c;
    this.mx;
    this.my;
    this.mz;
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
//
// function calculateNormal(vertices){
//     for( var i = 0; i < vertices)
//
// }
