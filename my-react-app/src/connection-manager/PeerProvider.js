import React, { useState, useEffect } from "react";
import Peer from "peerjs";

export const PeerContext = React.createContext();
let peerInstance;

const PeerProvider = ({ children }) => {
  const [peer, setPeer] = useState(null);
  const [connections, setConnections] = useState([]);
  const [receivedData, setReceivedData] = useState([]);
  const [peerId, setPeerId] = useState(null);
  const [readyToConnect, setReadyToConnect] = useState(false);

  useEffect(() => {
    if (!peerInstance) {
      peerInstance = new Peer({ debug: 1 });
      const p = peerInstance;
      p.on("open", (id) => {
        console.log("My peer ID is:", id);
        // Handle peer connections here
        setPeerId(id);
        setReadyToConnect(true);
      });

      p.on("connection", (newConn) => {
        console.log("New Connection established");

        newConn.on("data", (data) => {
          console.log("Received data:", data);
          setReceivedData(data); // Store received data in an array
        });

        setConnections((prevConnections) => [...prevConnections, newConn]);
      });
      window.peerInstance = p;

      setPeer(p);
    }

    // Optional: Clean up when the component unmounts or when peer changes
    return () => {
      if (peer) {
        peer.destroy();
      }
    };
  }, []);

  const sendData = (data, connectionId = null) => {
    console.log(`Sending `, data)
    if (connectionId) {
      const connection = connections.find((conn) => conn.peer === connectionId);
      if (connection) {
        connection.send(data);
      } else {
        console.error(`No active connection with ID ${connectionId}`);
      }
    } else {
      // Broadcast to all connections
      connections.forEach((conn) => conn.send(data));
    }
  };

  const connectToPeer = (connectionId) => {
    const newConn = peer.connect(connectionId);

    newConn.on("data", (data) => {
      console.log("Received data:", data);
      setReceivedData(data); // Store received data in an array
    });

    setConnections((prevConnections) => [...prevConnections, newConn]);
  };

  window.connections = connections;
  return (
    <PeerContext.Provider value={{ readyToConnect, receivedData, sendData, connectToPeer, peerId }}>
      {children}
    </PeerContext.Provider>
  );
};

export default PeerProvider;
