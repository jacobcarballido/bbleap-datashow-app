import { Component } from '@angular/core';
import { PlotlyModule } from 'angular-plotly.js';
import moment from 'moment';
import * as PlotlyJS from 'plotly.js-dist-min';

PlotlyModule.plotlyjs = PlotlyJS;

@Component({
  selector: 'app-csvloader',
  standalone: true,
  imports: [PlotlyModule],
  templateUrl: './csvloader.component.html',
  styleUrl: './csvloader.component.css'
})
export class CsvloaderComponent {

  vehicleDisplacement = "vehicleDisplacement";
  useFileSpeed = true;
  useLines = false;
  orientation=1;
  simulatedSpeed_kmh = 2;
  dataObject :any[] = [];

  public updateSpeed(val:any)
  {
    this.simulatedSpeed_kmh = val.target.value;
    if(!this.useFileSpeed) this.redrawChart();
  }

  public async loadFile(file:any)
  {
    if(file.files && file.files[0])
    {
      this.readText(await file.files[0].text());
    }
  };

  readText(text:any)
  {
    let distance = 0;
    let lines = [];
    let line = [];
    let field :any= "";
    //headers
    let fillingHeaders = true;
    let headers = [];
    let propertyCntMax = 0;
    let propertyCnt = 0;
    
    let dataPoint : any = {};

    for (let index = 0; index < text.length; index++) {
      if(text[index] == "\n"){
        if(fillingHeaders)
        {
          headers.push(field)
          fillingHeaders = false;
          propertyCntMax++;
        }else{
          //line.push(field);
          //lines.push(line);
          //line = [];
          dataPoint[headers[propertyCnt++]]=field;
          propertyCnt = 0;
          this.dataObject.push(dataPoint);
          dataPoint = {};
        }
        field = "";
        continue;
      }
      if(text[index] == ";" || text[index] == ",")
      {
          // if(field.indexOf("T#")>-1)
          // {
          //   //field =  moment(field, "T#HHMMSSMS").toString();
          //   distance += 100;
          //   line.push(distance);
          // }
          if(fillingHeaders)
          {
            headers.push(field)
            propertyCntMax++;
          }else{
            //line.push(field);
            dataPoint[headers[propertyCnt++]]=field;
          }
          field="";
          continue;
      }
      field += text[index];               
    } 

    this.dataObject.forEach((dataPoint,idx)=>{

      ////////////////
      //add lidar   
      ////////////////
      for(let i=1; i<12; i++)
      {
        dataPoint["Lidar_mm_x_"+i] = dataPoint["Lidar_mm_"+i] * Math.cos((i-6)*8*Math.PI/180);
        dataPoint["Lidar_mm_y_"+i] = dataPoint["Lidar_mm_"+i] * Math.sin((i-6)*8*Math.PI/180); 
      }
    })    

   this.redrawChart();

    
  };

  redrawChart()
  {
    if(!this.dataObject.length)return;

    let markers = "markers";
    if(this.useLines) markers = 'lines+markers';

    //add all x points
    let points_lidar :any =   {x:[],y:[],z:[],power:[]};
    let points_baumer :any =  {x:[],y:[],z:[],power:[]};
    let points_ifm :any =     {x:[],y:[],z:[],power:[]};
    let points_sick :any =    {x:[],y:[],z:[],power:[]};
    let points_sensorsPos :any =    {x:[],y:[],z:[],power:[]};

    let distance_mm = 0;

    
    this.dataObject.forEach((dataPoint,idx)=>{

      ////////////////
      //add lidar   
      ////////////////
      for(let i=1; i<12; i++)
      {       
        points_lidar.x.push(distance_mm);
        switch(this.orientation)
        {
          case 1:
            points_lidar.y.push(dataPoint["Lidar_mm_y_"+i]);
            points_lidar.z.push(-dataPoint["Lidar_mm_x_"+i]);
            break;

          case 2:
            points_lidar.y.push(-dataPoint["Lidar_mm_x_"+i]);
            points_lidar.z.push(-dataPoint["Lidar_mm_y_"+i]);
            break;

          case 3:
            points_lidar.y.push(dataPoint["Lidar_mm_x_"+i]);
            points_lidar.z.push(dataPoint["Lidar_mm_y_"+i]);
            break;
        }      
       
        points_lidar.power.push(dataPoint["Lidar_Echo_" + i]);
      }

      //add Baumer
      points_baumer.x.push(distance_mm);
     
      points_baumer.power.push(dataPoint["BAU_ground_conf"]);
      points_baumer.x.push(distance_mm);
    
      points_baumer.power.push(dataPoint["BAU_crop_conf"]);
      switch(this.orientation)
        {
          case 1:
            points_baumer.y.push(0);
            points_baumer.z.push(-dataPoint["BAU_ground_mm"]);
            points_baumer.y.push(0);
            points_baumer.z.push(-dataPoint["BAU_crop_mm"]);
            break;

          case 2:
            points_baumer.z.push(0);
            points_baumer.y.push(-dataPoint["BAU_ground_mm"]);
            points_baumer.z.push(0);
            points_baumer.y.push(-dataPoint["BAU_crop_mm"]);
            break;

          case 3:
            points_baumer.z.push(0);
            points_baumer.y.push(dataPoint["BAU_ground_mm"]);
            points_baumer.z.push(0);
            points_baumer.y.push(dataPoint["BAU_crop_mm"]);
            break;
        }      

      //add IFM
      for(let i=0; i<10; i++)
      {
        //points_ifm.x.push(dataPoint["IFM_Z_mm_"+i] + distance_mm);
        points_ifm.x.push(distance_mm);
        
        points_ifm.power.push(dataPoint["IFM_dB_" + i]);
        switch(this.orientation)
        {
          case 1:
            points_ifm.y.push(dataPoint["IFM_Y_mm_"+i]);
            points_ifm.z.push(-dataPoint["IFM_X_mm_"+i]);
            break;

          case 2:
            points_ifm.z.push(-dataPoint["IFM_Y_mm_"+i]);
            points_ifm.y.push(-dataPoint["IFM_X_mm_"+i]);
            break;

          case 3:
            points_ifm.z.push(dataPoint["IFM_Y_mm_"+i]);
            points_ifm.y.push(dataPoint["IFM_X_mm_"+i]);
            break;
        }      
      }

      ///////////////////////////////
      ///  Sensors/zero position  ///
      ///////////////////////////////
      points_sensorsPos.z.push(0);
      points_sensorsPos.y.push(0);
      points_sensorsPos.x.push(distance_mm);

      if(this.useFileSpeed)
      {
        distance_mm += dataPoint["iSpeed_mm_s"] * 0.1;
      }else{
        distance_mm += this.simulatedSpeed_kmh*1000/3.6 * 0.1;
      }
    })    


    this.graph.data = [];


    let dataLidar = {
      x:points_lidar.x, y: points_lidar.y, z: points_lidar.z,
      mode: markers,
      name:'Lidar',
      marker: {
        size: 5,
        // line: {
        // color: 'rgba(217, 217, 217, 0.8)',
        // width: 0.2},
        opacity: 0.9},
      //color: points_lidar.power,
      type: 'scatter3d'
    };
    this.graph.data.push(dataLidar);

    
    let dataBaumer = {
      x:points_baumer.x, y: points_baumer.y, z: points_baumer.z,
      mode: markers,
      name: 'Baumer',
      marker: {
        size: 5,
        // line: {
        // color: 'rgba(217, 217, 217, 0.8)',
        // width: 0.2},
        opacity: 0.9},
      type: 'scatter3d'
    };
    this.graph.data.push(dataBaumer);

    let dataIfm = {
      x:points_ifm.x, y: points_ifm.y, z: points_ifm.z,
      mode: markers,
      name: 'IFM',
      marker: {
        size: 5,
        // line: {
        // color: 'rgba(217, 217, 217, 0.8)',
        // width: 0.2},
        opacity: 0.9},
      type: 'scatter3d'
    };
    this.graph.data.push(dataIfm);

    let sensor = {
      x:points_sensorsPos.x, y: points_sensorsPos.y, z: points_sensorsPos.z,
      mode: markers,
      name: 'Sensors',
      marker: {
        size: 5,
        // line: {
        // color: 'rgba(217, 217, 217, 0.8)',
        // width: 0.2},
        opacity: 0.9},
      type: 'scatter3d'
    };
    this.graph.data.push(sensor);
  }

  unpack(lines:any[], name:string)
  {
    let packet = [];
    lines.forEach(l=>{
      if(l[name])packet.push(l[name]);
    })
  }

  public graph : any = {
    data:[]
  };
}
