import Crabshell from ".";

const can = new Crabshell(`127.0.0.1:50051`)


class Abstraction {
    async getApplicationList() {
        return (await can.fetch_all_raw())
    }
}

export default new Abstraction()