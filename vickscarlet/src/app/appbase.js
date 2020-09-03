class AppBase {
    constructor() {
        const initRet = this.init();
        if(initRet instanceof Promise) {
            initRet.then(async()=>await this.enter())
        } else {
            this.enter();
        }
    }
    static get version() {return "1.0.0";}
    static get ver() {return this.version;}
    static get v() {return this.version;}
    get version() {return this.constructor.version;}
    get ver() {return this.constructor.version;}
    get v() {return this.constructor.version;}
    async init() {}
    async enter() {}
}

app.AppBase = AppBase;