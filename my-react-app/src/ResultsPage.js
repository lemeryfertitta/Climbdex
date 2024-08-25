import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button, Badge, Card, List, Row, Col, Typography, Space, Grid, Tooltip } from "antd";
import {
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  UpOutlined,
  DownOutlined,
  BulbOutlined,
  InstagramOutlined,
} from "@ant-design/icons";
import {
  fetchResults,
  fetchResultsCount,
  // fetchBetaCount, // Uncomment if needed
} from "./api";
import KilterBoardLoader from "./KilterBoardLoader";
import { boardLayouts } from "./board-data";
import FilterDrawer from "./FilterDrawer";

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const Tick = () => (
  <svg viewBox="0 30 280 250" height="16px" width="16px">
    <path d="M 30,180 90,240 240,30" style={{ stroke: "#000", strokeWidth: 25, fill: "none" }} />
  </svg>
);

const IlluminateButton = () => <Button id="button-illuminate" type="default" icon={<BulbOutlined />} />;
const SearchButton = ({ onClick }) => (
  <Button id="button-illuminate" type="default" onClick={onClick} icon={<SearchOutlined />} />
);

const BetaButton = ({ betaCount }) => (
  <Badge count={betaCount} offset={[-5, 5]}>
    <Button
      id="anchor-beta"
      type="default"
      href="/kilter/beta/A0BC2661C68B4B00A5CDF2271CEAF246/"
      icon={<InstagramOutlined />}
    />
  </Badge>
);

const ResultsPage = () => {
  const { board, layout, size } = useParams();
  const location = useLocation();
  const screens = useBreakpoint();

  const isSmallScreen = !screens.md;

  const [queryParameters, setQueryParameters] = useState({
    minGrade: 10,
    maxGrade: 33,
    name: "",
    angle: "any",
    minAscents: 1,
    sortBy: "ascents",
    sortOrder: "desc",
    minRating: 1.0,
    onlyClassics: 0,
    gradeAccuracy: 1,
    settername: "",
    setternameSuggestion: "",
    holds: "",
    mirroredHolds: "",
  });

  const [results, setResults] = useState([]);
  const [resultsCount, setResultsCount] = useState(0);
  const [currentClimb, setCurrentClimb] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [betaCount, setBetaCount] = useState(0);

  const [drawerVisible, setDrawerVisible] = useState(false);

  const showDrawer = () => {
    setDrawerVisible(true);
  };

  const closeDrawer = () => {
    setDrawerVisible(false);
  };

  const applyFilters = (filters) => {
    console.log("Applied Filters: ", filters);
    // Add logic to filter your data here

    /**
 * {
    "minGradeId": 20,
    "maxGradeId": 24,
    "minHoldNumber": null,
    "maxHoldNumber": null,
    "minAscents": 1,
    "sortBy": "ascents",
    "sortOrder": "desc",
    "angle": "any",
    "minRating": 1,
    "onlyClassics": 0,
    "gradeAccuracy": 1,
    "setterName": "",
    "roleMatch": "strict",
    "holds": {}
}
 */
    setQueryParameters(filters);
  };

  useEffect(() => {
    const set_ids = (boardLayouts[layout].find(([sizeId]) => sizeId == size) || [])[3] || "";
    
    const fetchData = async () => {
      try {
        const [count, fetchedResults] = await Promise.all([
          fetchResultsCount(0, 10, queryParameters, {
            board,
            layout,
            size,
            set_ids,
          }),
          fetchResults(0, 10, queryParameters, {
            board,
            layout,
            size,
            set_ids,
          }),
          // fetchBetaCount(currentClimb.uuid), // Uncomment if needed
        ]);

        setResultsCount(count);
        setResults(fetchedResults);
        if (!currentClimb && fetchedResults.length > 0) {
          setCurrentClimb(fetchedResults[0]);
        }
        // setBetaCount(beta); // Uncomment if needed
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [location.search, board, layout, size, queryParameters]);

  const handleClimbClick = (climb) => {
    setCurrentClimb(climb);
  };

  const collapseIcon = isSmallScreen ? <UpOutlined /> : <LeftOutlined />;
  const expandIcon = isSmallScreen ? <DownOutlined /> : <RightOutlined />;

  return (
    <div style={{ padding: "16px", maxWidth: "1200px", margin: "0 auto" }}>
      <FilterDrawer
        currentSearchValues={queryParameters}
        boardName={board}
        visible={drawerVisible}
        onClose={closeDrawer}
        onApplyFilters={applyFilters}
      />
      <Row gutter={[16, 16]} justify="center">
        {!isCollapsed && (
          <Col xs={24} md={9}>
            <Card
              title={
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text strong>
                    <SearchButton onClick={showDrawer} /> Found {resultsCount} matching climbs
                  </Text>
                  <Tooltip title="Collapse List">
                    <Button type="text" icon={collapseIcon} onClick={() => setIsCollapsed(true)} />
                  </Tooltip>
                </div>
              }
              bodyStyle={{ padding: "0" }}
              style={{ height: "100%" }}
            >
              <List
                itemLayout="vertical"
                dataSource={results}
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
            </Card>
          </Col>
        )}

        {isCollapsed && (
          <Col xs={24} md={1} style={{ textAlign: "center" }}>
            <Tooltip title="Expand List">
              <Button
                type="text"
                icon={expandIcon}
                onClick={() => setIsCollapsed(false)}
                style={{ marginBottom: isSmallScreen ? 16 : 0 }}
              />
            </Tooltip>
          </Col>
        )}

        <Col xs={24} md={isCollapsed ? 23 : 12} style={{ transition: "all 0.3s ease" }}>
          <Card style={{ height: "100%" }}>
            {currentClimb ? (
              <>
                <Row gutter={[16, 16]} align="middle" justify="space-between" style={{ marginBottom: 16 }}>
                  <Col>
                    <Space>
                      <Button
                        type="default"
                        icon={<LeftOutlined />}
                        disabled={!results.length}
                        onClick={() => {
                          const currentIndex = results.findIndex((climb) => climb.uuid === currentClimb.uuid);
                          if (currentIndex > 0) {
                            setCurrentClimb(results[currentIndex - 1]);
                          }
                        }}
                      />
                      <IlluminateButton />
                    </Space>
                  </Col>
                  <Col style={{ textAlign: "center" }}>
                    <Title level={4} style={{ margin: 0 }}>
                      <a
                        href={`https://kilterboardapp.com/climbs/${currentClimb.uuid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {currentClimb.name}
                      </a>
                    </Title>
                    <Text>by {currentClimb.setter}</Text>
                    <br />
                    <Text>
                      Grade: {currentClimb.grade} ({currentClimb.gradeAdjustment}) at {currentClimb.angle}°
                    </Text>
                  </Col>
                  <Col>
                    <Space>
                      <BetaButton betaCount={10} />
                      <Button
                        type="default"
                        icon={<RightOutlined />}
                        disabled={!results.length}
                        onClick={() => {
                          const currentIndex = results.findIndex((climb) => climb.uuid === currentClimb.uuid);
                          if (currentIndex < results.length - 1) {
                            setCurrentClimb(results[currentIndex + 1]);
                          }
                        }}
                      />
                    </Space>
                  </Col>
                </Row>
                <KilterBoardLoader litUpHolds={currentClimb.holds} />
                {currentClimb.instructions && (
                  <Paragraph style={{ marginTop: 16 }}>{currentClimb.instructions}</Paragraph>
                )}
              </>
            ) : (
              <Text>No climb selected</Text>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ResultsPage;
