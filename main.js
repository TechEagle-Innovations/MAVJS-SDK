const { SerialPort } = require('serialport');
const { MavLinkPacketSplitter, MavLinkPacketParser, MavLinkPacket, common, protocol_v2: mavlink } = require('node-mavlink');

async function main()
{
    // substitute /dev/ttyACM0 with your serial port!
    const port = new SerialPort({ path: '/dev/ttyACM0', baudRate: 115200 })

    // constructing a reader that will emit each packet separately
    const reader = port
    .pipe(new MavLinkPacketSplitter())
    .pipe(new MavLinkPacketParser())

    /*
    * Way to read a mavlink message
    */
    reader.on('data', packet => {
        switch(packet.header.msgid)
        {
            case common.StatusText.MSG_ID:
                const message = packet.protocol.data(packet.payload, common.StatusText)
                console.log(message)
            break;

            case common.Attitude.MSG_ID:
                const att_msg = packet.protocol.data(packet.payload, common.Attitude)
                console.log(att_msg.roll)
                break;

            default:
            break

        }
        
      });

    
}

main()