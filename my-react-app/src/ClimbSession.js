import React, { useEffect, useState, useContext } from "react";
import { PeerContext } from "./PeerProvider";
import KilterBoard from "./KilterBoard";
const headers = new Headers({ "ngrok-skip-browser-warning": "true" });

const ClimbSession = ({ boardName, setBoardName, onLoginButtonClick }) => {
  const [layouts, setLayouts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [sets, setSets] = useState([]);
  const [selectedLayout, setSelectedLayout] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isNextButtonDisabled, setIsNextButtonDisabled] = useState(true);

  useEffect(() => {
    populateLayouts(boardName);
  }, [boardName]);

  useEffect(() => {
    if (selectedLayout) {
      populateSizes();
    }
  }, [selectedLayout]);

  useEffect(() => {
    if (selectedSize) {
      populateSets();
    }
  }, [selectedSize]);

  const populateLayouts = (boardName) => {
    fetch(`/api/v1/${boardName}/layouts`, { headers })
      .then((response) => response.json())
      .then((data) => {
        setLayouts(data);
        setSelectedLayout(data[0]?.[0] || "");
      });
  };

  const populateSizes = () => {
    fetch(`/api/v1/${boardName}/layouts/${selectedLayout}/sizes`, { headers })
      .then((response) => response.json())
      .then((data) => {
        setSizes(data);
        setSelectedSize(data[0]?.[0] || "");
      });
  };

  const populateSets = () => {
    fetch(`/api/v1/${boardName}/layouts/${selectedLayout}/sizes/${selectedSize}/sets`, { headers })
      .then((response) => response.json())
      .then((data) => {
        setSets(data);
        updateSetsInput(data);
      });
  };

  const updateSetsInput = (sets) => {
    let isOneSetEnabled = sets.some((set) => set[2] === true);
    setIsNextButtonDisabled(!isOneSetEnabled);
  };

  const handleBoardChange = (event) => {
    const newBoardName = event.target.value;
    setBoardName(newBoardName);
  };

  const { peer, peerId, receivedData, sendData, connectToPeer } = useContext(PeerContext);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (receivedData) {
      console.log("New data received:", receivedData);
      // Handle the received data
    }
  }, [receivedData]); // Effect runs whenever receivedData changes

  const handleSendMessage = () => {
    sendData({ message });
  };
  const onConnectButtonClick = (event) => {
    const connId = document.querySelector("#todo-remove-id").value;
    connectToPeer(connId);
    //TODO: Don't connect here, go to the climb view connect there
    event.preventDefault();
  };

  debugger;
  console.log(peer);
  return (
    <div className="card p-3 bg-light">
      <KilterBoard editEnabled={true} />
    </div>
  );
};

export default ClimbSession;
