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
	+ "  t = Tactile::setup();\n"
	+ "\n";
    
    // Log level. This goes first (even though it's near the bottom of the form) because
    // if enabled, we want the other options to be logged as they're set.
    var logLevel = document.getElementById("log-level").value;
    sketch += "  t->setLogLevel(" + logLevel + ");\n";

    // Which channels are enabled?
    sketch += "\n  // Which channels are disabled (inactive)?\n";
    var channelEnabled = [];
    channelEnabled.push(document.getElementById("channel-1-enabled").checked);
    channelEnabled.push(document.getElementById("channel-2-enabled").checked);
    channelEnabled.push(document.getElementById("channel-3-enabled").checked);
    channelEnabled.push(document.getElementById("channel-4-enabled").checked);
    for (var i = 1; i <= 4; i++)
    {
	sketch += "  t->ignoreSensor(" + i + ", " + !channelEnabled[i-1] + ");\n";
    }

    //--------------------------------------------------------------------------------
    // Input sensors
    //--------------------------------------------------------------------------------

    for (var ch = 1; ch <= 4; ch++) {

	sketch += "\n  // Input sensor " + ch + ":\n";

	// touch-or-proximity menu
	var e = document.getElementById("touch-or-proximity-menu-ch"+ch);
	var prox = e.options[e.selectedIndex].value;
	if (prox == "proximity") {
	    sketch = sketch + "  t->setProximityAsVolumeMode("+ch+", true);\n";
	}

	// touch/release thresholds
	var touchThreshold = document.getElementById("touch-threshold-ch"+ch).value;
	var releaseThreshold = document.getElementById("release-threshold-ch"+ch).value;
	if (   !checkNumber(touchThreshold, 0, 100, "Start-track threshold")
	    || !checkNumber(touchThreshold, 0, 100, "Stop-track threshold")) {return;}
	if (parseFloat(touchThreshold) <= parseFloat(releaseThreshold)) {
	    alert("Error: Start-track threshold must be higher that Stop-track threshold."
		  + " (you entered '" + touchThreshold + "' and '" + releaseThreshold + "')");
	    return;
	}
    
	sketch += "  t->setTouchReleaseThresholds(" + ch + ", " + touchThreshold + ", " + releaseThreshold + ");\n";

	// If proximity mode is used, touch-to-stop isn't used
	if (prox == "touch") {
	    var touchToStop = document.getElementById("touch-to-stop-ch"+ch).checked;
	    if (touchToStop) {
		sketch += "  t->setTouchToStop(" + ch + ", " + touchToStop + ");\n";
	    }
	}
    }

    //--------------------------------------------------------------------------------
    // Audio, Vibrate, or both?
    //--------------------------------------------------------------------------------

    sketch += "\n  // Output audio, vibration, or both?\n";
    
    var useAudioOutput     = document.getElementById("show-hide-audio").checked;
    var useVibrationOutput = document.getElementById("show-hide-haptic").checked;
    if (!useAudioOutput && ! useVibrationOutput) {
	alert("Error: You must have at least one of Audio or Haptic output enabled");
	return;
    }
    var outputOption = [];
    if (useAudioOutput) {
	outputOption.push("audioOutput");
    }
    if (useVibrationOutput) {
	outputOption.push("vibrationOutput");
    }
    for (ch = 1; ch <= 4; ch++) {
	if (channelEnabled[ch-1]) {
	    sketch += "  t->setOutputDestination(" + ch + ", " + outputOption.join(", ") + ");\n";
	}
    }

    //--------------------------------------------------------------------------------
    // Audio Output control
    //--------------------------------------------------------------------------------

    if (useAudioOutput) {

	for (var ch = 1; ch <= 4; ch++) {

	    sketch += "\n  // Audio channel " + ch + ":\n";
	    // If proximity mode is used, Fade-in, fade-out, and volume aren't used.
	    if (prox == "touch") {

		// Volume
		var volume = document.getElementById("volume-ch"+ch).value;
		if (!checkNumber(volume, 0, 100, "Volume")) {return;}
		sketch += "  t->setVolume(" + ch + ", " + volume + ");\n";

		// Fade-in and fade-out
		var fadeIn  = document.getElementById("fade-in-ch"+ch).value;
		var fadeOut = document.getElementById("fade-out-ch"+ch).value;
		if (   !checkNumber(fadeIn, 0, 100000, "Fade-in-ch"+ch)
		    || !checkNumber(fadeOut, 0, 10000, "Fade-out-ch"+ch)) { return; }
		sketch += "  t->setFadeInTime(" + ch + ", " + fadeIn + ");\n";
		sketch += "  t->setFadeOutTime(" + ch + ", " + fadeOut + ");\n";
	    }

	    // Continue-track mode
	    var continueTrack = document.getElementById("continue-track-ch"+ch).checked;
	    sketch += "  t->setContinueTrackMode(" + ch + ", " + continueTrack + ");\n";

	    // Random-track mode
	    var randomTrack = document.getElementById("random-track-ch"+ch).checked;
	    sketch += "  t->setPlayRandomTrackMode(" + ch + ", " + randomTrack + ");\n";

	    // Track looping
	    var trackLooping = document.getElementById("track-looping-ch"+ch).checked;
	    sketch += "  t->setLoopMode(" + ch + ", " + trackLooping + ");\n";

	}
    }
    
    // Inactivity timeout (applies to all channels)
    sketch += "\n  // All audio channels:\n";

    var inactivityTimeout = document.getElementById("inactivity-timeout").value;
    if (!checkNumber(inactivityTimeout, 0, 100000, "Inactivity timeout")) { return; }
    sketch += "  t->setInactivityTimeout(" + inactivityTimeout + ");\n";

    // Multi-track mode (applies to all channels)
    var multiTrack = document.getElementById("multi-track").checked;
    sketch += "  t->setMultiTrackMode(" + multiTrack + ");\n";

    //--------------------------------------------------------------------------------
    // Vibration output. Each channel has its own set of options
    //--------------------------------------------------------------------------------

    if (useVibrationOutput) {

	for (var ch = 1; ch <= 4; ch++) {
	    sketch += "\n  // Vibrator channel " + ch + ":\n";
	    if (channelEnabled[ch-1]) {

		// Selected envelope or envelope file
		var e = document.getElementById("vibration-waveform-ch"+ch);
		vibChoice = e.options[e.selectedIndex].value;
		if (vibChoice == "custom-file") {
		    var fileName = document.getElementById("custom-vib-name-ch"+ch).value;
		    if (!fileName) {
			alert("Error: Haptic Channel " + ch + ": the 'custom file' choice requires a filename");
			return;
		    }
		    sketch += "  t->setVibrationEnvelopeFile(" + ch + ", \"" + fileName + "\");\n";
		} else if (vibChoice) {
		    sketch += "  t->setVibrationEnvelope(" + ch + ", \"" + vibChoice + "\");\n";
		}

		// Vibrator type, and if linear, get the frequency
		var vibType = document.getElementById("vibrator-type-ch"+ch).value;
		if (vibType == "motor") {
		    sketch += "  t->setVibratorType(" + ch + ", motorVibrator);\n";
		} else {
		    sketch += "  t->setVibratorType(" + ch + ", linearVibrator);\n";
		    var vibFrequency = document.getElementById("vibrator-frequency-ch"+ch).value;
		    sketch += "  t->setVibrationFrequency(" + ch + ", " + vibFrequency + ");\n";
		}

		// What to do with proximity?
		if (prox == "proximity") {
		    //   Radio button 1: nothing, 2: intensity, 3: speed
		    if (document.getElementById("use-proximity-for-vib-2-ch"+ch).checked) {
			sketch += "  t->useProximityAsIntensity(" + ch + ", true);\n";
		    }
		    if (document.getElementById("use-proximity-for-vib-3-ch"+ch).checked) {
			var multiplier = document.getElementById("proximity-speed-ch" + ch).value;
			sketch += "  t->useProximityAsSpeed(" + ch + ", true, " + multiplier + ");\n";
		    }
		}
	    }
	}
    }


    //--------------------------------------------------------------------------------
    // Advanced options
    //--------------------------------------------------------------------------------

    sketch += "\n  // General (advanced) options (uncomment to change):\n";
    // Proximity multiplier
    for (var i = 1; i <= 4; i++) {
	var id = "proximity-multiplier-" + i;
	var m = document.getElementById(id).value;
	var fieldName = "Proximity multiplier " + i;
	if (!checkNumber(m, 0, 100, fieldName)) { return; }
	var commentIt = (parseFloat(m) == 1.0) ? "// " : "";
	sketch += "  " + commentIt + "t->setProximityMultiplier(" + i + ", " + m + ");\n";
    }

    // Averaging strength
    var averaging = document.getElementById("averaging").value;
    if (!checkNumber(averaging, 1, 10000, "Averaging")) { return; }
    var commentIt =  (parseInt(averaging) == 200) ? "// " : "";
    sketch += "  " + commentIt + "t->setAveragingStrength(" + averaging + ");\n";

    // Close out the sketch
    sketch = sketch
	+ "}\n"
	+ "\n"
	+ "void loop() {\n"
	+ "  t->loop();\n"
	+ "}\n"
    document.getElementById("sketch").innerHTML = sketch;
}

function touchModeChanged(channel) {
    var e = document.getElementById("touch-or-proximity-menu-ch"+channel);
    var t = e.options[e.selectedIndex].value;
    var frow = document.getElementById("fade-in-out-row-ch"+channel);
    var vrow = document.getElementById("volume-row-ch"+channel);
    var trow = document.getElementById("touch-to-stop-row-ch"+channel);
    if (t == "proximity") {
	frow.style.display = "none";
	vrow.style.display = "none";
	trow.style.display = "none";
    } else {
	frow.style.display = "";
	vrow.style.display = "";
	trow.style.display = "";
    }
    var vediv = document.getElementById("vib-proximity-enabled-ch"+channel);
    var vddiv = document.getElementById("vib-proximity-disabled-ch"+channel);
    if (t == "proximity") {
	vddiv.style.display = "none";
	vediv.style.display = "";
    } else {
	vddiv.style.display = "";
	vediv.style.display = "none";
    }
    if (t == "proximity") {
	document.getElementById("touch-threshold-ch"+channel).value = 15;
	document.getElementById("release-threshold-ch"+channel).value = 10;
    } else {
	document.getElementById("touch-threshold-ch"+channel).value = 85;
	document.getElementById("release-threshold-ch"+channel).value = 65;
    }
}

function selectVibWaveform(channel) {
    var e = document.getElementById("vibration-waveform-ch"+channel);
    var v = e.options[e.selectedIndex].value;
    var sl = document.getElementById("straight-line-container-ch"+channel);
    var sq = document.getElementById("square-wave-container-ch"+channel);
    var sw = document.getElementById("sawtooth-wave-container-ch"+channel);
    var pw = document.getElementById("single-pulse-wave-container-ch"+channel);
    var pf = document.getElementById("single-pulse-fade-wave-container-ch"+channel);
    var cu = document.getElementById("custom-file-wave-container-ch"+channel);
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

    var customFileContainer = document.getElementById("custom-vib-file-container-ch"+channel);
    var customFileExplanation = document.getElementById("custom-vib-explanation-ch"+channel);
    if (v == "custom-file") {
	customFileContainer.style.display = "";
	customFileExplanation.style.display = "";
    } else {
	customFileContainer.style.display = "none";
	customFileExplanation.style.display = "none";
    }
}

function initializeOnLoad() {
    duplicateOptions();
    for (var ch = 1; ch <= 4; ch++) {
	touchModeChanged(ch);
    }
    showHideAudio();
    showHideHaptic();
    showHideAdvanced();
    placeImages();
    selectChannel(1);
    for (var ch = 1; ch <= 4; ch++) {
	enableDisableChannel(ch);
	proximityVibActionChanged(ch);
	updateProximityAsSpeedStrength(ch);
	updateVibrationFrequency(ch);
    }
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
    for (channel = 1; channel <= 4; channel++) {
	placeImage("straight-line", "straight-line-here-ch"+channel);
	placeImage("square-wave",   "square-wave-here-ch"+channel);
	placeImage("sawtooth-wave", "sawtooth-wave-here-ch"+channel);
	placeImage("single-pulse-wave", "single-pulse-wave-here-ch"+channel);
	placeImage("single-pulse-fade-wave", "single-pulse-fade-wave-here-ch"+channel);
	placeImage("custom-design", "custom-design-here-ch"+channel);
	placeImage("vibrator-types", "vibrator-types-here-ch"+channel);
    }
}

// Rather than make four copies, the sensor, audio, and haptic options are only in the HTML once,
// and are duplicated on the fly, replacing references to channel 1 with references to channels
// 2-4. Makes changes much simpler.

function duplicateOptions(channel) {
    var regexp1 = /-ch\d/g;
    var regexp2 = /([a-z]+)\(1\)/gi;
    for (var ch = 2; ch <= 4; ch++) {
	let html = document.getElementById("sensor-options-row-ch1").innerHTML;
	let newHtml = html.replace(regexp1, "-ch"+ch).replace(regexp2, "$1("+ch+")");
	document.getElementById("sensor-options-row-ch"+ch).innerHTML = newHtml;
    }
    for (ch = 2; ch <= 4; ch++) {
	let html = document.getElementById("audio-options-row-ch1").innerHTML;
	let newHtml = html.replace(regexp1, "-ch"+ch).replace(regexp2, "$1("+ch+")");
	document.getElementById("audio-options-row-ch"+ch).innerHTML = newHtml;
    }
    for (ch = 2; ch <= 4; ch++) {
	let html = document.getElementById("vib-options-row-ch1").innerHTML;
	let newHtml = html.replace(regexp1, "-ch"+ch).replace(regexp2, "$1("+ch+")");
	document.getElementById("vib-options-row-ch"+ch).innerHTML = newHtml;
    }
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

// Tracks which channel is currently selected.
var selectedChannel = 1;

function selectChannel(channel) {
    // shows the channel-specific options for each category, hides the other three
    for (var i = 1; i <= 4; i++) {
	document.getElementById("sensor-options-row-ch"+i).style.display = (channel == i) ? "" : "none";
	document.getElementById("audio-options-row-ch"+i).style.display = (channel == i) ? "" : "none";
	document.getElementById("vib-options-row-ch"+i).style.display = (channel == i) ? "" : "none";
    }
    document.getElementById("sensor-channel").innerHTML = channel;
    document.getElementById("audio-channel").innerHTML = channel;
    document.getElementById("haptic-channel").innerHTML = channel;
    selectVibWaveform(channel);

    selectedChannel = channel;
}

function enableDisableChannel(channel) {
    var checkbox = document.getElementById("channel-" + channel + "-enabled");
    var enabled = checkbox.checked;
    tab = document.getElementById("channel-" + channel + "-tab");
    tab.disabled = !enabled;
    if (enabled) {
	tab.classList.remove("text-muted");
	tab.classList.remove("bg-light");
    } else {
	tab.classList.add("text-muted");
	tab.classList.add("bg-light");
    }
    // If it's not the currently active class, that's all we have to do.
    if (channel != selectedChannel || enabled) {
	return;
    }
    // If it is currently active, find another channel to be the selected channel
    for (var ch = 1; ch <= 4; ch++) {
	if (ch == channel) {continue;}
	if (document.getElementById("channel-" + ch + "-enabled").checked) {
	    var newTab = document.getElementById("channel-" + ch + "-tab");
	    newTab.click();
	    return;
	}
    }
    // If we get here, it means all four channels are disabled.
    tab.disabled = false;
    tab.classList.remove("text-muted");
    tab.classList.remove("bg-light");
    checkbox.checked = true;
    alert("You must have at least one channel enabled.");
}

function updateProximityAsSpeedStrength(channel) {
    var speedup = document.getElementById("proximity-speed-ch"+channel).value;
    var label = document.getElementById("proximity-speed-label-ch"+channel);
    label.innerHTML = "Speedup: " + speedup + "%";
}

function proximityVibActionChanged(channel) {
    var checked = document.getElementById("use-proximity-for-vib-3-ch"+channel).checked;
    e = document.getElementById("proximity-speed-group-ch" + channel);
    e.style.display = checked ? "" : "none";
}

function selectVibratorType(channel) {
    var type = document.getElementById("vibrator-type-ch"+channel).value;
    var e = document.getElementById("vibrator-frequency-group-ch"+channel);
    e.style.display = (type == "linear") ? "" : "none";
}

function updateVibrationFrequency(channel) {
    var freq = document.getElementById("vibrator-frequency-ch"+channel).value;
    var label = document.getElementById("vibrator-frequency-label-ch"+channel);
    label.innerHTML = "Frequency: " + freq + " Hz";
}
