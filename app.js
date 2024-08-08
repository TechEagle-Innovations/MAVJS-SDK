const { SerialPort } = require('serialport');
const { mavlink20, MAVLink20Processor } = require('./mavlink')
const mavlinkParser = new MAVLink20Processor(null, 1, 50)

const portPath = '/dev/ttyACM0'; // Adjust as needed
const baudRate = 115200;

const port = new SerialPort({ path: portPath, baudRate: baudRate });


const req = new mavlink20.messages.req_uav_cred(0, "", "");
const p = new Buffer.from(req.pack(mavlinkParser));


let get_cred = true;


/*
* Helper function to set mode
* {vehicle_type = 1 for copter, 2 for plane}
* {mode_name = string of mode name in capital_letters}
*/
function setMode(vehicle_type, mode_name)
{
  const PLANE = {
    "MANUAL"        : 0,
    "CIRCLE"        : 1,
    "STABILIZE"     : 2,
    "TRAINING"     : 3,
    "ACRO"          : 4,
    "FLY_BY_WIRE_A" : 5,
    "FLY_BY_WIRE_B" : 6,
    "CRUISE"        : 7,
    "AUTOTUNE"      : 8,
    "AUTO"          : 10,
    "RTL"           : 11,
    "LOITER"        : 12,
    "TAKEOFF"       : 13,
    "AVOID_ADSB"    : 14,
    "GUIDED"        : 15,
    "INITIALISING"  : 16,
    "QSTABILIZE"    : 17,
    "QHOVER"       : 18,
    "QLOITER"       : 19,
    "QLAND"         : 20,
    "QRTL"          : 21,
    "QAUTOTUNE"     : 22,
    "QACRO"         : 23,
    "THERMAL"       : 24,
    "LOITER_ALT_QLAND" : 25
  }

  const COPTER = {
        "STABILIZE" :     0,  // manual airframe angle with manual throttle
        "ACRO" :          1,  // manual body-frame angular rate with manual throttle
        'ALT_HOLD' :      2,  // manual airframe angle with automatic throttle
        "AUTO" :          3,  // fully automatic waypoint control using mission commands
        "GUIDED" :        4,  // fully automatic fly to coordinate or fly at velocity/direction using GCS immediate commands
        "LOITER" :        5,  // automatic horizontal acceleration with automatic throttle
        "RTL" :           6,  // automatic return to launching point
        "CIRCLE" :        7,  // automatic circular flight with automatic throttle
        "LAND" :          9,  // automatic landing with horizontal position control
        "DRIFT" :        11,  // semi-autonomous position, yaw and throttle control
        "SPORT" :        13,  // manual earth-frame angular rate control with manual throttle
        "FLIP" :         14,  // automatically flip the vehicle on the roll axis
        "AUTOTUNE" :     15,  // automatically tune the vehicle's roll and pitch gains
        "POSHOLD" :      16,  // automatic position hold with manual override, with automatic throttle
        "BRAKE" :        17,  // full-brake using inertial/GPS system, no pilot input
        "THROW" :        18,  // throw to launch mode using inertial/GPS system, no pilot input
        "AVOID_ADSB" :   19,  // automatic avoidance of obstacles in the macro scale - e.g. full-sized aircraft
        "GUIDED_NOGPS" : 20,  // guided mode but only accepts attitude and altitude
        "SMART_RTL" :    21,  // SMART_RTL returns to home by retracing its steps
        "FLOWHOLD"  :    22,  // FLOWHOLD holds position with optical flow without rangefinder
        "FOLLOW"    :    23,  // follow attempts to follow another vehicle or ground station
        "ZIGZAG"    :    24,  // ZIGZAG mode is able to fly in a zigzag manner with predefined point A and point B
        "SYSTEMID"  :    25,  // System ID mode produces automated system identification signals in the controllers
        "AUTOROTATE" :   26,  // Autonomous autorotation
        "AUTO_RTL" :     27,  // Auto RTL, this is not a true mode, AUTO will report as this mode if entered to perform a DO_LAND_START Landing sequence
        "TURTLE" :       28,  // Flip over after crash

  }

  switch(vehicle_type)
  {
    case 1: // copter
      try{
        const msg = new mavlink20.messages.command_long(0, 0, mavlink20.MAV_CMD_DO_SET_MODE, 0, 1, COPTER[mode_name], 0, 0, 0, 0, 0 )
        const buf = new Buffer.from(msg.pack(mavlinkParser));
        port.write(buf)
      }
      catch (error){
        console.log(error);
      }

      break;
    case 2: // plane
      try{
        const msg = new mavlink20.messages.command_long(0, 0, mavlink20.MAV_CMD_DO_SET_MODE, 0, 1, PLANE[mode_name], 0, 0, 0, 0, 0 )
        const buf = new Buffer.from(msg.pack(mavlinkParser));
        port.write(buf)
      }
      catch (error){
        console.log(error);
      }
      break;
    case defaults:
      break;

  }
  
}

function get_command(target_system, target_component, index, frame_type, command, lat, lng, alt, p1, p2)
{
  const cmd = new mavlink20.messages.mission_item(
    target_system = target_system,
    target_component = target_component,
    seq = index,
    frame = frame_type,
    command = command,
    current = 0,              // false:0, true:1
    autocontinue = 1,         // Auto-continue to next waypoint. 0: false, 1: true. Set false to pause mission after the item completes.
    param1 = p1,
    param2 = p2,
    x = lat,
    y = lng,
    z = alt,
    mission_type = mavlink20.MAV_MISSION_TYPE_MISSION
  );
  return cmd;
}

port.on('data', data => {

    const msg = mavlinkParser.parseBuffer(data)
    // mavlinkParser.decode(msg)
    try{
      for (let i = 0; i < msg.length; i++) {

        switch(msg[i].name)
        {
          case "HEARTBEAT":
            console.log(msg[i]);
          case "ATTITUDE":
            // console.log(msg[i].roll)
            break;

          case "COMMAND_ACK":
            console.log(msg[i])
          break;
          case "STATUSTEXT":
            console.log(msg[i].text)
            break;

          case "UAV_CRED":
            console.log(" UAV_ID = " + `${msg[i].uav_id}`)
            console.log(" UAS PASSKEY = " + `${msg[i].password}`)

          default:
          break;
        }
      }
      if(get_cred)
      {
        // port.write(p)
        // get_command(0,0,0,mavlink20.MAV_FRAME_GLOBAL_RELATIVE_ALT, mavlink20.MAV_CMD_NAV_WAYPOINT, 22.09, 43.23,10,1,1,1,1)
        // port.write(buf)
        setMode(2, "QHOVER");
        get_cred = false;
      }

    }
    catch (error)
    {
      console.error('An error occurred:', error.message);
    }

});

port.on('open', () => {
  console.log(`Serial port ${portPath} opened at ${baudRate} baud rate`);
});

port.on('error', err => {
  console.error(`Error: ${err.message}`);
});
