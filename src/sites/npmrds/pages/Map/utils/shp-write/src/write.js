import {jstypes as types} from './types'
// import dbf from 'dbf'
import structure from "./structure/structure"
import prj from './prj'
//import ext from './extent'
import getFields from './fields'
import assert from 'assert'
import pointWriter from './points'
import polyWriter from './poly'

var writers = {
    1: pointWriter,
    5: polyWriter,
    3: polyWriter
};

var recordHeaderLength = 8;



// Low-level writing interface
export function write(rows, geometry_type, geometries, callback) {

    var TYPE = types[geometry_type],
        writer = writers[TYPE],
        parts = writer.parts(geometries, TYPE),
        shpLength = 100 + (parts - geometries.length) * 4 + writer.shpLength(geometries),
        shxLength = 100 + writer.shxLength(geometries),
        shpBuffer = new ArrayBuffer(shpLength),
        shpView = new DataView(shpBuffer),
        shxBuffer = new ArrayBuffer(shxLength),
        shxView = new DataView(shxBuffer),
        extent = writer.extent(geometries);

    writeHeader(shpView, TYPE);
    writeHeader(shxView, TYPE);
    writeExtent(extent, shpView);
    writeExtent(extent, shxView);

    writer.write(geometries, extent,
        new DataView(shpBuffer, 100),
        new DataView(shxBuffer, 100),
        TYPE);

    shpView.setInt32(24, shpLength / 2);
    shxView.setInt32(24, (50 + geometries.length * 4));

    var dbfBuf = structure(rows);

    callback(null, {
        shp: shpView,
        shx: shxView,
        dbf: dbfBuf,
        prj: prj
    });
}

function writeHeader(view, TYPE) {
    view.setInt32(0, 9994);
    view.setInt32(28, 1000, true);
    view.setInt32(32, TYPE, true);
}

function writeExtent(extent, view) {
    view.setFloat64(36, extent.xmin, true);
    view.setFloat64(44, extent.ymin, true);
    view.setFloat64(52, extent.xmax, true);
    view.setFloat64(60, extent.ymax, true);
}

export default {
    write
}
