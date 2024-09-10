import React, { useState, useEffect, useCallback } from "react";
import {
  Drawer,
  List,
  Card,
  Button,
  Input,
  Select,
  Slider,
  InputNumber,
  Checkbox,
  Form,
  Row,
  Col,
  Collapse,
  Spin,
  Typography,
} from "antd";
import {fetchAngles, fetchGrades} from '../api'
const { Option } = Select;
const { Title, Text } = Typography;
const { Panel } = Collapse;

const FilterDrawer = ({
  currentClimb,
  climbs,
  handleClimbClick,
  climbCount,
  open,
  currentSearchValues,
  onClose,
  onApplyFilters,
  boardName,
  layout,
}) => {
  const [holdFilterCount, setHoldFilterCount] = useState(0);
  const [holds, setHolds] = useState({});
  const [grades, setGrades] = useState([]);
  const [minGrade, setminGrade] = useState(currentSearchValues.minGrade);
  const [maxGrade, setmaxGrade] = useState(currentSearchValues.maxGrade);
  const [minHoldNumber, setMinHoldNumber] = useState(null);
  const [maxHoldNumber, setMaxHoldNumber] = useState(null);
  const [minAscents, setMinAscents] = useState(currentSearchValues.minAscents);
  const [sortBy, setSortBy] = useState(currentSearchValues.sortBy);
  const [sortOrder, setSortOrder] = useState(currentSearchValues.sortOrder);
  const [angle, setAngle] = useState(currentSearchValues.angle);
  const [minRating, setMinRating] = useState(currentSearchValues.minRating);
  const [onlyClassics, setOnlyClassics] = useState(currentSearchValues.onlyClassics);
  const [gradeAccuracy, setGradeAccuracy] = useState(currentSearchValues.gradeAccuracy);
  const [settername, setsettername] = useState("");
  const [roleMatch, setRoleMatch] = useState("strict");
  const [loading, setLoading] = useState(true);
  const [fetchedGrades, setFetchedGrades] = useState(false);
  const [fetchedAngles, setFetchedAngles] = useState(false);
  const [angles, setAngles] = useState([]);

  // Debounce setup
  const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  const debouncedApplyFilters = useCallback(
    debounce((filters) => {
      onApplyFilters(filters);
    }, 500),
    [],
  );

  useEffect(() => {
    const fetchGradeValues = async () => {
      try {
        const data = await fetchGrades(boardName);
        setGrades(data);
        if (data.length > 0) {
          setminGrade(data[0][0]); // Set default min gradeId
          setmaxGrade(data[data.length - 1][0]); // Set default max gradeId
        }
        setLoading(false);
        setFetchedGrades(true);
      } catch (error) {
        console.error("Error fetching grades:", error);
        setLoading(false);
      }
    };

    if (!fetchedGrades) {
      fetchGradeValues();
    }
  }, [boardName]);

  useEffect(() => {
    const fetchAngleValues = async () => {
      try {
        const data = ["any", ...(await fetchAngles(boardName, layout))];
        setAngles(data);
        setAngle(data[0]);
        setFetchedGrades(true);
      } catch (error) {
        console.error("Error fetching angles:", error);
      }
    };

    if (!fetchedAngles) {
      fetchAngleValues();
    }
  }, [layout, boardName]);

  useEffect(() => {
    const filters = {
      minGrade,
      maxGrade,
      minAscents,
      sortBy,
      sortOrder,
      angle,
      minRating,
      onlyClassics,
      gradeAccuracy,
      settername,
      roleMatch,
      holds,
    };
    debouncedApplyFilters(filters);
  }, [
    minGrade,
    maxGrade,
    minAscents,
    sortBy,
    sortOrder,
    angle,
    minRating,
    onlyClassics,
    gradeAccuracy,
    settername,
    roleMatch,
    holds,
    debouncedApplyFilters,
  ]);

  const handleHoldClick = (holdId, mirroredHoldId) => {
    const currentColor = holds[holdId] || "black";
    const colorRows = [
      ["1", "red"],
      ["2", "blue"],
      ["3", "green"],
    ]; // Example color rows
    const colorIds = colorRows.map((colorRow) => colorRow[0]);
    const colors = colorRows.map((colorRow) => colorRow[1]);

    let currentIndex = colors.indexOf(currentColor);
    let nextIndex = currentIndex + 1;

    if (nextIndex >= colors.length) {
      const updatedHolds = { ...holds };
      delete updatedHolds[holdId];
      if (mirroredHoldId) delete updatedHolds[mirroredHoldId];
      setHolds(updatedHolds);
      setHoldFilterCount(holdFilterCount - 1);
    } else {
      const updatedHolds = {
        ...holds,
        [holdId]: colors[nextIndex],
      };
      if (mirroredHoldId) updatedHolds[mirroredHoldId] = colors[nextIndex];
      setHolds(updatedHolds);
      if (currentIndex === -1) {
        setHoldFilterCount(holdFilterCount + 1);
      }
    }
  };

  const resetHoldFilter = () => {
    setHolds({});
    setHoldFilterCount(0);
  };

  const handleApplyFilters = () => {
    const filters = {
      minGrade,
      maxGrade,
      minAscents,
      sortBy,
      sortOrder,
      angle,
      minRating,
      onlyClassics,
      gradeAccuracy,
      settername,
      roleMatch,
      holds,
    };
    onApplyFilters(filters);
    onClose();
  };

  if (loading || grades.length === 0) {
    return (
      <Drawer title="Advanced Filters" placement="left" onClose={onClose} width={400}>
        <Spin />
      </Drawer>
    );
  }

  return (
    <Drawer
      title="Advanced Filters"
      placement="left"
      onClose={onClose}
      width={"80%"}
      open={open}
    >
      <Collapse defaultActiveKey={[]} accordion>
        <Panel header={`Found ${climbCount} matching climbs`} key="1">
          <Form layout="vertical">
            {grades.length > 0 && (
              <Form.Item label="Grade Range">
                <Slider
                  range
                  min={grades[0][0]}
                  max={grades[grades.length - 1][0]}
                  value={[minGrade, maxGrade]}
                  marks={{
                    [minGrade]: grades.find(([id]) => id === minGrade)[1],
                    [maxGrade]: grades.find(([id]) => id === maxGrade)[1],
                  }}
                  onChange={(value) => {
                    setminGrade(value[0]);
                    setmaxGrade(value[1]);
                  }}
                  tooltip={{
                    formatter: (value) => grades.find(([id]) => id === value)[1],
                  }}
                />
              </Form.Item>
            )}

            <Form.Item label="Min Ascents">
              <InputNumber min={1} value={minAscents} onChange={setMinAscents} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Sort By">
              <Row gutter={8}>
                <Col span={16}>
                  <Select value={sortBy} onChange={setSortBy} style={{ width: "100%" }}>
                    <Option value="ascents">Ascents</Option>
                    <Option value="difficulty">Difficulty</Option>
                    <Option value="name">Name</Option>
                    <Option value="quality">Quality</Option>
                  </Select>
                </Col>
                <Col span={8}>
                  <Select value={sortOrder} onChange={setSortOrder} style={{ width: "100%" }}>
                    <Option value="desc">Descending</Option>
                    <Option value="asc">Ascending</Option>
                  </Select>
                </Col>
              </Row>
            </Form.Item>

            <Form.Item label="Angle">
              <Select
                value={typeof angle === "string" ? angle.toLowerCase() : angle}
                onChange={setAngle}
                style={{ width: "100%" }}
              >
                {angles.map((angle) => (
                  <Option key={angle} value={typeof angle === "string" ? angle.toLowerCase() : angle}>
                    {angle}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item label="Min Rating">
              <InputNumber
                min={1.0}
                max={3.0}
                step={0.1}
                value={minRating}
                onChange={setMinRating}
                style={{ width: "100%" }}
              />
            </Form.Item>

            <Form.Item label="Classics Only">
              <Select value={onlyClassics} onChange={setOnlyClassics} style={{ width: "100%" }}>
                <Option value="0">No</Option>
                <Option value="1">Yes</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Grade Accuracy">
              <Select value={gradeAccuracy} onChange={setGradeAccuracy} style={{ width: "100%" }}>
                <Option value={1}>Any</Option>
                <Option value={0.2}>Somewhat Accurate (&lt;0.2)</Option>
                <Option value={0.1}>Very Accurate (&lt;0.1)</Option>
                <Option value={0.05}>Extremely Accurate (&lt;0.05)</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Setter Name">
              <Input value={settername} onChange={(e) => setsettername(e.target.value)} />
            </Form.Item>

            <Form.Item label="Hold Filters">
              <Button type="dashed" onClick={resetHoldFilter} block>
                Reset Hold Filter ({holdFilterCount} Selected)
              </Button>
              <Row gutter={8} style={{ marginTop: 16 }}>
                <Col span={12}>
                  <Checkbox onChange={(e) => setMinHoldNumber(e.target.checked ? 1 : null)}>Min Hand Holds</Checkbox>
                  {minHoldNumber !== null && (
                    <InputNumber
                      min={1}
                      max={30}
                      value={minHoldNumber}
                      onChange={setMinHoldNumber}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                  )}
                </Col>
                <Col span={12}>
                  <Checkbox onChange={(e) => setMaxHoldNumber(e.target.checked ? 1 : null)}>Max Hand Holds</Checkbox>
                  {maxHoldNumber !== null && (
                    <InputNumber
                      min={1}
                      max={30}
                      value={maxHoldNumber}
                      onChange={setMaxHoldNumber}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                  )}
                </Col>
              </Row>
            </Form.Item>
          </Form>
        </Panel>
      </Collapse>

      <Card
        bodyStyle={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
        style={{ display: "flex", flexDirection: "column", height: "100%" }}
      >
        <div style={{ overflowY: "auto", flex: 1 }}>
          <List
            itemLayout="vertical"
            dataSource={climbs}
            renderItem={(climb) => (
              <List.Item
                key={climb.uuid}
                onClick={() => handleClimbClick(climb)}
                style={{
                  cursor: "pointer",
                  padding: "16px",
                  borderBottom: "1px solid #f0f0f0",
                  backgroundColor: currentClimb?.uuid === climb.uuid ? "#f0f0f0" : "transparent",
                  borderLeft: currentClimb?.uuid === climb.uuid ? "5px solid #1890ff" : "none",
                }}
              >
                <Title level={5} style={{ marginBottom: 4 }}>
                  {climb.name}
                </Title>
                <Text>
                  Grade: {climb.grade} ({climb.gradeAdjustment}) at {climb.angle}°
                </Text>
                <br />
                <Text type="secondary">
                  {climb.ascents} ascents, {climb.stars}★
                </Text>
              </List.Item>
            )}
          />
        </div>
      </Card>
    </Drawer>
  );
};

export default FilterDrawer;
