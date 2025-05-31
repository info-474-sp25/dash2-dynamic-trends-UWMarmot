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
    .map(([year, values]) => {
        //Each storm is just one row, so we just need to keep track of total rows per year
        const numStorms = values.length;
        console.log(numStorms);
        const totalDeaths = d3.sum(values, v => +v["Total Deaths"]);
        const totalInjured = d3.sum(values, v => +v["No. Injured"]);
        const totalHomeless = d3.sum(values, v => +v["No. Homeless"]);
        //Needed a little AI help for this return logic to make sure I got all of the values out of this function
        return {
            year: +year,
            numStorms,
            totalDeaths,
            //Then down here, divide by total deaths per year
            avgDeathsPerStorm: totalDeaths / numStorms,
            avgInjuredPerStorm: totalInjured / numStorms,
            avgHomelessPerStorm: totalHomeless / numStorms
        };
    });

    console.log(grouped_years);
    // 3.a: SET SCALES FOR CHART 1
    const x1 = d3.scaleLinear()
        .domain(d3.extent(grouped_years, d => d.year))
        .range([0, width]);

    const y1 = d3.scaleLinear()
        .domain([0, d3.max(grouped_years, d => d.avgDeathsPerStorm)])
        .range([height, 0]);

    // 4.a: PLOT DATA FOR CHART 1
    const line1 = d3.line()
        .x(d => x1(d.year))
        .y(d => y1(d.avgDeathsPerStorm));

    philippines_trop_storm.append("path")
        .datum(grouped_years)
        .attr("fill", "none")
        .attr("stroke", "purple")
        .attr("stroke-width", 1.5)
        .attr("class", "stormLine")
        .attr("d", line1);

    // 5.a: ADD AXES FOR CHART 1
    // I got kind of mixed up on axis logic and ended up using AI to fix my mistakes, not super sure about the transform stuff
    const xAxis = d3.axisBottom(x1).tickFormat(d3.format("d")); 
        philippines_trop_storm.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .append("text")
        .attr("x", width / 2)
        .attr("y", 40)
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Year");


    //Had to redo this Y axis with chatgpt to make it more flexible with changing the active lines
    const yAxis = d3.axisLeft(y1);
    const yAxisGroup = philippines_trop_storm.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    yAxisGroup.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("dy", "1em")
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .text("Avg Deaths per Storm");


    // 6.a: ADD LABELS FOR CHART 1



    // 7.a: ADD INTERACTIVITY FOR CHART 1

    //Found this approach online for choose colors, and it seemed cool
    const colorMap = {
        avgDeathsPerStorm: "purple",
        avgInjuredPerStorm: "gold",
        avgHomelessPerStorm: "navy"
    };

    const lineGen = metric => d3.line()
        .x(d => x1(d.year))
        .y(d => y1(d[metric]));

    function updateLines(selectedAvgs) {
        philippines_trop_storm.selectAll(".stormLine").remove();


        //Y axis manipulation was helped heavily by AI
        //Getting the Y axis to scale properly was no small task!
        y1.domain([0, d3.max(grouped_years, d => 
        d3.max(selectedAvgs.map(m => d[m])))]);
        yAxisGroup.transition().duration(500).call(d3.axisLeft(y1));

        selectedAvgs.forEach(metric => {
            philippines_trop_storm.append("path")
                .datum(grouped_years)
                .attr("class", "stormLine")
                .attr("fill", "none")
                .attr("stroke", colorMap[metric])
                .attr("stroke-width", 1.5)
                .attr("d", lineGen(metric));
        });
    }

    //This is to set avgDeaths as our baseline
    updateLines(["avgDeathsPerStorm"]);

    //Access checkboxes and change alongside them. 
    d3.selectAll("#avgSelector input").on("change", () => {
        console.log('got here');
        const selected = [];
        d3.selectAll("#avgSelector input:checked").each(function() {
            selected.push(this.value);
        });
        if (selected.length > 0) {
            updateLines(selected);
        }
    });

    

    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2


    // 4.b: PLOT DATA FOR CHART 2


    // 5.b: ADD AXES FOR CHART 


    // 6.b: ADD LABELS FOR CHART 2


    // 7.b: ADD INTERACTIVITY FOR CHART 2


});
