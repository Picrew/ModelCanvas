# Capability matrix

All rows below have an exact schema, registry entry, deterministic demo or widget fixture, and automated acceptance coverage.

| Renderer              | MIME / extension              |   Streaming |           Editing | Export             | Demo/test |
| --------------------- | ----------------------------- | ----------: | ----------------: | ------------------ | --------- |
| text.markdown         | text/markdown, md             |         Yes |                No | md, html           | Yes       |
| text.code             | text/plain, ts/js/py/css/html |          No |               Yes | source             | Yes       |
| text.math             | text/x-tex, tex               |          No |                No | tex                | Yes       |
| math.plot             | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| math.geometry         | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| math.matrix           | protocol JSON                 |          No |     View controls | json               | Yes       |
| math.distribution     | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| math.number-line      | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| data.table            | CSV/TSV                       |          No |               Yes | csv, chart         | Yes       |
| data.json             | JSON/YAML/XML/log             |          No |               Yes | source             | Yes       |
| chart.echarts         | ECharts JSON                  |          No |                No | png, svg           | Yes       |
| chart.vega-lite       | Vega-Lite JSON                |          No |                No | png, svg           | Yes       |
| diagram.mermaid       | text/vnd.mermaid              |          No |                No | svg, png           | Yes       |
| diagram.excalidraw    | Excalidraw JSON               |          No |               Yes | json, png, svg     | Yes       |
| media.image           | image/*                       |          No |         Transform | source             | Yes       |
| media.audio           | audio/*                       |         Yes |                No | source, transcript | Yes       |
| media.video           | video/*                       |         Yes |                No | source, transcript | Yes       |
| audio.pronunciation   | protocol JSON                 |         Yes |          Settings | audio              | Yes       |
| document.pdf          | application/pdf               |          No |                No | source, text       | Yes       |
| document.docx         | OOXML DOCX                    |          No |                No | source, pdf        | Yes       |
| document.spreadsheet  | XLS/XLSX/CSV                  |          No |               Yes | source, csv, chart | Yes       |
| document.presentation | PPT/PPTX/ODP                  |          No |                No | source, pdf        | Yes       |
| document.epub         | application/epub+zip          |          No |  Reading settings | source             | Yes       |
| data.notebook         | IPYNB JSON                    |          No |      Cell folding | ipynb              | Yes       |
| data.parquet          | Parquet/Arrow                 |          No |                No | csv, chart         | Yes       |
| map.geo               | GeoJSON                       |          No |    Layer controls | geojson, png       | Yes       |
| map.places            | protocol JSON                 |          No |    Layer controls | geojson, png       | Yes       |
| map.route             | protocol JSON                 |          No |    Layer controls | geojson, png       | Yes       |
| map.heatmap           | protocol JSON                 |          No |    Layer controls | geojson, png       | Yes       |
| map.track             | protocol JSON                 |          No |    Layer controls | geojson, png       | Yes       |
| model.3d              | GLTF/GLB/OBJ/STL/PLY          |          No |     View controls | source             | Yes       |
| science.molecule      | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| science.reaction      | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| science.optics        | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| engineering.circuit   | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| engineering.waveform  | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| engineering.timing    | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| engineering.logic     | protocol JSON                 |          No |     View controls | json, svg          | Yes       |
| artifact.html         | text/html                     |     Runtime |               Yes | html               | Yes       |
| artifact.react        | TSX/JSX                       |     Runtime |               Yes | files              | Yes       |
| artifact.python       | text/x-python                 |     Runtime |               Yes | py, output         | Yes       |
| widget.weather        | protocol JSON                 |          No |                No | json               | Yes       |
| widget.stock          | protocol JSON                 |          No |             Range | json, png          | Yes       |
| widget.sports         | protocol JSON                 |          No |                No | json               | Yes       |
| widget.travel         | protocol JSON                 |          No |                No | json               | Yes       |
| widget.product        | protocol JSON                 |          No |                No | json               | Yes       |
| widget.calendar       | protocol JSON                 |          No | Confirmed actions | ics                | Yes       |
| widget.email          | message/rfc822                |          No | Confirmed actions | eml                | Yes       |
| widget.logistics      | protocol JSON                 |          No |                No | json               | Yes       |
| form.dynamic          | protocol JSON                 | Incremental |               Yes | json/events        | Yes       |

Known boundaries: Office fidelity beyond browser preview uses the optional LibreOffice service; commercial model/TTS calls require server-side keys; Python scientific wheels require an explicitly allowed package origin, while core Python runs fully offline.
