var NUM_INSTRUMENTS = 2;

function Kit(name) {
  this.SAMPLE_BASE_PATH = "sounds/drum-samples/";
  this.name = name;

  this.kickBuffer = null;
  this.snareBuffer = null;
  this.hihatBuffer = null;
  this.tomhiBuffer = null;
  this.tommidBuffer = null;
  this.tomlowBuffer = null;
  this.clBuffer = null;
  this.cbBuffer = null;
  this.cpBuffer = null;
  this.cyBuffer = null;
  this.rsBuffer = null;

  this.c0Buffer = null;
  this.d0Buffer = null;
  this.e0Buffer = null;
  this.f0Buffer = null;
  this.g0Buffer = null;
  this.a0Buffer = null;
  this.b0Buffer = null;
  this.c1Buffer = null;
  this.d1Buffer = null;


  this.startedLoading = false;
  this.isLoaded = false;
  this.instrumentLoadCount = 0;
}

Kit.prototype.pathName = function() {
  return this.SAMPLE_BASE_PATH + this.name + "/";
};

Kit.prototype.load = function() {
  if (this.startedLoading) {
    return;
  }

  this.startedLoading = true;

  var pathName = this.pathName();

  //don't want to have set number of instruments, or whatever
  var kickPath = pathName + "kick.mp3";
  var snarePath = pathName + "snare.mp3";
  var hihatPath = pathName + "hihat.mp3";
  var tomhiPath = pathName + "tomhi.mp3";
  var tommidPath = pathName + "tommid.mp3";
  var tomlowPath = pathName + "tomlow.mp3";
  var clPath = pathName + "cl.mp3";
  var cbPath = pathName + "cb.mp3";
  var cpPath = pathName + "cp.mp3";
  var cyPath = pathName + "cy.mp3";
  var rsPath = pathName + "rs.mp3";

  var c0Path = pathName + "c0.wav";
  var d0Path = pathName + "d0.wav";
  var e0Path = pathName + "e0.wav";
  var f0Path = pathName + "f0.wav";
  var g0Path = pathName + "g0.wav";
  var a0Path = pathName + "a0.wav";
  var b0Path = pathName + "b0.wav";
  var c1Path = pathName + "c1.wav";
  var d1Path = pathName + "d1.wav";

  this.loadSample(kickPath, "kick");
  this.loadSample(snarePath, "snare");
  this.loadSample(hihatPath, "hihat");
  this.loadSample(tomhiPath, "tomhi");
  this.loadSample(tommidPath, "tommid");
  this.loadSample(tomlowPath, "tomlow");
  this.loadSample(clPath, "cl");
  this.loadSample(cbPath, "cb");
  this.loadSample(cpPath, "cp");
  this.loadSample(cyPath, "cy");
  this.loadSample(rsPath, "rs");

  this.loadSample(c0Path, "c0");
  this.loadSample(d0Path, "d0");
  this.loadSample(e0Path, "e0");
  this.loadSample(f0Path, "f0");
  this.loadSample(g0Path, "g0");
  this.loadSample(a0Path, "a0");
  this.loadSample(b0Path, "b0");
  this.loadSample(c1Path, "c1");
  this.loadSample(d1Path, "d1");

};

//also make a class per buffer/sample? can store prettified name?

//this should definitely be part of a sample class, pass in kit or st
//if we have the name of a sample type, then we can do metaprogramming awesomeness. 
Kit.prototype.loadSample = function(url, instrumentName) {
  //need 2 load asynchronously 
  var request = new XMLHttpRequest();
  request.open("GET", url, true);
  request.responseType = "arraybuffer";

  var kit = this;

  request.onload = function() {
    context.decodeAudioData(
      request.response,
      function(buffer) {
        switch (instrumentName) {
          case "kick":
            kit.kickBuffer = buffer;
            break;
          case "snare":
            kit.snareBuffer = buffer;
            break;
          case "hihat":
            kit.hihatBuffer = buffer;
            break;
          case "tomhi":
            kit.tomhiBuffer = buffer;
            break;
          case "tommid":
            kit.tommidBuffer = buffer;
            break;
           case "tomlow":
            kit.tomlowBuffer = buffer;
            break;
          case "cl":
            kit.clBuffer = buffer;
            break; 
          case "cb":
            kit.cbBuffer = buffer;
            break;
          case "cp":
            kit.cpBuffer = buffer;
            break;  
          case "cy":
            kit.cyBuffer = buffer;
            break; 
          case "rs":
            kit.rsBuffer = buffer;
            break;  
          case "c0":
            kit.c0Buffer = buffer;
            break; 
          case "d0":
            kit.d0Buffer = buffer;
            break; 
          case "e0":
            kit.e0Buffer = buffer;
            break;  
          case "f0":
            kit.f0Buffer = buffer;
            break; 
          case "g0":
            kit.g0Buffer = buffer;
            break; 
          case "a0":
            kit.a0Buffer = buffer;
            break; 
          case "b0":
            kit.b0Buffer = buffer;
            break;  
          case "c1":
            kit.c1Buffer = buffer;
            break; 
          case "d1":
            kit.d1Buffer = buffer;
            break; 
              
        }
        kit.instrumentLoadCount++;
        if (kit.instrumentLoadCount === NUM_INSTRUMENTS) {
          kit.isLoaded = true;
        }
      },
      function(buffer) {
        console.log("Error decoding drum samples!");
      }
    );
  }
  request.send();
}