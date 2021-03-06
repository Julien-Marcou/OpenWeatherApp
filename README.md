OpenWeatherApp
===========

A sample Open Source Weather application.

Set-up
-----------

The app uses the [OpenWeatherMap](http://openweathermap.org/) API.  
You'll need to add your own API Key into the file `www/js/app.js` in order to make it works.

How to build
-----------

**Apache Cordova** + **Compass** need to be installed on your computer in order to continue.

This repository is an Apache Cordova project, missing folders and dependencies will be automatically downloaded and installed when you add a destination platform.

To compile the SCSS to CSS, execute this line from the `www` folder

```
compass watch
```

To generate the application for a new platform (like Android), execute these lines from the root folder

```
cordova platform add android
cordova build android
```

Screenshots
-----------

![OpenWeatherApp New Weather Place Page](https://raw.githubusercontent.com/Julien-Marcou/OpenWeatherApp/master/screenshots/NewWeatherPlace.jpg)

![OpenWeatherApp Weather Previews Page](https://raw.githubusercontent.com/Julien-Marcou/OpenWeatherApp/master/screenshots/WeatherPreviews.jpg)

![OpenWeatherApp Weather Forecast Page](https://raw.githubusercontent.com/Julien-Marcou/OpenWeatherApp/master/screenshots/WeatherForecast.jpg)
