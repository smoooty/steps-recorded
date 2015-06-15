//audio node variables
var context;
var convolver;
var compressor;
var masterGainNode;
var effectLevelNode;
var lowPassFilterNode;

var noteTime;
var startTime;
var lastDrawTime = -1;
var LOOP_LENGTH = 16;
var rhythmIndex = 0;
var timeoutId;
var testBuffer = null;

var currentKit = null;
var reverbImpulseResponse = null;

var tempo = 120;
var TEMPO_MAX = 400;
var TEMPO_MIN = 20;
var TEMPO_STEP = 4;
var recorder;

if (window.hasOwnProperty('AudioContext') && !window.hasOwnProperty('webkitAudioContext')) {
  window.webkitAudioContext = AudioContext;

}

$(function() {
  init();
  toggleSelectedListener();
  playPauseListener();
  lowPassFilterListener();
  reverbListener();
  createLowPassFilterSliders();
  initializeTempo();
  changeTempoListener();
});

function createLowPassFilterSliders() {
  $("#freq-slider").slider({
    value: 1,
    min: 0,
    max: 1,
    step: 0.01,
    disabled: true,
    slide: changeFrequency
  });
  $("#quality-slider").slider({
    value: 0,
    min: 0,
    max: 1,
    step: 0.01,
    disabled: true,
    slide: changeQuality
  });
}

function lowPassFilterListener() {
  $('#lpf').click(function() {
    $(this).toggleClass("active");
    $(this).blur();
    if ($(this).hasClass("btn-default")) {
      $(this).removeClass("btn-default");
      $(this).addClass("btn-warning");
      lowPassFilterNode.active = true;
      $("#freq-slider,#quality-slider").slider( "option", "disabled", false );
    }
    else {
      $(this).addClass("btn-default");
      $(this).removeClass("btn-warning");
      lowPassFilterNode.active = false;
      $("#freq-slider,#quality-slider").slider( "option", "disabled", true );
    }
  })
}

function reverbListener() {
  $("#reverb").click(function() {
    $(this).toggleClass("active");
    $(this).blur();
    if ($(this).hasClass("btn-default")) {
      $(this).removeClass("btn-default");
      $(this).addClass("btn-warning");
      convolver.active = true;
    }
    else {
      $(this).addClass("btn-default");
      $(this).removeClass("btn-warning");
      convolver.active = false;
    }
  })
}

function changeFrequency(event, ui) {
  var minValue = 40;
  var maxValue = context.sampleRate / 2;
  var numberOfOctaves = Math.log(maxValue / minValue) / Math.LN2;
  var multiplier = Math.pow(2, numberOfOctaves * (ui.value - 1.0));
  lowPassFilterNode.frequency.value = maxValue * multiplier;
}

function changeQuality(event, ui) {
  //30 is the quality multiplier, for now. 
  lowPassFilterNode.Q.value = ui.value * 30;
}

function playPauseListener() {
  $('#play-pause').click(function() {
    var $span = $(this).children("span");
    if($span.hasClass('fa-play')) {
      $span.removeClass('fa-play');
      $span.addClass('fa-pause');
      handlePlay();
    } 
    else {
      $span.addClass('fa-play');
      $span.removeClass('fa-pause');
      handleStop();
    }
  });
}




function toggleSelectedListener() {
  $('.pad').click(function() {
    $(this).toggleClass("selected");
  });
}

function init() {
  initializeAudioNodes();
  loadKits();
  loadImpulseResponses();
}

function initializeAudioNodes() {
  context = new webkitAudioContext();
  var finalMixNode;
  if (context.createDynamicsCompressor) {
      // Create a dynamics compressor to sweeten the overall mix.
      compressor = context.createDynamicsCompressor();
      compressor.connect(context.destination);
      finalMixNode = compressor;
  } else {
      // No compressor available in this implementation.
      finalMixNode = context.destination;
  }


  // Create master volume.
  // for now, the master volume is static, but in the future there will be a slider
  masterGainNode = context.createGain();
  masterGainNode.gain.value = 0.7; // reduce overall volume to avoid clipping
  masterGainNode.connect(finalMixNode);








    source = masterGainNode;

    delay = context.createDelay();
    delay.delayTime.value = 0.5;

    feedback = context.createGain();
    feedback.gain.value = 0.8;

    filter = context.createBiquadFilter();
    filter.frequency.value = 1000;

    delay.connect(feedback);
    feedback.connect(filter);
    filter.connect(delay);

    source.connect(delay);
    source.connect(context.destination);
    delay.connect(context.destination);


  
      recorder = new Recorder(finalMixNode);


  //connect all sounds to masterGainNode to play them

  //don't need this for now, no wet dry mix for effects
  // // Create effect volume.
  // effectLevelNode = context.createGain();
  // effectLevelNode.gain.value = 1.0; // effect level slider controls this
  // effectLevelNode.connect(masterGainNode);

  // Create convolver for effect
  convolver = context.createConvolver();
  convolver.active = false;
  // convolver.connect(effectLevelNode);

  //Create Low Pass Filter
  lowPassFilterNode = context.createBiquadFilter();
  //this is for backwards compatibility, the type used to be an integer
  lowPassFilterNode.type = (typeof lowPassFilterNode.type === 'string') ? 'lowpass' : 0; // LOWPASS
  //default value is max cutoff, or passing all frequencies
  lowPassFilterNode.frequency.value = context.sampleRate / 2;
  lowPassFilterNode.connect(masterGainNode);
  lowPassFilterNode.active = false;
}

function loadKits() {
  //name must be same as path
  var kit = new Kit("TR808");
  kit.load();

  //TODO: figure out how to test if a kit is loaded
  currentKit = kit;
}

function loadImpulseResponses() {
  reverbImpulseResponse = new ImpulseResponse("sounds/impulse-responses/matrix-reverb2.wav");
  reverbImpulseResponse.load();
}


//TODO delete this
function loadTestBuffer() {
  var request = new XMLHttpRequest();
  var url = "http://www.freesound.org/data/previews/102/102130_1721044-lq.mp3";
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  request.onload = function() {
    context.decodeAudioData(
      request.response,
      function(buffer) { 
        testBuffer = buffer;
      },
      function(buffer) {
        console.log("Error decoding drum samples!");
      }
    );
  }
  request.send();
}

//TODO delete this
function sequencePads() {
  $('.pad.selected').each(function() {
    $('.pad').removeClass("selected");
    $(this).addClass("selected");
  });
}

function playNote(buffer, noteTime) {
  var voice = context.createBufferSource();
  voice.buffer = buffer;

  var currentLastNode = masterGainNode;
  if (lowPassFilterNode.active) {
    lowPassFilterNode.connect(currentLastNode);
    currentLastNode = lowPassFilterNode;
  }
  if (convolver.active) {
    convolver.buffer = reverbImpulseResponse.buffer;
    convolver.connect(currentLastNode);
    currentLastNode = convolver;
  }

  voice.connect(currentLastNode);
  voice.start(noteTime);
}

function schedule() {
  var currentTime = context.currentTime;

  // The sequence starts at startTime, so normalize currentTime so that it's 0 at the start of the sequence.
  currentTime -= startTime;

  while (noteTime < currentTime + 0.200) {
      var contextPlayTime = noteTime + startTime;
      var $currentPads = $(".column_" + rhythmIndex);
      $currentPads.each(function() {
        if ($(this).hasClass("selected")) {
          var instrumentName = $(this).parents().data("instrument");
          switch (instrumentName) {
          case "kick":
            playNote(currentKit.kickBuffer, contextPlayTime);
            break;
          case "snare":
            playNote(currentKit.snareBuffer, contextPlayTime);
            break;
          case "hihat":
            playNote(currentKit.hihatBuffer, contextPlayTime);
            break;
          case "tomhi":
            playNote(currentKit.tomhiBuffer, contextPlayTime);
            break;
          case "tommid":
            playNote(currentKit.tommidBuffer, contextPlayTime);
            break;  
          case "tomlow":
            playNote(currentKit.tomlowBuffer, contextPlayTime);
            break;  
          case "cl":
            playNote(currentKit.clBuffer, contextPlayTime);
            break; 
          case "cb":
            playNote(currentKit.cbBuffer, contextPlayTime);
            break;  
         case "cp":
            playNote(currentKit.cpBuffer, contextPlayTime);
            break;  
          case "cy":
            playNote(currentKit.cyBuffer, contextPlayTime);
            break;
          case "rs":
            playNote(currentKit.rsBuffer, contextPlayTime);
            break; 
          case "c0":
            playNote(currentKit.c0Buffer, contextPlayTime);
            break;  
          case "d0":
            playNote(currentKit.d0Buffer, contextPlayTime);
            break;  
          case "e0":
            playNote(currentKit.e0Buffer, contextPlayTime);
            break;  
          case "f0":
            playNote(currentKit.f0Buffer, contextPlayTime);
            break;  
          case "g0":
            playNote(currentKit.g0Buffer, contextPlayTime);
            break;  
          case "a0":
            playNote(currentKit.a0Buffer, contextPlayTime);
            break;  
          case "b0":
            playNote(currentKit.b0Buffer, contextPlayTime);
            break; 
          case "c1":
            playNote(currentKit.c1Buffer, contextPlayTime);
            break;  
          case "d1":
            playNote(currentKit.d1Buffer, contextPlayTime);
            break;               

        }
          //play the buffer
          //store a data element in the row that tells you what instrument
        }
      });
      if (noteTime != lastDrawTime) {
          lastDrawTime = noteTime;
          drawPlayhead(rhythmIndex);
      }
      advanceNote();
  }

  timeoutId = requestAnimationFrame(schedule)
}

function drawPlayhead(xindex) {
    var lastIndex = (xindex + LOOP_LENGTH - 1) % LOOP_LENGTH;

    //can change this to class selector to select a column
    var $newRows = $('.column_' + xindex);
    var $oldRows = $('.column_' + lastIndex);
    
    $newRows.addClass("playing");
    $oldRows.removeClass("playing");
}

function advanceNote() {
    // Advance time by a 16th note...
    // var secondsPerBeat = 60.0 / theBeat.tempo;
    //TODO CHANGE TEMPO HERE, convert to float
    tempo = Number($("#tempo-input").val());
    var secondsPerBeat = 60.0 / tempo;
    rhythmIndex++;
    if (rhythmIndex == LOOP_LENGTH) {
        rhythmIndex = 0;
    }
   
    //0.25 because each square is a 16th note
    noteTime += 0.25 * secondsPerBeat
    // if (rhythmIndex % 2) {
    //     noteTime += (0.25 + kMaxSwing * theBeat.swingFactor) * secondsPerBeat;
    // } else {
    //     noteTime += (0.25 - kMaxSwing * theBeat.swingFactor) * secondsPerBeat;
    // }

}

function handlePlay(event) {
    rhythmIndex = 0;
    noteTime = 0.0;
    startTime = context.currentTime + 0.005;
    schedule();
}

function handleStop(event) {
  cancelAnimationFrame(timeoutId);
  $(".pad").removeClass("playing");
}

function initializeTempo() {
  $("#tempo-input").val(tempo);
}

function changeTempoListener() {
  $("#increase-tempo").click(function() {
    if (tempo < TEMPO_MAX) {
      tempo += TEMPO_STEP;
      $("#tempo-input").val(tempo);
    }
  });

  $("#decrease-tempo").click(function() {
    if (tempo > TEMPO_MIN) {
      tempo -= TEMPO_STEP;
      $("#tempo-input").val(tempo);
    } 
  });
}



function __log(e, data) {
    log.innerHTML += "\n" + e + " " + (data || '');
  }

  var audio_context;
  var recorder;

  function startUserMedia() {
    
    __log('Media stream created.');
    input.start();
    __log('Input connected to audio context destination.');
    
    recorder = new Recorder(input);
    __log('Recorder initialised.');
  }

  function startRecording(span) {
    recorder && recorder.record();
    span.hidden = true;
    span.nextElementSibling.hidden = false;
    __log('Recording...');
  }

  function stopRecording(span) {
    recorder && recorder.stop();
    span.hidden = true;
    span.previousElementSibling.hidden = false;
    __log('Stopped recording.');
    
    // create WAV download link using audio data blob
    createDownloadLink();
    
    recorder.clear();
  }

  function createDownloadLink() {
    recorder && recorder.exportWAV(function(blob) {
      var url = URL.createObjectURL(blob);
      var li = document.createElement('li');
      var au = document.createElement('audio');
      var hf = document.createElement('a');
      
      au.controls = true;
      au.src = url;
      hf.href = url;
      hf.download = new Date().toISOString() + '.wav';
      hf.innerHTML = hf.download;
      li.appendChild(au);
      li.appendChild(hf);
      recordingslist.appendChild(li);
    });
  }

  window.onload = function init() {
    try {
      // webkit shim
     window.AudioContext = window.AudioContext || window.webkitAudioContext;
      navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
      window.URL = window.URL || window.webkitURL;
      
      audio_context = new AudioContext;
      __log('Audio context set up.');
    } catch (e) {
      alert('No web audio support in this browser!');
    }
    
    initializeAudioNodes();
    
  };


