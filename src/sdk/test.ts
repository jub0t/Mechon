import { Engine } from './enums';
import Crabshell from './index';
import express from 'express';
const app = express();

const can = new Crabshell(`127.0.0.1:50051`)
const call = can.core.Clients.broadcast.Subscribe({});

call.on('data', (response: { message: string }) => {
    console.log('Received:', response.message);
});

call.on('end', () => {
    console.log('Stream ended');
    can.core.reconnect();
});

call.on('error', (e) => {
    console.error('Error:', e);
    // Connection broke from the server, reconnect?
    if (e.code == 14) {
        // Reconnect logic
    }
});

app.get("/create-dummy", async (req, res) => {
    const start = new Date();

    const bot = await can.create({
        name: "Master Machine",
        engine: Engine.Node,
    })

    console.log(bot)

    if (bot != null) {
        console.log(bot)
        res.json({
            success: true,
            time: new Date().getTime() - start.getTime(),
            data: bot.data
        })
    } else {
        res.status(500).json({ success: false });
    }
})

app.get("/fake-io", (req, res) => {
    const text = req.query.text;
    console.log(text)
})


app.get("/start/:id/:status", async (req, res) => {
    const { id, status } = req.params

    const results = await can.update_status_by_id(id, parseInt(status))
    res.json(results)
})

// HTTP Route for Start Request (bot service)
app.get('/', async (req, res) => {
    const bots = await can.fetch_all_raw()
    res.json({
        success: true,
        data: bots?.data  // Response from gRPC server
    });
});

const random_port = 7200;
app.listen(random_port, function () {
    console.log(`Live at http://127.0.0.1:${random_port}`);
});
