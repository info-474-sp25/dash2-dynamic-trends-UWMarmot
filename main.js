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
        .attr("y", -70)
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

    function updateLegend(selectedAvgs) {
    const legendContainer = d3.select("#legendContainer");
    legendContainer.html(""); // Clear previous legend
        selectedAvgs.forEach(metric => {
            const item = legendContainer.append("div")
                .style("display", "flex")
                .style("align-items", "center")
                .style("margin-bottom", "4px");

            item.append("div")
                .style("width", "15px")
                .style("height", "15px")
                .style("background-color", colorMap[metric])
                .style("margin-right", "8px");

            item.append("span").text(metricLabel(metric));
        });
    }

    // Make legend labels that are easy to read
    function metricLabel(key) {
        const labels = {
            avgDeathsPerStorm: "Avg Deaths per Storm",
            avgInjuredPerStorm: "Avg Injured per Storm",
            avgHomelessPerStorm: "Avg Homeless per Storm"
        };
        return labels[key] || key;
    }

    const lineGen = metric => d3.line()
        .x(d => x1(d.year))
        .y(d => y1(d[metric]));

    function updateLines(selectedAvgs) {
        //Clear all the lines
        philippines_trop_storm.selectAll(".stormLine").remove();
        philippines_trop_storm.selectAll(".trendLine").remove();
        philippines_trop_storm.selectAll(".barGroup").remove();

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
                .attr("stroke-width", 2)
                .attr("d", lineGen(metric));
        });

        //Draw trendlines to match value
        if (d3.select("#trendline-toggle").property("checked")) {
            drawTrendlines(selectedAvgs);
        }
        updateLegend(selectedAvgs);
    }



    //Access checkboxes, choose which lines to use with them.
    d3.selectAll("#avgSelector input").on("change", () => {
        const selected = [];
        d3.selectAll("#avgSelector input:checked").each(function() {
            selected.push(this.value);
        });
        if (selected.length > 0){
            updateChartView(selected)
        } else {
            philippines_trop_storm.selectAll(".stormLine").remove();
            philippines_trop_storm.selectAll(".trendLine").remove();
            philippines_trop_storm.selectAll(".barGroup").remove();
            updateLegend([]);
        };
    });

    //Second interactive element, simple trendline!

    function drawTrendlines(selectedAvgs) {
        philippines_trop_storm.selectAll(".trendLine").remove();

        selectedAvgs.forEach(metric => {
            const metricData = grouped_years.map(d => ({
                year: d.year,
                value: d[metric]
            }));

            const trendlineData = linearRegression(metricData);

            philippines_trop_storm.append("path")
                .datum(trendlineData)
                .attr("class", "trendLine")
                .attr("fill", "none")
                .attr("stroke", colorMap[metric])
                .attr("stroke-dasharray", "4 4")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => x1(d.year))
                    .y(d => y1(d.value))
                );
        });
    }

    d3.select("#trendline-toggle").on("change", () => {
        const selected = [];
        d3.selectAll("#avgSelector input:checked").each(function() {
            selected.push(this.value);
        });
        const chartType = d3.select("#chartType").property("value");
        if (chartType == "line") {
            updateLines(selected);
        }
    });

    function linearRegression(data) {
        const n = data.length;
        const sumX = d3.sum(data, d => d.year);
        const sumY = d3.sum(data, d => d.value);
        const sumXY = d3.sum(data, d => d.year * d.value);
        const sumX2 = d3.sum(data, d => d.year * d.year);

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        return data.map(d => ({
            year: d.year,
            value: m * d.year + b
         }));  
    }


    //Suprise widget 3 to pivot to stacked bar chart!
    //This one was done mostly with AI, because it was such a big departure from my original graph, and it
    //was not as easy to change as I had hoped. 
    function drawStackedBarChart(selectedAvgs) {
        philippines_trop_storm.selectAll(".stormLine").remove();
        philippines_trop_storm.selectAll(".trendLine").remove();
        philippines_trop_storm.selectAll(".barGroup").remove();

        // Reshape data
        const stack = d3.stack()
            .keys(selectedAvgs)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const series = stack(grouped_years);

        // Update y scale
        y1.domain([
            0,
            d3.max(grouped_years, d => 
                d3.sum(selectedAvgs.map(metric => d[metric]))
            )
        ]);
        yAxisGroup.transition().duration(500).call(d3.axisLeft(y1));

        // Draw bars
        const barGroups = philippines_trop_storm.selectAll(".barGroup")
            .data(series)
            .enter()
            .append("g")
            .attr("class", "barGroup")
            .attr("fill", d => colorMap[d.key]);

        barGroups.selectAll("rect")
            .data(d => d)
            .enter()
            .append("rect")
            .attr("x", d => x1(d.data.year) - 10)
            .attr("y", d => y1(d[1]))
            .attr("height", d => y1(d[0]) - y1(d[1]))
            .attr("width", 20);
    }

    //Used to change chart types
    function updateChartView(selectedAvgs) {
        const chartType = d3.select("#chartType").property("value");

        if (chartType === "line") {
            updateLines(selectedAvgs);
        } else if (chartType === "stackedBar") {
            drawStackedBarChart(selectedAvgs);
            updateLegend(selectedAvgs);
        }
    }

    d3.select("#chartType").on("change", () => {
        const selected = [];
        d3.selectAll("#avgSelector input:checked").each(function() {
            selected.push(this.value);
        });
        if (selected.length > 0) updateChartView(selected);
    });


    updateLines(["avgDeathsPerStorm"]);
    updateChartView(["avgDeathsPerStorm"]);

});
