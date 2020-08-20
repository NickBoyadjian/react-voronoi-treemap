import React, { useEffect, useRef, useState } from 'react';
import { select, range, hierarchy, nest, sum, csv, extent, polygonCentroid, max, min } from 'd3';
import { voronoiTreemap } from 'd3-voronoi-treemap';
import seedrandom from 'seedrandom';
import csvdata from './data.csv';
import randomHexColor from 'random-hex-color';
import { coordinatePolygons } from './helpers';

export default function Index() {
  const svgRef = useRef();
  const [csvData, setCsvData] = useState([]);

  function getShape() {
    return range(100).map(i => {
      const rad = 0 + i / 100 * 2 * Math.PI;
      return [
        500 / 2 + 500 / 2 * Math.cos(rad),
        500 / 2 + 500 / 2 * Math.sin(rad)]
    })
  }

  function getDataNested(data) {
    let freedom_nest = nest()
      .key(d => d.Region)
      .key(d => d.Country)
      .rollup(v => sum(v, d => +d.C02))
      .entries(data);

    return { key: 'nested_group', values: freedom_nest }
  }


  useEffect(() => {
    async function mdo() {
      // return if the svg container isn't ready
      if (!svgRef.current) return;

      // set up basic variables
      const svg = select(svgRef.current);
      const voronoi = svg.append('g');
      const labels = svg.append('g');
      let voronoiTreeMap = voronoiTreemap().prng(new seedrandom('ok')).clip(getShape());
      let data = [];


      // get the data from file and push each object into the data array
      csv(csvdata, d => {
        data.push(d)
      }).then(_ => {
        // Format the data to be grouped by region and country
        const nestedData = getDataNested(data);

        // Get all the relevant data attached needed for rendering
        const nodes1 = hierarchy(nestedData, d => d.values).sum(d => d.value);
        voronoiTreeMap(nodes1);

        nodes1.each(node => (node.oldPolygon = node.polygon));
        nodes1.each(node => {
          const [x0, x1] = extent(node.polygon, d => d[0]);
          const [y0, y1] = extent(node.polygon, d => d[1]);

          node.simplePolygon = node.polygon;
          const width = x1 - x0;
          const height = y1 - y0;
          node.polyProps = {
            centroid: polygonCentroid(node.simplePolygon),
            bounds: [[x0, y0], [x1, y1]],
            width,
            height,
            aspect: height / width,
            max: max([width, height]),
            min: min([width, height])
          }
          // node.polygon = coordinatePolygons(node.oldPolygon, node.polygon)
        })


        let nodes = nodes1.descendants()
          .sort((a, b) => b.depth - a.depth)
          .map((d, i) => Object.assign({}, d, { id: i }));

        console.log(nodes)

        voronoi.selectAll('.node')
          .data(nodes)
          .join('polygon')
          .classed('.node', true)
          .attr('points', d => d.polygon)
          .attr('stroke', '#555555')
          .attr('stroke-opacity', 1)
          .attr('stroke-width', 0)
          .attr('stroke-linejoin', 'round')
          .attr('fill-opacity', d => d.depth === 2 ? 1 : 0)
          .attr('fill', _ => randomHexColor())
          .attr('pointer-events', d => d.height === 0 ? 'fill' : 'none')
          .on('mouseenter', function (d) {
            console.log(d)
          })
          .attr("stroke-width", d => 7 - d.depth * 2.8);
      })
    }

    mdo();

  }, [svgRef])


  return (
    <div>
      <svg ref={svgRef} width={500} height={500} />
    </div>
  )
}
