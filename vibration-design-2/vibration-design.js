

function initializeOnLoad() {
    updateVibrationFrequency();
    changeNumberOfSliders();
}

function changeNumberOfSliders() {
    nSliders = document.getElementById("number-of-sliders").value;
    if (isNaN(parseInt(nSliders))) {
	alert("'Number of points' must be a number");
	return;
    }
    nSliders = parseInt(nSliders);
    document.getElementById("number-of-sliders").value = nSliders;

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

function validateSoundLength() {
    var e = document.getElementById("sound-length");
    if (isNaN(parseFloat(e.value))) {
	alert("Sound length must be a number");
	e.value = 2;
    }
}

function simulate() {
    var numPoints    = parseInt(document.getElementById("number-of-sliders").value);
    var soundLength  = parseFloat(document.getElementById("sound-length").value);
    var msecPerPoint = soundLength * 1000 / numPoints;
    var frequency    = document.getElementById("vibration-frequency").value;
    var intensityValues = [];
    for (var i = 1; i <= numPoints; i++) {
	var name = "slider" + i;
	intensityValues.push(document.getElementById(name).value);
    }
    playVibration(frequency, msecPerPoint, intensityValues);
}

async function playVibration(frequency, msecPerPoint, intensityValues) {
    var context = new AudioContext();
    var o = context.createOscillator();
    o.frequency.value = frequency;
    o.type = "sine";
    g = context.createGain();
    o.connect(g);
    g.connect(context.destination);
    var eventTime = context.currentTime;
    for (var i = 0; i < intensityValues.length; i++) {
	var intensity = intensityValues[i]/100.0;
	if (intensity == 0) {
	    intensity = 0.01;  // zero isn't allowed for exponentialRampToValueAtTime()
	}
	// Uses exponential-ramp-to-value rather than instant intensity change
	// to avoid "click" sounds. 5msec ramp up each change. The second
	// exponential-ramp-to-value keeps the same intensity, so it just determines
	// the time the next one starts.
	g.gain.exponentialRampToValueAtTime(intensity, eventTime+0.005);
	eventTime += msecPerPoint/1000.0;
	g.gain.exponentialRampToValueAtTime(intensity, eventTime);
    }
    o.start();
    await new Promise(r => setTimeout(r, msecPerPoint * intensityValues.length));
    o.stop();
}

function updateVibrationFrequency() {
    var freq = document.getElementById("vibration-frequency").value;
    var label = document.getElementById("vibration-frequency-label");
    label.innerHTML = "Frequency: " + freq + " Hz";
}

function writeSoundFile() {
    var numPoints   = parseInt(document.getElementById("number-of-sliders").value);
    var soundLength = parseFloat(document.getElementById("sound-length").value);
    var frequency   = parseInt(document.getElementById("vibration-frequency").value);
    var intensityValues = [];

    var file = "";
    file += "soundLength:" + soundLength + "\n";
    file += "frequency:" + frequency + "\n";
    file += "numPoints:" + numPoints + "\n";
    file += "intensities:\n";
    var numPoints   = parseInt(document.getElementById("number-of-sliders").value);
    for (var i = 1; i <= numPoints; i++) {
	var name = "slider" + i;
	file += document.getElementById(name).value + "\n";
    }
    document.getElementById("vibration-file").value = file;
}

function readSoundFile() {
    var soundLength, msecPerPoint, frequency, intensities;
    var lines = document.getElementById("vibration-file").value.split("\n"); 
    var startOfIntensities = 0;
    var i, nameValue;
    for (i = 0; i < lines.length; i++) {
	nameValue = lines[i].split(":");
	if      (nameValue[0] == "soundLength" ) { soundLength  = nameValue[1]; }
	else if (nameValue[0] == "frequency"   ) { frequency    = nameValue[1]; }
	else if (nameValue[0] == "numPoints"   ) { numPoints    = nameValue[1]; }
	else if (nameValue[0] == "intensities") {
	    intensities = [];
	    startOfIntensities = i+1;
	    break;
	} else {
	    alert("Error in sound file: unknown element '" + nameValue[0] + "'");
	    return;
	}
    }
    if (typeof(intensity) == undefined || startOfIntensities == 0) {
	alert("Error in sound file: can't find 'intensities' values");
	return;
    }
    var oneWarning = false;
    for (i = startOfIntensities; i < lines.length; i++) {
	if (lines[i].length == 0) {
	    break;
	}
	if (isNaN(parseInt(lines[i]))) {
	    if (!oneWarning) {
		alert("Error: intensity values must be numbers: '" + lines[i] + "' isn't valid");
		oneWarning = true;
	    }
	    lines[i] = "0";
	}
	intensities[i-startOfIntensities] = lines[i];
    }

    if (typeof(soundLength)  == undefined) {alert("Error in sound file: missing 'soundLength'");  return;}
    if (typeof(frequency)    == undefined) {alert("Error in sound file: missing 'frequency'");    return;}
    if (typeof(numPoints)    == undefined) {alert("Error in sound file: missing 'numPoints'");    return;}
    if (isNaN(parseFloat(soundLength))) {alert("Error in sound file: 'soundLength' must be a number"); return;}
    if (isNaN(parseFloat(frequency)))   {alert("Error in sound file: 'frequency' must be a number");   return;}
    if (isNaN(parseFloat(numPoints)))   {alert("Error in sound file: 'numPoints' must be a number");   return;}
    if (numPoints != intensities.length) {
	alert("Warning: error in sound file: 'numPoints' (" + numPoints +
	      "\ndoesn't match actual number of intensity values (" + intensities.length +
	      ")\nusing '" + intensities.length + "'");
    }

    var numPoints = intensities.length;
    document.getElementById("number-of-sliders").value = numPoints;
    document.getElementById("sound-length").value = soundLength;
    document.getElementById("vibration-frequency").value = frequency;
    changeNumberOfSliders();
    for (var i = 1; i <= numPoints; i++) {
	var name = "slider" + i;
	document.getElementById(name).value = intensities[i-1];
    }
    updateVibrationFrequency();
}

