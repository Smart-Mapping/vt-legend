import 'maplibre-gl/dist/maplibre-gl.css';

import { toPng } from 'html-to-image';

if (window.URL.createObjectURL === undefined) {
    window.URL.createObjectURL = () => { };
}
const maplibregl = require('maplibre-gl');

let legendData = {};
let group = '';
let groupCounter = 0;
let elementCounter = 0;
let styleJson = {};
const standardZoom = 14;
const standardCenter = [1, 0];
let renderMap = {};
let isIdle = true;

/**
 * Initialize the legend application and render map
 */
export function initApp() {
    document.getElementById('selStyle').addEventListener('change', () => initStyle());
    document.getElementById('selDpi').addEventListener('change', () => {
        setResolution();
        initStyle();
    });
    document.getElementById('toggleLogo').addEventListener('change', () => {
        document.getElementById('legendLogo').classList.toggle('hidden');
        if (isIdle) {
            initStyle();
        }
    });

    renderMap = new maplibregl.Map({
        container: 'renderMap',
        center: standardCenter,
        zoom: standardZoom
    });
    renderMap.setPixelRatio(calcRatio());

    if (window.location.search.search(/override=true/) > -1) {
        fetch('data.json')
            .then(response => response.json())
            .then(data => legendData = data);
    } else {
        legendData = require('./data.json');
    }

    // Convert map to image and create legend item when map finished rendering
    renderMap.on('idle', () => {
        var canvas = renderMap.getCanvas(document.querySelector('#renderMap .mapbgoxgl-canvas'));
        let container = document.createElement('div');
        container.className = 'legend-element';
        let text = document.createElement('span');
        text.className = 'legend-label';
        text.innerText = legendData[groupCounter].items[elementCounter - 1].label;
        let img = document.createElement('img');
        img.src = canvas.toDataURL();

        // Add border for defined elements
        const border = legendData[groupCounter].items[elementCounter - 1].border;
        if (border === 'true') {
            img.className = 'border';
        } else if (border !== undefined && border === 'true_if_white') {
            // Only add border if color of all visible fill layers is white
            const style = renderMap.getStyle();
            let isWhite = true;

            for (let i = 0; i < style.layers.length; i++) {
                if (style.layers[i].layout.visibility === 'visible' && style.layers[i].type === 'fill'
                    && !isColorWhite(style.layers[i].paint['fill-color'])) {
                    isWhite = false;
                    break;
                }
            }

            if (isWhite) {
                img.className = 'border';
            }
        }

        container.appendChild(img);
        container.appendChild(text);

        let colClass = (elementCounter < (legendData[groupCounter].items.length / 2) + 1) ? '.left' : '.right';

        document.querySelector('#group' + groupCounter + ' ' + colClass).appendChild(container);
        createLegendItem();
    });

    initStyle();
}

/**
 * Parse the selected style file
 */
function initStyle() {
    isIdle = false;
    document.getElementById('renderMap').style.display = 'block';
    document.getElementById('btnDownload').style.display = 'none';

    groupCounter = 0;
    group = '';
    document.getElementById('legend').innerHTML = '';
    const selStyle = document.getElementById('selStyle');
    let styleFile = selStyle.options[selStyle.selectedIndex].value;

    fetch(styleFile)
        .then(response => response.json())
        .then(style => {
            styleJson = style;

            // Delete data sources to add dummy datasets later on
            delete styleJson.sources;
            styleJson.sources = {
                'legend-source': {
                    'type': 'geojson',
                    'data': {
                        'type': 'FeatureCollection',
                        'features': []
                    }
                }
            };
            for (let i = 0; i < styleJson.layers.length; i++) {
                styleJson.layers[i]['source'] = 'legend-source';
                delete styleJson.layers[i]['source-layer'];
                delete styleJson.layers[i]['maxzoom'];

                // Set visibility if not explicitly set
                if (style.layers[i].layout === undefined) {
                    style.layers[i].layout = { 'visibility': 'visible' };
                }

                if (styleJson.layers[i].type === 'symbol') {
                    // Show line symbols as a point so that the symbol is placed in the center
                    if (styleJson.layers[i].layout['symbol-placement'] === 'line') {
                        styleJson.layers[i].layout['symbol-placement'] = 'point';
                    }

                    // Set fixed anchor
                    styleJson.layers[i].layout['text-anchor'] = 'center';
                    delete styleJson.layers[i].layout['text-variable-anchor'];
                }



                // No filter defined -> set layer id as filter 'klasse'
                if (styleJson.layers[i].filter === undefined) {
                    styleJson.layers[i].filter = ['==', ['get', 'klasse'], styleJson.layers[i].id];
                }
            }

            // Delete data source 
            if (styleJson.sources['smarttilesHL_de'] !== undefined) {
                delete styleJson.sources['smarttilesHL_de'].url;
                delete styleJson.sources['smarttilesHL_de'].attribution;
                styleJson.sources['smarttilesHL_de'].type = 'geojson';
                for (let i = 0; i < styleJson.layers.length; i++) {
                    delete styleJson.layers[i]['source-layer'];
                    delete styleJson.layers[i]['maxzoom'];
                }
            }
            createLegendItem();
        });
}

/**
 * Parse the style file with the defined filters and create GeoJSON datasets
 */
function createLegendItem() {
    if (groupCounter < legendData.length) {
        if (legendData[groupCounter].group != group) {
            group = legendData[groupCounter].group;
            addGroup(group);
            elementCounter = 0;
        }

        if (elementCounter < legendData[groupCounter].items.length) {
            let style = styleJson;

            // Variable to check if at least one layer is visible
            let isVisible = false;

            for (let j = 0; j < style.layers.length; j++) {
                style.layers[j].layout.visibility = 'none';
            }

            for (let i = 0; i < legendData[groupCounter].items[elementCounter].layers.length; i++) {
                let features = [];
                let filterRegExp = '';

                // Create GeoJSON dataset
                const feature = createGeoJsonFeature(legendData[groupCounter].items[elementCounter].layers[i]);
                features.push(feature);

                // Add filter strings to RegExp
                filterRegExp += legendData[groupCounter].items[elementCounter].layers[i].filter.join('|');

                for (let j = 0; j < style.layers.length; j++) {
                    // Filter layers
                    if (style.layers[j].id.search(filterRegExp) >= 0) {
                        style.layers[j].layout.visibility = 'visible';
                        isVisible = true;

                        // Create data source for layer
                        if (style.sources['legend-source-' + i] === undefined) {
                            style.sources['legend-source-' + i] = {
                                'type': 'geojson'
                            };
                        }

                        style.sources['legend-source-' + i].data = {
                            'type': 'FeatureCollection',
                            'features': features
                        };
                        style.layers[j]['source'] = 'legend-source-' + i;
                    }
                }
            }

            if (isVisible) {
                // Render map
                if (legendData[groupCounter].items[elementCounter].zoom !== undefined) {
                    renderMap.setZoom(legendData[groupCounter].items[elementCounter].zoom);
                } else {
                    renderMap.setZoom(standardZoom);
                }
                if (legendData[groupCounter].items[elementCounter].center !== undefined) {
                    renderMap.setCenter(legendData[groupCounter].items[elementCounter].center);
                } else {
                    renderMap.setCenter(standardCenter);
                }
                renderMap.setStyle(style);
                elementCounter++;
            } else {
                // No layer with used filter is visible
                elementCounter++;
                createLegendItem();
            }
        } else if (groupCounter < legendData.length) {
            incrementGroupCounter();
            createLegendItem();
        }
    } else {
        finishLegend();
    }
}

/**
 * Add a group to the legend
 * @param {string} groupName Name of the group
 */
export function addGroup(groupName) {
    let groupTitle = document.createElement('div');
    groupTitle.innerHTML = groupName;
    groupTitle.className = 'groupTitle';
    groupTitle.id = 'groupTitle' + groupCounter;
    document.getElementById('legend').appendChild(groupTitle);

    let groupCont = document.createElement('div');
    groupCont.className = 'groupContainer';
    groupCont.id = 'group' + groupCounter;
    document.getElementById('legend').appendChild(groupCont);

    let groupContLeft = document.createElement('div');
    groupContLeft.className = 'left';
    let groupContRight = document.createElement('div');
    groupContRight.className = 'right';
    groupCont.appendChild(groupContLeft);
    groupCont.appendChild(groupContRight);
}

/**
 * Finish creating the legend by rearranging the legend items
 */
export function finishLegend() {
    document.getElementById('renderMap').style.display = 'none';

    // Rearrange groups and elements if the arrangement is unbalanced 
    // Right column must not contain more or significantly less elements than left column
    for (let i = 0; i < document.querySelectorAll('.groupContainer').length; i++) {

        let numLeft = document.querySelectorAll('#group' + i + ' .left .legend-element').length;
        const numRight = document.querySelectorAll('#group' + i + ' .right .legend-element').length;
        if (numRight > numLeft | numRight < numLeft - 1) {
            numLeft = Math.ceil((numLeft + numRight) / 2);

            const legendElements = document.querySelectorAll('#group' + i + ' .legend-element');
            for (let j = 0; j < legendElements.length; j++) {
                if (j < numLeft) {
                    document.querySelectorAll('#group' + i + ' .left')[0].appendChild(legendElements[j]);
                } else {
                    document.querySelectorAll('#group' + i + ' .right')[0].appendChild(legendElements[j]);
                }
            }
        }
    }

    // Remove empty groups
    for (let i = 0; i < document.querySelectorAll('.groupContainer').length; i++) {
        if (document.querySelector('#group' + i + ' .left').children.length === 0
            && document.querySelector('#group' + i + ' .right').children.length === 0) {
            document.getElementById('group' + i).remove();
            document.getElementById('groupTitle' + i).remove();
        }
    }

    var node = document.getElementById('frame');


    toPng(node)
        .then(function (dataUrl) {
            const selStyle = document.getElementById('selStyle');
            const styleName = selStyle.options[selStyle.selectedIndex].text;

            var btnDownload = document.getElementById('btnDownload');
            btnDownload.download = 'basemap.de_Legende_' + styleName + '.png';
            btnDownload.href = dataUrl;
            btnDownload.style.display = 'block';
        })
        .catch(function (error) {
            console.error('oops, something went wrong!', error);
        });
    isIdle = true;
}

/**
 * Create a GeoJSON feature from legend items layer configuration
 * @param {*} layer Layer of a legend item
 */
export function createGeoJsonFeature(layer) {
    // Set default geometries
    let coordinates = [1, 0];
    let geomType = 'Point';
    if (layer.geomType === 'MultiPoint') {
        geomType = 'MultiPoint';
        coordinates = [
            [1, 0]
        ];
    } else if (layer.geomType === 'Line') {
        geomType = 'LineString';
        coordinates = [
            [0.998, 0], [1.002, 0]
        ];
    } else if (layer.geomType === 'MultiLine') {
        geomType = 'MultiLineString';
        coordinates = [
            [[0.998, 0], [1.002, 0]]
        ];
    } else if (layer.geomType === 'Polygon') {
        geomType = 'MultiPolygon';
        coordinates = [
            [[[0.999, -0.00035], [0.999, 0.00035], [1.001, 0.00035], [1.001, -0.00035], [0.999, -0.00035]]]
        ];
    }

    // Overwrite geometry
    if (layer.coordinates !== undefined) {
        coordinates = layer.coordinates;
    }

    const feature = {
        'type': 'Feature',
        'geometry': {
            'type': geomType,
            'coordinates': coordinates
        },
        'properties': layer.properties
    };

    return feature;
}

/**
 * Checks colors of different types to be pure white
 * @param {string} color 
 * @returns true: color is pure white
 */
export function isColorWhite(color) {
    return (color.toLowerCase().replace(/\s/g, '') === '#fff'
        || color.toLowerCase().replace(/\s/g, '') === '#ffffff'
        || color.toLowerCase().replace(/\s/g, '') === 'rgb(255,255,255)'
        || color.toLowerCase().replace(/\s/g, '') === 'rgba(255,255,255,1)'
        || color.toLowerCase().replace(/\s/g, '') === 'hsl(0,0%,100%)'
        || color.toLowerCase().replace(/\s/g, '') === 'hsla(0,0%,100%,1)'
        || color.toLowerCase().replace(/\s/g, '') === 'white');
}

/**
 * Toggle the legend logo
 */
export function toggleLogo() {
    document.getElementById('legendLogo').classList.toggle('hidden');
}

/**
 * Set DPI for the legend image
 */
export function setResolution() {
    const selDpi = document.getElementById('selDpi');
    let dpi = selDpi.options[selDpi.selectedIndex].value;
    Object.defineProperty(window, 'devicePixelRatio', {
        get: function () { return dpi / 96; }
    });
}

export function calcRatio() {
    const selDpi = document.getElementById('selDpi');
    let dpi = selDpi.options[selDpi.selectedIndex].value;
    return Math.ceil(dpi / 100) + 1;
}

/**
 * Increment the groupCounter
 */
export function incrementGroupCounter() {
    groupCounter++;
}
