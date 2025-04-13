import protoLoader from '@grpc/proto-loader';
import grpcjs from '@grpc/grpc-js';

// Load the .proto files and define package
const packageDefinition = protoLoader.loadSync([
    (`./src/sdk/proto/application.proto`),
    (`./src/sdk/proto/broadcast.proto`),
    (`./src/sdk/proto/system.proto`),
], {
    longs: String,
    enums: Number, // Maybe String?
    keepCase: true,
    defaults: true,
    oneofs: true
});

// Load both bot and broadcast services
const protoBot = grpcjs.loadPackageDefinition(packageDefinition).application;
const protoBroadcast = grpcjs.loadPackageDefinition(packageDefinition).broadcast;

export const clients = {
    bot: new protoBot.Application('localhost:50051', grpcjs.credentials.createInsecure()),
    broadcast: new protoBroadcast.BroadcastService('localhost:50051', grpcjs.credentials.createInsecure())  // Use broadcast service client
}

export default class CoreAbstraction {
    Clients = clients;
    constructor(address: string) { }

    async reconnect() {
        this.Clients = {
            bot: new protoBot.Application('localhost:50051', grpcjs.credentials.createInsecure()),
            broadcast: new protoBroadcast.BroadcastService('localhost:50051', grpcjs.credentials.createInsecure())  // Use broadcast service client
        }
    }
}