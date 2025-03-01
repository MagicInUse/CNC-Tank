import ReactDOMServer from 'react-dom/server';

export function svgToDataUrl(svgComponent) {
  const svgString = ReactDOMServer.renderToStaticMarkup(svgComponent);
  const encoder = new TextEncoder();
  const utf8Bytes = encoder.encode(svgString);
  return `data:image/svg+xml;base64,${btoa(String.fromCharCode.apply(null, utf8Bytes))}`;
}