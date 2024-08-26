import React, { useState, useEffect } from "react";
import {
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  BulbOutlined,
  InstagramOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import { Button, Badge, Card, List, Typography, Space, Tooltip, Layout, Row, Col } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { fetchResults, fetchResultsCount } from "./api";
import KilterBoardLoader from "./KilterBoardLoader";
import { boardLayouts } from "./board-data";
import FilterDrawer from "./FilterDrawer";

const { Title, Text } = Typography;
const { Header, Sider, Content } = Layout;

const ResultsPage = () => {
  const { board, layout, size } = useParams();
  const location = useLocation();

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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const showDrawer = () => {
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const applyFilters = (filters) => {
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
        ]);

        setResultsCount(count);
        setResults(fetchedResults);
        if (!currentClimb && fetchedResults.length > 0) {
          setCurrentClimb(fetchedResults[0]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [location.search, board, layout, size, queryParameters]);

  const handleClimbClick = (climb) => {
    setCurrentClimb(climb);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={isCollapsed}
        width="35%"
        style={{ background: "#fff", display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <Card
          title={
            <Row justify="space-between" align="middle">
              {isCollapsed ? null : (
                <Col>
                  <Button type="default" onClick={showDrawer} icon={<SearchOutlined />} />
                </Col>
              )}
              <Col>{isCollapsed ? null : <Text strong>Found {resultsCount} matching climbs</Text>}</Col>
              <Col>
                <Button
                  type="default"
                  icon={isCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                />
              </Col>

              {!isCollapsed ? null : (
                <Col>
                  <Badge count={resultsCount} offset={[-5, 5]}>
                    <Button type="default" onClick={showDrawer} icon={<SearchOutlined />} />
                  </Badge>
                </Col>
              )}
            </Row>
          }
          bodyStyle={{ padding: 0, flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}
          style={{ display: "flex", flexDirection: "column", height: "100%" }}
        >
          <div style={{ overflowY: "auto", flex: 1 }}>
            {isCollapsed ? null : (
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
            )}
          </div>
        </Card>
      </Sider>

      <Layout style={{ flex: 1, overflow: "hidden" }}>
        <Header style={{ background: "#fff", padding: "0 16px" }}>
          <Row justify="space-between" align="middle">
            {currentClimb && (
              <>
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
                    <Button id="button-illuminate" type="default" icon={<BulbOutlined />} />
                  </Space>
                </Col>
                <Col flex="auto" style={{ textAlign: "center" }}>
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
                  <Text>
                    Grade: {currentClimb.grade} ({currentClimb.gradeAdjustment}) at {currentClimb.angle}°
                  </Text>
                </Col>
                <Col flex="none">
                  <Space>
                    <Badge count={10} offset={[-5, 5]}>
                      <Button
                        id="anchor-beta"
                        type="default"
                        href="/kilter/beta/A0BC2661C68B4B00A5CDF2271CEAF246/"
                        icon={<InstagramOutlined />}
                      />
                    </Badge>
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
              </>
            )}
          </Row>
        </Header>

        <Content
          style={{
            padding: 16,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            height: "100%",
            backgroundColor: "#FFF",
          }}
        >
          {currentClimb ? <KilterBoardLoader litUpHolds={currentClimb.holds} /> : <Text>No climb selected</Text>}
        </Content>
      </Layout>
      <FilterDrawer boardName={board} layout={layout} currentSearchValues={queryParameters} open={drawerOpen} onClose={closeDrawer} onApplyFilters={applyFilters} />
    </Layout>
  );
};

export default ResultsPage;
