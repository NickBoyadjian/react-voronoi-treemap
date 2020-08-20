import React, { useEffect, useRef, useState } from 'react';
import { select, range, hierarchy, nest, sum, csv, extent, polygonCentroid, max, min } from 'd3';
import { voronoiTreemap } from 'd3-voronoi-treemap';
import seedrandom from 'seedrandom';
import csvdata from './data.csv';
import randomHexColor from 'random-hex-color';
import { getDataNested, getShape, appendImages } from './helpers';

export default function Index() {
  const svgRef = useRef();
  const [csvData, setCsvData] = useState([]);



  useEffect(() => {
    async function mdo() {
      // return if the svg container isn't ready
      if (!svgRef.current) return;

      // set up basic variables
      const svg = select(svgRef.current);
      const voronoi = svg.append('g').classed('voronoi', true);
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

        const selection = voronoi.selectAll('.node')
          .data(nodes)
          .join('g')
          .classed('node', true)
          .append('polygon')
          .attr('points', d => d.polygon)
          .attr('stroke', d => d.depth === 0 ? '#eee' : '#fff')
          .attr('stroke-opacity', 1)
          .attr('stroke-width', 0)
          .attr('stroke-linejoin', 'round')
          .attr('fill-opacity', d => d.depth === 2 ? 0.5 : 0)
          .attr('fill', "#252525")
          .attr('pointer-events', d => d.height === 0 ? 'fill' : 'none')
          .attr("stroke-width", d => 7 - d.depth * 2.8)
          .on('mouseenter', function (d) {
            select(this).attr('fill-opacity', 0.2)
          })
          .on('mouseleave', function (d) {
            select(this).attr('fill-opacity', 0.5);
          })

        appendImages(voronoi.selectAll('.node'))
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
