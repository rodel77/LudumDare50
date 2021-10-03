declare function loadSound(path: string): p5.SoundFile;

declare var drawingContext: CanvasRenderingContext2D;

function sign(x: number) : number{
    if(x==0) return 0;
    return x>0 ? 1 : -1;
}

function towards(current: number, target: number, max_delta: number) : number {
    if(abs(target-current)<=max_delta) return target;

    return current + sign(target - current) * max_delta;
}

function clamp(x: number, a: number, b: number){
    return max(min(b, x), a);
}

const COLORS = {
    YELLOW: [241, 196, 15],
    BLACK:  [44, 62, 80],
    BLUE:   [52, 152, 219],
    CYAN:   [26, 188, 156],
    WHITE:  [255, 255, 255],
    GREEN:  [46, 204, 113],
    PURPLE: [155, 89, 182],
    RED:    [231, 76, 60],
    ORANGE: [230, 126, 34],
    PINK:   [243, 104, 224],
};

enum Emotion {
    HAPPY,
    SAD,
    MEH,
};

enum Interest {
    SQUARE,
    CIRCLE,
    TRIANGLE,
    DIAMOND,
    HEX,
};

function random_interest(): Interest{
    let less = 3;

    if(cycle_count>10) less = 2;
    if(cycle_count>75) less = 1;
    if(cycle_count>100) less = 0;

    
    let r = floor(random(0, Object.keys(Interest).length/2 - less));
    console.log("Result", r);
    return r;
}

interface ConversationEntry {
    conversation: Conversation;
    timestamp: number;
}

class Relation {
    a: Person;
    b: Person;
    quality: number = 1;
    conversation_stack: ConversationEntry[] = [];
    harmed: boolean = false;
    harm_timestamp: number;
    
    constructor(a: Person, b: Person){
        this.a = a;
        this.b = b;
    }

    destroy() {
        conversations = conversations.filter((conv)=>{
            return conv.relation!=this;
        });
        this.conversation_stack.filter(()=>{return false});
    }
};

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function easeInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
    }

let screen_size: number;
let deleting_relations = false;

function get_scale(): number{
    return screen_size / 1000;
}

let interests: Map<Interest, number> = new Map();

class Person {
    happiness: number = 0;
    target_happiness: number = 0;
    interests: Interest[] = [];
    last_epiphany: number = 0;
    depression: number = 0;
    // emotion: Emotion = Emotion.HAPPY;
    x: number;
    y: number;
    origin_x: number;
    origin_y: number;
    dead: boolean;

    offset_x = 0;
    offset_y = 0;
    offset_time = 0;

    eye_x: number = 0;
    eye_y: number = 0;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
        this.origin_x = x;
        this.origin_y = y;
    }

    get_absolute_position() : p5.Vector {
        // console.log(this.x * screen_size, mouseX)
        return createVector(this.x * screen_size * .4 + width/2, this.y * screen_size * .4 + height/2);
    }

    collides(x: number, y: number) {
        if(this.dead) return false;
        let position = this.get_absolute_position();
        let delta = createVector(x, y).sub(position);
        return delta.mag() < 50 * get_scale();
    }

    epiphany_chance(){
        return this.happiness!=.5 ? map(clamp(cycle_count, 70, 200), 70, 200, .3, .5) : .7;
    }

    epiphany_frecuency(){
        return this.happiness!=.5 ? map(clamp(cycle_count, 100, 200), 100, 200, 7, 4) : 1;
    }

    cycle(){
        let alone_interest: Interest;
        interests.forEach((amount, key)=>{
            if(amount==1){
                alone_interest = key;
            }
        });

        this.last_epiphany++;
        if((this.last_epiphany>this.epiphany_frecuency() && random()<this.epiphany_chance()) || (alone_interest)){
            if(!alone_interest && random()>.2){
                if(this.interests.length>1){
                    this.interests.sort((a, b) => {
                        return (interests.has(a) ? interests.get(a) : 0) - (interests.has(b) ? interests.get(b) : 0);
                    });

                    
                    let interest = this.interests.pop();
                    console.log("Removing:", Interest[interest])
                    // let index = floor(random(0, this.interests.length))
                    // let interest = this.interests[index];
                    // this.interests.splice(index, 1);
                    console.log("Adding interest #2", interest);
                    interests.set(interest, interests.get(interest)-1);
                }
            }else{
                if(this.interests.length<2 && cycle_count>10){
                    let possible: Interest[] = [];

                    // if(cycle_count>100){
                        possible[0] = random_interest();
                        possible[1] = random_interest();
                        possible[2] = random_interest();
                        possible[3] = random_interest();
                        possible[4] = random_interest();
                        possible[5] = random_interest();
                    // }else{
                    //     if(cycle_count>75 && !interests.has(Interest.DIAMOND)){
                    //         possible.push(Interest.DIAMOND);
                    //     }
                    //     if(cycle_count>100 && !interests.has(Interest.HEX)){
                    //         possible.push(Interest.HEX);
                    //     }
    
                    //     interests.forEach((_, key)=>{
                    //         possible.push(key);
                    //     });
                    //     possible.sort((a, b) => {
                    //         return (interests.has(a) ? interests.get(a) : 0)-(interests.has(b) ? interests.get(b) : 0);
                    //     });
                    // }

                    for(let interest of possible){
                        if(!this.has_interest(interest)){
                            this.interests.push(interest);
                            interests.set(interest, interests.has(interest) ? interests.get(interest)+1 : 1);
                            break;
                        }
                    }
                }
            }
            this.last_epiphany = 0;
        }
    }

    evaluate_happiness() {
        let count = 0;
        relations.forEach((relation) => {
            if(!relation.harmed && (relation.a==this || relation.b==this)){
                count++;
            }
        });

        if(count==0){
            this.target_happiness = 0;
        }else if(count>2){
            this.target_happiness = .5;
        }else{
            this.target_happiness = 1;
        }
    }

    has_relation(other: Person){
        for(let relation of relations){
            if((relation.a==this || relation.b==this) && (relation.a==other || relation.b==other)){
                return true;
            }
        };
        return false
    }

    has_interest(interest: Interest){
        return this.interests.indexOf(interest)!=-1;
    }

    hear_topic(other: Person, relation: Relation, topic: Interest){
        // if(!this.has_interest(topic)){
        //     // Check if more than 2 relations have the same interest
        //     let count = 0;
        //     relations.filter((relation)=>{
        //         return relation.a==this || relation.b==this;
        //     }).map((relation)=>{
        //         return relation.a==this ? relation.b : relation.a;
        //     }).forEach((person) => {
        //         if(person.has_interest(topic)) count++;
        //     });

        //     if(count>=2){
        //         this.interests.push(topic);
        //     }else{
        //         // relation.quality -= .1;
        //     }
        // }
    }

    draw() {
        if(this.happiness!=1 && cycle_count>0){
            this.depression += 0.2 * deltaTime/1000;
        }
        if(this.happiness!=0 && this.depression>0){
            this.depression -= 0.1 * deltaTime/1000;
        }
        this.depression = clamp(this.depression, 0, 1);
        if(this.depression==1){
            if(!this.dead){
                for(let interest of this.interests){
                    interests.set(interest, interests.get(interest)-1);
                }
                relations = relations.filter((relation)=>relation.a!=this && relation.b!=this);
                if(selected_person==this) selected_person = undefined;
                this.dead = true;
                dead.play();
            }
        }
        
        this.offset_time += deltaTime;
        if(this.offset_time>500){
            this.offset_time = 0;
            this.offset_x = (random()-.5)*.6;
            this.offset_y = (random()-.5)*.6;
        }
        this.x = lerp(this.x, this.origin_x + this.offset_x, .002);
        this.y = lerp(this.y, this.origin_y + this.offset_y, .002);

        let position = this.get_absolute_position();
        this.happiness = towards(this.happiness, this.target_happiness, .05);

        push();
        
        noStroke();
        translate(position.x, position.y);
        scale(get_scale()*.9, get_scale()*.9);
        if(this.collides(mouseX, mouseY) || selected_person==this) scale(1.1, 1.1)
    
        // Shadow
        push();
        translate(10, 10)
        fill(0, 0, 0, 50);
        circle(0, 0, 100);
        pop();
    
        fill(lerpColor(color(COLORS.BLUE),color(COLORS.YELLOW), this.happiness));
        if(this.dead) fill(COLORS.RED);
        circle(0, 0, 100);
        fill(COLORS.BLACK);
        push();
        let delta_x = mouseX-position.x;
        let delta_y = mouseY-position.y;

        let mag = sqrt(pow(delta_x, 2) + pow(delta_y, 2));

        if(this.dead){
            translate(this.eye_x, this.eye_y);
            strokeWeight(get_scale()*3);
            stroke(COLORS.BLACK)
            line(-15, -15, -10, -10);
            line(-10, -15, -15, -10);
    
            line(15, -15, 10, -10);
            line(10, -15, 15, -10);
        }else{
            this.eye_x = lerp(this.eye_x, delta_x/mag, .25);
            this.eye_y = lerp(this.eye_y, delta_y/mag, .25);
            translate(this.eye_x, this.eye_y);
            ellipse(-15, -10, 10, 15);
            ellipse(15, -10, 10, 15);
        }
        pop();
    
        stroke(COLORS.BLACK);
        strokeWeight(5);
        strokeCap(PROJECT);
        noFill();
        if(selected_person==this || this.dead){
            circle(0, 20, 20);
        }else{
            let point_y = map(this.happiness, 0, 1, 5, 35);
            bezier(-20, 20, -10, point_y, 10, point_y, 20, 20);
        }

        if(this.depression>0 && !this.dead){
            noStroke()
            fill(COLORS.BLACK);
            ellipse(40, -40, 35, 35);
            fill(COLORS.RED);
            arc(40, -40, 30, 30, -.01, PI*2*this.depression);
        }

        // Interests
        if(!this.dead){
            noStroke();
            fill(COLORS.WHITE);
            translate(-(this.interests.length-1)*25/2, -75);
            this.interests.forEach((interest) => {
                draw_interest(interest);
                translate(25, 0);
            });
        }
        pop();
    }
};

class Conversation {
    relation: Relation;
    a_topic: Interest;
    b_topic: Interest;
    a_liked: boolean;
    b_liked: boolean;
    flushed: boolean = false;
    timestamp = Date.now();
    
    constructor(relation: Relation){
        this.relation = relation;
    }

    render() {
        let alpha = this.get_alpha();

        let pointa = this.relation.a.get_absolute_position();
        let pointb = this.relation.b.get_absolute_position();
        // Lovely typescript, innit?
        let ab = <p5.Vector><unknown>p5.Vector.lerp(pointa, pointb, easeInOutQuad(alpha));
        let ba = <p5.Vector><unknown>p5.Vector.lerp(pointb, pointa, easeInOutQuad(alpha));

        let scl = get_scale() * 1.2;
        push();
        translate(ab.x, ab.y);
        scale(scl, scl);
        draw_interest(this.a_topic);
        pop();
        
        push();
        translate(ba.x, ba.y);
        scale(scl, scl);
        draw_interest(this.b_topic);
        pop();

        return alpha<1;
    }

    get_alpha(): number {
        return (Date.now()-this.timestamp)/2000;
    }
};

function draw_interest(interest: Interest){
    stroke(COLORS.BLACK);
    strokeWeight(5 * get_scale());
    switch(interest){
            case Interest.HEX:
            fill(COLORS.PINK);
            beginShape()
            vertex(10, 0);
            vertex(6, -10);
            vertex(-6, -10);
            vertex(-10, 0);
            vertex(-6, 10);
            vertex(6, 10);
            vertex(10, 0);
            endShape()
            break;
            case Interest.CIRCLE:
            fill(COLORS.PURPLE);
            circle(0, 0, 20);
            break;
            case Interest.SQUARE:
            fill(COLORS.GREEN);
            rect(-10, -10, 20, 20);
            break;
            case Interest.TRIANGLE:
            fill(COLORS.YELLOW);
            triangle(0, -10, 10, 10, -10, 10);
            break;
            case Interest.DIAMOND:
            fill(COLORS.ORANGE);
            push();
            rotate(PI/4);
            rect(-15/2, -15/2, 15, 15);
            pop();
            break;
    }
}

function create_relation(a: Person, b: Person){
    let ab = new Relation(a, b);
    relations.push(ab);

    persons.forEach((person)=>person.evaluate_happiness());
}

let selected_person: Person;
let persons: Person[] = [];
let relations: Relation[] = [];
let conversations: Conversation[] = [];
let score = 0;

let like_image;
let font, font2;
let plop, pling, nice, rip, dead, appear;
function preload(){
    soundFormats("mp3");
    plop = loadSound("assets/plop");
    pling = loadSound("assets/pling");
    nice = loadSound("assets/nice");
    rip = loadSound("assets/rip");
    dead = loadSound("assets/dead");
    appear = loadSound("assets/appear");
    like_image = loadImage("assets/like.png");
    font = loadFont("assets/Ubuntu-Medium.ttf")
    font2 = loadFont("assets/Merriweather-Light.ttf")
}

let positions: p5.Vector[] = [];
let au: p5.SoundFile;
let g;
function setup(){
    createCanvas(windowWidth, windowHeight);
    textFont(font);
    // createCanvas(windowWidth, windowHeight, WEBGL);
    // smooth()
    // g = createGraphics(windowWidth, windowHeight, p5.Renderer);

    positions = [
        createVector(-1, 1),
        createVector(1, -1),
        createVector(1, 1),
        createVector(-1, -1),
        createVector(0, .6),
        createVector(0, -.6),
        createVector(.6, 0),
        createVector(-.6, 0),
    ]

    // for(let i = 0; i < 10; i++){
    //     while(true){
    //         let pos = createVector(floor(random(-2, 2)), floor(random(-2, 2)));

    //         if(!positions.find((a) => a.x==pos.x && a.y==pos.y)){
    //             positions.push(pos);

    //             // let person = new Person(pos.x/3, pos.y/3);
    //             // person.interests.push(Interest.CIRCLE);
    //             // person.interests.push(Interest.SQUARE);
    //             // persons.push(person);

    //             break;
    //         }
    //     }
    // }

    create_person();
    create_person();
};

function create_person(){
    let pos = positions.pop();
    let person = new Person(pos.x/2, pos.y/2);
    while(person.interests.length!=2){
        let interest = random_interest();
        if(!person.has_interest(interest)){
            person.interests.push(interest);
            console.log("Adding interest #1", interest);
            interests.set(interest, interests.has(interest) ? interests.get(interest)+1 : 1);
        }
    }
    // person.interests.push(Interest.CIRCLE);
    // person.interests.push(Interest.DIAMOND);
    persons.push(person);
}

function draw_relations(){
    let strk = 15 * get_scale()
    // for(let relation of relations){
    let changed: Relation;
    relations = relations.filter((relation)=>{
        let apos = relation.a.get_absolute_position();
        let bpos = relation.b.get_absolute_position();
        let clr = lerpColor(lerpColor(color(COLORS.RED), color(COLORS.YELLOW), relation.quality), color(COLORS.GREEN), relation.quality);

        // let delta = apos.add(bpos.sub(apos).div(2));
        let delta = p5.Vector.sub(bpos, apos);
        let mag = delta.mag();

        let dot = ( ((mouseX-apos.x)*(bpos.x-apos.x)) + ((mouseY-apos.y)*(bpos.y-apos.y)) ) / pow(mag,2);

        let closest = p5.Vector.add(apos, delta.mult(clamp(dot, 0, 1)));
        // circle(closest.x, closest.y, 10);

        let colliding = pow(closest.x-mouseX, 2) + pow(closest.y-mouseY, 2) <= pow(1 + strk, 2);
        if(colliding && !relation.harmed){
            if(deleting_relations){
                rip.play();
                relation.destroy();
                changed = relation;
                return false;
            }
            clr.setAlpha(100);
        }

        let scl = get_scale();
        if(relation.harmed){
            drawingContext.setLineDash([10*scl, 30*scl]);
            clr.setAlpha(pow(sin(Date.now()/100), 2)*200);
        }else{
            drawingContext.setLineDash([]);
        }

        stroke(COLORS.BLACK);
        strokeWeight(strk*1.5);
        line(apos.x, apos.y, bpos.x, bpos.y);

        strokeWeight(strk);
        stroke(clr);
        line(apos.x, apos.y, bpos.x, bpos.y);
        drawingContext.setLineDash([]);

        if(relation.harmed && Date.now()-relation.harm_timestamp>5000){
            relation.destroy();
            return false;
        }

        return true;
    });

    if(changed){
        changed.a.evaluate_happiness();
        changed.b.evaluate_happiness();
    }
}

function draw_converations_feedback(){
    for(let relation of relations){
        push();
        relation.conversation_stack = relation.conversation_stack.filter((conversation) => {
            let alpha = (Date.now()-conversation.timestamp)/500;

            // Hacky code warning
            let apos = conversation.conversation.relation.a.get_absolute_position();
            let bpos = conversation.conversation.relation.b.get_absolute_position();

            let scl = get_scale();

            push();
            let delta = p5.Vector.sub(bpos, apos);
            let pos = p5.Vector.add(apos, delta.div(delta.mag()).mult(45 * scl));
            translate(pos.x, pos.y);

            scale(scl*1.3, scl*1.3);
            strokeWeight(3 * get_scale());
            stroke(COLORS.BLACK[0]);
            if(conversation.conversation.a_liked){
                fill(COLORS.GREEN);
            }else{
                rotate(PI);
                fill(COLORS.RED);
            }
            triangle(0, -10, 10, 10, -10, 10);
            pop();

            push();
            delta = p5.Vector.sub(apos, bpos);
            pos = p5.Vector.add(bpos, delta.div(delta.mag()).mult(45 * scl));
            translate(pos.x, pos.y);

            scale(scl*1.3, scl*1.3);
            strokeWeight(3 * get_scale());
            stroke(COLORS.BLACK[0]);
            if(conversation.conversation.b_liked){
                fill(COLORS.GREEN);
            }else{
                rotate(PI);
                fill(COLORS.RED);
            }
            triangle(0, -10, 10, 10, -10, 10);
            pop();

            return alpha<1;
        });
        pop();
    }
}

let relation_index = 0;
let cycle_count = 0;

function cycle(){
    persons.forEach((person)=>person.cycle());

    cycle_count++;

    if(cycle_count%10==0 && positions.length>0){
        appear.play();
        create_person();
    }

    if(relation_index>relations.length-1){
        relation_index = 0;
    }

    if(relations.length>0){
        let relation = relations[relation_index];

        let conversation = new Conversation(relation);

        let a_topic = relation.a.interests[floor(random(0, relation.a.interests.length))];
        let b_topic = relation.b.interests[floor(random(0, relation.b.interests.length))];

        conversation.a_liked = relation.a.has_interest(b_topic);
        conversation.b_liked = relation.b.has_interest(a_topic);
        // relation.b.hear_topic(relation.a, relation, a_topic);
        // relation.a.hear_topic(relation.b, relation, b_topic);

        conversation.a_topic = a_topic;
        conversation.b_topic = b_topic;
        conversations.push(conversation);
        relation_index++;

        if(relation.quality<=0 && !relation.harmed){
            relation.harmed = true;
            relation.harm_timestamp = Date.now();
            relation.destroy();
            // relations = relations.filter((rel)=>relation!=rel);
            relation.a.evaluate_happiness();
            relation.b.evaluate_happiness();
        }
    }
}

let cycle_time = 0;
function update(){
    // console.log(frameRate())

    cycle_time += deltaTime/map(clamp(cycle_count, 50, 150), 50, 150, 1500, 500);
    if(cycle_time>1 && relations.length>0){
        console.log(map(clamp(cycle_count, 50, 150), 50, 150, 1500, 500))
        cycle_time = 0;
        cycle();
    }
}

function draw(){
    update();
    // console.log("asd")
    // clear();
    // rect(sin(Date.now())*100, 0, 100, 100);
    background(200);

    let scl = get_scale();

    push();
    noStroke();
    fill(100, 100, 100);
    screen_size = min(windowWidth, windowHeight);
    translate(-screen_size/2, -screen_size/2)
    translate(windowWidth/2, windowHeight/2)
    // rect(0, 0, screen_size, screen_size)
    stroke(COLORS.BLACK);
    fill(COLORS.WHITE);
    textSize(scl*100);
    pop();

    
    // for(let i = -1; i <= 1; i++){
    let density = 100;
    for(let i = -ceil(width / scl / density); i <= ceil(width / scl / density); i++){
        stroke(COLORS.BLACK);
        strokeWeight(5*scl);
        line(i * density * scl + width/2, 0, i * density * scl + width/2, height);
    }

    for(let i = -ceil(height / scl / density); i <= ceil(height / scl / density); i++){
        stroke(COLORS.BLACK);
        strokeWeight(5*scl);
        line(0, i * density * scl + height/2, width, i * density * scl + height/2);
    }

    // noFill();
    textFont(font)
    strokeWeight(scl*15);
    textAlign(CENTER);
    stroke(COLORS.BLACK);
    fill(COLORS.WHITE);
    textSize(scl*100);
    text(score, width/2, 100*scl);

    push();
    textAlign(CENTER, BOTTOM);
    translate(-screen_size/2, -screen_size/2)
    translate(windowWidth/2, windowHeight/2)
    textFont(font2)
    strokeWeight(scl*10);
    if(cycle_count==0){
        text("Not lonely, not to popular", 0, 0, screen_size, screen_size * .9);
    }
    pop();
    // text("Connect the lonely people", width/2, 100*scl);
    noStroke();
    fill(COLORS.BLACK);

    draw_relations();

    conversations = conversations.filter((conversation)=>{
        let keep = conversation.render();
        if(!conversation.flushed && conversation.get_alpha()>.8){
            conversation.flushed = true;

            let delta = 0;
            if(conversation.a_liked && conversation.b_liked){
                score++;
                delta++;
                nice.play(0, 1);
            }else{
                nice.play(0, .7);
            }

            if(!conversation.a_liked && !conversation.b_liked){
                delta-=2;
            }else{
                if(!conversation.a_liked || !conversation.b_liked){
                    delta--;
                }
            }
            conversation.relation.quality += delta * (map(clamp(cycle_count, 100, 200), 100, 200, .2, .5));
            conversation.relation.quality = max(min(1, conversation.relation.quality), 0);

            conversation.relation.conversation_stack.push({conversation: conversation, timestamp: Date.now()});
        }
        return keep;
    });

    // console.log(conversations.length);

    if(selected_person){
        stroke(COLORS.BLACK);
        let position = selected_person.get_absolute_position();
        line(position.x, position.y, mouseX, mouseY);
    }
    
    push();
    // translate(width/2, height/2);
    // scale(screen_size*.001, screen_size*.001);

    persons.forEach((person)=>person.draw());
    pop();

    draw_converations_feedback();
}

window.mousePressed = function(){
}

window.windowResized = function(){
    resizeCanvas(windowWidth, windowHeight);
}

// function touchStarted(){
//     console.log("started")
// }
// function mousePressed(){
//     console.log("asd")
//     // return 
// }

window.mousePressed = function() {
    for(const person of persons) {
        if(person.collides(mouseX, mouseY)){
            selected_person = person;
            plop.play();
            return;
        }
    }

    deleting_relations = true;
}

window.touchStarted = window.mousePressed;

window.mouseReleased = function() {
    deleting_relations = false;

    if(selected_person){
        for(const person of persons) {
            if(person.collides(mouseX, mouseY) && person!=selected_person && !person.has_relation(selected_person)){
                create_relation(person, selected_person);
                pling.play();
                break;
            }
        }
        plop.play();
        selected_person = undefined;
    }
}

window.touchEnded = window.mouseReleased;

// window.touchStarted = function() {
    
//     console.log("tap")
// }