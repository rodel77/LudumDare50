import module = require('p5');
// import * as a from "tweenjs";
// import TWEEN = require('@tweenjs/tween.js')
import * as p5Global from 'p5/global';
import * as p5Sound from 'p5/lib/addons/p5.sound';


export = module;
export as namespace p5;
declare global {

    interface Window {
        p5: typeof module,
        sound: typeof p5Sound,
    }
}
