import { Component, ViewChild, ElementRef, OnInit } from '@angular/core';
import { NavController, Platform } from '@ionic/angular';
import { Geolocation } from '@ionic-native/geolocation/ngx';
import { filter } from 'rxjs/operators';
import { Storage } from '@ionic/storage-angular';
import { Subscription } from 'rxjs';
declare var google;

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {


  @ViewChild('map') mapElement: ElementRef;
  map: any;
  currentMapTrack = null;
  isTracking = false;
  trackedRoute = [];
  previousTracks = [];
  positionSubscription: Subscription
  constructor(
    public navCtrl: NavController,
    private plt: Platform,
    private geolocation: Geolocation,
    private storage: Storage
  ) { }

  ngOnInit() {
    this.ionViewDidLoad();
  }

  ionViewDidLoad() {
    this.plt.ready().then(() => {
      //this.loadHistoricRoutes();
      let mapOptions = {
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      }
      this.map = new google.maps.Map(this.mapElement.nativeElement, mapOptions);
      this.geolocation.getCurrentPosition().then(pos => {
        let latLng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        this.map.setCenter(latLng);
        this.map.setZoom(16);
      }).catch((error) => {
        console.log('Error getting location', error)
      })
    })
  }
  loadHistoricRoutes() {
    this.storage.get('routes').then(data => {
      if (data) {
        this.previousTracks = data;
      }
    });
  }

  startTracking() {
    this.isTracking = true;
    this.trackedRoute = [];

    this.positionSubscription = this.geolocation.watchPosition()
      .pipe(
        filter((p) => p['coords'] !== undefined) //Filter Out Errors
      )
      .subscribe(data => {
        setTimeout(() => {
          this.trackedRoute.push({ lat: data['coords'].latitude, lng: data['coords'].longitude });
          //this.redrawPath(this.trackedRoute);
        }, 0);
      });

  }
  redrawPath(path) {
    if (this.currentMapTrack) {
      this.currentMapTrack.setMap(null);
    }

    console.log(path.length)
    if (path.length > 1) {
      this.currentMapTrack = new google.maps.Polyline({
        path: path,
        geodesic: true,
        strokeColor: '#ff00ff',
        strokeOpacity: 1.0,
        strokeWeight: 3
      });
      this.currentMapTrack.setMap(this.map);
    }
  }
  stopTracking() {
    let newRoute = { finished: new Date().getTime(), path: this.trackedRoute };
    this.previousTracks.push(newRoute);
    //this.getKmRoute(this.trackedRoute);
    //this.storage.set('routes', this.previousTracks);
   
    this.isTracking = false;
    this.positionSubscription.unsubscribe();
    this.redrawPath(this.trackedRoute)
    //this.currentMapTrack.setMap(null);

  }
  getKmRoute(route) {
    let result: any;
    console.log(route);
    for (let index = 0; index <= route.length - 2; index++) {
      const firstCoordinate = route[index];
      const secondCoordinate = route[index + 1];
      result = result + this.getDistanceFromLatLonInKm(firstCoordinate.lat, firstCoordinate.lng,  secondCoordinate.lat, secondCoordinate.lng);
      console.log('result ' + result);
    }
  }
   
  showHistoryRoute(route) {
    this.redrawPath(route);
  }
  getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = this.deg2rad(lat2-lat1);  // deg2rad below
    var dLon = this.deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c; // Distance in km
    console.log(d);
    return d;
  
  }
  deg2rad(deg) {
    return deg * (Math.PI/180)
  }
  

}
