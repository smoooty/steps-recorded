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