import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
// import "./ResultsPage.css";
import { drawBoard, getBluetoothPacket, illuminateClimb } from "./bluetooth"; // Import necessary functions
import { fetchResults, fetchResultsCount, fetchBetaCount } from "./api"; // Import API functions
import FontAwesomeIcon from "react-fontawesome";
import KilterBoardLoader from "./KilterBoardLoader";
import { boardLayouts } from "./board-data";
const Tick = () => (
  <svg viewBox="0 30 280 250" height="16px" width="16px">
    <path d="M 30,180 90,240 240,30" style={{ stroke: "#000", strokeWidth: 25, fill: "none" }} />
  </svg>
);

const IllumiateButton = () => (
  <button id="button-illuminate" class="btn btn-outline-primary position-relative" type="button">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      class="bi bi-lightbulb"
      viewBox="0 0 16 16"
    >
      <path d="M2 6a6 6 0 1 1 10.174 4.31c-.203.196-.359.4-.453.619l-.762 1.769A.5.5 0 0 1 10.5 13a.5.5 0 0 1 0 1 .5.5 0 0 1 0 1l-.224.447a1 1 0 0 1-.894.553H6.618a1 1 0 0 1-.894-.553L5.5 15a.5.5 0 0 1 0-1 .5.5 0 0 1 0-1 .5.5 0 0 1-.46-.302l-.761-1.77a2 2 0 0 0-.453-.618A5.98 5.98 0 0 1 2 6m6-5a5 5 0 0 0-3.479 8.592c.263.254.514.564.676.941L5.83 12h4.342l.632-1.467c.162-.377.413-.687.676-.941A5 5 0 0 0 8 1"></path>
    </svg>
  </button>
);

const SearchButton = () => (
  <button class="btn btn-outline-primary position-relative" type="button">
    <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" />
  </button>
);

const BetaButton = () => (
  <a
    id="anchor-beta"
    class="btn btn-outline-primary position-relative"
    href="/kilter/beta/A0BC2661C68B4B00A5CDF2271CEAF246/"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      class="bi bi-instagram"
      viewBox="0 0 16 16"
    >
      <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"></path>
    </svg>
    <span id="span-beta-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
      5
    </span>
  </a>
);

const ResultsPage = () => {
  const { board, layout, size } = useParams(); // Extract parameters from URL
  const location = useLocation(); // To access the query string

  // Hardcoded state parameters (replace these with your actual dynamic state management later)
  const [queryParameters] = useState({
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
  const [currentClimb, setCurrentClimb] = useState({});

  useEffect(() => {
    const set_ids = (boardLayouts[layout].find(([sizeId]) => sizeId === size) || [])[3];

    // Fetch results count and the first page of results
    fetchResultsCount(0, 10, queryParameters, { board, layout, size, set_ids }).then((count) => {
      setResultsCount(count);
      console.log("got results", count);
    });
    fetchResults(0, 10, queryParameters, { board, layout, size, set_ids })
      .then((results) => {
        if (Object.keys(currentClimb).length === 0) {
          setCurrentClimb(results[0]);
        }
        return results;
      })
      .then(setResults);

    // Draw the board
    drawBoard("svg-climb", [], 0, 0, 0, 0); // Replace with actual dynamic parameters
  }, [location.search, board, layout, size, queryParameters]);

  const handleClimbClick = (index, pageSize, resultsCount, result) => {
    setCurrentClimb(result);

    const prevButton = document.getElementById("button-prev");
    prevButton.onclick = () => clickClimbButton(index - 1, pageSize, resultsCount);
    prevButton.disabled = index <= 0;
    const nextButton = document.getElementById("button-next");
    nextButton.onclick = () => clickClimbButton(index + 1, pageSize, resultsCount);
    nextButton.disabled = index >= resultsCount - 1;
  };

  const clickClimbButton = (index, pageSize, resultsCount) => {
    if (index > 0 && index < resultsCount - 1) {
      const nextPageNumber = Math.floor(index / pageSize);
      fetchResults(nextPageNumber, pageSize, queryParameters, { board, layout, size }).then((newResults) => {
        setResults(newResults);
        handleClimbClick(index, pageSize, resultsCount, newResults[index % pageSize]);
      });
    }
  };

  return (
    <div className="container-sm text-center">
      <div className="row justify-content-md-center">
        <div className="col-md-5 card p-3 g-2 vh-100">
          <h4>Found {resultsCount} matching climbs</h4>
          <div id="div-results-list" className="list-group">
            {results.map((result, index) => (
              <button
                key={index}
                className="list-group-item list-group-item-action bg-secondary-subtle"
                onClick={() => handleClimbClick(index, 10, resultsCount, result)}
              >
                <p>
                  <span>
                    {result.name} {result.grade} ({result.gradeAdjustment}) at {result.angle}°
                    {true === false ? <Tick /> : null} {/** TODO: Only insert Tick when already sent */}
                  </span>
                </p>
                <p class="fw-light">
                  {result.ascents} ascents, {result.stars}★
                </p>
              </button>
            ))}
          </div>
        </div>
        <div class="col-md-5 card p-3 g-2 vh-100" id="div-climb">
          <div class="row g-0">
            <div class="col-1">
              <button type="button" class="btn btn-outline-primary" id="button-prev">
                ←
              </button>
            </div>
            <div class="col-2">
              <IllumiateButton />
            </div>
            <div class="col-6">
              <h4 id="header-climb-name">
                <a
                  href={`https://kilterboardapp.com/climbs/${currentClimb.uuid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {currentClimb.name}
                </a>
              </h4>
              <h6 id="header-climb-setter">by {currentClimb.setter}</h6>
              <p id="paragraph-climb-stats">
                <span>
                  {currentClimb.grade} ({currentClimb.gradeAdjustment}) at {currentClimb.angle}°
                </span>
              </p>
            </div>
            <div class="col-2">
              <BetaButton />
            </div>
            <div class="col-1">
              <button type="button" class="btn btn-outline-primary" id="button-next">
                →
              </button>
            </div>
          </div>

          <KilterBoardLoader litUpHolds={currentClimb.holds} />

          <div class="row">
            <p id="paragraph-climb-description" class="small mt-2 d-none">
              {currentClimb.instructions}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
