import EventEmitter from 'events';

export enum EventTypes {
    STD_OUT = "std_out",
    STD_ERR = "std_err",
}

export default class CancalaEvent {
    private emitter: EventEmitter;

    constructor() {
        this.emitter = new EventEmitter();
    }

    onOut<T>(callback: (data: T) => void) {
        this.emitter.on(EventTypes.STD_OUT, callback);
    }

    offOut<T>(callback: (data: T) => void) {
        this.emitter.off(EventTypes.STD_OUT, callback);
    }

    onceOut<T>(callback: (data: T) => void) {
        this.emitter.once(EventTypes.STD_OUT, callback);
    }

    emitOut<T>(data: T) {
        this.emitter.emit(EventTypes.STD_OUT, data);
    }
}
