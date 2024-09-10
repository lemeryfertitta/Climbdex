import React, { useState, useEffect } from "react";
import { SearchOutlined, LeftOutlined, RightOutlined, BulbOutlined, InstagramOutlined } from "@ant-design/icons";
import { Button, Badge, Typography, Space, Layout, Row, Col } from "antd";
import { useParams, useLocation } from "react-router-dom";
import { fetchResults, fetchResultsCount } from "./api";
import KilterBoardLoader from "../kilter-board/loader";
import { boardLayouts } from "./board-data";
import FilterDrawer from "./FilterDrawer";
import { useSwipeable } from "react-swipeable";

const { Title, Text } = Typography;
const { Header, Content } = Layout;

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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const getResponsiveStyles = () => {
    if (viewportWidth > 1200) {
      return {
        titleSize: "24px",
        textSize: "16px",
        padding: "0 24px",
      };
    } else if (viewportWidth > 768) {
      return {
        titleSize: "20px",
        textSize: "14px",
        padding: "0 16px",
      };
    } else {
      return {
        titleSize: "16px",
        textSize: "12px",
        padding: "0 8px",
      };
    }
  };

  const styles = getResponsiveStyles();

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
    closeDrawer();
  };

  const navigateClimbsLeft = () => {
    const currentIndex = results.findIndex((climb) => climb.uuid === currentClimb.uuid);
    if (currentIndex > 0) {
      setCurrentClimb(results[currentIndex - 1]);
    }
  };

  const navigateClimbsRight = () => {
    const currentIndex = results.findIndex((climb) => climb.uuid === currentClimb.uuid);
    if (currentIndex < results.length - 1) {
      setCurrentClimb(results[currentIndex + 1]);
    }
  };

  // Keyboard event listener
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "ArrowLeft") {
        navigateClimbsLeft();
      } else if (event.key === "ArrowRight") {
        navigateClimbsRight();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentClimb, results]);

  // Swipe event handlers
  const handlers = useSwipeable({
    onSwipedLeft: () => navigateClimbsRight(),
    onSwipedRight: () => navigateClimbsLeft(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true, // optional, enables mouse swipe events
  });

  return (
    <Layout style={{ height: "100vh" }} {...handlers}>
      <Layout>
        <Header
          style={{
            background: "#fff",
            padding: styles.padding,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Row justify="space-between" align="middle" style={{ width: "100%" }}>
            {currentClimb && (
              <>
                <Col>
                  <Space>
                    <Button id="button-illuminate" type="default" icon={<BulbOutlined />} />
                    <Button type="default" onClick={showDrawer} icon={<SearchOutlined />} />
                  </Space>
                </Col>
                <Col flex="auto" style={{ textAlign: "center" }}>
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                      fontSize: styles.titleSize,
                      lineHeight: "1.2",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    <a
                      href={`https://kilterboardapp.com/climbs/${currentClimb.uuid}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "block",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        fontSize: styles.titleSize,
                      }}
                    >
                      {currentClimb.name}
                    </a>
                  </Title>
                  <Text
                    style={{
                      display: "block",
                      fontSize: styles.textSize,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    by {currentClimb.setter}
                  </Text>
                  <Text
                    style={{
                      display: "block",
                      fontSize: styles.textSize,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Grade: {currentClimb.grade} ({currentClimb.gradeAdjustment}) at {currentClimb.angle}°
                  </Text>
                </Col>
                <Col>
                  <Space>
                    <Badge count={10} offset={[-5, 5]}>
                      <Button
                        id="anchor-beta"
                        type="default"
                        href="/kilter/beta/A0BC2661C68B4B00A5CDF2271CEAF246/"
                        icon={<InstagramOutlined />}
                      />
                    </Badge>
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
            height: "100%",
            backgroundColor: "#FFF",
          }}
        >
          {currentClimb ? <KilterBoardLoader litUpHolds={currentClimb.holds} /> : <Text>No climb selected</Text>}
        </Content>
      </Layout>
      <FilterDrawer
        currentClimb={currentClimb}
        handleClimbClick={handleClimbClick}
        boardName={board}
        layout={layout}
        climbCount={resultsCount}
        climbs={results}
        currentSearchValues={queryParameters}
        open={drawerOpen}
        onClose={closeDrawer}
        onApplyFilters={applyFilters}
      />
    </Layout>
  );
};

export default ResultsPage;
