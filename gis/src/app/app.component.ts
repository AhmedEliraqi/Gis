import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import esriConfig from '@arcgis/core/config.js';
import BasemapToggle from "@arcgis/core/widgets/BasemapToggle.js";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery.js";
import AreaMeasurement2D from "@arcgis/core/widgets/AreaMeasurement2D.js";
import Compass from "@arcgis/core/widgets/Compass.js";
import Bookmarks from "@arcgis/core/widgets/Bookmarks.js";
import MapImageLayer from "@arcgis/core/layers/MapImageLayer.js";
import LayerList from "@arcgis/core/widgets/LayerList.js";
import esriRequest from "@arcgis/core/request.js";
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { PaginationInstance } from 'ngx-pagination';
import Feature from "@arcgis/core/widgets/Feature.js";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer.js";
import { query } from '@angular/animations';
import Query from "@arcgis/core/rest/support/Query.js";
import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Point from "@arcgis/core/geometry/Point.js";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],

})
export class AppComponent implements OnInit {

  geoJsons: any[] = [];
  data: any;
  line: any[] = [];
  polygon: any[] = [];
  showPoint = true;
  showLine = false;
  showPolygon = false;
  pageNumber: number = 1;
  pageSize = 10;
  totalItemsCount = 159;
  total: number = 166;
  view: any;
  graphicLayer: any;
  selectedObjectId: number | null = null;
  msg = '';


  constructor() {

  }


  pageChange(event: PageEvent) {
    this.pageNumber = event.pageIndex;
    this.showPointTable(this.selectedObjectId, this.pageNumber, this.pageSize);
  };

  nextPage(event: PageEvent) {
    this.pageNumber = event.pageIndex;
  };

  ngOnInit(): void {
    const map = new Map({
      basemap: "osm" // Basemap layer service
    });

    this.view = new MapView({
      map: map,
      center: [-97.21008134095314, 43.85632728398435], // Longitude, latitude
      zoom: 4, // Zoom level
      container: "view" // Div element
    });
    (window as any)._view = this.view;
    this.graphicLayer = new GraphicsLayer();

    let basemapToggle = new BasemapToggle({
      view: this.view,  // The view that provides access to the map's "streets-vector" basemap
      nextBasemap: "satellite"  // Allows for toggling to the "hybrid" basemap
    });


    // view.ui.add(basemapToggle, {
    //   position: "top-right"
    // });


    let basemapGallery = new BasemapGallery({
      view: this.view

    });
    // Add widget to the top right corner of the view
    // view.ui.add(basemapGallery, {
    //     position: "top-right"
    //   });


    let measurementWidget = new AreaMeasurement2D({
      view: this.view
    });
    //view.ui.add(measurementWidget, "top-right");


    let compass = new Compass({
      view: this.view
    });


    // adds the compass to the top left corner of the MapView
    //view.ui.add(compass, "top-left");


    // Add the widget to the top-right corner of the view
    // view.ui.add(basemapGallery, {
    //   position: "top-right"
    // });


    const bookmarks = new Bookmarks({
      view: this.view,
      editingEnabled: true,
      // whenever a new bookmark is created, a 100x100 px
      // screenshot of the view will be taken and the rotation, scale, and extent
      // of the view will not be set as the viewpoint of the new bookmark
      defaultCreateOptions: {
        takeScreenshot: true,
        captureViewpoint: false,
        captureTimeExtent: false, // the time extent of the view will not be saved in the bookmark
        screenshotSettings: {
          width: 100,
          height: 100
        }
      }
    });
    //view.ui.add(bookmarks, "top-left");

    let fPointlayer = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer/0"
    })

    let fLinelayer = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer/1"
    })

    let fPolygonlayer = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer/2"
    })

    // let layer = new MapImageLayer({
    //   // URL to the map service
    //   url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer",
    //   // dynamic sublayers. See sublayers documentation for more info

    // });

    map.add(fPointlayer)
    map.add(fLinelayer)
    map.add(fPolygonlayer)

    map.add(this.graphicLayer);

    //map.add(layer)

    let layerlist = new LayerList({
      view: this.view
    });

    this.view.ui.add(layerlist, "top-left");

    this.getDataFromMap();
    this.getLineFromMap();

    this.getDatas(this.selectedObjectId, this.pageNumber, this.pageSize).then(result => {
      this.geoJsons = result;
      console.log(this.geoJsons);
    }).catch(error => {
      console.error(error);
    });




  }


  getDataFromMap() {
    this.view.on("click", async (event: any) => {
      let hitResult = await this.view.hitTest(event);
      if (hitResult.results.length === 1) {
        this.selectedObjectId = hitResult.results[0].graphic.attributes.objectid;
        this.pageNumber = 1;
        let data = await this.getDatas(this.selectedObjectId, this.pageNumber, this.pageSize);
        this.geoJsons = data;

      } else { // if non-point feature is clicked, reset the selectedObjectId and set tableData to empty array
        this.selectedObjectId = null;

      }
    });
  };

  getLineFromMap() {
    this.view.on("click", async (event: any) => {
      let hitResult = await this.view.hitTest(event);
      if (hitResult.results.length === 1) {
        this.selectedObjectId = hitResult.results[0].graphic.attributes.objectid;
        let data = await this.getLine(this.selectedObjectId, this.pageNumber, this.pageSize);
        this.line = data;

      } else { // if non-point feature is clicked, reset the selectedObjectId and set tableData to empty array
        this.selectedObjectId = null;
        this.line = [];

      }
    });
  }


  async goToPointGeometry(obj: any) {
    let flayer = new FeatureLayer({
      url: 'https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/0'
    })

    let query = new Query();
    query.where = `objectid = ${obj}`;
    query.returnGeometry = true;
    query.outFields = ["*"];

    let result = await flayer.queryFeatures(query);
    this.graphicLayer.removeAll();
    let pointSymbol = {
      type: "simple-marker",
      color: [226, 119, 40],
      size: 20,
      outline: {
        width: 2,
        color: "darkblue"
      }
    };

    let pointGrahic = new Graphic({
      geometry: result.features[0].geometry,
      symbol: pointSymbol,
    });
    this.graphicLayer.add(pointGrahic);
    this.view.goTo(result.features[0].geometry)

  };

  async gotoLineGeomtry(obj: any) {
    console.log("obj", obj);

    let flayer: any = null;


    flayer = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/1"
    })

    let query = new Query();
    query.where = `objectid = ${obj}`;
    query.returnGeometry = true;

    let result = await flayer.queryFeatures(query)
    console.log("result geometry", result);
    console.log("result geometry", result.features[0].geometry);


    this.graphicLayer.removeAll();
    let lineSymbol = {
      type: "simple-line",  // autocasts as SimpleLineSymbol()
      color: [226, 119, 40],
      width: 4,
      size: 20,
      outline: {
        width: 0.5,
        color: "darkblue"
      }
    };

    let lineGrahic = new Graphic({
      geometry: result.features[0].geometry,
      symbol: lineSymbol,
    });
    this.graphicLayer.add(lineGrahic);

    this.view.goTo(result.features[0].geometry)
  };

  async gotoPolygonGeomtry(obj: any) {
    console.log("obj", obj);

    let flayer = new FeatureLayer({
      url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/FeatureServer/2"
    })


    let query = new Query();
    query.where = `objectid = ${obj}`;
    query.returnGeometry = true;

    let result = await flayer.queryFeatures(query)
    console.log("result geometry", result);
    console.log("result geometry", result.features[0].geometry);
    this.graphicLayer.removeAll();
    let polygonSymbol = {
      type: "simple-fill",
      color: "red",
      outline: {
        color: [128, 128, 128, 0.5],
        width: "0.5px"
      }
    };

    let polygonGrahic = new Graphic({
      geometry: result.features[0].geometry,
      symbol: polygonSymbol,
    });
    this.graphicLayer.add(polygonGrahic);
    this.view.goTo(result.features[0].geometry)
  };

  updateTable(): void {
    const selectedObjectId = null;
    const pageNumber = 1;
    const pageSize = 10;

    this.showPointTable(selectedObjectId, pageNumber, pageSize);
  }



  showPointTable(selectedObjectId: number | null, pageNumber: number = 1, pageSize: number = 10) {
    this.showPoint = true;
    this.showLine = false;
    this.showPolygon = false;
    this.getDatas(selectedObjectId, pageNumber, pageSize).then(result => {
      this.geoJsons = result;
      this.total = 166;
      this.pageNumber = pageNumber;
      this.pageSize = pageSize;
      console.log(this.geoJsons);
    }).catch(error => {
      console.error(error);
    });
  };

  showLineTable(selectedObjectId: number | null, pageNumber: number = 1, pageSize: number = 10) {
    this.showPoint = false;
    this.showLine = true;
    this.showPolygon = false;
    this.getLine(selectedObjectId, pageNumber, pageSize).then(result => {
      this.line = result;
      console.log(this.line);

    }).catch(error => {
      console.error(error);
    });

  };

  showPolyTable() {
    this.showPoint = false;
    this.showLine = false;
    this.showPolygon = true;
    this.getPolygon().then(result => {
      this.polygon = result;
      console.log(this.polygon);

    }).catch(error => {
      console.error(error);
    });
  };



  async getDatas(selectedObjectId: number | null, pageNumber: number, pageSize: number): Promise<any> {
    let url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer/0/query";
    let whereClause = selectedObjectId ? `objectid = ${selectedObjectId}` : "1=1";
    if (pageNumber > 1) {
      whereClause += ` AND OBJECTID > ${pageSize * (pageNumber - 1)}`;
    }

    let query: any = {
      responseType: 'json',
      query: {
        f: 'json',
        where: whereClause,
        returnCountOnly: false,
        outFields: '*',
        returnGeometry: true,
        orderByFields: 'OBJECTID',
        resultOffset: (pageNumber - 1) * pageSize,
        resultRecordCount: pageSize
      },
    }
    const response = await esriRequest(url, query);
    return response.data.features;
  };

  async getLine(selectedObjectId: number | null, pageNumber: number, pageSize: number): Promise<any> {
    let url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer/1/query";

    let whereClause = selectedObjectId ? `objectid = ${selectedObjectId}` : "1=1";
    if (pageNumber > 1) {
      whereClause += ` AND OBJECTID > ${pageSize * (pageNumber - 1)}`;
    }

    let query: any = {
      responseType: 'json',
      query: {
        f: 'json',
        where: whereClause,
        returnCountOnly: false,
        outFields: '*',
        returnGeometry: true,
        orderByFields: 'OBJECTID',
        resultOffset: (pageNumber - 1) * pageSize,
        resultRecordCount: pageSize
      },
    }
    const response = await esriRequest(url, query);
    return response.data.features;

  };


  async getPolygon(): Promise<any> {
    let url = "https://sampleserver6.arcgisonline.com/arcgis/rest/services/Wildfire/MapServer/2/query";

    let query: any = {
      resposeType: 'json',
      query: {
        f: 'json',
        where: '1=1',
        returnCountOnly: false,
        outFields: '*',
        returnGeometry: true,
      },
    }
    const response = await esriRequest(url, query);
    return response.data.features;

  }

  title = 'gis';
}
