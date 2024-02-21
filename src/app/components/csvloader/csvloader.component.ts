import { Component } from '@angular/core';
import { PlotlyModule } from 'angular-plotly.js';
import moment from 'moment';
import * as PlotlyJS from 'plotly.js-dist-min';
import { max, mean, min, std, sum } from "mathjs";
import { isNumber } from '@ng-bootstrap/ng-bootstrap/util/util';

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
  clipYmm:number=99999;


  public updateSpeed(val:any)
  {
    this.simulatedSpeed_kmh = val.target.value;
    if(!this.useFileSpeed) this.redrawChart();
  }
  public updateClip(val:any)
  {
    this.clipYmm = val.target.value;
    this.redrawChart();
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
    this.dataObject = [];
    
    let dataPoint : any = {};

    for (let index = 0; index < text.length; index++) {
      if(text[index] == "\n"){
        if(fillingHeaders)
        {
          headers.push(field)
          fillingHeaders = false;
          propertyCntMax++;
        }else{
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
          if(fillingHeaders)
          {
            headers.push(field)
            propertyCntMax++;
          }else{
            if(!isNaN(Number(field)))
            {dataPoint[headers[propertyCnt++]]=field;
            } else{
              dataPoint[headers[propertyCnt++]]="-";
            }

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
        if(dataPoint["Lidar_mm_"+i] != 65535 && dataPoint["Lidar_mm_"+i] != "-")
        {
          dataPoint["Lidar_mm_x_"+i] = dataPoint["Lidar_mm_"+i] * Math.cos((i-6)*8*Math.PI/180);
          dataPoint["Lidar_mm_y_"+i] = dataPoint["Lidar_mm_"+i] * Math.sin((i-6)*8*Math.PI/180); 
        }
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
    let points_lidar :any =   {x:[],y:[],z:[],power:[],colorRaw:[]};
    let points_baumer :any =  {x:[],y:[],z:[],power:[],colorRaw:[]};
    let points_ifm :any =     {x:[],y:[],z:[],power:[],colorRaw:[]};
    let points_sick :any =    {x:[],y:[],z:[],power:[],colorRaw:[]};
    let points_sensorsPos :any =    {x:[],y:[],z:[],power:[]};

    let distance_mm = 0;
    
    this.dataObject.forEach((dataPoint,idx)=>{

      ////////////////
      //add lidar   
      ////////////////

     

      let idxZ = 0;
      for(let i=1; i<12; i++)
      {       
        if(dataPoint["Lidar_mm_y_"+i] == undefined || dataPoint["Lidar_mm_y_"+i] == undefined)continue;

        if( Number(dataPoint["Lidar_mm_y_"+i]) > this.clipYmm ||
            Number(dataPoint["Lidar_mm_x_"+i]) > this.clipYmm ||
            Number(dataPoint["Lidar_mm_y_"+i]) < -this.clipYmm ||
            Number(dataPoint["Lidar_mm_x_"+i]) < -this.clipYmm  )
        {
          continue;
        }      
       
        points_lidar.x.push(distance_mm);      

        switch(this.orientation)
        {
          case 1:
            points_lidar.y.push(dataPoint["Lidar_mm_y_"+i]);
            points_lidar.z.push(-dataPoint["Lidar_mm_x_"+i]);
            points_lidar.colorRaw.push( -dataPoint["Lidar_mm_x_"+i]);
            break;

          case 2:
            points_lidar.y.push(-dataPoint["Lidar_mm_x_"+i]);
            points_lidar.z.push(-dataPoint["Lidar_mm_y_"+i]);            
            points_lidar.colorRaw.push(-dataPoint["Lidar_mm_x_"+i]);
            break;

          case 3:
            points_lidar.y.push(dataPoint["Lidar_mm_x_"+i]);
            points_lidar.z.push(dataPoint["Lidar_mm_y_"+i]);
            points_lidar.colorRaw.push( dataPoint["Lidar_mm_y_"+i]);
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
        if(dataPoint["IFM_X_mm_"+i] == "-" || dataPoint["IFM_Y_mm_"+i] == "-") continue;

        if( Number(dataPoint["IFM_Y_mm_"+i]) > this.clipYmm ||
            Number(dataPoint["IFM_X_mm_"+i]) > this.clipYmm ||
            Number(dataPoint["IFM_Y_mm_"+i]) < -this.clipYmm ||
            Number(dataPoint["IFM_X_mm_"+i]) < -this.clipYmm  )
        {
          continue;
        }     

        //points_ifm.x.push(dataPoint["IFM_Z_mm_"+i] + distance_mm);
        points_ifm.x.push(distance_mm);
        
        points_ifm.power.push(dataPoint["IFM_dB_" + i]);
        switch(this.orientation)
        {
          case 1:
            points_ifm.y.push(dataPoint["IFM_Y_mm_"+i]);
            points_ifm.z.push(-dataPoint["IFM_X_mm_"+i]);
            points_ifm.colorRaw.push(-dataPoint["IFM_X_mm_"+i]);
            break;

          case 2:
            points_ifm.z.push(-dataPoint["IFM_Y_mm_"+i]);
            points_ifm.y.push(-dataPoint["IFM_X_mm_"+i]);
            points_ifm.colorRaw.push(-dataPoint["IFM_X_mm_"+i]);
            break;

          case 3:
            points_ifm.z.push(dataPoint["IFM_Y_mm_"+i]);
            points_ifm.y.push(dataPoint["IFM_X_mm_"+i]);
            points_ifm.colorRaw.push(dataPoint["IFM_X_mm_"+i]);
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
        distance_mm += Number(dataPoint["iSpeed_mm_s"]) * 0.1;
      }else{
        distance_mm += this.simulatedSpeed_kmh*1000/3.6 * 0.1;
      }
    })    


    ////////////////////
    /// LIDAR COLOR CAL
    ////////////////////

    let maxValue = -999999;
    let minValue = 999999;
    points_lidar.color = [];
    points_lidar.colorRaw.forEach((y:any,indx:number)=>
    {
      if (y!=0 && y>maxValue)maxValue = y;
      if (y!=0 && y<minValue)minValue = y;
    })
    points_lidar.colorRaw.forEach((y:any,indx:number)=>
      {
        points_lidar.color.push(this.getColorScaled(y,maxValue,minValue));
      }
    )

    /////////////////
    /// IFM COLOR CAL
    /////////////////

    maxValue = -999999;
    minValue = 999999;
    points_ifm.color = [];
    points_ifm.colorRaw.forEach((y:any,indx:number)=>
    {
      if (y!=0 && y>maxValue)maxValue = y;
      if (y!=0 && y<minValue)minValue = y;
    })
    points_ifm.colorRaw.forEach((y:any,indx:number)=>
      {
        points_ifm.color.push(this.getColorScaled(y,maxValue,minValue));
      }
    )

    this.graph.data = [];
    let type2 = "surface";
    let type = "scatter3d";
    let dataLidar = {
      x: points_lidar.x, 
      y: points_lidar.y, 
      z: points_lidar.z,
      //color : points_lidar.elements,
      //color_discrete_sequence : points_lidar.color,
      //surfaceaxis: 2,
      //surfacecolor: 'rgba(0,255,0,0.5)',
      mode: markers,
      name:'Lidar',
      marker: {
        size: 5,
        // line: {
        color: points_lidar.color,
        // width: 0.2},
        opacity: 0.9},
      //color: points_lidar.power,
      type: type
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
      type: type
    };
    //this.graph.data.push(dataBaumer);

    let dataIfm = {
      x:points_ifm.x, y: points_ifm.y, z: points_ifm.z,
      mode: markers,
      name: 'IFM',
      marker: {
        size: 5,
        // line: {
          color: points_ifm.color,
        // width: 0.2},
        opacity: 0.9},
      type: type
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
      type: type
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
    data:[],
    layout: {height: 800}
  };

  private getColorScaled(val:number,valMax:number,valMin:number)
  {
    let value = (val - valMin) / (valMax - valMin);
    const initColor = this.hexToRgb('#eb4034');
    const centerColor = this.hexToRgb('#f0ec1d');
    const endColor = this.hexToRgb('#51f211');
    return this.findColorBetween(value, initColor, centerColor, endColor);
  }

  hexToRgb(hex: string): any {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  findColorBetween(percentage: number, left: rgb, midle: rgb, right: rgb): string {
    if (percentage < 0) percentage = 0;
    var newColor = { r: 0, g: 0, b: 0, a: 255 };
    var init = { r: 0, g: 0, b: 0 };
    var end = { r: 0, g: 0, b: 0 };
    if (percentage < 0.5) {
      init = left;
      end = midle;
      percentage *= 2;
    }
    else {
      init = midle;
      end = right;
      percentage = (percentage - 0.5) * 2;
    }
    newColor.r = Math.round(init.r + (end.r - init.r) * percentage);
    newColor.g = Math.round(init.g + (end.g - init.g) * percentage);
    newColor.b = Math.round(init.b + (end.b - init.b) * percentage);
    return 'rgba('+ newColor.r +','+ newColor.g +','+ newColor.b +',1)';
  }

  isNumeric(str:any) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(Number(str)) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }
}
export interface rgb {
  r: number, g: number, b: number
}