import React, { useEffect, useState, useContext } from "react";
// import KilterBoard from "./KilterBoard";
import { PeerContext } from "./PeerProvider";
import { Link } from "react-router-dom";
import { defaultLayouts, boardLayouts } from "./kilter-board/board-data";
const headers = new Headers({ "ngrok-skip-browser-warning": "true" });

const BoardForm = ({ setBoardName }) => {
  const [layouts, setLayouts] = useState(defaultLayouts);
  const [sets, setSets] = useState([]);

  const [selectedBoard, setSelectedBoard] = useState("kilter");
  const [selectedLayout, setSelectedLayout] = useState(8);
  const [selectedSize, setSelectedSize] = useState(17);
  const [sizes, setSizes] = useState(boardLayouts[selectedLayout] || []);

  const handleBoardChange = (e) => {
    setSelectedBoard(e.target.value);
  };
  const onLayoutChange = (e) => {
    setSelectedLayout(e.target.value);
    setSizes(boardLayouts[e.target.value]);
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

  const onStartSessionClick = (event) => {
    // selectedLayout, selectedSize
    const connId = document.querySelector("#todo-remove-id").value;
    connectToPeer(connId);
    //TODO: Don't connect here, go to the climb view connect there
    event.preventDefault();
  };

  return (
    <div className="card p-3 bg-light">
      <div className="input-group mb-3">
        <span className="input-group-text">Board</span>
        <select
          className="form-select"
          id="select-board"
          name="board"
          value={selectedBoard}
          onChange={handleBoardChange}
        >
          <option value="decoy">Decoy</option>
          <option value="grasshopper">Grasshopper</option>
          <option value="kilter">Kilter</option>
          <option value="tension">Tension</option>
          <option value="touchstone">Touchstone</option>
        </select>
      </div>
      <div className="input-group mb-3">
        <span className="input-group-text">Layout</span>
        <select
          className="form-select"
          id="select-layout"
          name="layout"
          value={selectedLayout}
          onChange={onLayoutChange}
        >
          {(layouts || []).map(([layoutId, layoutName]) => (
            <option key={layoutId} value={layoutId}>
              {layoutName}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group mb-3">
        <span className="input-group-text">Size</span>
        <select
          className="form-select"
          id="select-size"
          name="size"
          value={selectedSize}
          onChange={(e) => setSelectedSize(e.target.value)}
        >
          {(sizes || []).map(([sizeId, sizeName, sizeDescription]) => (
            <option key={sizeId} value={sizeId}>
              {`${sizeName} ${sizeDescription}`}
            </option>
          ))}
        </select>
      </div>
      {/* <div className="input-group mb-1 d-grid gap-2">
        <button
          id="button-login"
          type="button"
          className="btn btn-secondary"
          data-bs-toggle="modal"
          data-bs-target="#div-modal"
          onClick={onLoginButtonClick}
        >
          Login
        </button>
      </div> */}
      <div class="input-group mb-3">
        <span class="input-group-text" id="basic-addon1">
          @
        </span>
        <input type="text" id="todo-remove-id" class="form-control" placeholder="Session ID" />
      </div>

      <div id="div-sets-inputs"></div>
      <div className="input-group mb-3">
        <div className="col d-grid me-1">
          <button className="btn btn-success" onClick={onConnectButtonClick}>
            Join a session
          </button>
        </div>
        <div className="col d-grid ms-1">
          <Link to={`/climb/${selectedBoard}/${selectedLayout}/${selectedSize}`}>
            <button className="btn btn-primary" type="submit" id="button-next">
              Start a session
            </button>
          </Link>
        </div>
      </div>
      {peerId}
    </div>
  );
};

export default BoardForm;
