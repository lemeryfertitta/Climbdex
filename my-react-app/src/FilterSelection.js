import React, { useEffect, useRef } from "react";
import noUiSlider from "nouislider";
import "nouislider/distribute/nouislider.css";

const FilterSelection = () => {
  const sliderRef = useRef(null);
  const holdFilterRef = useRef(null);
  const mirroredHoldFilterRef = useRef(null);

  useEffect(() => {
    createSlider();
  }, []);

  const createSlider = () => {
    const arbitraryValuesForSlider = ["value1", "value2", "value3"]; // replace with actual values
    const gradeMapping = {
      value1: "mappedValue1",
      value2: "mappedValue2",
      value3: "mappedValue3",
    };

    const format = {
      to: (value) => arbitraryValuesForSlider[Math.round(value)],
      from: (value) => arbitraryValuesForSlider.indexOf(value),
    };

    noUiSlider.create(sliderRef.current, {
      start: [arbitraryValuesForSlider[0], arbitraryValuesForSlider[arbitraryValuesForSlider.length - 1]],
      range: { min: 0, max: arbitraryValuesForSlider.length - 1 },
      step: 1,
      connect: true,
      tooltips: true,
      format: format,
    });

    mergeTooltips(sliderRef.current, 10, " - ");

    document.getElementById("form-search").addEventListener("submit", function (e) {
      e.preventDefault();
      const values = sliderRef.current.noUiSlider.get();
      const minGradeValue = values[0];
      const maxGradeValue = values[1];
      const convertedMinGrade = gradeMapping[minGradeValue];
      const convertedMaxGrade = gradeMapping[maxGradeValue];
      document.getElementById("slider-minValue").value = convertedMinGrade;
      document.getElementById("slider-maxValue").value = convertedMaxGrade;
      this.submit();
    });
  };

  const mergeTooltips = (slider, threshold, separator) => {
    // Implement the mergeTooltips function logic here...
  };

  const onFilterCircleClick = (circleElement, colorRows) => {
    // Implement the onFilterCircleClick logic here...
  };

  const resetHoldFilter = () => {
    holdFilterRef.current.value = "";
    mirroredHoldFilterRef.current.value = "";
    // Implement reset hold filter logic...
  };

  return (
    <div className="container-sm text-center">
      <div className="row justify-content-md-center">
        <div className="col-md-5">
          <form className="card p-3 bg-light" id="form-search" action="/results">
            <p className="mb-2">Setup: Board Name - Layout Name - Size Name</p>
            <p className="mb-5">
              <small>
                <a id="anchor-back" href="/">
                  Back to setup selection
                </a>
              </small>
            </p>
            <div className="mb-2 gap-2" id="grade-slider" ref={sliderRef}></div>
            <input type="hidden" id="slider-minValue" name="minGrade" />
            <input type="hidden" id="slider-maxValue" name="maxGrade" />

            {/* Add the rest of the form controls as needed */}

            <div className="input-group mb-3 d-grid gap-2">
              <button className="btn btn-primary" type="submit">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FilterSelection;
