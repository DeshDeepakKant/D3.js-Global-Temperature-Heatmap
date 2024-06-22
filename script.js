// URL to fetch the data from
const dataUrl = "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json";

// Fetch the data
fetch(dataUrl)
    .then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json(); // Parse the JSON response
    })
    .then((data) => {
        createChart(data.baseTemperature, data.monthlyVariance); // Pass base temp and dataset to createChart
    })
    .catch((error) => {
        console.error("Error fetching the data:", error);
    });

// Function to create the heat map
function createChart(baseTemperature, dataset) {
    // Clear any existing chart
    d3.select("#chart-container").html("");

    const width = 1400; // Increased width for better readability
    const height = 600; // Increased height
    const margin = {
        top: 100,
        right: 50,
        bottom: 100,
        left: 100
    };

    // Create tooltip with improved positioning
    const tooltip = d3.select("body")
        .append("div")
        .attr("id", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none")
        .style("z-index", "1000");

    // Add Title
    d3.select(".container")
        .insert("h1", "#chart-container")
        .attr("id", "title")
        .text("Global Land Surface Temperature Variation");

    // Add Description
    d3.select(".container")
        .insert("p", "#chart-container")
        .attr("id", "description")
        .text(`Temperature Anomalies from 1753 to 2015 (Base Temperature: ${baseTemperature.toFixed(2)}°C)`);

    // X and Y scales
    const years = [...new Set(dataset.map((d) => d.year))];
    const xScale = d3
        .scaleBand()
        .domain(years)
        .range([margin.left, width - margin.right]);

    const yScale = d3
        .scaleBand()
        .domain(d3.range(1, 13)) // Months from 1 to 12
        .range([margin.top, height - margin.bottom]);

    const colorScale = d3
        .scaleSequential(d3.interpolateRdBu)
        .domain([
            baseTemperature + d3.max(dataset, (d) => d.variance),
            baseTemperature + d3.min(dataset, (d) => d.variance),
        ]);

    // SVG container
    const svg = d3.select("#chart-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

    // X-axis
    svg.append("g")
        .attr("id", "x-axis")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .call(
            d3.axisBottom(xScale)
                .tickValues(years.filter((year, index) => index % 20 === 0))
                .tickFormat(d3.format("d"))
        )
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "var(--text-secondary)");

    // Y-axis
    svg.append("g")
        .attr("id", "y-axis")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(
            d3.axisLeft(yScale)
                .tickFormat((month) => d3.timeFormat("%B")(new Date(0, month - 1)))
        )
        .selectAll("text")
        .style("font-size", "12px")
        .style("fill", "var(--text-secondary)");

    // Heatmap Cells
    svg.selectAll(".cell")
        .data(dataset)
        .enter()
        .append("rect")
        .attr("class", "cell")
        .attr("x", (d) => xScale(d.year))
        .attr("y", (d) => yScale(d.month))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", (d) => colorScale(baseTemperature + d.variance))
        .attr("data-month", (d) => d.month - 1)
        .attr("data-year", (d) => d.year)
        .attr("data-temp", (d) => baseTemperature + d.variance)
        .on("mouseover", function(event, d) {
            // Ensure tooltip is on top of other elements
            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>Year:</strong> ${d.year}<br>
                    <strong>Month:</strong> ${d3.timeFormat("%B")(new Date(0, d.month - 1))}<br>
                    <strong>Temperature:</strong> ${(baseTemperature + d.variance).toFixed(2)}°C<br>
                    <strong>Variance:</strong> ${d.variance.toFixed(2)}°C
                `)
                .style("left", `${event.pageX + 15}px`)
                .style("top", `${event.pageY - 15}px`)
                .attr("data-year", d.year);
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        });

    // Legend
    const legendWidth = 300;
    const legendHeight = 20;
    const legendColors = 10;

    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendWidth]);

    const legendAxis = d3.axisBottom(legendScale)
        .ticks(legendColors)
        .tickFormat(d3.format(".1f"));

    const legend = svg
        .append("g")
        .attr("id", "legend")
        .attr("transform", `translate(${(width - legendWidth) / 2}, ${height - 50})`);

    // Legend color bars
    legend
        .selectAll("rect")
        .data(d3.range(legendColors))
        .enter()
        .append("rect")
        .attr("x", (d) => (legendWidth / legendColors) * d)
        .attr("y", 0)
        .attr("width", legendWidth / legendColors)
        .attr("height", legendHeight)
        .attr("fill", (d) =>
            colorScale(colorScale.domain()[0] + (d / legendColors) * (colorScale.domain()[1] - colorScale.domain()[0]))
        );

    // Legend axis
    legend
        .append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis)
        .selectAll("text")
        .style("font-size", "10px")
        .style("fill", "var(--text-secondary)");
}