import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Inject} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigatorService } from 'src/app/services/navigator.service';
import { EndpointService } from 'src/app/services/endpoint.service';
import { FormControl, Validators, FormBuilder, FormGroup, FormArray } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogClose, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GoalComponent } from '../../goal/goal.component';
import { GrafComponent } from '../graf/graf.component';
import { Goal } from 'src/app/models/goal';
import { Observable } from 'rxjs';
import {distinct, map, startWith} from 'rxjs/operators';
import { DataSet } from "vis-data/peer/esm/vis-data";
import { Network } from "vis-network/peer/esm/vis-network";
import {MatFormFieldModule} from '@angular/material/form-field'; 
import { MatInputModule } from '@angular/material/input';

//import * as vis from 'visjs';
//import * as vis from 'dist/vis-network.min.js';
//import { Network, DataSet } from "vis-network";
//import * as vis  from "vis-network";
//import * as vis from 'vis-network';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  public edit = false;
  @ViewChild('treeContainer', { static: true }) treeContainer: ElementRef;
  @ViewChild("compGraf", { static: true }) graf: ElementRef;

  @Input() id;
  public nooodes;
  public edgeees;
  public container;
  public data;
  public options;
  public network;
  public map;
  public loaded = false;
  public nameFormControl: FormControl;
  public idFormControl: FormControl;
  public goalFormControl: FormControl;
  public intention;
  public goalsFilter: Observable<string[]>;
  public pruebas;





  


  //Sample test data it can be dynamic as well.
  QuestionsForSubmittedAnswersArray: any[] = [
    {
      Goal: '',
      Strategy: '',
      Target: 'Stop',
    }
  ];

  FeedBack!: FormGroup;



  constructor(
    public navigatorService: NavigatorService,
    private router: Router,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private endpointService: EndpointService,
    private http: HttpClient,
    private _snackBar: MatSnackBar,
    public formBuilder: FormBuilder,
    public dialogs: MatDialog
  ) {  }


 

  ngOnInit(): void {
    this.id = this.route.snapshot.paramMap.get('id')!;
    //this.iniciar_test();
    this.createContactForm();
    this.sampleData();
    if(this.id !== undefined && this.id !== null &&  this.id !== "") {
      console.log(this.id);
      this.endpointService.getMap(this.id).subscribe(data => {
        if(data['error'] === undefined) this.map = this.parseMap(data);
        else {
          this.edit = true;
          this.map = new Map(null);
          this.loadFormControls();
          this.navigatorService.allowChange = false;
        }
        console.log(this.map);
        this.loadFormControls();
        this.loaded = true;
        
      })
    } else {
      this.map = new Map(null);
      this.edit = true;
      this.loadFormControls();
      this.loaded = true;
      this.navigatorService.allowChange = false;
      

    }

    



  }


  

  createContactForm() {
    this.FeedBack = this.formBuilder.group({
      Rows: this.formBuilder.array([this.initRows()]),
    });
  }

  initRows() {
    return this.formBuilder.group({
      Goal: ['Start'],
      Strategy: [''],
      Target: [''],
    });
  }

  get formArr() {
    return this.FeedBack.get('Rows') as FormArray;
  }
  
  sampleData() {
    this.QuestionsForSubmittedAnswersArray.forEach((row) => {
      this.formArr.push(this.addRow(row));
    });
  }

addRow(obj) {
    return this.formBuilder.group({
      Goal: [obj.Goal],
      Strategy: [obj.Strategy],
      Target: [obj.Target],
    });
  }

  addNewRow() {
    let obj1 = {
      Goal: '',
      Strategy: '',
      Target: 'Stop',
    };
    this.formArr.push(this.addRow(obj1));
  }


  deleteRow(index: number) {
    this.formArr.removeAt(index);
  }


  private parseMap(data) {
    this.edit = false;
    return data;
  }

  private loadFormControls() {
    this.nameFormControl = new FormControl({value: this.map.name, disabled: !this.edit}, Validators.required);
    this.nameFormControl.valueChanges.subscribe(value => {
      this.navigatorService.allowChange = true;
      this.map.name = value;
    })
    this.idFormControl = new FormControl({value: this.map.id, disabled: !this.edit}, Validators.required);
    this.idFormControl.valueChanges.subscribe(value => {
      this.navigatorService.allowChange = true;
      this.map.id = value;
    })
    
    
    if(this.intention !== undefined && this.intention !== null)
      this.goalFormControl = new FormControl(this.intention.name, Validators.required)
    else this.goalFormControl = new FormControl('', Validators.required)
    this.goalsFilter = this.goalFormControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value || '')),
    );
    
  }
  
  private _filter(value) {
    return this.navigatorService.goalList.filter(goal => goal.name.toLowerCase().includes(value.toLowerCase()))
  }




  public stringifyName() {

    let body = {id: this.map.id, name: this.map.name, author:'felix'};
    console.log(body);
    
    return body;
  }



  public borraMap(){
  if(confirm("Are you sure you want to delete this map?")) {
  console.log(this.id);
  this.navigatorService.allowChange = false;
  this.endpointService.deleteMap(this.id).subscribe( data => {
      this.navigatorService.refreshMapList();
      this.router.navigate(['/map']);
      this._snackBar.open("Map deleted!", 'X', {duration: 3000, panelClass: ['green-snackbar']});
    })
    this.navigatorService.refreshMapList();
    return true;
  }
}


public async submitFinal(){


  var tamany = this.FeedBack.value.Rows.length;

  this.FeedBack.value.id = this.map.id;
  this.FeedBack.value.name = this.map.name;
  this.FeedBack.value.author = 'felix';


  //this.navigatorService.allowChange = true;
  let body = this.stringifyMap();
    
   this.endpointService.addMap(body).subscribe(async data => {
        //console.log("data", data)
        //this.map.id = data.id;
        //console.log(this.map)
        this.navigatorService.refreshMapList();
        this._snackBar.open("Map added!", 'X', {duration: 3000, panelClass: ['green-snackbar']});
        console.log(data.id);
        this.router.navigate(['/map', data.id]);
    })
        //this.navigatorService.refreshMapList();
        //this.router.navigate(['/map', this.map.id]);  
        console.log('creacio map completa')    
    //return true;
  
}


public stringifyMap() {
  let body = {name: this.map.name, id: this.map.id, pruebas: '[{"x": -100.0, "y": 0.0, "id": "Start", "name": "Start"}, {"x": 200.0, "y": 0.0, "id": "Stop", "name": "Stop"}]'};
  return JSON.stringify(body);
}



public nada(){
console.log('aaa');
}

public openGoalDialog() {
  const dialogRef = this.dialog.open(GoalComponent, {
    width: '1000px',
  });
  dialogRef.afterClosed().subscribe(result => {
    this.navigatorService.refreshGoalList();
  });
}

public intentionSelected(event) {
  this.edit = true;
  let index = this.navigatorService.goalList.findIndex(goal => goal.name == event.option.value)
  if(index !== -1) this.intention = new Goal(this.navigatorService.goalList[index]['id'], event.option.value)
}
 







public openEditMapDialog() {
  const dialogRef = this.dialogs.open(UpdateMapDialog, {
    width: '500px',
    data: {id: this.map.id}
  })
  dialogRef.afterClosed().subscribe(result => {
    
  })
} 




public async submitMap(){

  let body = this.stringifyMap();
  console.log('Datos del mapaaaaa:')
  console.log(!isNaN(this.map.id));
  
if(this.map.id != undefined && this.map.name != undefined ){
  if(!isNaN(this.map.id)){
    if(this.map.id.trim().length != 0 && this.map.name.trim().length != 0 ){
      await this.endpointService.addMap(body).subscribe(data => {
        console.log("data", data);
        console.log(data);
        console.log('id del mapa:');
        console.log(this.map.id);
        if(data.id == 0){
          this._snackBar.open("Map added!", 'X', {duration: 3000, panelClass: ['green-snackbar']});
          this.navigatorService.refreshMapList();
          this.crea_elements_map();
          
        }else{
          console.log('creacio mapa retorna error');
          this._snackBar.open("Map ID already exists", 'X', {duration: 3000, panelClass: ['green-snackbar']});
        }
        console.log('creacio map completa') 
        
    })
    }else{
      this._snackBar.open("Error! ID and Name cannot be empty", 'X', {duration: 3000, panelClass: ['blue-snackbar']});
    }
  }else{
    this._snackBar.open("Error! ID has to be numerical", 'X', {duration: 3000, panelClass: ['blue-snackbar']});
  }
  }else{
    this._snackBar.open("Error! Introduce ID and Name", 'X', {duration: 3000, panelClass: ['blue-snackbar']});
  }

           
}


public async crea_elements_map(){
  var real_elements : any = [];
  console.log('entra a crear_elements');
  let data1 = {id: this.map.id, name: 'Start', map: this.map.id, x: '-100.0', y: '0.0'};
  await this.endpointService.addNewGoal(data1).subscribe(async data => {
    console.log('arriba a goal1');
    console.log(data['id']);

    let data2 = {id: this.map.id, name: 'Stop', map: this.map.id, x: '200.0', y: '0.0'};
    await this.endpointService.addNewGoal(data2).subscribe(dataa => {
    console.log(dataa['id']);
    this.router.navigate(['/map', this.map.id]);
  });
  });

  

  //this.router.navigate(['/map', this.map.id]);
  
}




}




@Component({
  selector: 'update-map-dialog',
  templateUrl: './update-map-dialog.html',
  styleUrls: ['./update-map-dialog.html']
})
export class UpdateMapDialog {
  @ViewChild("noumap_name", { static: true }) noumapname: ElementRef;
  constructor(
    public dialogRef: MatDialogRef<UpdateMapDialog>,
    @Inject(MAT_DIALOG_DATA) public data,
    public endpointService: EndpointService,
    public navigatorService: NavigatorService,
    private _snackBar: MatSnackBar,
    private router: Router,
    
  ) {}

  public name: String = '';

  public updateMapName() {
    if(this.noumapname.nativeElement.value.trim().length > 0){
      let body = {name: this.noumapname.nativeElement.value}
      this.endpointService.updateMap(this.data.id, body).subscribe(data => {
        this.navigatorService.refreshMapList();
        this.router.navigate(['/map/' + this.data.id]);
      })
      console.log('El map a modificar es el: ');
      console.log(this.data.id);
      console.log('El nou nom es: ');
      console.log(this.noumapname.nativeElement.value);
    }else{
      this._snackBar.open("Invalid name", 'X', {duration: 2000, panelClass: ['red-snackbar']});
    }
    this.closeDialog(true)
  }

  closeDialog(reload = false): void {
    this.dialogRef.close(reload ? 1 : 2);
  }
}


