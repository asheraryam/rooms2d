"use strict";

import { io } from 'socket.io-client';
import { encode, decode } from "@msgpack/msgpack";

var average = (array) => array.reduce((a, b) => a + b) / array.length;
export default class SocketClient extends Phaser.Plugins.BasePlugin {

  socket = null;

  is_connected = false;

  player_id;

  constructor(pluginManager) {
    super(pluginManager);

    this.init_new_socket();

    const self = this;



  }

  send_encoded(p_msg, p_obj) {
    const encoded = encode(p_obj);
    this.socket.emit(
      p_msg, Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength));
  }

  init_new_socket() {

    const self = this;

    this.socket = io.connect({ rejectUnauthorized: false });

    this.socket.on('connected', function () {
      self.is_connected = true;

      //     // get path from current URL
      //     let room = window.location.pathname.slice(3);   // remove leading /chat/
      //     let pos = room.indexOf('/');
      //     if (pos !== -1) {
      //         room = room.slice(0, pos);
      //     }
      //     console.log("Room ID %s", room);
      //     self.room_id = room;
    });

    this.latency = 100;
    this.latency_logs = [];
    this.socket.on('ping', function (start_ms) {
      let latency_ms = Date.now() - start_ms;

      self.latency_logs.unshift(latency_ms);
      if (self.latency_logs.length > 5)
        self.latency_logs.pop();

      self.latency = average(self.latency_logs);
      // console.log("Average Latency: %s", self.latency);
    });

    this.sendTest = function () {
      console.log("test sent");
      self.socket.emit('test');
    };

    this.whatsUp = function (p_name, p_pic_id, p_id) {
      // Ask about everything
      if (!self.room_id) {
        let pos = window.location.pathname.indexOf('/r/');
        if (pos !== -1) {
          self.room_id = window.location.pathname.slice(pos + 3);
        }
      }
      self.socket.emit('whatsUp', {
        room: self.room_id, pic_id: p_pic_id, username: p_name, id: p_id
      });
    };


    this.playerCatchBall = function (p_player_id, p_ball_id) {
      self.send_encoded('catchball', { p: p_player_id, b: p_ball_id });
    };

    this.playerStartThrowBall = function (p_player_id, p_ball_id, p_px, p_py, p_vx, p_vy) {
      self.send_encoded('startthrowball', {
        p: p_player_id, b: p_ball_id, x: p_px, y: p_py, v: p_vx, w: p_vy
      });
    };

    this.playerThrowBall = function (p_ball_id, p_px, p_py, p_vx, p_vy) {
      self.send_encoded('throwball', {
        b: p_ball_id, x: p_px, y: p_py, v: p_vx, w: p_vy
      });
    };

    this.setPeerID = function (p_player_id, p_peer_id) {
      self.socket.emit('set_peer_id', { player_id: p_player_id, peer_id: p_peer_id });
    };

    this.sendMove = function (p_pos_x, p_pos_y, p_vel_x, p_vel_y, p_player_id = null) {
      // TODO Send empty object if the velocity is 0 and rounded positions are same as last frame
      self.send_encoded('move', {
        px: Math.round(p_pos_x), py: Math.round(p_pos_y), vx: Math.round(p_vel_x), vy: Math.round(p_vel_y)
      })
    };

    this.sendYoutubeChangeURL = function (p_player_id, p_new_v_id) {
      self.socket.emit(
        'yt_url', { p: p_player_id, v: p_new_v_id });
      console.log("Sent yt_url %s", p_new_v_id);
    };

    this.sendYoutubeState = function (p_player_id, p_new_state) {
      // TODO Send empty object of the velocity is 0 and rounded positions are same as last frame
      self.socket.emit(
        'yt_state', { p: p_player_id, s: p_new_state });
      console.log("Sent yt_state %s", p_new_state);
    };

    this.sendMutedSelfState = function (p_player_id, p_new_state) {
      self.socket.emit(
        'muted_self', { p: p_player_id, s: p_new_state });
    };
  }
}