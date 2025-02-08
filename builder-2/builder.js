//  This file is part of of the "Tactile" library.
// 
//  Tactile is free software: you can redistribute it and/or modify it under
//  the terms of the GNU Lesser General Public License (LGPL) as published by
//  the Free Software Foundation, either version 3 of the License, or (at
//  your option) any later version.
// 
//  Tactile is distributed in the hope that it will be useful, but WITHOUT
//  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
//  FITNESS FOR A PARTICULAR PURPOSE. See the LGPL for more details.
// 
//  You should have received a copy of the LGPL along with Tactile. If not,
//  see <https://www.gnu.org/licenses/>.

function createArduinoSketch() {

    // sketch C++ header
    var sketch =
	"#include <Arduino.h>\n"
	+ "#include \"Tactile.h\"\n"
	+ "\n"
	+ "Tactile *t;\n"
	+ "void setup() {\n"
	+ "\n";
    
    // Log level. This goes first (even though it's near the bottom of the form) because
    // if enabled, we want the other options to be logged as they're set.
    var logLevel = document.getElementById("log-level").value;
    sketch += "  t->setLogLevel(" + logLevel + ");\n";

    // Which channels are enabled?
    var channelsEnabled = [];
    channelsEnabled.push(!document.getElementById("channel-1-enabled").checked);
    channelsEnabled.push(!document.getElementById("channel-2-enabled").checked);
    channelsEnabled.push(!document.getElementById("channel-3-enabled").checked);
    channelsEnabled.push(!document.getElementById("channel-4-enabled").checked);
    for (var i = 1; i <= 4; i++)
    {
	sketch += "  t->ignoreSensor(" + i + ", " + channelsEnabled[i-1] + ");\n";
    }

    // touch-or-proximity menu
    var e = document.getElementById("touch-or-proximity-menu");
    var prox = e.options[e.selectedIndex].value;
    if (prox == "proximity") {
	sketch = sketch + "  t->setProximityAsVolumeMode(true);\n";
    }
    
    // touch/release thresholds
    var touchThreshold = document.getElementById("touch-threshold").value;
    var releaseThreshold = document.getElementById("release-threshold").value;
    if (   !checkNumber(touchThreshold, 0, 100, "Start-track threshold")
	|| !checkNumber(touchThreshold, 0, 100, "Stop-track threshold")) {return;}
    if (parseFloat(touchThreshold) <= parseFloat(releaseThreshold)) {
	alert("Error: Start-track threshold must be higher that Stop-track threshold."
	      + " (you entered '" + touchThreshold + "' and '" + releaseThreshold + "')");
	return;
    }
    sketch += "  t->setTouchReleaseThresholds(" + touchThreshold + ", " + releaseThreshold + ");\n";
    
    // If proximity mode is used, Fade-in, fade-out, volume, and touch-to-stop
    // aren't used.
    if (prox == "touch") {

	// Volume
	var volume = document.getElementById("volume").value;
	if (!checkNumber(volume, 0, 100, "Volume")) {return;}
	sketch += "  t->setVolume(" + volume + ");\n";

	// Fade-in and fade-out
	var fadeIn  = document.getElementById("fade-in").value;
	var fadeOut = document.getElementById("fade-out").value;
	if (   !checkNumber(fadeIn, 0, 100000, "Fade-in")
	    || !checkNumber(fadeOut, 0, 10000, "Fade-out")) { return; }
	sketch += "  t->setFadeInTime(" + fadeIn + ");\n";
	sketch += "  t->setFadeOutTime(" + fadeOut + ");\n";

        // Touch-to-stop mode
	var touchToStop = document.getElementById("touch-to-stop").checked;
	sketch += "  t->setTouchToStop(" + touchToStop + ");\n";
    }

    // Multi-track mode
    var multiTrack = document.getElementById("multi-track").checked;
    sketch += "  t->setMultiTrackMode(" + multiTrack + ");\n";

    // Continue-track mode
    var continueTrack = document.getElementById("continue-track").checked;
    sketch += "  t->setContinueTrackMode(" + continueTrack + ");\n";

    // Inactivity timeout
    var inactivityTimeout = document.getElementById("inactivity-timeout").value;
    if (!checkNumber(inactivityTimeout, 0, 100000, "Inactivity timeout")) { return; }
    sketch += "  t->setInactivityTimeout(" + inactivityTimeout + ");\n";

    // Random-track mode
    var randomTrack = document.getElementById("random-track").checked;
    sketch += "  t->setPlayRandomTrackMode(" + randomTrack + ");\n";

    // Track looping
    var trackLooping = document.getElementById("track-looping").checked;
    sketch += "  t->setLoopMode(" + trackLooping + ");\n";

    // Proximity multiplier
    for (var i = 1; i <= 4; i++) {
	var id = "proximity-multiplier-" + i;
	var m = document.getElementById(id).value;
	var fieldName = "Proximity multiplier " + i;
	if (!checkNumber(m, 0, 100, fieldName)) { return; }
	if (parseFloat(m) != 1.0) {
	    sketch += "  t->setProximityMultiplier(" + i + ", " + m + ");\n";
	}
    }

    // Averaging strength
    var averaging = document.getElementById("averaging").value;
    if (!checkNumber(averaging, 1, 10000, "Averaging")) { return; }
    if (parseInt(averaging) != 200) {
	sketch += "  t->setAveragingStrength(" + averaging + ");\n";
    }

    // Close out the sketch
    sketch = sketch
	+ "}\n"
	+ "\n"
	+ "// Don't modify this loop() function.\n"
	+ "void loop() {\n"
	+ "  t->loop();\n"
	+ "}\n"
    document.getElementById("sketch").innerHTML = sketch;
}

function touchModeChanged() {
    var e = document.getElementById("touch-or-proximity-menu");
    var t = e.options[e.selectedIndex].value;
    var frow = document.getElementById("fade-in-out-row");
    var vrow = document.getElementById("volume-row");
    var trow = document.getElementById("touch-to-stop-row");
    if (t == "proximity") {
	frow.style.display = "none";
	vrow.style.display = "none";
	trow.style.display = "none";
    } else {
	frow.style.display = "";
	vrow.style.display = "";
	trow.style.display = "";
    }
}

function selectVibWaveform(channel) {
    var e = document.getElementById("vibration-waveform-"+channel);
    var v = e.options[e.selectedIndex].value;
    var sl = document.getElementById("straight-line-container");
    var sq = document.getElementById("square-wave-container");
    var sw = document.getElementById("sawtooth-wave-container");
    var pw = document.getElementById("single-pulse-wave-container");
    var pf = document.getElementById("single-pulse-fade-wave-container");
    var cu = document.getElementById("custom-file-wave-container");
    sl.classList.remove("text-primary");
    sq.classList.remove("text-primary");
    sw.classList.remove("text-primary");
    pw.classList.remove("text-primary");
    pf.classList.remove("text-primary");
    cu.classList.remove("text-primary");
    if      (v == "continuous")        { sl.classList.add("text-primary"); }
    else if (v == "square-wave")       { sq.classList.add("text-primary"); }
    else if (v == "sawtooth-wave")     { sw.classList.add("text-primary"); }
    else if (v == "single-pulse")      { pw.classList.add("text-primary"); }
    else if (v == "single-pulse-fade") { pf.classList.add("text-primary"); }
    else if (v == "custom-file")       { cu.classList.add("text-primary"); }

    var customFileContainer = document.getElementById("custom-vib-file-container-"+channel);
    var customFileExplanation = document.getElementById("custom-vib-explanation");
    if (v == "custom-file") {
	customFileContainer.style.display = "";
	customFileExplanation.style.display = "";
    } else {
	customFileContainer.style.display = "none";
	customFileExplanation.style.display = "none";
    }
}

function initializeOnLoad() {
    touchModeChanged();
    placeImages();
    showHideAudio();
    showHideHaptic();
    showHideAdvanced();
    selectHapticOutputChannel(1);
}

function isNumeric(str) {
    if (typeof str != "string") return false;
    return !isNaN(str) && !isNaN(parseFloat(str));
}

function checkNumber(str, lowLimit, highLimit, fieldLabel) {
    if (!isNumeric(str)) {
	alert("Error: " + fieldLabel + " must be a number (you entered '" + str + "')");
	return false;
    }
    var n = parseFloat(str);
    if (n < lowLimit || n > highLimit) {
	alert("Error: " + fieldLabel + " must be between " + lowLimit + " and " + highLimit
	      + " (you entered '" + str + "')");
	return false;
    }
    return true;
}

function placeImage(name, where) {
    document.getElementById(where).innerHTML = document.getElementById(name).innerHTML;
}

function placeImages() {
    placeImage("straight-line", "straight-line-here");
    placeImage("square-wave",   "square-wave-here");
    placeImage("sawtooth-wave", "sawtooth-wave-here");
    placeImage("single-pulse-wave", "single-pulse-wave-here");
    placeImage("single-pulse-fade-wave", "single-pulse-fade-wave-here");
}

function showHideAudio() {
    var audioHiddenDiv = document.getElementById("audio-options-disabled");
    var audioShownDiv  = document.getElementById("audio-options");
    if (document.getElementById('show-hide-audio').checked) {
	audioHiddenDiv.style.display = "none";
	audioShownDiv.style.display = "";
    } else {
	audioHiddenDiv.style.display = "";
	audioShownDiv.style.display = "none";
    }
}

function showHideHaptic() {
    var hapticHiddenDiv = document.getElementById("haptic-options-disabled");
    var hapticShownDiv  = document.getElementById("haptic-options");
    if (document.getElementById('show-hide-haptic').checked) {
	hapticHiddenDiv.style.display = "none";
	hapticShownDiv.style.display = "";
    } else {
	hapticHiddenDiv.style.display = "";
	hapticShownDiv.style.display = "none";
    }
}

function showHideAdvanced() {
    var advancedHiddenDiv = document.getElementById("advanced-options-disabled");
    var advancedShownDiv  = document.getElementById("advanced-options");
    if (document.getElementById('show-hide-advanced').checked) {
	advancedHiddenDiv.style.display = "none";
	advancedShownDiv.style.display = "";
    } else {
	advancedHiddenDiv.style.display = "";
	advancedShownDiv.style.display = "none";
    }
}

function selectHapticOutputChannel(channel) {
    for (var i = 1; i <= 4; i++) {
	document.getElementById("channel-options-"+i).style.display = (channel == i) ? "" : "none";
    }
    selectVibWaveform(channel);
}
