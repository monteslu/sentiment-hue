var sentiment = require('sentiment');
var _ = require('lodash');


var red = {
  setState: {
    options: {
      hue: 65000,
      bri: 255,
      sat: 255,
      transitiontime: 10
    }
  }
};

var green = {
  setState: {
    options: {
      hue: 25000,
      bri: 255,
      sat: 255,
      transitiontime: 10
    }
  }
};

var white = {
  setState: {
    options: {
      hue: 65000,
      bri: 255,
      sat: 0,
      transitiontime: 1
    }
  }
};

var meh = {
  setState: {
    options: {
      hue: 5000,
      bri: 255,
      sat: 255,
      transitiontime: 10
    }
  }
};


var twitterColor = {
  setState: {
    options: {
      hue: 40000,
      bri: 255,
      sat: 220,
      transitiontime: 1
    }
  }
};

function Plugin(messenger, options){
  this.messenger = messenger;
  this.options = options;
  this.options.lightNumbers = this.options.lightNumbers.split(',');
  return this;
}

function cloneMsg(msgHeader, lightColor, lightNumber){
  msgHeader.message = lightColor;
  var msg = _.cloneDeep(msgHeader);
  msg.message.setState.lightNumber = lightNumber;
  return msg;
}

Plugin.prototype.onMessage = function(message){
  var data = message.payload || message.message || {};
  var self = this;
  if(data.text){
    sentiment(data.text, function(err, result){
      console.log(data.text, result);
      if(!err){

        this.options.lightNumbers.forEach(function(lightNumber){
          var light;

          if(result.score > 1){
            light = green;
          }else if(result.score < -1){
            light = red;
          }else{
            light = meh;
          }

          light.setState.lightNumber = lightNumber;

          var msgHeader = {
              devices: self.messenger.gatewayId,
              subdevice: self.options.huePluginName
          };

          var twitterMsg = cloneMsg(msgHeader, twitterColor, lightNumber);
          var sentimentMsg = cloneMsg(msgHeader, light, lightNumber);
          var whiteMsg = cloneMsg(msgHeader, white, lightNumber);


          var sendWhite = function(){
            self.messenger.send(whiteMsg, function(setErrw, ok){
              console.log(setErrw, ok);
            });
          };

          var sendSentiment = function(){
            self.messenger.send(sentimentMsg, function(setErrw, ok){
              console.log(setErrw, ok);
              setTimeout(sendWhite, 10000);
            });
          };

          self.messenger.send(twitterMsg, function(setErr, ok){
            setTimeout(sendSentiment, 2000);
          });

        });
      }

    });
  }
};

Plugin.prototype.destroy = function(){
  //clean up
  console.log('destroying.', this.options);
};

var messageSchema = {
  type: 'object',
  properties: {
    text: {
      type: 'string',
      required: true
    }
  }
};

var optionsSchema = {
  type: 'object',
  properties: {
    huePluginName: {
      type: 'string',
      required: true
    },
    lightNumbers: {
      type: 'string',
      required: true
    }
  }
};


module.exports = {
  Plugin: Plugin,
  optionsSchema: optionsSchema,
  messageSchema: messageSchema
};
