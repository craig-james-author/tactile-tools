function changeNumberOfSliders() {
    nSliders = document.getElementById("number-of-sliders").value;
    if (nSliders > 200) {
	nSliders = 200;
	alert("Max points is 200");
    }
    var values = [];
    values.push(0);	// first slot not used
    var tableWidth = nSliders * 15;
    var html = "<table style=\"width: "  + tableWidth + "px;\"><tr>";
    for (var i = 1; i <= nSliders; i++) {
	var name = "slider" + i;
	var slider = document.getElementById(name);
	if (slider) {
	    values.push(slider.value);
	} else {
	    values.push(0);
	}
	html += "<td class=\"td-range\"><input type=\"range\" orient=\"vertical\" id=\"" + name + "\"></td>\n";
    }
    var sliders = document.getElementById("sliders-container");
    sliders.innerHTML = html;
    for (var i = 1; i <= nSliders; i++) {
	var name = "slider" + i;
	document.getElementById(name).value = values[i];
    }
}

function getCookie(name) {
    var cookieValue = document.cookie;
    var cookies = cookieValue.split("; ");
    for (var i = 0; i < cookies.length; i++) {
	if (cookies[i].startsWith(name+"=")) {
	    var nameVal = cookies[i].split("=");
	    return nameVal[1];
	}
    }
    return null;
}

function initializeOnLoad() {
    var numSliders = getCookie("numberSliders");
    if (!numSliders) {
	changeNumberOfSliders();
	return;
    }
    var soundLength = getCookie("soundLength");
    var volumes = getCookie("volumes");
    if (!soundLength) {
	soundLength = 10;
    }

    document.getElementById("number-of-sliders").value = numSliders
    document.getElementById("sound-length").value = soundLength;
    changeNumberOfSliders();
    volumesArray = volumes.split(",");
    for (var i = 0; i < volumesArray.length; i++) {
	var name = "slider" + (i+1);
	document.getElementById(name).value = volumesArray[i];
    }
}

function simulate() {
    var numPoints   = parseInt(document.getElementById("number-of-sliders").value);
    var soundLength = parseFloat(document.getElementById("sound-length").value);
    var msecPerPoint = soundLength * 1000 / numPoints;
    var volumeValues = [];
    for (var i = 1; i <= numPoints; i++) {
	var name = "slider" + i;
	volumeValues.push(document.getElementById(name).value);
    }
    playVibration(msecPerPoint, volumeValues);
}

async function playVibration(msecPerPoint, volumeValues) {
    var context = new AudioContext();
    var o = context.createOscillator();
    o.frequency.value = 200;
    o.type = "sine";
    g = context.createGain();
    o.connect(g);
    g.connect(context.destination);
    var eventTime = context.currentTime;
    for (var i = 0; i < volumeValues.length; i++) {
	var volume = volumeValues[i]/100.0;
	if (volume == 0) {
	    volume = 0.01;  // zero isn't allowed for exponentialRampToValueAtTime()
	}
	// Uses exponential-ramp-to-value rather than instant volume change
	// to avoid "click" sounds. 5msec ramp up each change. The second
	// exponential-ramp-to-value keeps the same volume, so it just determines
	// the time the next one starts.
	g.gain.exponentialRampToValueAtTime(volume, eventTime+0.005);
	eventTime += msecPerPoint/1000.0;
	g.gain.exponentialRampToValueAtTime(volume, eventTime);
    }
    o.start();
    await new Promise(r => setTimeout(r, msecPerPoint * volumeValues.length));
    o.stop();
}

function createConfiguration() {

    var numPoints   = parseInt(document.getElementById("number-of-sliders").value);
    var soundLength = parseFloat(document.getElementById("sound-length").value);
    var msecPerPoint = soundLength * 1000 / numPoints;

    var volumeValues = [];
    var numPoints   = parseInt(document.getElementById("number-of-sliders").value);
    for (var i = 1; i <= numPoints; i++) {
	var name = "slider" + i;
	volumeValues.push(document.getElementById(name).value);
    }
    var configuration = {};
    configuration.msecPerPoint = msecPerPoint;
    configuration.soundLength = soundLength;
    configuration.volumes = volumeValues;
    return configuration;
}

function writeSoundFile() {
    var configuration = createConfiguration();
    document.getElementById("sound-file").value = JSON.stringify(configuration, null, "  ");
}

function readSoundFile() {
    var file = document.getElementById("sound-file").value;
    var configuration;
    try {
	configuration = JSON.parse(file);
    } catch(error) {
	alert("Sorry, can't parse sound file: '" + error + "'");
	return;
    }
    if (!configuration) {
	alert("Warning: can't parse sound file");
	return;
    }
    var soundLength  = configuration.soundLength;
    var msecPerPoint = configuration.msecPerPoint;
    var volumes      = configuration.volumes;
    if (!soundLength || !msecPerPoint || !volumes) {
	alert("Warning: can't parse sound file");
	return;
    }
    var numPoints = volumes.length;
    document.getElementById("number-of-sliders").value = volumes.length;
    document.getElementById("sound-length").value = soundLength;

    for (var i = 1; i <= numPoints; i++) {
	var name = "slider" + i;
	document.getElementById(name).value = volumes[i-1];
    }
}
