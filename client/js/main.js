(function() {

    const getData = done => {

        const resource = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';
        const init = {
            method: 'GET',
        };

        fetch(resource, init)
            .then(response => response.json())
            .then(data => {
                done(data);
            })
            .catch(err => console.log(err));

    };

    getData(data => {

        console.log(data);
        const dataset = data['monthlyVariance'].map(({ year, variance, month }) => ({year, variance, month: month - 1}));
        const baseTemp = data['baseTemperature'];

        const w = 1200;
        const h = 600;

        const chartPadding = 60;
        const chartPaddingBottom = 100;
        const legendOffset = 60;    
        const minYear = d3.min(dataset, d => d['year']);
        const maxYear = d3.max(dataset, d => d['year']);
        const minVariance = d3.min(dataset, d => d['variance']);
        const maxVariance = d3.max(dataset, d => d['variance']);
        const minTemp = baseTemp + minVariance;
        const maxTemp = baseTemp + maxVariance;

        const colorsArr = ['#313695', '#4575B4', '#74ADD1', '#ABD9E9', '#E0F3F8', '#FFFFBF', '#FEE090', '#FDAE61', '#F46D43', '#D73027', '#A50026'];
        const monthNameArr = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        const monthNumArr = [0,1,2,3,4,5,6,7,8,9,10,11];
        const yearsArr = [];
        for (let year = minYear; year <= maxYear; year++) yearsArr.push(year);
        const values = yearsArr.filter(year => year % 10 === 0);
        const legendValues = dataset.map(data => baseTemp + data.variance);

        // Scale X
        const scaleX = d3.scaleBand();
        scaleX.domain(yearsArr).range([chartPadding, w - chartPadding]);

        // Scale Y
        const scaleY = d3.scaleBand();
        scaleY.domain(monthNumArr).range([chartPadding, h - chartPadding - chartPaddingBottom]);

        // Color Scale
        const scaleColor = d3.scaleQuantize();
        scaleColor.domain([minTemp, maxTemp]).range(colorsArr);

        // Legend
        const legendWidth = 400;
        const legendHeight = 300 / colorsArr.length;

        const legendThreshhold = d3.scaleThreshold()
            .domain(((min, max, count) => {

                const arr = [];
                const step = (max-min) / count;
                const base = min;

                for (let i = 1; i < count; i++) {
                    arr.push(base + i * step);
                }

                return arr;

            })(minTemp, maxTemp, colorsArr.length))
            .range(colorsArr);

        const legendScaleX = d3.scaleLinear()
            .domain([minTemp, maxTemp])
            .range([chartPadding, legendWidth])

        const xLegendAxis = d3.axisBottom(legendScaleX)
            .tickSize(10, 0)
            .tickValues(legendThreshhold.domain())
            .tickFormat(d3.format('.1f'));

        // Axes
        const xAxis = d3.axisBottom(scaleX).tickValues(values)
        const yAxis = d3.axisLeft(scaleY).tickFormat((d, i) => monthNameArr[d]);

        const svg = d3.select('#svg-heatmap')
            .attr('width', w)
            .attr('height', h)

        // Render X Axis.
        svg.append('g')
            .attr('id', 'x-axis')
            .attr('transform', `translate(0, ${h - chartPadding - chartPaddingBottom})`)
            .call(xAxis);

        // Render Y Axis.
        svg.append('g')
            .attr('id', 'y-axis')
            .attr('transform', `translate(${chartPadding}, 0)`)
            .call(yAxis);

        // Render Legend
        const legend = svg.append('g')
            .attr('id', 'legend')
            .attr('transform', `translate(${chartPadding}, ${h - chartPadding - chartPaddingBottom + legendOffset})`)

        legend.append('g')
            .selectAll('rect')
            .data(legendThreshhold.range().map(color => {
                const d = legendThreshhold.invertExtent(color);
                if (d[0] == null) d[0] = legendScaleX.domain()[0];
                if (d[1] == null) d[1] = legendScaleX.domain()[1];
                return d;
            }))
            .enter().append('rect')
            .style('fill', (d, i) => legendThreshhold(d[0]))
            .attr('x', d => legendScaleX(d[0]))
            .attr('y', 0)
            .attr('width', d => legendScaleX(d[1]) - legendScaleX(d[0]))
            .attr('height', legendHeight)

        legend.append('g')
            .attr('transform', `translate(0, ${legendHeight})`)
            .call(xLegendAxis);

        // Rects
        svg.selectAll('rects')
            .data(dataset)
            .enter()
            .append('rect')
            .attr('class', 'cell')
            .attr('data-month', d => d.month)
            .attr('data-year', d => d.year)
            .attr('data-temp', d => baseTemp + d.variance)
            .attr('x', d => scaleX(d.year) + 1)
            .attr('y', d => scaleY(d.month))
            .attr('width', d => scaleX.bandwidth())
            .attr('height', d => scaleY.bandwidth())
            .attr('data-cell-number', (d, i) => i)
            .style('fill', d => scaleColor(baseTemp + d.variance))
            .on('mouseenter', (d, i) => {
                
                // rect.top, rect.right, rect.bottom, rect.left
                const cellRect = document.querySelector(`[data-cell-number="${i}"]`).getBoundingClientRect();

                const topOffset = 10;
                const leftOffset = 0;

                const tooltip = d3.select('#tooltip')
                    .style('top', `${cellRect.top}px`)
                    .style('left', `${cellRect.left}px`)
                    .style('opacity', '0.7')
                    .attr('data-year', dataset[i]['year'])

                tooltip.select('#tooltip-date')
                    .text(() => `${dataset[i]['year']} - ${monthNameArr[dataset[i]['month']]}`)

                tooltip.select('#tooltip-temperature')
                    .text(() => `${(baseTemp + dataset[i]['variance']).toFixed(1)}°C`)

                tooltip.select('#tooltip-variance')
                    .text(() => `${dataset[i]['variance'] > 0 ? '+' : ''}${dataset[i]['variance'].toFixed(1)}`)

                const tooltipRect = document.querySelector('#tooltip').getBoundingClientRect();

                tooltip.style('left', `${(cellRect.left + cellRect.width) - (tooltipRect.width / 2)}px`)
                    .style('top', `${cellRect.top - tooltipRect.height - topOffset}px`)

            })
            .on('mouseout', (d, i) => {
                const tooltip = d3.select('#tooltip')
                    .style('opacity', '0.0')
            })

    });

})();