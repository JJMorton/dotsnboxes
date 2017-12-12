let express = require('express');
let socket = require('socket.io');

let app = express();
let server = app.listen(process.env.PORT || 8001);
app.use(express.static('public'));

let io = socket(server);

let players = [];
let play = false;
let grid = [];
let completedBoxes = 0;

class Dot {
	constructor() {
		//             top,    right,  bottom, left
		this.joints = [false,  false,  false,  false];
		// This refers to the bottom right box
		this.box = false;
		this.boxText = "";
		this.boxID = "";
	}

	createJoint(index) {
		this.joints[index] = true;
	}

	createBox(text, id) {
		this.box = true;
		this.boxText = text;
		this.boxID = id;
	}
}

function getFormattedTime() {
	let d = new Date();
	d = ('0' + d.getHours()).slice(-2) + ":" + ('0' + d.getMinutes()).slice(-2) + ":" + ('0' + d.getSeconds()).slice(-2);
	return d;
}

function reset() {
	createGrid();
	completedBoxes = 0;
	players = [];
	play = false;
}

function createGrid() {
	let size = 5 + Math.floor(players.length/2);
	grid = [];
	for (let x = 0; x < size; x++) {
		grid[x] = [];
		for (let y = 0; y < size; y++) {
			grid[x][y] = new Dot();
		}
	}
}

function createdABox(playerID) {
	let created = false;
	// Check for boxes created
	// All the dots except the right column and bottom row
	for (let x = 0; x < grid.length; x++) {
		for (let y = 0; y < grid[0].length; y++) {
			// Looks at the box to the bottom right of the dot
			if (grid[x][y].joints[1] && grid[x+1][y].joints[2] && grid[x+1][y+1].joints[3] && grid[x][y+1].joints[0] && !grid[x][y].box) {
				grid[x][y].box = true;
				grid[x][y].boxID = playerID;
				for (let i = 0; i < players.length; i++) {
					if (players[i].id == playerID) {
						players[i].score++;
						grid[x][y].boxText = (i + 1).toString();
					}
				}
				completedBoxes++;
				created = true;
			}
		}
	}
	return created;
}

function createEndTimer() {
	console.log("[" + getFormattedTime() + "] Game ended");
	setTimeout(function() {
		reset();
		io.sockets.emit('endGame');
	}, 2000);
}

function nextPlayer() {
	let i = 0;
	let found = false;
	while (i < players.length && !found) {
		if (players[i].active) {
			found = true;
			players[i].active = false;

			let nextActivePlayer = i;
			let done = false;
			while (!done) {
				nextActivePlayer++;
				if (nextActivePlayer < players.length) {
					if (players[nextActivePlayer].present) {
						done = true;
						players[nextActivePlayer].active = true;
					}
				} else {
					nextActivePlayer = -1;
				}
			}

		}
		i++;
	}
}

function emitGameUpdate(socketID = null) {
	// Compacts the grid data for emitting
	let gridData = [];
	for (col of grid) {
		for (dot of col) {
			gridData[gridData.length] = {
				joints: dot.joints,
				box: dot.box,
				boxText: dot.boxText,
				boxID: dot.boxID
			}
		}
	}

	if (socketID == null) {
		io.sockets.emit('gameUpdate', {
			grid: gridData,
			players: players,
			play: play
		});
	} else {
		io.to(socketID).emit('gameUpdate', {
			grid: gridData,
			players: players,
			play: play
		});
	}
}

io.sockets.on('connection', (socket) => {
	console.log("[" + getFormattedTime() + "] New connection with ID " + socket.id);

	if (!play) {
		createGrid();
	}
	emitGameUpdate(socket.id);

	socket.on('setNick', (data) => {
		if (data.nickname == "" || data.nickname == null || data.nickname.length > 45) {
			io.to(socket.id).emit('message', {
				text: 'Invalid nickname',
				sender: ""
			});
		} else {
			if (!play) {
				players[players.length] = {
					id: socket.id,
					nickname: data.nickname,
					ready: false,
					active: false,
					present: true,
					score: 0
				};

				io.sockets.emit('message', {
					text: data.nickname + " joined",
					sender: ""
				});

				createGrid();
				emitGameUpdate();
			}
		}
	});

	socket.on('playerReady', () => {
		let allReady = true;
		for (let i = 0; i < players.length; i++) {
			if (players[i].id == socket.id) {
				players[i].ready = !players[i].ready;
			}
			if (!players[i].ready) {
				allReady = false;
			}
		}

		if (allReady) {
			players[0].active = true;
			play = true;
			io.sockets.emit('message', {
				text: "All players ready. Game starting",
				sender: ""
			});
		}

		emitGameUpdate();

		console.log("[" + getFormattedTime() + "] " + socket.id + " toggled ready state");
	});

	socket.on('jointCreated', (data) => {
		grid[data.x][data.y].createJoint(data.index);
		// Create the joint going in the opposite direction
		switch(data.index) {
			case 0:
				grid[data.x][data.y - 1].createJoint(2);
				break;
			case 1:
				grid[data.x + 1][data.y].createJoint(3);
				break;
			case 2:
				grid[data.x][data.y + 1].createJoint(0);
				break;
			case 3:
				grid[data.x - 1][data.y].createJoint(1);
		}

		if (!createdABox(data.playerID)) {
			nextPlayer();
		}

		if (completedBoxes == (grid.length-1) * (grid[0].length-1)) {
			// Game completed
			console.log("[" + getFormattedTime() + "] Game completed")
			// Find the players with the largest score
			let winners = [{score: -1}];
			for (client of players) {
				if (client.score > winners[0].score) {
					winners = [client];
				} else if (client.score == winners[0].score) {
					winners[winners.length] = client;
				}
			}
			if (winners.length == 1) {
				io.sockets.emit('message', {
					text: winners[0].nickname + " won with a score of " + winners[0].score,
					sender: ""
				});
			} else {
				// If players drew, construct an appropriate sentence
				let winnersString = "";
				for (let i = 0; i < winners.length; i++) {
					winnersString += winners[i].nickname;
					if (i == winners.length - 2) {
						winnersString += " and ";
					} else if (i == winners.length - 1) {
						winnersString += " ";
					} else {
						winnersString += ", ";
					}
				}
				io.sockets.emit('message', {
					message: winnersString + "drew with a score of " + winners[0].score,
					sender: ""
				});
			}

			createEndTimer();
		}

		emitGameUpdate();
	});

	socket.on("message", (message) => {
		io.sockets.emit("message", message);
	});

	socket.on('disconnect', () => {
		console.log("[" + getFormattedTime() + "] " + socket.id + " disconnected");
		let i = 0;
		let found = false;
		let activePlayerDisconnect = -1;
		while (i < players.length && found == false) {
			if (players[i].id == socket.id) {
				io.sockets.emit('message', {
					text: players[i].nickname + " disconnected",
					sender: ""
				});
				found = true;
				if (play) {
					// If the game had started, set them as not present and skip their turn
					if (players[i].active) {
						activePlayerDisconnect = i;
					}
					players[i].present = false;
				} else {
					// Otherwise, just remove the player and resize the grid
					players.splice(i, 1);
					createGrid();
				}
			}

			i++;
		}
		
		// Decides if all the players are inactive or not
		let inactive = true;
		for (player of players) {
			if (player.present) {
				inactive = false;
			}
		}

		if (!inactive && activePlayerDisconnect >= 0) {
			nextPlayer();
		}

		if (players.length == 0 || inactive) {
			console.log("[" + getFormattedTime() + "] Players disconnected, restarting game");
			reset();
		}

		emitGameUpdate();
	});

});
