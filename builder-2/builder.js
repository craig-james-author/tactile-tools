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
    
    // If proximity mode is used, touch-to-stop isn't used
    if (prox == "touch") {
	var touchToStop = document.getElementById("touch-to-stop").checked;
	sketch += "  t->setTouchToStop(" + touchToStop + ");\n";
    }


    //--------------------------------------------------------------------------------
    // Audio, Vibrate, or both?
    //--------------------------------------------------------------------------------

    var useAudioOutput     = document.getElementById("show-hide-audio").checked;
    var useVibrationOutput = document.getElementById("show-hide-haptic").checked;
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

      // If proximity mode is used, Fade-in, fade-out, and volume aren't used.
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
    }
    
    //--------------------------------------------------------------------------------
    // Vibration output. Each channel has its own set of options
    //--------------------------------------------------------------------------------

    if (useVibrationOutput) {
	for (var channel = 1; channel <= 4; channel++) {
	    if (channelEnabled[channel-1]) {

		// Selected envelope or envelope file
		var e = document.getElementById("vibration-waveform-ch"+channel);
		vibChoice = e.options[e.selectedIndex].value;
		if (vibChoice == "custom-file") {
		    var fileName = document.getElementById("custom-vib-name-ch"+channel).value;
		    if (!fileName) {
			alert("Error: Haptic Channel " + channel + ": the 'custom file' choice requires a filename");
			return;
		    }
		    sketch += "  t->setVibrationEnvelopeFile(" + channel + ", \"" + fileName + "\");\n";
		} else if (vibChoice) {
		    sketch += "  t->setVibrationEnvelope(" + channel + ", \"" + vibChoice + "\");\n";
		}

		// Vibrator type, and if linear, get the frequency
		var vibType = document.getElementById("vibrator-type-ch"+channel).value;
		if (vibType == "motor") {
		    sketch += "  t->setVibratorType(" + channel + ", motorVibrator);\n";
		} else {
		    sketch += "  t->setVibratorType(" + channel + ", linearVibrator);\n";
		    var vibFrequency = document.getElementById("vibrator-frequency-ch"+channel).value;
		    sketch += "  t->setVibrationFrequency(" + channel + ", " + vibFrequency + ");\n";
		}

		// What to do with proximity?
		if (prox == "proximity") {
		    //   Radio button 1: nothing, 2: intensity, 3: speed
		    if (document.getElementById("use-proximity-for-vib-2-ch"+channel).checked) {
			sketch += "  t->useProximityAsIntensity(" + channel + ", true);\n";
		    }
		    if (document.getElementById("use-proximity-for-vib-3-ch"+channel).checked) {
			var multiplier = document.getElementById("proximity-speed-ch" + channel).value;
			sketch += "  t->useProximityAsSpeed(" + channel + ", true, " + multiplier + ");\n";
		    }
		}
	    }
	}
    }


    //--------------------------------------------------------------------------------
    // Advanced options
    //--------------------------------------------------------------------------------

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
    var vediv = document.getElementById("vib-proximity-enabled");
    var vddiv = document.getElementById("vib-proximity-disabled");
    if (t == "proximity") {
	frow.style.display = "none";
	vrow.style.display = "none";
	trow.style.display = "none";
	vddiv.style.display = "none";
	vediv.style.display = "";
    } else {
	frow.style.display = "";
	vrow.style.display = "";
	trow.style.display = "";
	vddiv.style.display = "";
	vediv.style.display = "none";
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
    touchModeChanged();
    showHideAudio();
    showHideHaptic();
    showHideAdvanced();
    duplicateHapticOptions();
    placeImages();
    selectHapticOutputChannel(1);
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

// Rather than make four copies, the haptic options are only in the HTML once,
// and are duplicated on the fly, replacing references to channel 1 with references
// to channels 2-4. Makes changes much simpler.
function duplicateHapticOptions(channel) {
    var regexp1 = /-ch\d/g;
    var regexp2 = /([a-z]+)\(1\)/gi;
    for (var ch = 2; ch <= 4; ch++) {
	var html = document.getElementById("vib-options-row-ch1").innerHTML;
	var newHtml = html.replace(regexp1, "-ch"+ch).replace(regexp2, "$1("+ch+")");
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
    var hapticShownDivA = document.getElementById("haptic-options-A");
    var hapticShownDivB = document.getElementById("haptic-options-B");
    if (document.getElementById('show-hide-haptic').checked) {
	hapticHiddenDiv.style.display = "none";
	hapticShownDivA.style.display = "";
	hapticShownDivB.style.display = "";
    } else {
	hapticHiddenDiv.style.display = "";
	hapticShownDivA.style.display = "none";
	hapticShownDivB.style.display = "none";
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
    // shows one of the four forms for vibrations, hides the other three
    for (var i = 1; i <= 4; i++) {
	document.getElementById("vib-options-row-ch"+i).style.display = (channel == i) ? "" : "none";
    }
    selectVibWaveform(channel);
}

function enableDisableChannel(channel) {
    var enabled = document.getElementById("channel-" + channel + "-enabled").checked;
    e = document.getElementById("channel-" + channel + "-tab").disabled = !enabled;
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
