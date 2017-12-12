window.mobileCheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

let socket;
//let host = 'http://165.120.23.108:8001/';
let host = 'https://dotsnboxes.herokuapp.com/';

let mobile;

const baseGridSize = 5;

let gridSize, boxSize, dotSize, hoverRadius;
let dragOrigin, transPos, dragging;
let activeDot, completedBoxes;
let grid;
let name, play, active;
let sndPress, sndRelease, sndBox;
let font;
let connections;
let snow;

$(document).ready(function() {
	$("#input-nickname").on("blur", function() {
		$("#input-nickname").slideUp(100);
		document.getElementById("input-nickname").value = "";
	});
});

function joinGame(e) {
	if (e.keyCode == 13) {
		name = document.getElementById("input-nickname").value;
		if (name != "") {
			$("#input-nickname").slideUp(100);
			if (!play) {
				document.getElementById("input-nickname").value = "";
				document.getElementById("player-name").innerHTML = "Playing as <strong>" + name + "</strong>";
				document.getElementById("input-chat").setAttribute("placeholder", "Type a message and press enter..");
				socket.emit("setNick", {nickname: name});
				dragging = false;
			}
		}
	}
}

function sendMessage(e) {
	if (e.keyCode == 13) {
		let message = {
			text: document.getElementById("input-chat").value,
			sender: name
		};
		if (message.text != "") {
			document.getElementById("input-chat").value = "";
			socket.emit("message", message);
		}
	}
}

function toggleReady() {
	socket.emit("playerReady");
}

function updateButtonState() {
	document.getElementById("btn-join").disabled  = name != "" || play;
	document.getElementById("btn-ready").disabled = name == "" || play;
	document.getElementById("input-chat").disabled = name == "";
}

function forEachDot(action) {
	for (col of grid) {
		for (dot of col) {
			action(dot);
		}
	}
}

function transMouse() {
	return createVector(mouseX - transPos.x, mouseY - transPos.y);
}

function createGrid() {
	gridSize = 5 + Math.floor(connections.length/2);
	dotSize = boxSize/10;
	hoverRadius = boxSize/3;
	transPos = createVector(width/2 - boxSize*gridSize/2, height/2 - boxSize*gridSize/2);

	grid = [];
	for (let x = 0; x < gridSize; x++) {
		grid[x] = [];
		for (let y = 0; y < gridSize; y++) {
			grid[x][y] = new Dot(x * boxSize + boxSize/2, y * boxSize + boxSize/2, dotSize, hoverRadius, boxSize);
		}
	}
}

function resizeGrid() {
	dotSize = boxSize/10;
	hoverRadius = boxSize/3;
	transPos = createVector(width/2 - boxSize*gridSize/2, height/2 - boxSize*gridSize/2);

	for (let x = 0; x < gridSize; x++) {
		for (let y = 0; y < gridSize; y++) {
			grid[x][y].x = x * boxSize + boxSize/2;
			grid[x][y].y = y * boxSize + boxSize/2;
			grid[x][y].size = dotSize;
			grid[x][y].hoverSize = hoverRadius * 2;
			grid[x][y].jointSize = boxSize;
		}
	}
}

function zoom(absAmount) {
	let amount = absAmount * boxSize;
	if (boxSize + amount > 0.02*min(width, height) && (boxSize + amount) * gridSize < 0.9*min(width, height)) {
		boxSize += amount;
	}
	resizeGrid();
}

function preload() {
	// Load sounds and fonts
	sndPress = loadSound('assets/press.wav');
	sndRelease = loadSound('assets/release.wav');
	sndBox = loadSound('assets/box.wav');

	font = loadFont("assets/OpenSans.ttf");
}

function setup() {
	let canvas = createCanvas(document.getElementById("game").offsetWidth, document.getElementById("game").offsetHeight);
	canvas.parent("game");
	document.getElementById("player-name").innerHTML = "You are a spectator";
	document.getElementById("input-chat").setAttribute("placeholder", "Join the game to chat");

	// Initialise variables
	mobile = mobileCheck();
	gridSize = 5;
	activeDot = null;
	completedBoxes = 0;
	dragging = false;
	grid = [];
	name = "";
	play = false;
	active = false;
	connections = [];
	snow = [];

	if (mobile) {
		boxSize = round(min(width, height) / (gridSize + 1));
	} else {
		boxSize = round(min(width/3, height/3) / (gridSize + 1));
	}

	// Socket events
	socket = io.connect(host);

	socket.on("gameUpdate", (data) => {
		// Update play state
		play = data.play

		// Update player count
		connections = data.players;
		document.getElementById("player-count").innerHTML = "Number of players: <strong>" + connections.length + "</strong>";

		// Update grid
		createGrid();
		let i = 0;
		forEachDot((dot) => {
			dot.joints = data.grid[i].joints;
			dot.box = data.grid[i].box;
			dot.boxText = data.grid[i].boxText;
			dot.boxID = data.grid[i].boxID;
			i++;
		});

		// Update player list
		// Remove all players in list
		let playerListElt = document.getElementById("player-list");
		while(playerListElt.hasChildNodes()) {
			playerListElt.removeChild(playerListElt.lastChild);
		}

		if (connections.length > 0) {
			active = false;

			// Add all players to list
			for (let i = 0; i < connections.length; i++) {
				if (connections[i].id == socket.id && connections[i].active) {
					active = true;
				}

				let playerElt = document.createElement("li");

				let playerTextElt = document.createElement("p");
				playerTextElt.className = "player";
				playerTextElt.innerHTML = connections[i].nickname;
				if (connections[i].present == false) {
					playerTextElt.innerHTML += " (left)";
				}

				if (connections[i].active || (!play && connections[i].ready)) {
					playerElt.className = "active-player";
					playerTextElt.className += " active-player";
				}

				let scoreElt = document.createElement("div");
				scoreElt.style.width = str(100 * connections[i].score / sq(gridSize-1)) + "%";
				scoreElt.className = "score-bar";

				playerElt.appendChild(scoreElt);
				playerElt.appendChild(playerTextElt);

				playerListElt.appendChild(playerElt);
			}
		}
		updateButtonState();
	});

	socket.on("message", (message) => {
		let messageElt = document.createElement("p");
		if (message.sender == "") {
			messageElt.innerHTML = "<strong>[INFO]</strong>" + " > " + message.text;
		} else {
			messageElt.innerHTML = "<strong>" + message.sender + "</strong>" + " > " + message.text;
		}

		let messageContainer = document.getElementById("chat-container");
		messageContainer.appendChild(messageElt);
		messageContainer.scrollTop = messageContainer.scrollHeight;
	});

	socket.on("endGame", () => {
		console.log("endGame");
		socket.disconnect();
		setup();
	});

	// Add snow on desktop
	if (!mobile) {
		for (let i = 0; i < 30; i++) {
			snow[i] = new Snow();
		}
	}

	createGrid();
}

function draw() {
	if (completedBoxes == sq(gridSize-1) && play) {
		socket.emit("endGame");
	}

	background(40);

	// Drawing the actual game
	translate(transPos.x, transPos.y);

	let mousePos = transMouse();

	// Draw the dots
	forEachDot((dot) => {
		dot.draw();
		if (dot == activeDot) {
			stroke(255);
			strokeWeight(dotSize * 0.7);
			line(dot.x, dot.y, mousePos.x, mousePos.y);
		} else {
			if (dist(mousePos.x, mousePos.y, dot.x, dot.y) < hoverRadius && active) {
				dot.hover();
			}
		}
	});

	for (particle of snow) {
		particle.move();
		particle.show();
	}
}

function mousePressed() {
	let mousePos = transMouse();
	// if (!mobile) {
	// 	dragging = true;
	// }

	if (active) {
		forEachDot((dot) => {
			if (dist(mousePos.x, mousePos.y, dot.x, dot.y) < hoverRadius) {
				dragging = false;
				activeDot = dot;
				dot.active = true;
				sndPress.setVolume(0.2);
				sndPress.play();
			}
		});
	}

	// if (dragging) {
	// 	dragOrigin = createVector(mousePos.x, mousePos.y);
	// }
}

function mouseDragged() {
	// if (dragging) {
	// 	let mousePos = transMouse();
	// 	transPos.add(p5.Vector.sub(createVector(mousePos.x, mousePos.y), dragOrigin));
	// }
}

function mouseReleased() {
	let mousePos = transMouse();

	if (activeDot != null) {
		for (let col = 0; col < gridSize; col++) {
			for (let row = 0; row < gridSize; row++) {
				let dot = grid[col][row];

				if (dist(mousePos.x, mousePos.y, dot.x, dot.y) < hoverRadius && dist(mousePos.x, mousePos.y, activeDot.x, activeDot.y) <= boxSize + hoverRadius) {
					sndRelease.setVolume(0.2);
					sndRelease.play();

					let data = {
						x: col,
						y: row,
						index: -1,
						playerID: socket.id
					}

					let top    = dot.y == activeDot.y - boxSize;
					let right  = dot.x == activeDot.x + boxSize;
					let bottom = dot.y == activeDot.y + boxSize;
					let left   = dot.x == activeDot.x - boxSize;

					let posIndex = -1;
					if (top && !(right || bottom || left) && !activeDot.joints[0]) {
						data.index = 2;
					} else if (right && !(top || bottom || left) && !activeDot.joints[1]) {
						data.index = 3;
					} else if (bottom && !(right || top || left) && !activeDot.joints[2]) {
						data.index = 0;
					} else if (left && !(right || bottom || top) && !activeDot.joints[3]) {
						data.index = 1;
					}

					if (data.index > -1) {
						socket.emit('jointCreated', data);
					}
				}
			}
		}

		activeDot.active = false;
		activeDot = null;
	}
}

function mouseWheel(e) {
	zoom(-e.delta/1000);
}

function windowResized() {
	resizeCanvas(document.getElementById("game").offsetWidth, document.getElementById("game").offsetHeight);
	resizeGrid();
}
