

import Peer from 'peerjs';

export default class PeerChat extends Phaser.Plugins.BasePlugin {
  peer = null;

  _can_call = false;

  _queued_peer_ids = [];

  _connected_peer_ids = [];

  constructor(pluginManager) {
    super(pluginManager);

    this.init_new_peer();

  }


  callback_on_connect = null;
  init_new_peer() {
    const self = this;

    self.peer = new Peer();

    this.peer.on('open', function () {
      // TODO Tell server about my ID
      console.log('My PeerJS ID is:', self.peer.id);
      self._can_call = true;

      self.call_next_peer();

      try {
        if (!!self.callback_on_connect) {
          self.callback_on_connect();
        }
      } catch (error) {
        console.error("Errer in callback_on_connect", error);
      }

    });

    this.peer.on('error', function (err) {
      // Errors on the peer are almost always fatal and will destroy the peer
      console.error('Critical peer error. Starting new peer.', err);

      self._can_call = false;

      // TODO Tell the server about this
      self.init_new_peer();

    });


    this.peer.on('call', (call) => {
      console.log("Answering player ");
      let getUserMedia_ = (navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia);
      getUserMedia_({ video: false, audio: true }, (stream) => {
        let peer_id = call.peer.toString();
        self._connected_peer_ids.push(peer_id);

        call.answer(stream); // Answer the call with an A/V stream.
        call.on('stream', (remoteStream) => {
          // Show stream in some <video> element.

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
        console.error('Failed to get local stream to answer call. Note that the peer is still listed under _connected_peer_ids.', err);
      });
    });
  }

  player_peer_map = new Map(); // The map is for updating volumes each frame
  receive_all_peers(p_all_peers) {
    const self = this;
    p_all_peers.forEach(element => {
      if (element.peer_id != self.peer.id) {
        self.player_peer_map.set(element.player_id, element.pid);
        self.request_call_peer(element.pid);
      }
    });
  }

  request_call_peer(p_peer_id) {
    this._queued_peer_ids.push(p_peer_id);

    if (!!this._can_call) {
      this.call_next_peer();
    }
  }

  call_next_peer() {
    try {

      if (this._queued_peer_ids.length <= 0) {
        // No more peers to call
        return;
      }

      const self = this;

      let next_peer_id = this._queued_peer_ids.shift();

      console.log("Calling player ", next_peer_id);
      self.conn = self.peer.connect(next_peer_id);

      self.conn.on('open', function () {
        // Receive messages
        self.conn.on('data', function (data) {
          console.log('Received', data);
        });

        // Send messages
        self.conn.send(`Hello from ${self.peer.id} !`);
      });

      let getUserMedia_ = (navigator.getUserMedia
        || navigator.webkitGetUserMedia
        || navigator.mozGetUserMedia
        || navigator.msGetUserMedia);
      getUserMedia_({ video: false, audio: true }, (stream) => {
        if (!next_peer_id) {
          return;
        }
        console.log("Got media stream to call player ", next_peer_id);
        const call = self.peer.call(next_peer_id.toString(), stream);
        call.on('stream', (remoteStream) => {
          if (!next_peer_id) {
            return;
          }
          // Show stream in some <video> element.
          let peer_id = next_peer_id.toString();
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
          self.call_next_peer();
        });
      }, (err) => {
        console.error(
          'Failed to get local stream to send call. Note that the peer is removed _queued_peer_ids before connecting, so there will be no second attempt.', err);
      });

    } catch (error) {

    }
  }


  //Additional methods for getting managing player data
  isAlive() {
    // TODO maybe use peer.disconnected property for this
    return this._can_call;
  }
}