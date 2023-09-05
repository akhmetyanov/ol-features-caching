import { Component, OnInit } from '@angular/core';
import { MultiPolygon as TMultiPolygon } from '@turf/turf';
import { Feature, Map, View } from 'ol';
import Polygon, { fromExtent } from 'ol/geom/Polygon';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { OSM } from 'ol/source'
import VectorSource from 'ol/source/Vector';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import * as turf from '@turf/turf'
import { MultiPolygon as OMultiPolygon } from 'ol/geom';
import { GeoJSON } from 'ol/format'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  map?: Map
  vectorLaver?: VectorLayer<VectorSource>
  diffLaver?: VectorLayer<VectorSource>

  cache?: TMultiPolygon

  ngOnInit(): void {
    this.vectorLaver = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(186, 35, 113, 0.8)'
        }),
        stroke: new Stroke({
          width: 2,
          color: 'rgba(20, 206, 83, 0.8)',
          lineDash: []
        })
      })
    })

    this.diffLaver = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(50, 50, 50, 0.8)'
        }),
        stroke: new Stroke({
          width: 2,
          color: 'rgba(40, 250, 83, 0.8)',
          lineDash: []
        })
      })
    })

    this.map = new Map({
      target: 'map',
      layers: [
        new TileLayer({ source: new OSM() }),
        this.vectorLaver,
        this.diffLaver
      ],
      view: new View({
        center: [0, 0],
        zoom: 2
      })
    })
  }

  onCache() {
    if (!this.map || !this.vectorLaver) return
    const { ccs, ce } = this.getState()

    if (!ce) return

    if (ccs) {
      const feature = new GeoJSON().readFeature(turf.union(ce, ccs))
      this.vectorLaver.getSource()?.clear()
      this.vectorLaver.getSource()?.addFeature(feature)
    } else {
      const feature = new GeoJSON().readFeature(ce)
      this.vectorLaver.getSource()?.addFeature(feature)
    }
  }

  private getState() {
    const ccs = this.getCurrentCacheState() // ccs - current cache state
    const ce = this.getCurrentExtent() // ce - current extent
    return { ce, ccs }
  }

  private getCurrentExtent() {
    if (!this.map) return null
    const extent = this.map.getView().calculateExtent()
    const olPolygone = fromExtent(extent);
    return turf.polygon((olPolygone as Polygon).getCoordinates());
  }

  private getCurrentCacheState() {
    const features = this.vectorLaver?.getSource()?.getFeatures() ?? []
    if (features.length) {
      return turf.multiPolygon((features[0].getGeometry() as OMultiPolygon).getCoordinates());
    }
    return null
  }

  onRemoveCache() {
    this.vectorLaver?.getSource()?.clear()
  }

  onDiff() {
    if (!this.map || !this.diffLaver) return
    const { ce, ccs } = this.getState();
    if (!ce || !ccs) return

    const feature = new GeoJSON().readFeature(turf.difference(ce, ccs))
    this.diffLaver.getSource()?.clear()
    this.diffLaver.getSource()?.addFeature(feature)
  }

  onRemoveDiff() {
    this.diffLaver?.getSource()?.clear()
  }
}
