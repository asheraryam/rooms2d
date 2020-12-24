import { io } from 'socket.io-client';
import Phaser from 'phaser';
import Peer from 'peerjs';

import r_pixel from './assets/sprites/pixel.png';
import r_tilesheet from './assets/map/tilesheet.png';
import r_map from './assets/map/example_map.json';
import r_sprite from './assets/sprites/sprite.png';
import r_ball from './assets/sprites/ball.png';
import r_crosshair from './assets/sprites/crosshair.png';
import r_characters from './assets/sprites/characters/other/All.png';
import r_slime from './assets/sprites/slime_monster/slime_monster_spritesheet.png';

import r_char_0 from './assets/sprites/characters/char_0.png';
import r_char_1 from './assets/sprites/characters/char_1.png';
import r_char_2 from './assets/sprites/characters/char_2.png';
import r_char_3 from './assets/sprites/characters/char_3.png';
import r_char_4 from './assets/sprites/characters/char_4.png';
import r_char_5 from './assets/sprites/characters/char_5.png';
import r_char_6 from './assets/sprites/characters/char_6.png';
import r_char_7 from './assets/sprites/characters/char_7.png';
import r_char_8 from './assets/sprites/characters/char_8.png';
import r_char_9 from './assets/sprites/characters/char_9.png';
import r_char_10 from './assets/sprites/characters/char_10.png';
import r_char_11 from './assets/sprites/characters/char_11.png';
import r_char_12 from './assets/sprites/characters/char_12.png';
import r_char_13 from './assets/sprites/characters/char_13.png';
import r_char_14 from './assets/sprites/characters/char_14.png';
import r_char_15 from './assets/sprites/characters/char_15.png';
import r_char_16 from './assets/sprites/characters/char_16.png';
import r_char_17 from './assets/sprites/characters/char_17.png';
import r_char_18 from './assets/sprites/characters/char_18.png';
import r_char_19 from './assets/sprites/characters/char_19.png';
import r_char_20 from './assets/sprites/characters/char_20.png';
import r_char_21 from './assets/sprites/characters/char_21.png';
import r_char_22 from './assets/sprites/characters/char_22.png';
import r_char_23 from './assets/sprites/characters/char_23.png';

export default class MainGame extends Phaser.Scene {
    static MAX_HEAR_DISTANCE = 400;
    static MOVE_TWEEN_SPEED = 0.25;
    static MOVE_SPEED = 0.25;
    Client = {};

    constructor() {
        super('MainGame');

        this.phaser_created = false;


        this.playerMap = {};
        this.tween_map = {};
        this.players = [];

    }

    static clamp(val, min, max) { return Math.max(min, Math.min(max, val)); };

    init() {
        // game.stage.disableVisibilityChange = true;

        const self = this;


        this.Client.socket = io.connect();

        // this.Client.socket.on('connected', function () {
        //     // get path from current URL
        //     let room = window.location.pathname.slice(3);   // remove leading /chat/
        //     let pos = room.indexOf('/');
        //     if (pos !== -1) {
        //         room = room.slice(0, pos);
        //     }
        //     console.log("Room ID %s", room);
        //     self.room_id = room;
        // });

        this.Client.sendTest = function () {
            console.log("test sent");
            self.Client.socket.emit('test');
        };

        this.Client.askNewPlayer = function () {
            let pos = window.location.pathname.indexOf('/r/');
            if (pos !== -1) {
                self.room_id = window.location.pathname.slice(pos + 3);
            }
            // console.log("Room ID %s", self.room_id);
            let _name = localStorage.getItem("username");
            console.log("Selected name %s", _name);
            self.Client.socket.emit('newplayer', { room: self.room_id, username: _name });
        };

        this.Client.sendClick = function (p_px, p_py, p_vx, p_vy) {
            self.Client.socket.emit('click', { px: p_px, py: p_py, vx: p_vx, vy: p_vy });
        };
        this.Client.sendMove = function (p_px, p_py, p_vx, p_vy) {
            self.Client.socket.emit('move', { px: p_px, py: p_py, vx: p_vx, vy: p_vy });
        };

        this.Client.socket.on('newplayer', function (data) {
            self.addNewPlayer(data.id, data.px, data.py, data.vx, data.vy, data.sprite, data.uname);
        });


        this.Client.socket.on('allplayers', function (data) {
            self.player_id = data.you.id.toString();
            console.log("My new player id is ", self.player_id);
            self.peer = new Peer(self.player_id);
            self.peer.on('open', function () {
                console.log('My PeerJS ID is:', self.peer.id);

                const _all = data.all;
                for (let i = 0; i < _all.length; i++) {
                    if (_all[i].id != self.player_id)
                        call_player(_all[i].id);
                }
            });


            self.peer.on('call', (call) => {
                console.log("Answering player ");
                let getUserMedia_ = (navigator.getUserMedia
                    || navigator.webkitGetUserMedia
                    || navigator.mozGetUserMedia
                    || navigator.msGetUserMedia);
                getUserMedia_({ video: false, audio: true }, (stream) => {
                    call.answer(stream); // Answer the call with an A/V stream.
                    call.on('stream', (remoteStream) => {
                        // Show stream in some <video> element.
                        let peer_id = call.peer.toString();
                        console.log("Answered player " + peer_id);
                        const remoteVideo = document.getElementById("p" + peer_id);
                        if (remoteVideo) {
                            remoteVideo.srcObject = remoteStream;
                        } else {
                            let video = document.createElement('video');
                            video.srcObject = remoteStream;
                            video.autoplay = true;
                            video.id = "p" + peer_id;
                            let element = document.getElementById("media-container");
                            element.appendChild(video);
                        }
                    });
                }, (err) => {
                    console.error('Failed to get local stream', err);
                });
            });


            const _all = data.all;
            for (let i = 0; i < _all.length; i++) {
                self.addNewPlayer(_all[i].id, _all[i].x, _all[i].y, _all[i].sprite, _all[i].uname);
            }


            self.Client.socket.on('clicked', function (data) {
                if (self.player_id != data.id) {
                    // console.log("player %s clicked. current player %s", data.id, self.player_id)
                    self.updatePlayerPhysics(data.id, data.px, data.py, data.vx, data.py);
                }
            });

            self.Client.socket.on('moved', function (data) {
                if (self.player_id != data.id) {
                    // console.log("player %s moved. current player %s", data.id, self.player_id)
                    self.updatePlayerPhysics(data.id, data.px, data.py, data.vx, data.py);
                }
            });

            self.Client.socket.on('remove', function (id) {
                self.removePlayer(id);
            });
        });

        function call_player(p_id) {
            console.log("Calling player ", p_id);
            self.conn = self.peer.connect(p_id);

            self.conn.on('open', function () {
                // Receive messages
                self.conn.on('data', function (data) {
                    console.log('Received', data);
                });

                // Send messages
                self.conn.send('Hello!');
            });

            let getUserMedia_ = (navigator.getUserMedia
                || navigator.webkitGetUserMedia
                || navigator.mozGetUserMedia
                || navigator.msGetUserMedia);
            getUserMedia_({ video: false, audio: true }, (stream) => {
                console.log("Got media stream to call player ", p_id);
                const call = self.peer.call(p_id.toString(), stream);
                call.on('stream', (remoteStream) => {
                    // Show stream in some <video> element.
                    let peer_id = p_id.toString();
                    const remoteVideo = document.getElementById("p" + peer_id);
                    if (remoteVideo) {
                        remoteVideo.srcObject = remoteStream;
                    } else {
                        let video = document.createElement('video');
                        video.srcObject = remoteStream;
                        video.autoplay = true;
                        video.id = "p" + peer_id;
                        let element = document.getElementById("media-container");
                        element.appendChild(video);
                    }
                });
            }, (err) => {
                console.error('Failed to get local stream', err);
            });
        }

    };

    preload() {
        this.char_anims = {};

        this.load.tilemapTiledJSON('map', r_map);
        this.load.image('tilesheet', r_tilesheet);
        this.load.image('pixel', r_pixel);

        this.load.image('sprite', r_sprite);
        this.load.image('ball', r_ball);
        this.load.image('crosshair', r_crosshair);
        this.load.spritesheet('characters', r_characters, { frameWidth: 48, frameHeight: 51 });
        this.load.spritesheet('slime', r_slime, { frameWidth: 24, frameHeight: 24 });

        try {
            let url = 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexyoutubeplayerplugin.min.js';
            // let url = 'js/rex-notes/dist/rexyoutubeplayerplugin.min.js';
            this.load.plugin('rexyoutubeplayerplugin', url, true);
        } catch (error) {
            console.error("Erorr preloading yt plugin" + error);
        }
        // for (let i = 0; i < 24; i++) {
        //     this.load_char_spritesheet(i);
        // }

        this.load.spritesheet("char_0", r_char_0, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_1", r_char_1, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_2", r_char_2, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_3", r_char_3, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_4", r_char_4, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_5", r_char_5, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_6", r_char_6, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_7", r_char_7, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_8", r_char_8, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_9", r_char_9, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_10", r_char_10, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_11", r_char_11, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_12", r_char_12, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_13", r_char_13, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_14", r_char_14, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_15", r_char_15, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_16", r_char_16, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_17", r_char_17, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_18", r_char_18, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_19", r_char_19, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_20", r_char_20, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_21", r_char_21, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_22", r_char_22, { frameWidth: 16, frameHeight: 17 });
        this.load.spritesheet("char_23", r_char_23, { frameWidth: 16, frameHeight: 17 });
    };

    // load_char_spritesheet(char_id) {
    //     // if (!this.char_sprites[char_id]) {
    //     this.load.spritesheet('char_' + char_id, './assets/sprites/characters/char_' + char_id + '.png', { frameWidth: 16, frameHeight: 17 });

    //     // }

    // }
    load_char_anims(char_id) {
        this.anims.create({
            key: 'down_' + char_id,
            frames: this.anims.generateFrameNumbers('char_' + char_id, { frames: [0, 4, 8] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'right_' + char_id,
            frames: this.anims.generateFrameNumbers('char_' + char_id, { frames: [1, 5, 9] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'up_' + char_id,
            frames: this.anims.generateFrameNumbers('char_' + char_id, { frames: [2, 6, 10] }),
            frameRate: 8,
            repeat: -1
        });
        this.anims.create({
            key: 'left_' + char_id,
            frames: this.anims.generateFrameNumbers('char_' + char_id, { frames: [3, 7, 11] }),
            frameRate: 8,
            repeat: -1
        });
    }

    updateCamera() {
        // const width = this.scale.gameSize.width;
        // const height = this.scale.gameSize.height;

        // const camera = this.cameras.main;

        // camera.setViewport(0, 0, width, height);

        // this.adaptive_layer.setPosition(width / 2, height / 2);
        // this.adaptive_layer.setScale(this.scene.getZoom());
    }

    resize() {
        // this.updateCamera();
    }

    on_hit_ball() {
        console.log("Player hit ball");
    }

    create() {
        const self = this;

        for (let i = 0; i < 24; i++) {
            this.load_char_anims(i);
        }

        // this.adaptive_layer = this.add.container();

        this.phaser_created = true;

        let yt_original_config = {
            x: 1300,
            y: 160,
            width: 426,
            height: 240
        }

        try {
            this.youtubePlayer = this.add.rexYoutubePlayer(
                yt_original_config.x, yt_original_config.y, yt_original_config.width, yt_original_config.height, {
                videoId: 'OkQlrIQhUMQ',
                modestBranding: true,
                loop: false,
                autoPlay: false,
            }).on('ready', function () {
                console.log("Video ready");
                // self.youtubePlayer.setPosition(600, 300);
            });
        } catch (error) {
            console.error("Erorr starting yt plugin" + error);
        }



        this.youtubePlayer.original_config = yt_original_config;

        this.player_group = this.physics.add.group();
        this.ball_group = this.physics.add.group();


        this.physics.add.collider(this.player_group, this.ball_group, this.on_hit_ball);


        // let testKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        let map = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        let map1 = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        let map2 = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        let map3 = this.make.tilemap({ key: 'map', tileWidth: 32, tileHeight: 32 });
        let tileset = map.addTilesetImage('tilesheet');

        let layer;
        for (let i = 0; i < map.layers.length; i++) {
            layer = map.createLayer(i, tileset);
            if (layer.layer.name == "collision") {
                layer.setCollisionByProperty({ collides: true });
                // layer.setCollisionBetween(22, 24);
                this.physics.add.collider(this.player_group, layer);
                this.physics.add.collider(this.ball_group, layer);
                layer.visible = false;
            }
        }
        for (let i = 0; i < map1.layers.length; i++) {
            layer = map1.createLayer(i, tileset, map.widthInPixels);
            if (layer.layer.name == "collision") {
                layer.setCollisionByProperty({ collides: true });
                // layer.setCollisionBetween(22, 24);
                this.physics.add.collider(this.player_group, layer);
                this.physics.add.collider(this.ball_group, layer);
                layer.visible = false;
            }
        }
        for (let i = 0; i < map2.layers.length; i++) {
            layer = map2.createLayer(i, tileset, 0, map.heightInPixels);
            if (layer.layer.name == "collision") {
                layer.setCollisionByProperty({ collides: true });
                // layer.setCollisionBetween(22, 24);
                this.physics.add.collider(this.player_group, layer);
                this.physics.add.collider(this.ball_group, layer);
                layer.visible = false;
            }
        }
        for (let i = 0; i < map3.layers.length; i++) {
            layer = map3.createLayer(i, tileset, map.widthInPixels, map.heightInPixels);
            if (layer.layer.name == "collision") {
                layer.setCollisionByProperty({ collides: true });
                // layer.setCollisionBetween(22, 24);
                this.physics.add.collider(this.player_group, layer);
                this.physics.add.collider(this.ball_group, layer);
                layer.visible = false;
            }
        }

        // this.adaptive_layer.add(map);

        //  Set the camera and physics bounds to be the size of 4x4 bg images
        this.cameras.main.setBounds(0, 0, map.widthInPixels * 2, map.heightInPixels * 2);
        this.physics.world.setBounds(0, 0, map.widthInPixels * 2, map.heightInPixels * 2);
        this.cameras.main.zoom = 1.5;
        this.youtubePlayer.original_config.zoom = this.cameras.main.zoom;


        // this.input.on('wheel', function (pointer, gameObjects, deltaX, deltaY, deltaZ) {
        //     let _new_zoom = MainGame.clamp(self.cameras.main.zoom - deltaY * 0.025, 1.2, 1.6);
        //     self.cameras.main.zoom = _new_zoom;
        //     let _zoom_change = (self.youtubePlayer.original_config.zoom - _new_zoom) / self.youtubePlayer.original_config.zoom;
        //     self.youtubePlayer.x = self.youtubePlayer.original_config.x - _zoom_change * 130;
        //     self.youtubePlayer.y = self.youtubePlayer.original_config.y - _zoom_change * 70;
        // });


        // layer.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
        this.Client.askNewPlayer();

        this.crosshair = this.add.sprite(-100, -100, 'crosshair');
        this.crosshair.setVisible(false);
        // this.adaptive_layer.add(this.crosshair);


        this.ball = this.physics.add.sprite(300, 400, 'slime', 6);
        this.ball.scale = 2;
        // this.ball.body.bounce = new Phaser.Math.Vector2(1, 1);
        this.ball.body.setVelocity(100, 100);
        this.ball.setCollideWorldBounds(true);
        this.ball.setImmovable(false);
        this.ball.setBounce(1);
        this.ball.setCircle(12);
        this.ball.setPushable(true);
        this.ball.setDrag(40);
        this.ball.setMaxVelocity(1000);
        this.ball_group.add(this.ball);

        this.input.mouse.disableContextMenu();

        this.input.on('pointerdown', function (pointer) {
            if (pointer.leftButtonDown()) {
                let world_pointer = self.cameras.main.getWorldPoint(pointer.x, pointer.y);
                // console.log("Pressed local: %s %s world: %s %s", pointer.x, pointer.y, world_pointer.x, world_pointer.y);
                let _player = self.movePlayerToPosWithPhysics(self.player_id, world_pointer.x, world_pointer.y);
                if (_player)
                    self.Client.sendMove(_player.x, _player.y, _player.body.velocity.x, _player.body.velocity.y);

            }

        }, self);

        this.keys_arrows = this.input.keyboard.createCursorKeys();
        this.keys_wasd = this.input.keyboard.addKeys({
            'up': Phaser.Input.Keyboard.KeyCodes.W,
            'left': Phaser.Input.Keyboard.KeyCodes.A,
            'down': Phaser.Input.Keyboard.KeyCodes.S,
            'right': Phaser.Input.Keyboard.KeyCodes.D
        });

        this.current_move_input = new Phaser.Math.Vector2(0, 0);

        // this.scene.launch('GameScene');

        // this.gameScene = this.scene.get('GameScene');
    }

    update(time, delta) {
        this.handle_player_anims();
        this.updatePlayerYSort();
        if (!this.player_id || !this.current_player) {
            return;

        }
        this.handle_player_controls(delta);
        this.handle_voice_proxomity();
        this.handleVideo();
    }
    handleVideo() {
        let _distance_vid = Phaser.Math.Distance.Between(
            this.youtubePlayer.x, this.youtubePlayer.y, this.current_player.x, this.current_player.y);
        this.youtubePlayer.setVolume(1 - MainGame.clamp(_distance_vid / (MainGame.MAX_HEAR_DISTANCE * 2), 0, 1));
        let _dist_y = this.youtubePlayer.y - this.current_player.y;
        if (_distance_vid < MainGame.MAX_HEAR_DISTANCE * 0.75 && -_dist_y < MainGame.MAX_HEAR_DISTANCE / 2) {
            this.cameras.main.followOffset.y = Phaser.Math.Linear(this.cameras.main.followOffset.y, -_dist_y, 0.05);
        } else {
            this.cameras.main.followOffset.y = Phaser.Math.Linear(this.cameras.main.followOffset.y, 0, 0.05);
        }
    }


    handle_player_controls(delta) {
        this.current_move_input.set(0, 0);
        if (this.keys_arrows.up.isDown || this.keys_wasd.up.isDown) {
            this.current_move_input.y = -1;
        }
        if (this.keys_arrows.down.isDown || this.keys_wasd.down.isDown) {
            this.current_move_input.y = +1;
        }
        if (this.keys_arrows.right.isDown || this.keys_wasd.right.isDown) {
            this.current_move_input.x = +1;
        }
        if (this.keys_arrows.left.isDown || this.keys_wasd.left.isDown) {
            this.current_move_input.x = -1;
        }

        let move_vector = this.current_move_input.scale(delta * MainGame.MOVE_SPEED);
        if (move_vector.lengthSq() == 0) {
            return null;
        }

        if (!!this.tween_map[this.player_id]) {
            this.tween_map[this.player_id].stop();
            this.crosshair.setVisible(false);

        }

        let _player = this.incrementPlayerPos(this.player_id, move_vector);
        if (!!_player) {
            this.Client.sendMove(_player.x, _player.y, _player.body.velocity.x, _player.body.velocity.y);
        }


    }
    static ANIM_VEL_CUTOFF = 0.1;
    handle_player_anims() {
        this.players.forEach(p_id => {
            let player = this.playerMap[p_id];
            if (!!player) { // Animate based on velocity
                let _p_vel = player.body.velocity;
                if (Math.abs(_p_vel.x) >= Math.abs(_p_vel.y)) {
                    if (_p_vel.x > MainGame.ANIM_VEL_CUTOFF) {
                        if (!player.anims.isPlaying || !player.anims.currentAnim.key.startsWith("right"))
                            player.play("right_" + player.sprite_id);
                    } else if (_p_vel.x < -MainGame.ANIM_VEL_CUTOFF) {
                        if (!player.anims.isPlaying || !player.anims.currentAnim.key.startsWith("left"))
                            player.play("left_" + player.sprite_id);
                    } else {
                        if (!!player.anims.currentAnim) {
                            // console.log("Stop anim");
                            let first_frame = player.anims.currentAnim.getFrameAt(0);
                            player.anims.pause(first_frame);
                            // player.anims.stopOnFrame(first_frame);
                        }
                        // player.anims.isPlaying = false;
                        // player.anims.repeat = 0;
                        // player.anims.stopAfterRepeat(1);
                    }
                } else {
                    if (_p_vel.y > MainGame.ANIM_VEL_CUTOFF) {
                        if (!player.anims.isPlaying || !player.anims.currentAnim.key.startsWith("down"))
                            player.play("down_" + player.sprite_id);
                    } else if (_p_vel.y < -MainGame.ANIM_VEL_CUTOFF) {
                        if (!player.anims.isPlaying || !player.anims.currentAnim.key.startsWith("up"))
                            player.play("up_" + player.sprite_id);
                    } else {
                        if (!!player.anims.currentAnim) {
                            // console.log("Stop anim");
                            let first_frame = player.anims.currentAnim.getFrameAt(0);
                            player.anims.pause(first_frame);
                            // player.anims.stopOnFrame(first_frame);
                        }
                        // player.anims.repeat = 0;
                        // player.anims.stopAfterRepeat(1);
                    }
                }
            }
        });
    }


    handle_voice_proxomity() {
        try {
            let video_parent = document.querySelector('#media-container');
            this.players.forEach(p_id => {
                if (p_id == this.player_id) {
                    return;
                }

                // TODO Need to profile this and make sure it's ok. 
                // I can optimize this by storing the DOMS in a map.
                let child_video = video_parent ? video_parent.querySelector('#p' + p_id) : null;
                if (!child_video) {
                    return;
                }
                let player = this.playerMap[p_id];
                if (!!player) {
                    let _distance = Phaser.Math.Distance.Between(
                        player.x, player.y, this.current_player.x, this.current_player.y);

                    let _volume = 1 - MainGame.clamp(_distance / MainGame.MAX_HEAR_DISTANCE, 0, 1);
                    // TODO I can store the last volume separately if the getter here is costly
                    child_video.volume = _volume;
                }
            });

        } catch (error) {
            console.warn(error);
        }
    }

    handleSimulationSync(delta) {
        this.players.forEach(p_id => {
            if (p_id == this.player_id) {
                return;
            }
            let player = this.playerMap[p_id];
            if (!!player) {
                // TODO Reduce allocations
                let old_pos = new Phaser.Math.Vector2(player.x, player.y);
                let new_pos = old_pos.lerp(player.sync_target, 0.1);
                player.x = new_pos.x;
                player.y = new_pos.y;
            }
        });
    }



    addNewPlayer(p_id, p_px, p_py, p_vx, p_vy, p_sprite_id, p_username) {
        console.log("Recieved player name %s ", p_username);
        this.players.push(p_id);
        let _new_player = this.physics.add.sprite(p_px, p_py, 'char_' + p_sprite_id, 0);
        _new_player.body.velocity.x = p_vx;
        _new_player.body.velocity.y = p_vy;
        // this.adaptive_layer.add(_new_player);
        this.playerMap[p_id] = _new_player;
        _new_player.scale = 3;
        _new_player.sprite_id = p_sprite_id;
        _new_player.username = p_username;
        _new_player.setCircle(6);
        if (p_id == this.player_id) {
            this.current_player = _new_player;
            _new_player.body.collideWorldBounds = true;
            _new_player.setPushable(false);
            _new_player.setImmovable(true);
            _new_player.setBounce(0);
            this.cameras.main.startFollow(_new_player, false, 1, 1);
            // NOTE Second parameter of startFollow is for rounding pixel jitter. 
            // Setting it to true will fix the jitter of world tiles but add jitter for the player sprite.
            this.player_group.add(_new_player);
        }

        // Add label
        let style = { font: "14px Arial", fill: "#000000", wordWrap: false, wordWrapWidth: (_new_player.width * _new_player.scale), align: "center" };//, backgroundColor: "#ffff00" };
        _new_player.name_label = this.add.text(
            _new_player.x + (_new_player.width * _new_player.scale) / 2, _new_player.y + (_new_player.height * _new_player.scale) / 2, _new_player.username, style);
    };

    incrementPlayerPos(p_id, p_vector) {
        let player = this.playerMap[p_id];
        if (!player) {
            console.log("Warning! Player is null");
            return null;
        }
        player.x += p_vector.x;
        player.y += p_vector.y;
        return player;
    }

    setPlayerPos(p_id, p_x, p_y, lerp = false) {
        let player = this.playerMap[p_id];
        if (!player) {
            console.log("Warning! Player is null");
            return;
        }
        if (!!this.tween_map[p_id]) {
            this.tween_map[p_id].stop();
        }
        if (!!lerp) {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, p_x, p_y);

            let _duration = distance / MainGame.MOVE_TWEEN_SPEED;

            this.tween_map[p_id] = this.tweens.add({
                targets: player,
                x: p_x,
                y: p_y,
                // ease: 'Sine.easeIn',
                duration: _duration,
                paused: false
            });

            // this.tween_map[p_id].play();
        } else {
            player.x = p_x;
            player.y = p_y;
        }
    }

    updatePlayerYSort() {
        const self = this;
        this.players.forEach(_index => {
            let player = this.playerMap[_index];
            if (!!player) {
                player.depth = player.y + (player.height * player.scale) / 2;

                // console.log("Update label: %s", player.name_label.text);
                player.name_label.x = Phaser.Math.Linear(player.name_label.x, player.x - + player.name_label.width / 2, 0.5);
                player.name_label.y = Phaser.Math.Linear(player.name_label.y, player.y + (player.height * player.scale) / 2, 0.5);

                if (player.body.speed > 0 && !!player.current_target) {
                    let distance = Phaser.Math.Distance.Between(player.x, player.y, player.current_target.x, player.current_target.y);

                    //  4 is our distance tolerance, i.e. how close the source can get to the target
                    //  before it is considered as being there. The faster it moves, the more tolerance is required.
                    if (distance < 10) {
                        player.body.reset(player.current_target.x, player.current_target.y);
                        player.current_target = null;
                        if (_index == self.player_id) {
                            self.crosshair.setVisible(false);
                        }
                    }
                }
            }
        });
        // if (!!this.crosshair)
        //     this.crosshair.depth = this.crosshair.y + this.crosshair.height / 2;

    }

    updatePlayerPhysics(p_id, p_px, p_py, p_vx, p_vy) {

        let player = this.playerMap[p_id];
        if (!player) {
            console.log("Warning! Player is null");
            return;
        }

        player.sync_target = new Phaser.Math.Vector2(p_px, p_py);
        player.setVelocity(p_vx, p_vy);

    }


    movePlayerToPosWithPhysics(p_id, p_px, p_py) {
        const self = this;

        let _player = this.playerMap[p_id];
        if (!_player) {
            console.log("Warning! Player is null");
            return;
        }

        _player.current_target = new Phaser.Math.Vector2(p_px, p_py);

        let distance = Phaser.Math.Distance.Between(_player.x, _player.y, p_px, p_py);


        this.physics.moveToObject(_player, _player.current_target, null,
            distance / MainGame.MOVE_TWEEN_SPEED);

        if (this.player_id == p_id) {
            this.crosshair.setPosition(p_px, p_py);
            this.crosshair.setVisible(true);
        }
        return _player;
    }

    movePlayerTo(p_id, p_x, p_y) {
        const self = this;

        let player = this.playerMap[p_id];
        if (!player) {
            console.log("Warning! Player is null");
            return;
        }
        let distance = Phaser.Math.Distance.Between(player.x, player.y, p_x, p_y);
        if (distance <= 0) {
            console.log("Warning! Distance is 0. Move ignored.");
            return;
        }
        let _duration = distance / MainGame.MOVE_TWEEN_SPEED;

        // this.physics.moveToObject(player, pointer, _duration);

        if (!!this.tween_map[p_id]) {
            this.tween_map[p_id].stop();
        }

        this.tween_map[p_id] = this.tweens.add({
            targets: player,
            x: p_x,
            y: p_y,
            // ease: 'Sine.easeIn',
            duration: _duration,
            paused: false,
            onComplete: function () {
                self.crosshair.setVisible(false);
            },
        });

        if (this.player_id == p_id) {
            this.crosshair.setPosition(p_x, p_y);
            this.crosshair.setVisible(true);
        }

        // this.tween_map[p_id].play();

    };

    removePlayer(id) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i] == id) { this.players.splice(i, 1); }
        }
        this.playerMap[id].name_label.destroy();
        this.playerMap[id].destroy();
        delete this.playerMap[id];
    };


}

