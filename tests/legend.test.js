import fs from 'fs'
import path from 'path'
import { Window } from 'happy-dom'
import { it, expect, describe, vi, beforeAll } from 'vitest';

import { isColorWhite, addGroup, toggleLogo, finishLegend, groupCounter, incrementGroupCounter, createGeoJsonFeature } from '../src/js/legend';

const htmlDocPath = path.join(process.cwd(), 'src/index.html');
const htmlDocumentContent = fs.readFileSync(htmlDocPath).toString();
const window = new Window();

const document = window.document;
document.write(htmlDocumentContent);
vi.stubGlobal('document', document);

const groupName0 = 'test group 0';
const groupName1 = 'test group 1';

beforeAll(() => {
    addGroup(groupName0);
    incrementGroupCounter();
    addGroup(groupName1);

    let legendElement = document.createElement('div');
    legendElement.className = 'legend-element';
    let legendElement2 = document.createElement('div');
    legendElement2.className = 'legend-element';
    let legendElement3 = document.createElement('div');
    legendElement3.className = 'legend-element';

    document.querySelector('#group0 .left').appendChild(legendElement);
    document.querySelector('#group0 .right').appendChild(legendElement2);
    document.querySelector('#group0 .right').appendChild(legendElement3);
});

describe('addGroup()', () => {
    it('should add new groups to DOM', () => {
        expect(document.getElementById('legend').children.length).toBe(4);
        
        expect(document.getElementById('groupTitle0')).not.toBeNull();
        expect(document.getElementById('group0')).not.toBeNull();

        expect(document.getElementById('groupTitle1')).not.toBeNull();
        expect(document.getElementById('group1')).not.toBeNull();
    });

    it ('should add two children "left" and "right" to each new group', () => {
        expect(document.querySelector('#group0 > .left')).not.toBeNull();
        expect(document.querySelector('#group0 > .right')).not.toBeNull();
        expect(document.querySelector('#group1 > .left')).not.toBeNull();
        expect(document.querySelector('#group1 > .right')).not.toBeNull();
    });

    it('should set the correct group name', () => {
        expect(document.getElementById('groupTitle0').innerHTML).toBe(groupName0);
        expect(document.getElementById('groupTitle1').innerHTML).toBe(groupName1);
    });
});

describe('toggleLogo()', () => {
    it('should toggle class name "hidden"', () => {
        expect(document.getElementById('legendLogo').className).toContain('hidden');
        toggleLogo();
        expect(document.getElementById('legendLogo').className).not.toContain('hidden');
        toggleLogo();
        expect(document.getElementById('legendLogo').className).toContain('hidden');
    });
});

describe('isColorWhite()', () => {
    it('should confirm white for pure white with correct color syntax', () => {
        expect(isColorWhite('#fff')).toBeTruthy();
        expect(isColorWhite('#ffffff')).toBeTruthy();
        expect(isColorWhite('rgb(255,255,255)')).toBeTruthy();
        expect(isColorWhite('rgba(255,255,255,1)')).toBeTruthy();
        expect(isColorWhite('hsl(0,0%,100%)')).toBeTruthy();
        expect(isColorWhite('hsla(0,0%,100%,1)')).toBeTruthy();
        expect(isColorWhite('white')).toBeTruthy();
    });
   
    it('should confirm white for pure white with whitespaces and uppercase', () => {
        expect(isColorWhite(' #FFF ')).toBeTruthy();
        expect(isColorWhite(' #FFFFFF ')).toBeTruthy();
        expect(isColorWhite('RGB(255, 255, 255)')).toBeTruthy();
        expect(isColorWhite('RGBA(255, 255, 255, 1)')).toBeTruthy();
        expect(isColorWhite('HSL(0, 0%, 100%)')).toBeTruthy();
        expect(isColorWhite('HSLA(0, 0%, 100%, 1)')).toBeTruthy();
        expect(isColorWhite(' WHITE')).toBeTruthy();
    });

    it('should reject white for non pure white color', () => {
        expect(isColorWhite('#fdf')).toBeFalsy();
        expect(isColorWhite('#ffaaff')).toBeFalsy();
        expect(isColorWhite('rgb(254,255,255)')).toBeFalsy();
        expect(isColorWhite('rgba(254,255,255,1)')).toBeFalsy();
        expect(isColorWhite('hsl(50,0%,100%)')).toBeFalsy();
        expect(isColorWhite('hsla(50,0%,100%,1)')).toBeFalsy();
        expect(isColorWhite('red')).toBeFalsy();
    });

    it('should throw error on non string input', () => {
        const func = () => {
            isColorWhite(1);
        };
        expect(func).toThrow();
    });
});

describe('createGeoJsonFeature()', () => {  
    it('should create a proper GeoJSON feature', () => {
        const layer = {
            'geomType': 'Point',
            'properties': {
                'type': 'test'
            }
        };

        const result = createGeoJsonFeature(layer);

        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('geometry');
        expect(result).toHaveProperty('properties');
        expect(result.geometry).toHaveProperty('type');
        expect(result.geometry).toHaveProperty('coordinates');
    });

    it('should create a Point feature', () => {
        const layer = {
            'geomType': 'Point'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.type).toBe('Point');
    });

    it('should create a MultiPoint feature', () => {
        const layer = {
            'geomType': 'MultiPoint'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.type).toBe('MultiPoint');
    });

    it('should create a LineString feature', () => {
        const layer = {
            'geomType': 'Line'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.type).toBe('LineString');
    });   

    it('should create a MultiLineString feature', () => {
        const layer = {
            'geomType': 'MultiLine'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.type).toBe('MultiLineString');
    });      

    it('should create a MultiPolygon feature', () => {
        const layer = {
            'geomType': 'Polygon'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.type).toBe('MultiPolygon');
    }); 

    it('should set default coordinates', () => {
        const layer = {
            'geomType': 'Point'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.coordinates).toEqual([1, 0]);
    });    
    
    it('should set given coordinates', () => {
        const coordinates = [2, 2];
        const layer = {
            'geomType': 'Point',
            'coordinates': coordinates
        };
        const result = createGeoJsonFeature(layer);

        expect(result.geometry.coordinates).toEqual(coordinates);
    });      

    it('should set given properties', () => {
        const properties = {
            'type': 'poi',
            'name': 'my_poi'
        };
        const layer = {
            'geomType': 'Point',
            'properties': properties
        };
        const result = createGeoJsonFeature(layer);

        expect(result.properties).toEqual(properties);
    });   

    it('should not set properties for feature when not defined', () => {
        const layer = {
            'geomType': 'Point'
        };
        const result = createGeoJsonFeature(layer);

        expect(result.properties).toBeNull;
    });      
});

describe('finishLegend()', () => {
    beforeAll(() => {
        finishLegend();
    });

    it('should rearrange group columns, if right column has more elements than left column', () => {
        expect(document.getElementById('legend').children.length).toBe(2);
        expect(document.querySelector('#group0 > .left').children.length)
            .toBeGreaterThanOrEqual(document.querySelector('#group0 > .right').children.length);
    });

    it('should remove empty groups', () => {
        expect(document.getElementById('legend').children.length).toBe(2);
        expect(document.getElementById('group1')).toBeNull();
    });
});
