const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// Connect to mongo

mongo.connect('mongodb://127.0.0.1/mongochat', {useNewUrlParser: true}, (err, db) => {
    if (err) {
        console.log(err);
        throw err;
    }

    console.log('MongoDB connected...');

    // Connect to Socket.io
    client.on('connection', socket => {
        let chat = db.collection('chats');

        // Create function to send status
        sendStatus = function(s) {
            socket.emit('status', s);
        }

        // Get chats from mongo collection
        chat.find().limit(100).sort({_id:1}).toArray(function (err, res) {
            if (err) {
                console.log(err);
                throw err;
            }

            // Emit the messages
            socket.emit('output', res);
        });

        // Handle input events
        socket.on('input', (data) => {
            let name = data.name;
            let message = data.message;

            // Check for name and message

            if (name == '' || message == '') {
                // Send error status
                sendStatus ('Please enter a name and a message');
            } else {
                // Insert message
                chat.insert({name: name, message: message}, () => {
                    client.emit('output', [data]);

                    // Send status object
                    sendStatus ({
                        message: 'Message sent',
                        clear: true
                    });
                });
            }

        });

        // Handle clear
        socket.on('clear', (data) => {
            // Remove all chats from collection
            chat.remove({}, () => {
                socket.emit('cleared');
            })
        })
    })
});
