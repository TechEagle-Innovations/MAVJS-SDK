const { SerialPort } = require('serialport');
const { mavlink20, MAVLink20Processor } = require('./mavlink')
const mavlinkParser = new MAVLink20Processor(null, 1, 50)

const portPath = '/dev/ttyACM0'; // Adjust as needed
const baudRate = 115200;

const port = new SerialPort({ path: portPath, baudRate: baudRate });


const req = new mavlink20.messages.req_uav_cred(0, "", "");
const p = new Buffer.from(req.pack(mavlinkParser));




port.on('data', data => {

    const msg = mavlinkParser.parseBuffer(data)
    // mavlinkParser.decode(msg)
    for (let i = 0; i < msg.length; i++) {

      if(msg[i].name == "ATTITUDE") {
          console.log(msg[i].roll)
        
      }
      
      else if (msg[i].name == "STATUSTEXT") {
        console.log(msg[i].text)
      }
    }
    
    // if(msg.name == "ATTITUDE"){
    //   console.log(msg)
    // }

});

port.on('open', () => {
  console.log(`Serial port ${portPath} opened at ${baudRate} baud rate`);
});

port.on('error', err => {
  console.error(`Error: ${err.message}`);
});
