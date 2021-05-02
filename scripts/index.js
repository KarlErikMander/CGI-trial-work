// We dont need DOM event handler because this javascript file is placed as the
// last thing in the html file so it gets loaded as the last thing making shure everything 
// else loads before javascript file

// Switch current tab to tabStart setting all the other tabs to hidden
//switchTab("tabResultDayRange")


// Global variables
var mymap;
var marker;
var dayChooser = null;
var dayRangeResults = [];
var chart;
// Initialize after content load
document.addEventListener("DOMContentLoaded", function () {
  switchTab("tabStart");
  init();
  am4core.ready(initGraph);
  initEvents();
});
/**
 * Function sets all nececary event listeners
 */
function initEvents() {
  var titleContainer = document.getElementById("titleContainer");
  var singleDay = document.getElementById("singleDay");
  var dayRangeStart = document.getElementById("dayRangeStart");
  var dayRangeEnd = document.getElementById("dayRangeEnd");
  var longitudeTextBox = document.getElementById("longitude");
  var latitudeTextBox = document.getElementById("latitude");
  var buttonStart = document.getElementById("buttonStart");
  var buttonBackToStart = document.getElementById("buttonBackToStart");
  var buttonChooseLocation = document.getElementById("buttonChooseLocation");
  var buttonBackToSetDate = document.getElementById("buttonBackToSetDate");
  var buttonCalculate = document.getElementById("buttonCalculate");
  var buttonResetSingle = document.getElementById("buttonResetSingle");
  var buttonResetRange = document.getElementById("buttonResetRange");

  // Cant pass arguments so did this
  titleContainer.addEventListener("click", function () {
    switchTab("tabStart");
  });
  buttonStart.addEventListener("click", function () {
    switchTab("tabSetDate");
  });
  buttonBackToSetDate.addEventListener("click", function () {
    switchTab("tabSetDate");
  });
  buttonBackToStart.addEventListener("click", function () {
    switchTab("tabStart");
  });

  singleDay.addEventListener("click", handleDateInputClick);
  dayRangeStart.addEventListener("click", handleDateInputClick);
  dayRangeEnd.addEventListener("click", handleDateInputClick);

  buttonChooseLocation.addEventListener("click", validateDates);
  buttonCalculate.addEventListener("click", calculateSunRiseSet);
  buttonResetSingle.addEventListener("click", reset);
  buttonResetRange.addEventListener("click", reset);
  longitudeTextBox.addEventListener("input", handleLongLatTextBoxOnChange);
  latitudeTextBox.addEventListener("input", handleLongLatTextBoxOnChange);
  // Set map click event
  mymap.on('click', onMapClick);
}

/**
 * Function that initializes necessary elements
 */
function init() {
  // Setup map
  mymap = L.map('map').setView([25, 0], 2);
  marker = L.marker()
  L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    maxZoom: 18,
    minZoom: 2,
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    accessToken: 'pk.eyJ1Ijoia2FybDU0ODkiLCJhIjoiY2tvNnd5dzN6MXFiMzJ3bHliMjZ4dzZzbCJ9.ddH1DSXiF1E7XbpPEK8D5A'
  }).addTo(mymap);
  // Set marker
  handleLongLatTextBoxOnChange();
}

/**
 * Function that initializes graph with global "dayRangeResults" data.
 * https://www.amcharts.com/demos/line-chart-with-scroll-and-zoom/?theme=moonrisekingdom
 */
function initGraph() {

  // Themes begin
  am4core.useTheme(am4themes_moonrisekingdom);
  am4core.useTheme(am4themes_animated);
  // Themes end

  // Create chart instance
  chart = am4core.create("dayRangeChart", am4charts.XYChart);

  // Add data
  chart.data = dayRangeResults;

  // Create axes
  var dateAxis = chart.xAxes.push(new am4charts.DateAxis());
  dateAxis.renderer.minGridDistance = 50;

  var durationAxis = chart.yAxes.push(new am4charts.DurationAxis());
  durationAxis.baseUnit = "second";
  durationAxis.title.text = "Päeva pikkus";
  durationAxis.renderer.minGridDistance = 50;

  // Create series
  var series = chart.series.push(new am4charts.LineSeries());
  series.dataFields.valueY = "pikkus";
  series.dataFields.dateX = "kuupäev";
  series.strokeWidth = 2;
  series.minBulletDistance = 10;
  series.tooltipText = "{valueY.formatDuration('hh:mm:ss')}";
  series.tooltip.pointerOrientation = "vertical";
  series.tooltip.background.cornerRadius = 20;
  series.tooltip.background.fillOpacity = 0.5;
  series.tooltip.label.padding(12, 12, 12, 12)

  // Add scrollbar
  chart.scrollbarX = new am4charts.XYChartScrollbar();
  chart.scrollbarX.series.push(series);

  // Add cursor
  chart.cursor = new am4charts.XYCursor();
  chart.cursor.xAxis = dateAxis;
  chart.cursor.snapToSeries = series;
}

/**
 * Function that uses https://sunrise-sunset.org/api API to get sunrise and sunset data
 */
function calculateSunRiseSet() {
  var singleDate = document.getElementById("singleDay");
  var dayRangeStart = document.getElementById("dayRangeStart");
  var dayRangeEnd = document.getElementById("dayRangeEnd");
  // Check if user wants data of single day or day range
  if (dayChooser == "singleDay") {
    // Create a request
    var request = new XMLHttpRequest();
    request.open("GET", "https://api.sunrise-sunset.org/json?lat=" + marker.getLatLng().lat + "&lng=" + marker.getLatLng().lng + "&date=" + singleDate.value + "&formatted=1", true);
    // Async callback
    request.onload = function () {
      setSingleDayResultsCallback(this.response);
    }
    // Send request
    request.send();
    // Switch to single day result tab
    switchTab("tabResultSingleDay");
  } else {
    // https://stackoverflow.com/questions/4345045/loop-through-a-date-range-with-javascript
    // Loop through data range and create request for each day
    for (var d = new Date(dayRangeStart.value); d < new Date(dayRangeEnd.value); d.setDate(d.getDate() + 1)) {
      var request = new XMLHttpRequest();
      request.open("GET", "https://api.sunrise-sunset.org/json?lat=" + marker.getLatLng().lat + "&lng=" + marker.getLatLng().lng + "&date=" + d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate() + "&formatted=1", true);
      // Save requests date and pass it to request
      request.requestDate = new Date(d.getTime());
      request.onload = function () {
        // third argument is false because this is not the last callback.
        setDayRangeResultsCallback(this.response, this.requestDate, false);
      }
      request.send();
    }
    // Create the last request 
    var request = new XMLHttpRequest();
    request.open("GET", "https://api.sunrise-sunset.org/json?lat=" + marker.getLatLng().lat + "&lng=" + marker.getLatLng().lng + "&date=" + dayRangeEnd.value + "&formatted=1", true);
    request.onload = function () {
      // Third argument is true because this is the last request. setDayRangeResultsCallback will initialize graph with current data
      setDayRangeResultsCallback(this.response, new Date(dayRangeEnd.value), true);
    }
    request.send();
    // Switch to day range result tab
    switchTab("tabResultDayRange");
  }
}

/**
 * Function for onLoad callback. Handles SunSet API data results.
 * Callback is called depending on user inputed date range days.
 * Callback data is added to global array. 
 * If the callback is the last one it will initialize graph to show data.
 * @param {String} data 
 * @param {Date} date 
 * @param {Boolean} lastRequest 
 */
function setDayRangeResultsCallback(data, date, lastRequest) {
  // parse API response
  var jsonData = JSON.parse(data);
  if (jsonData.status == "OK") {
    // Add api response to global array
    dayRangeResults.push({
      kuupäev: date,
      pikkus: hhmmssToSeconds(jsonData.results.day_length)
    });
  }
  // If it is the last request then initialize graph
  if (lastRequest) {
    initGraph();
  }
}

/**
 * Function resets all user changed elements
 */
function reset() {
  var singleDay = document.getElementById("singleDay");
  var dayRangeStart = document.getElementById("dayRangeStart");
  var dayRangeEnd = document.getElementById("dayRangeEnd");
  var longitudeTextBox = document.getElementById("longitude");
  var latitudeTextBox = document.getElementById("latitude");
  var singleDayContainer = document.getElementById("singleDayContainer");
  var dayRangeContainer = document.getElementById("dayRangeContainer");
  // Reset all datePickers
  singleDay.valueAsDate = null;
  dayRangeEnd.valueAsDate = null;
  dayRangeStart.valueAsDate = null;
  // Reset map pin
  longitudeTextBox.value = 5;
  latitudeTextBox.value = 25;
  handleLongLatTextBoxOnChange();
  // Empty result array
  dayRangeResults.length = [];
  // Dispose chart
  chart.dispose();
  // Set tab to start
  switchTab('tabStart');
  // Reset container backround
  singleDayContainer.style.background = "none";
  dayRangeContainer.style.background = "none";
}

/**
 * Function converts input string "hh:mm:ss" to integer seconds
 * https://stackoverflow.com/questions/9640266/convert-hhmmss-string-to-seconds-only-in-javascript
 * @param {*} input Input string "hh:mm:ss"
 * @returns returns total seconds
 */
function hhmmssToSeconds(input) {
  var splitInput = input.split(':');
  return (+splitInput[0]) * 60 * 60 + (+splitInput[1]) * 60 + (+splitInput[2]);
}

/**
 * Function that is called when single sunrise/set data has loaded and can be used.
 * Function sets data to corresponding fields in tabResult
 * @param {String} data 
 */
function setSingleDayResultsCallback(data) {
  console.log(data);
  var singleDaySunriseP = document.getElementById("singleDaySunriseP");
  var singleDaySunsetP = document.getElementById("singleDaySunsetP");
  var singleDayLength = document.getElementById("singleDayLength");

  var jsonData = JSON.parse(data);
  if (jsonData.status == "OK") {
    // Set results to elements
    singleDaySunriseP.innerHTML = jsonData.results.sunrise;
    singleDaySunsetP.innerHTML = jsonData.results.sunset;
    singleDayLength.innerHTML = jsonData.results.day_length;
    // Set singleDaySunriseP,singleDaySunsetP,singleDayLength opacity to 1 for transition effect 
    singleDaySunriseP.style.opacity = 1;
    singleDaySunsetP.style.opacity = 1;
    singleDayLength.style.opacity = 1;
  } else {
    // Server did not like something. Show it
    singleDayLength.innerHTML = jsonData.status;
    singleDayLength.style.opacity = 1;
  }
}

/**
 * Function sets markers location to user clicked location
 * Also sets lat and lng textboxes values
 * @param {eventArgs} eventArgs Input eventArguments from leafletJS
 */
function onMapClick(eventArgs) {
  var longitudeTextBox = document.getElementById("longitude");
  var latitudeTextBox = document.getElementById("latitude");
  // Check if lng or lat is 0. API does not like 0
  if (longitudeTextBox.value == 0 || latitudeTextBox.value == 0) {
    return;
  }

  // Set lat and long to corresponding text boxes
  longitudeTextBox.value = eventArgs.latlng.lng;
  latitudeTextBox.value = eventArgs.latlng.lat;
  // Set marker location to user clicked location
  marker.setLatLng(eventArgs.latlng).addTo(mymap);
}

/**
 * Function handles text changes from lat and lng text boxes
 */
function handleLongLatTextBoxOnChange() {
  var longitudeTextBox = document.getElementById("longitude");
  var latitudeTextBox = document.getElementById("latitude");
  // Check if lng or lat is 0. API does not like 0
  if (longitudeTextBox.value == 0 || latitudeTextBox.value == 0) {
    return;
  }
  // Set markers position 
  marker.setLatLng(L.latLng(latitudeTextBox.value, longitudeTextBox.value)).addTo(mymap);
  // Pan map to new marker location
  mymap.panTo(marker.getLatLng());
}

/**
 * Function that changes viewable tab in index page.
 * @param {String} tabName  The requested tab to be shown
 */
function switchTab(tabName) {
  // Hide all tabs
  var tabcontent = document.getElementsByClassName("tab");
  for (var i = 0; i < tabcontent.length; i++) {
    tabcontent[i].style.display = "none";
  }

  // Show the requested tab
  document.getElementById(tabName).style.display = "initial";
}

/**
 * Function that is called when user clicks on date input in choose date subpage.
 * Function sets corresponding containers backround color to indicate what area user has selected.
 * @param {input} dateInput Input parameter is the date input what is clicked.
 */
function handleDateInputClick() {
  var singleDayContainer = document.getElementById("singleDayContainer");
  var dayRangeContainer = document.getElementById("dayRangeContainer");
  // Check wich radiobutton is clicked and set corresponding backround to indicate wich is selected
  if (this.name == "singleDay") {
    dayChooser = "singleDay";
    singleDayContainer.style.background = "rgb(190,190,190)";
    dayRangeContainer.style.background = "none";
  } else {
    dayChooser = "dayRange";
    singleDayContainer.style.background = "none";
    dayRangeContainer.style.background = "rgb(190,190,190)";
  }
}

/**
 * Function validates user entered dates. If dates are valid then user is 
 * directed to next page to select location.
 */
function validateDates() {
  // Set variables
  var singleDate = document.getElementById("singleDay");
  var dayRangeStart = document.getElementById("dayRangeStart");
  var dayRangeEnd = document.getElementById("dayRangeEnd");

  // Check if user has selected single or dayRange 
  if (dayChooser == null) {
    return;
  }
  if (dayChooser == 'singleDay') {
    // Check if user has chosen single day
    if (singleDate.value == "") {
      alert("Kuupäev on tühi");
    } else if (isValidDate(singleDate.value)) { // Check if the selected date is valid
      switchTab('tabSetLocation')
      // https://stackoverflow.com/questions/31030949/leaflet-map-not-showing-in-bootstrap-div?rq=1
      mymap.invalidateSize();
    } else {
      alert("Kuupäev pole õige!")
    }
  } else {
    // Check if user has chosen start and end day range
    if (dayRangeStart.value != "" && dayRangeEnd.value != "") {
      // Check if user selected days are valid
      if (isValidDate(dayRangeStart.value) && isValidDate(dayRangeEnd.value)) {
        // Check if start date is before end date
        var dateStart = new Date(dayRangeStart.value);
        var dateEnd = new Date(dayRangeEnd.value);
        if (dateStart < dateEnd) {
          // check if two days difference is not larger than 30 days.
          // Source https://stackoverflow.com/questions/3224834/get-difference-between-2-dates-in-javascript
          var diffTime = Math.abs(dateEnd - dateStart);
          var diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            switchTab('tabSetLocation');
            // https://stackoverflow.com/questions/31030949/leaflet-map-not-showing-in-bootstrap-div?rq=1
            mymap.invalidateSize();
          } else {
            alert("Algus- ja lõppkuupäeva vahe on suurem, kui 30 päeva!");
          }
        } else {
          alert("Algus kuupäev pole varem, kui lõpp kuupäev!")
        }
      } else {
        alert("Kuupäevad pole õiged!")
      }
    } else {
      alert("Kuupäevad on tühjad!");
    }
  }
}

/**
 * Function that validates date string. 
 * Source https://stackoverflow.com/questions/5812220/how-to-validate-a-date/5812341#5812341
 * @param {String} input Input date string that is validated
 * @returns boolean if the string is valid or not
 */
function isValidDate(input) {
  var bits = input.split('-');
  var d = new Date(bits[0], bits[1] - 1, bits[2]);
  return d && (d.getMonth() + 1) == bits[1];
}