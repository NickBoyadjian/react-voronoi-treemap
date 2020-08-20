import { nest, range, sum, select } from 'd3';

export function getDataNested(data) {
  let freedom_nest = nest()
    .key(d => d.Region)
    .key(d => d.Country)
    .rollup(v => sum(v, d => +d.C02))
    .entries(data);

  return { key: 'nested_group', values: freedom_nest }
}

export function getShape() {
  return range(100).map(i => {
    const rad = 0 + i / 100 * 2 * Math.PI;
    return [
      500 / 2 + 500 / 2 * Math.cos(rad),
      500 / 2 + 500 / 2 * Math.sin(rad)]
  })
}

export function appendImages(nodes) {
  const image = nodes.filter(d => d.height === 0)
  const imageGroup = image.append('g').classed('image', true);
  const imageUrl = Math.round(Math.random()) === 1
    ? 'https://www.buytshirtdesigns.net/wp-content/uploads/2020/03/CoronaVirus-Awareness-800x662.jpg'
    : 'https://www.rushordertees.com/design/ZoomImage.php?src=4316992_f&style=3931&colorCode=37&x=240&y=300&width=880&height=880&scale=1.7&watermark=false'

  imageGroup
    .append('clipPath')
    .attr('id', (d, i) => `${d.id}-clip`)
    .attr('pointer-events', 'none')
    .attr('transform', d =>
      `translate(${d.polyProps.bounds[0].map(d => d * -1)})`
    )
    .append('polygon')
    .attr('points', d => d.polygon)

  imageGroup
    .append('image')
    .attr('on-load', function (d, i) {
      const image = new Image();
      image.onload = () => {
        d.imageProps = {
          width: image.width,
          height: image.height,
          aspect: image.height / image.width
        };

        const { x, y, width, height } = computeImagePosition(
          d.imageProps,
          d.polyProps
        );

        const imageSelect = select(this)
          .attr('x', x)
          .attr('y', y)
          .attr('width', width)
          .attr('height', height)
          .attr('visibility', 'visible')
          .on('mouseenter', function (d) {
            console.log(d)
          });

      }
      image.src = i % 2 === 0
        ? 'https://www.buytshirtdesigns.net/wp-content/uploads/2020/03/CoronaVirus-Awareness-800x662.jpg'
        : 'https://www.rushordertees.com/design/ZoomImage.php?src=4316992_f&style=3931&colorCode=37&x=240&y=300&width=880&height=880&scale=1.7&watermark=false'
    })
    .attr('clip-path', d => `url(#${d.id}-clip)`)
    .attr("transform", d => `translate(${d.polyProps.bounds[0]})`)
    .attr("visibility", "visible")
    .attr("href", (d, i) => image.src = i % 2 === 0
      ? 'https://www.buytshirtdesigns.net/wp-content/uploads/2020/03/CoronaVirus-Awareness-800x662.jpg'
      : 'https://www.rushordertees.com/design/ZoomImage.php?src=4316992_f&style=3931&colorCode=37&x=240&y=300&width=880&height=880&scale=1.7&watermark=false');
}



function computeImagePosition(imageProps, polyProps) {
  const { aspect: iAspect, width: iWidth, height: iHeight } = imageProps;
  const { aspect: pAspect, width: pWidth, height: pHeight } = polyProps;
  const [x, y, width, height] =
    pAspect < iAspect
      ? [
        0,
        ((iAspect / pAspect) * pHeight - pHeight) / -2,
        pWidth,
        iHeight * (pWidth / iWidth)
      ]
      : [
        ((pAspect / iAspect) * pWidth - pWidth) / -2,
        0,
        iWidth * (pHeight / iHeight),
        pHeight
      ];

  return {
    x,
    y,
    width,
    height
  };
}