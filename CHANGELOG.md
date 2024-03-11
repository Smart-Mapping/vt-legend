## v1.5.0 (not released)
### Improvements and changes
* Add configuration for SVG instead of map images.
* Add configuration to use raster services in the style.

## v1.4.0 (2023-12-08)
### Improvements and changes
* Add values "MultiLine" and "MultiPoint" for configuration parameter geomType.
* Add new configuration parameter "center" for legend items.
* Adaptation of the map pixelRatio to the resolution of the legend image.

### Bug fixes
* Extend default geometry for lines.

## v1.3.0 (2023-09-05)
### Improvements and changes
* Invisible style layers ("visibility": "none") are shown in the legend if they are defined in data.json.

### Bug fixes
* For each layer of a legend item a separate GeoJSON source is created in the style, so that GeoJSON configurations can't be applied to a wrong layer.

## v1.2.0 (2023-05-09)
### Improvements and changes
* Create legend image in high resolution

### Bug fixes
* Toggle logo after legend creation complete

## v1.1.0 (2023-01-11)
### Improvements and changes
* Replace style sources by source with dummy name

## v1.0.1 (2022-09-09)
### Improvements and changes
* Update dependencies
* Adapt data.json to basemap.de style version 2.0

## v1.0.0 (2022-06-27)
Initial release