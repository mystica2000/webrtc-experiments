import Fastify, { fastify } from 'fastify';

import { Server } from 'socket.io';
import fastifySocketIO from 'fastify-socket.io';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

// // Instantiate Fastify with some config
const app = fastify({
  logger: false,
});

app.register(fastifySocketIO, {
  preClose: (done) => {
    // do other things
    app.io.local.disconnectSockets(true);
    done();
  },
  cors: {
    origin: "http://localhos:4200",
  },
  path: "/signal",
  connectTimeout: 60000,
  pingTimeout: 60000
});

app.get('/', async function () {
  return { message: 'Hello API' };
});


app.ready((err) => {
  if (err) throw err;

  app.io.on('connection', (socket) => {
    console.log("client connected", socket.id);

    socket.on("start", () => {
      socket.except(socket.id).emit("start");
    })

    socket.on('offer', (offer: any) => {
      console.log("GOT OFFER!");
      socket.except(socket.id).emit('offer', offer);
    })

    // Handle 'answer' messages
    socket.on('answer', (answer: any) => {
      console.log("GOT answer!! ");
      socket.except(socket.id).emit('answer', answer);
    });

    // Handle 'ice-candidate' messages
    socket.on('iceCandidate', (candidate: any) => {
      console.log("GOT iceCandidate!! ");
      socket.except(socket.id).emit('iceCandidate', candidate);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });

    socket.on("end", () => {
      console.log("CLOSE");
      // send to all
      socket.broadcast.emit("end");
    })

  })
});

// Start listening.
app.listen({ port, host }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  } else {
    console.log(`[ ready ] http://${host}:${port}`);
  }
});

declare module 'fastify' {
  interface FastifyInstance {
    io: Server<{ offer: any, answer: any, iceCandidate: any, end: any, start: any }>
  }
}