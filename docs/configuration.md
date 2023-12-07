# Legend configuration

The content of the legend can be defined in the file [data.json](../src/js/data.json). Additionally the URLs to the underlying vector tile style files have to be modified in the _select_ element of the [index.html](../src/index.html) file.

A legend consists of thematic groups, each containing several legend items. A legend item itself consists of an image (50px x 20px) and a text.

## Groups

The file [data.json](../src/js/data.json) contains an array of objects, each with a group name and an array of legend items

```json
[
    {
        "group": "traffic",
        "items": [
            { ... }
        ]
    }
]
```

### group

_Required string._

Used as group label in the legend image.

### items

_Required array of objects._

The items property lists all legend elements for the assosiated group.

## Items

A legend item has an image and a label. The image is created via a small map with [MapLibre GL JS](https://github.com/maplibre/maplibre-gl-js). The map content is defined by the layers property.

```json
"items": [
    {
        "label": "motorway",
        "zoom": 15,
        "layers": [
            { ... }
        ]
    }
]
```

### label

_Required string._

Used as label for the legend item.

### layers

_Required array of objects._

The layers property defines the content of the legend item image.

### border

_Optional string. One of `"true"`, `"true_if_white"`._

If necessary, a CSS border can be displayed around the image. If this option is not set or contains another value, no border will be drawn.

`"true"`: \
The image gets a gray border.

`"true_if_white"`: \
The image gets a gray border if it contains only pure white polygons ("#FFFFFF" or equivalent). 

### zoom

_Optional number between `0` and `24`._

If the map for the legend item image is to be rendered at a zoom level other than the default (level 14), the optional zoom parameter can be set. This may be necessary if the underlying style displays the required layers only at certain zoom levels.

## Layers

The layers array contains objects with filters for the style file layers and properties and optional coordinates for dummy datasets.

```json
"layers": [
    {
        "geomType": "Line",
        "filter": [
            "motorway_fill",
            "motorway_contour"
        ],
        "properties": {
            "type": "motorway",
            "lanes": 2
        },
        "coordinates": [[1,0], [2,0]]
    }
]
```

You can create composite or overlaid objects in the map, by defining multiple objects in the _layers_ array.

### geomType

_Required string. One of `"Point"`, `"Line"`, `"Polygon"`._

For each of the three geometry types, a default geometry is created for display in the legend item image. The center of the map is the coordinate [1, 0] (EPSG:4326).

If you need a geometry other than the default geometries, you can use the paramter _coordinates_ to overwrite the default geometry.

`"Point"`: 

By default the point is placed in the center of the map.

![Point](images/geom_type_point.png)

Default POINT coordinates (EPSG:4326): `[1, 0]`

`"MultiPoint"`: 

By default a single point is placed in the center of the map.

![MultiPoint](images/geom_type_point.png)

Default MULTIPOINT coordinates (EPSG:4326): `[[1, 0]]`

`"Line"`:

The default line is a horizontal LineString on the equator.

![Line](images/geom_type_line.png)

Default LINESTRING coordinates (EPSG:4326): `[[0.998, 0], [1.002, 0]]`

`"MultiLine"`:

The default multi line is a horizontal MultiLineString on the equator.

![MultiLine](images/geom_type_line.png)

Default MULTILINESTRING coordinates (EPSG:4326): `[[[0.998, 0], [1.002, 0]]]`

`"Polygon"`:

For this geometry type the default geometry is a MultiPolygon that almost fills the map image.

![Polygon](images/geom_type_polygon.png)

Default MULTIPOLYGON coordinates (EPSG:4326): \
`[[[0.999, -0.00035], [0.999, 0.00035], [1.001, 0.00035], [1.001, -0.00035], [0.999, -0.00035]]]`



### filter

_Required array of strings._

The filter is a list of strings filtering the style layers _id_ properties by [regular expressions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp). All layers whose _id_ matches at least one of the filter strings are rendered in the map. All other layers are set to `"visibility": "none"`.

The layers matching the filters should match the selected _geomType_.

The following example filters all layers which contain `motorway_fill` or `motorway_contour`. It would also e.g. match layers like `motorway_fill_bridge` or `street_and_motorway_contour`.

```json
"filter": [
    "motorway_fill",
    "motorway_contour"
],
```

If you want to filter an exact layer _id_, you can e.g. use the parameter `\b` as in the following example to filter only the exact layer ids `motorway_fill` and `motorway_contour`.

```json
"filter": [
    "\bmotorway_fill\b",
    "\bmotorway_contour\b"
],
```

### properties

_Required object with arbitrary properties._

With _properties_ you can define dummy datasets which match the filters in the style file layers. These datasets are combined with the (default) coordinates to GeoJSON objects, which are the data basis for the maps.

Assume you have a layer _motorway_fill_ in your style file with the followings configuration:

```json
{
    "id": "motorway_fill",
    "type": "fill",
    "filter": [
        "all",
        ["==","type","motorway"],
        ["==","lanes",2]
    ],
    ...
}
```

You must define a _properties_ object as shown below, to match the style layers filter. Otherwise, no object would be rendered in the map.

```json
"properties": {
    "type": "motorway",
    "lanes": 2
}
```

### coordinates

_Optional array of spatial geometries._

With this parameter you can overwrite the default geometry of the _geomType_. Depending on the specified _geomType_ it must be the coordinates for a Point, LineString or MultiPolygon in GeoJSON syntax with WGS84 (EPSG:4326).

The maps center is: `[1, 0]`

The bounding box of the map at the default zoom level 14 is: `[0.998927, -0.0004292], [1.001073, 0.000429]`

Example of a point, with an offset to the south:

```json
"coordinates": [1, -0.0004]
```

Example of a short horizontal line:

```json
"coordinates": [[0.9995, 0],[1.0005, 0]]
```

Example of two polygons:

```json
"coordinates": [
    [[[1.00002,0.00002],[1.00003,0.00001],[1,-0.00001],[0.99999,0],[1.00002,0.00002]]],
    [[[1.00003, -0.00002],[1.00003, 0],[1.00005,0],[1.00005,-0.00002],[1.00003,-0.00002]]]
]
```

# Override data.json

The content of the file data.json is compiled with the application and the file cannot be modified after compilation. To change the legend configuration after compilation, you can create a modified data.json in the compiled application folder. Call the application with the URL parameter _override=true_ to load the modified configuration.

```
https://<legend-url>?override=true
```