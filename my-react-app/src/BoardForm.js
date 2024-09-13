import React, { useEffect, useState, useContext } from "react";
import { Form, Select, Input, Button, Row, Col, Typography } from "antd";
import { PeerContext } from "./connection-manager/PeerProvider";
import { Link } from "react-router-dom";
import { defaultLayouts, boardLayouts } from "./kilter-board/board-data";

const { Option } = Select;
const { Title } = Typography;

const BoardForm = ({ setBoardName }) => {
  const [layouts, setLayouts] = useState(defaultLayouts);
  const [sets, setSets] = useState([]);

  const [selectedBoard, setSelectedBoard] = useState("kilter");
  const [selectedLayout, setSelectedLayout] = useState(8);
  const [selectedSize, setSelectedSize] = useState(17);
  const [sizes, setSizes] = useState(boardLayouts[selectedLayout] || []);

  const handleBoardChange = (value) => {
    setSelectedBoard(value);
  };

  const onLayoutChange = (value) => {
    setSelectedLayout(value);
    setSizes(boardLayouts[value]);
  };

  const { peer, peerId, receivedData, sendData, connectToPeer } = useContext(PeerContext);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (receivedData) {
      console.log("New data received:", receivedData);
      // Handle the received data
    }
  }, [receivedData]);

  const handleSendMessage = () => {
    sendData({ message });
  };

  const onConnectButtonClick = (event) => {
    const connId = document.querySelector("#todo-remove-id").value;
    connectToPeer(connId);
    event.preventDefault();
  };

  const onStartSessionClick = (event) => {
    const connId = document.querySelector("#todo-remove-id").value;
    connectToPeer(connId);
    event.preventDefault();
  };

  return (
    <div style={{ padding: "24px", background: "#f7f7f7", borderRadius: "8px" }}>
      <Title level={4}>Board Settings</Title>
      <Form layout="vertical">
        <Form.Item label="Board">
          <Select value={selectedBoard} onChange={handleBoardChange}>
            <Option value="decoy">Decoy</Option>
            <Option value="grasshopper">Grasshopper</Option>
            <Option value="kilter">Kilter</Option>
            <Option value="tension">Tension</Option>
            <Option value="touchstone">Touchstone</Option>
          </Select>
        </Form.Item>

        <Form.Item label="Layout">
          <Select value={selectedLayout} onChange={onLayoutChange}>
            {layouts.map(([layoutId, layoutName]) => (
              <Option key={layoutId} value={layoutId}>
                {layoutName}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Size">
          <Select value={selectedSize} onChange={(value) => setSelectedSize(value)}>
            {sizes.map(([sizeId, sizeName, sizeDescription]) => (
              <Option key={sizeId} value={sizeId}>
                {`${sizeName} ${sizeDescription}`}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label="Session ID">
          <Input id="todo-remove-id" placeholder="Session ID" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Button type="primary" block onClick={onConnectButtonClick}>
              Join a session
            </Button>
          </Col>
          <Col span={12}>
            <Link to={`/climb/${selectedBoard}/${selectedLayout}/${selectedSize}`}>
              <Button type="primary" block>
                Start a session
              </Button>
            </Link>
          </Col>
        </Row>
      </Form>
      <div style={{ marginTop: "16px" }}>
        <Typography.Text type="secondary">Peer ID: {peerId}</Typography.Text>
      </div>
    </div>
  );
};

export default BoardForm;
