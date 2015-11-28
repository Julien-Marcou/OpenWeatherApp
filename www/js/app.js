"use strict";

(function($) {

	var API_KEY = 'YOUR_OPENWEATHERMAP_APPID';

	// Data
	var weatherPlaces = [];
	var weatherData = [];
	var currentPage = 2;
	var currentPlaceId = null;

	// Global app
	var $refreshButton = $('#refreshWeatherData');
	var $body = $('.body');
	var $page = $('.page');

	// Template elements
	var weatherPreviewWrapper = $('#weatherPreviewWrapper').html();
	var weatherPreviewContent = $('#weatherPreviewContent').html();
	var weatherForecastWrapper = $('#weatherForecastWrapper').html();
	var weatherForecastTitle = $('#weatherForecastTitle').html();
	var weatherForecastError = $('#weatherForecastError').html();
	var weatherForecastContent = $('#weatherForecastContent').html();

	// "New weather place" page
	var $newWeatherPlaceForm = $('#newWeatherPlacePage');
	var $definedLocation = $('#definedLocation');
	var $useMyLocation = $('#useMyLocation');
	var $todayPreview = $('#todayPreview');
	var $tomorrowPreview = $('#tomorrowPreview');

	// "Weather previews" page
	var $weatherPreviews = $('#weatherPreviewsPage .content');
	var $addAPlace = $('#addAPlace');
	var $clearAllPlaces = $('#clearAllPlaces');

	// "One place" page
	var $weatherForecasts = $('#weatherForecastsPage .content');
	var $weatherForecastsViewport = $('#weatherForecastsPage .viewport');
	var $backToPreviews = $('#backToPreviews');
	var $removePlace = $('#removePlace');




	function getTemperature(temperature) {
		return Math.round(temperature);
	}

	function getWind(wind) {
		return Math.round(wind * 3.6); // 1 m/s <=> 3.6 km/h
	}

	function getWeatherClass(isDaylight, weather) {
		// See : http://openweathermap.org/weather-conditions
		var code = weather.id;

		// Thunderstorm
		if(code >= 200 && code <= 299) {
			return 'rain-thunder';
		}
		// Drizzle
		else if(code >= 300 && code <= 399) {
			return 'rain';
		}
		// Rain
		else if(code >= 500 && code <= 599) {
			if(code >= 500 && code <= 504) {
				return isDaylight ? 'rain-sun' : 'rain-moon';
			}
			else if(code == 511) {
				return 'snow-rain';
			}
			else {
				return 'rain';
			}
		}
		// Snow
		else if(code >= 600 && code <= 699) {
			if(code == 600 || code == 601) {
				return isDaylight ? 'snow-sun' : 'snow-moon';
			}
			else if(code >= 611 && code <= 616) {
				return 'snow-rain';
			}
			else {
				return 'snow';
			}
		}
		// Athmosphere
		else if(code >= 700 && code <= 799) {
			if(code == 701 || code == 711 || code == 721 || code == 741) {
				return 'fog';
			}
			else if(code == 731 || code == 751 || code == 761) {
				// TODO : return 'dust';
			}
			else if(code == 762) {
				// TODO : return 'volcanic-ash';
			}
			else if(code == 771) {
				return 'wind';
			}
			else if(code == 781) {
				// TODO : return 'tornado';
			}
		}
		// Clouds
		else if(code >= 800 && code <= 899) {
			if(code == 800) {
				return isDaylight ? 'sun' : 'moon';
			}
			else if(code == 801) {
				return isDaylight ? 'clouds-sun' : 'clouds-moon';
			}
			else if(code == 802) {
				return 'clouds';
			}
			else {
				return 'clouds-heavy';
			}
		}
		// Extreme (or other)
		else {
			if(code == 905 || code >= 951 && code <= 959) {
				return 'wind';
			}
			else if(code == 906) {
				return 'hail';
			}
			else if(code == 903) {
				// TODO : return 'hot-wave';
			}
			else if(code == 904) {
				// TODO : return 'cold-wave';
			}
			else if(code == 901 || code == 960 || code == 961) {
				// TODO : return 'storm';
			}
			else if(code == 900 || code == 902 || code == 962) {
				// TODO : return 'tornado';
			}
		}

		console.error('Unknown weather status !', {code: code, title: weather.main, description: weather.description});
		return 'unknown';
	}

	function recoverWeatherData(id, location, $previewWrapper, $forecastWrapper) {
		var place = weatherPlaces[id];

		$.when(
			$.get('http://api.openweathermap.org/data/2.5/weather?'+location+'&mode=json&units=metric&APPID='+API_KEY),
			$.get('http://api.openweathermap.org/data/2.5/forecast/daily?'+location+'&mode=json&units=metric&cnt=8&APPID='+API_KEY)
		)
		.done(function(accurateData, approximateData) {
			var data = {
				place: place,
				accurate: accurateData[0],
				approximate: approximateData[0],
			};
			if(data.accurate.cod == 200 && data.approximate.cod == 200) {

				var previewIsToday = data.place.preview == 'today';
				var today = new Date();
				var oneDay = 24 * 60 * 60 * 1000;
				var sunriseYesterday = new Date(data.accurate.sys.sunrise * 1000 - oneDay);
				var sunsetYesterday = new Date(data.accurate.sys.sunset * 1000 - oneDay);
				var sunriseToday = new Date(data.accurate.sys.sunrise * 1000);
				var sunsetToday = new Date(data.accurate.sys.sunset * 1000);
				var sunriseTomorrow = new Date(data.accurate.sys.sunrise * 1000 + oneDay);
				var sunsetTomorrow = new Date(data.accurate.sys.sunset * 1000 + oneDay);
				var isDaylight = (today > sunriseYesterday && today < sunsetYesterday) || (today > sunriseToday && today < sunsetToday) || (today > sunriseTomorrow && today < sunsetTomorrow);

				weatherData.push(data);

				var city = data.accurate.name;
				var country = data.accurate.sys.country;
				var date = previewIsToday ? 'Today' : 'Tomorrow';
				var temperature = getTemperature(previewIsToday ? data.accurate.main.temp : data.approximate.list[1].temp.day);
				var previewClass = getWeatherClass(isDaylight, previewIsToday ? data.accurate.weather[0] : data.approximate.list[1].weather[0]);

				$previewWrapper.removeClass('loading').html(weatherPreviewContent
					.replace('%city',        city)
					.replace('%country',     country)
					.replace('%date',        date)
					.replace('%temperature', temperature)
					.replace('%class',       previewClass)
				);
				$forecastWrapper.removeClass('loading').html(weatherForecastTitle
					.replace('%city',    city)
					.replace('%country', country)
				);

				for(var i = 0; i < 8; i++) {
					var dayDate = new Date(today.getTime() + (i * oneDay));
					var day = dayDate.getDate();
					var month = dayDate.getMonth() + 1;
					var year = dayDate.getFullYear();
					var wind = i == 0 ? getWind(data.accurate.wind.speed) : getWind(data.approximate.list[i].speed);
					var temperatureMin = i == 0 ? getTemperature(data.accurate.main.temp_min) : getTemperature(data.approximate.list[i].temp.min);
					var temperatureMax = i == 0 ? getTemperature(data.accurate.main.temp_max) : getTemperature(data.approximate.list[i].temp.max);
					var forecastClass = i == 0 ? getWeatherClass(isDaylight, data.accurate.weather[0]) : getWeatherClass(isDaylight, data.approximate.list[i].weather[0]);

					month = month < 10 ? '0'+month : month;
					day = day < 10 ? '0'+day : day;

					$forecastWrapper.append(weatherForecastContent
						.replace('%day',            day)
						.replace('%month',          month)
						.replace('%year',           year)
						.replace('%wind',           wind)
						.replace('%temperatureMin', temperatureMin)
						.replace('%temperatureMax', temperatureMax)
						.replace('%class',          forecastClass)
					);
				}
			}
			else {
				$previewWrapper.removeClass('loading').addClass('error').text('Location not found');
				$forecastWrapper.removeClass('loading').addClass('error').html(weatherForecastError
					.replace('%error', 'Location not found')
				);
			}
		})
		.fail(function() {
			$previewWrapper.removeClass('loading').addClass('error').text('Network error');
			$forecastWrapper.removeClass('loading').addClass('error').html(weatherForecastError
				.replace('%error', 'Network error')
			);
		});
	}

	function recoverGeolocation($previewWrapper, $forecastWrapper, callback) {
		if(typeof navigator.geolocation.getCurrentPosition !== 'undefined') {
			navigator.geolocation.getCurrentPosition(
				function(position) {
					$.get(
						'http://api.openweathermap.org/data/2.5/find?lat='+position.coords.latitude+'&lon='+position.coords.longitude+'&mode=json&units=metric&cnt=1&APPID='+API_KEY
					)
					.done(function(currentData) {
						callback(currentData.list[0].id);
					})
					.fail(function() {
						$previewWrapper.removeClass('loading').addClass('error').text('Network error');
						$forecastWrapper.removeClass('loading').addClass('error').html(weatherForecastError
							.replace('%error', 'Network error')
						);
					});
				},
				function(error) {
					$previewWrapper.removeClass('loading').addClass('error').text(error.message);
					$forecastWrapper.removeClass('loading').addClass('error').html(weatherForecastError
						.replace('%error', error.message)
					);
				},
				{
					timeout: 10000
				}
			);
		}
		else {
			$previewWrapper.removeClass('loading').addClass('error').text('Geolocation unavailable');
			$forecastWrapper.removeClass('loading').addClass('error').html(weatherForecastError
				.replace('%error', 'Geolocation unavailable')
			);
		}
	}

	function recoverPlaceData(id) {
		var place = weatherPlaces[id];

		var $previewWrapper = $(weatherPreviewWrapper);
		$previewWrapper.data('place-id', id);
		$weatherPreviews.append($previewWrapper);

		var $forecastWrapper = $(weatherForecastWrapper);
		$forecastWrapper.data('place-id', id);
		$weatherForecasts.append($forecastWrapper);
		if(currentPage == 3 && currentPlaceId == id) {
			$forecastWrapper.addClass('visible');
		}

		if(place.useMyLocation) {
			recoverGeolocation($previewWrapper, $forecastWrapper, function(cityId) {
				recoverWeatherData(id, 'id='+cityId, $previewWrapper, $forecastWrapper);
			});
		}
		else {
			recoverWeatherData(id, 'q='+place.definedLocation, $previewWrapper, $forecastWrapper);
		}
	}

	function recoverLocalStorageWeatherPlaces() {
		weatherPlaces = JSON.parse(localStorage.getItem('weatherPlaces')) || [];
		for(var i = 0; i < weatherPlaces.length; i++) {
			recoverPlaceData(i);
		}
	}

	function addWeatherPlace(place) {
		weatherPlaces.push(place);
		localStorage.setItem('weatherPlaces', JSON.stringify(weatherPlaces));
		recoverPlaceData(weatherPlaces.length - 1);
		buildTemplate();
	}

	function removeWeatherPlace(id) {
		weatherPlaces.splice(id, 1);
		weatherData.splice(id, 1);
		localStorage.setItem('weatherPlaces', JSON.stringify(weatherPlaces));

		$weatherForecasts.find('.forecast').filter(function() {
			if($(this).data('place-id') == id) {
				$(this).data('place-id', -1);
				$(this).children().addClass('hidden');
			}
			else if($(this).data('place-id') > id) {
				$(this).data('place-id', $(this).data('place-id') - 1);
			}
		});
		$weatherPreviews.find('.preview').filter(function() {
			if($(this).data('place-id') == id) {
				$(this).remove();
			}
			else if($(this).data('place-id') > id) {
				$(this).data('place-id', $(this).data('place-id') - 1);
			}
		});
		buildTemplate();
	}

	function clearWeatherPlaces() {
		weatherPlaces = [];
		weatherData = [];
		localStorage.removeItem('weatherPlaces');

		$weatherPreviews.children().addClass('hidden');
		$weatherForecasts.html('');
		buildTemplate();
	}

	function resetNewWeatherPlaceForm() {
		$definedLocation.val('').prop('disabled', false);
		$useMyLocation.prop('checked', false);
		$todayPreview.prop('checked', true);
	}

	function buildTemplate() {
		if(weatherPlaces.length == 0) {
			$clearAllPlaces.addClass('hidden');
			$addAPlace.addClass('button-stretch');
		}
		else {
			$clearAllPlaces.removeClass('hidden');
			$addAPlace.removeClass('button-stretch');
		}
	}

	function navigateToPage(index) {
		if($body.hasClass('hidden')) {
			$body.removeClass('hidden');
		}
		currentPage = index;
		$page.removeClass('page1 page2 page3').addClass('page'+index);
	}




	// Initialization
	{
		document.addEventListener('deviceready', function() {
			document.addEventListener('backbutton', function() {
				if(currentPage == 2) {
					navigator.app.exitApp();
				}
				else {
					navigateToPage(2);
				}
			}, false);
		}, false);


		recoverLocalStorageWeatherPlaces();
		buildTemplate();
		navigateToPage(2);

		$refreshButton.on('click', function() {
			$weatherPreviews.html('');
			$weatherForecasts.html('');
			recoverLocalStorageWeatherPlaces();
			buildTemplate();
		});
	}

	// "New weather place form" page
	{
		$useMyLocation.change(function(event) {
			$definedLocation.prop('disabled', $useMyLocation[0].checked);
		});

		$newWeatherPlaceForm.on('submit', function(event) {
			event.preventDefault();

			if(!$useMyLocation[0].checked && $definedLocation.val() == '') {
				alert("You must enter a location.");
				return false;
			}

			var newPlace = {};
			newPlace.useMyLocation = $useMyLocation[0].checked;
			newPlace.definedLocation = newPlace.useMyLocation ? '' : $definedLocation.val();
			newPlace.preview = $tomorrowPreview[0].checked ? 'tomorrow' : 'today';

			addWeatherPlace(newPlace);

			resetNewWeatherPlaceForm();
			navigateToPage(2);
		});

		$newWeatherPlaceForm.on('reset', function(event) {
			event.preventDefault();
			resetNewWeatherPlaceForm();
			navigateToPage(2);
		});
	}

	// "Weather previews" page
	{
		$weatherPreviews.on('click', '.preview', function(event) {
			var placeId = $(this).data('place-id');
			$weatherForecasts.find('.visible').removeClass('visible');
			$weatherForecasts.find('.forecast').filter(function() {
				if($(this).data('place-id') == placeId) {
					$(this).addClass('visible');
				}
			});
			$weatherForecastsViewport.scrollTop(0);
			currentPlaceId = placeId;
			navigateToPage(3);
		});

		$addAPlace.on('click', function(event) {
			navigateToPage(1);
		});

		$clearAllPlaces.on('click', function(event) {
			if(confirm('Are you sure ?')) {
				clearWeatherPlaces();
			}
		});
	}

	// "Weather forecast" page
	{
		$backToPreviews.on('click', function(event) {
			navigateToPage(2);
		});

		$removePlace.on('click', function(event) {
			if(confirm('Are you sure ?')) {
				removeWeatherPlace(currentPlaceId);
				navigateToPage(2);
			}
		});
	}

}(jQuery));
