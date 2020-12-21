import BoardPlugin from '../../plugins/board-plugin.js';

const COLOR_PRIMARY = 0x7986cb;
const COLOR_LIGHT = 0xaab6fe;
const COLOR_DARK = 0x49599a;

class Demo extends Phaser.Scene {
    constructor() {
        super({
            key: 'examples'
        })
    }

    preload() { }

    create() {
        var config = {
            grid: getHexagonGrid(this),
            // grid: getQuadGrid(this),
            width: 8,
            height: 8,
            // wrap: true
        }
        var board = new Board(this, config);

        // add some blockers
        for (var i = 0; i < 8; i++) {
            new Blocker(board);
        }

        // add chess
        var chessA = new ChessA(board);
        chessA.wander();
    }
}

var getQuadGrid = function (scene) {
    return {
        gridType: 'quadGrid',
        x: 400,
        y: 100,
        cellWidth: 100,
        cellHeight: 50,
        type: 1
    };
}

var getHexagonGrid = function (scene) {
    return {
        gridType: 'hexagonGrid',
        x: 100,
        y: 100,
        size: 30,
        staggeraxis: 'x',
        staggerindex: 'odd'
    };
};

class Board extends RexPlugins.Board.Board {
    constructor(scene, config) {
        // create board
        super(scene, config);
        // draw grid
        var graphics = scene.add.graphics({
            lineStyle: {
                width: 1,
                color: COLOR_DARK,
                alpha: 1
            }
        });
        this.forEachTileXY(function (tileXY, board) {
            var points = board.getGridPoints(tileXY.x, tileXY.y, true);
            graphics.strokePoints(points, true);
        })
    }
}

class Blocker extends RexPlugins.Board.Shape {
    constructor(board, tileXY) {
        var scene = board.scene;
        if (tileXY === undefined) {
            tileXY = board.getRandomEmptyTileXY(0);
        }
        // Shape(board, tileX, tileY, tileZ, fillColor, fillAlpha, addToBoard)
        super(board, tileXY.x, tileXY.y, 0, COLOR_DARK);
        scene.add.existing(this);

        // add behaviors        
        this.moveTo = scene.rexBoard.add.moveTo(this, {
            occupiedTest: true
        })
    }
}

class ChessA extends RexPlugins.Board.Shape {
    constructor(board, tileXY) {
        var scene = board.scene;
        if (tileXY === undefined) {
            tileXY = board.getRandomEmptyTileXY(0);
        }
        // Shape(board, tileX, tileY, tileZ, fillColor, fillAlpha, addToBoard)
        super(board, tileXY.x, tileXY.y, 0, COLOR_LIGHT);
        scene.add.existing(this);

        // add behaviors        
        this.moveTo = scene.rexBoard.add.moveTo(this, {
            occupiedTest: true
        })
            .on('occupy', function (occupiedChess, myChess) {
                var direction = board.directionBetween(myChess, occupiedChess);
                occupiedChess.moveTo.moveToward(direction);
            })
    }

    wander() {
        if (this.moveTo.isRunning) {
            return;
        }
        this.moveTo
            .once('complete', function () {
                this.wander();
            }, this)
            .moveToRandomNeighbor();
    }
}

var config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: Demo,
    plugins: {
        scene: [{
            key: 'rexBoard',
            plugin: BoardPlugin,
            mapping: 'rexBoard'
        }]
    }
};

var game = new Phaser.Game(config);