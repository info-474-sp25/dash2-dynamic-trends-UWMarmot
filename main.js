// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const philippines_trop_storm = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_RENAME = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("EmdatTropicalStorms.csv").then(data => {
    // 2.b: ... AND TRANSFORM DATA
   const filtered = data.filter(d => d.Country === "Philippines");

    // Group by Start Year and calculate averages
    const grouped_years = d3.groups(filtered, d => d['Start Year'])
        .map(([year, values]) => ({
            year,
            avgTotalDeaths: d3.mean(values, v => v["Total Deaths"]),
            avgNumInjured: d3.mean(values, v => v["No. Injured"]),
            avgNumHomeless: d3.mean(values, v => v["No. Homeless"])
        }));

    console.log(grouped_years);
    // 3.a: SET SCALES FOR CHART 1
    const x1 = d3.scaleLinear()
        .domain(d3.extent(grouped_years, d => d.year))
        .range([0, width]);

    const y1 = d3.scaleLinear()
        .domain([0, d3.max(grouped_years, d => d.avgTotalDeaths)])
        .range([height, 0]);

    // 4.a: PLOT DATA FOR CHART 1
    const line1 = d3.line()
        .x(d => x1(d.year))
        .y(d => y1(d.avgTotalDeaths));

    philippines_trop_storm.append("path")
        .datum(grouped_years)
        .attr("fill", "none")
        .attr("stroke", "purple")
        .attr("stroke-width", 1)
        .attr("d", line1);

    // 5.a: ADD AXES FOR CHART 1


    // 6.a: ADD LABELS FOR CHART 1


    // 7.a: ADD INTERACTIVITY FOR CHART 1
    

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2


});
