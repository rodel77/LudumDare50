declare function loadSound(path: string): p5.SoundFile;

function sign(x: number) : number{
    if(x==0) return 0;
    return x>0 ? 1 : -1;
}

function towards(current: number, target: number, max_delta: number) : number {
    if(abs(target-current)<=max_delta) return target;

    return current + sign(target - current) * max_delta;
}

const COLORS = {
    YELLOW: [241, 196, 15],
    BLACK:  [44, 62, 80],
    BLUE:   [52, 152, 219],
    WHITE:  [255, 255, 255],
    GREEN:  [46, 204, 113],
    PURPLE: [155, 89, 182],
    RED:    [231, 76, 60],
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
};

function random_interest(): Interest{
    return floor(random(0, Object.keys(Interest).length/2));
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

    constructor(a: Person, b: Person){
        this.a = a;
        this.b = b;
    }
};

function easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - pow(-2 * x + 2, 3) / 2;
}

function easeInOutQuad(x: number): number {
    return x < 0.5 ? 2 * x * x : 1 - pow(-2 * x + 2, 2) / 2;
    }

let screen_size: number;

function get_scale(): number{
    return screen_size / 1000;
}

class Person {
    happiness: number = 0;
    target_happiness: number = 0;
    interests: Interest[] = [];
    last_epiphany: number = 0;
    // emotion: Emotion = Emotion.HAPPY;
    x: number;
    y: number;
    origin_x: number;
    origin_y: number;

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
        let position = this.get_absolute_position();
        let delta = createVector(x, y).sub(position);
        return delta.mag() < 50 * get_scale();
    }

    cycle(){
        this.last_epiphany++;
        if(this.last_epiphany>5 && random()<.3){
            console.log("epiphany")
            if(random()>.5){
                if(this.interests.length>1){
                    this.interests.splice(random(0, this.interests.length), 1);
                }
            }else{
                if(this.interests.length<3){
                    while(true){
                        let interest = random_interest();
                        
                        if(!this.has_interest(interest)){
                            this.interests.push(interest);
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
            if(relation.a==this || relation.b==this){
                count++;
            }
        });

        if(count==0){
            this.target_happiness = 0;
        }else if(count==1){
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
        this.offset_time += deltaTime;
        if(this.offset_time>random(200, 500)){
            this.offset_time = 0;
            this.offset_x = (random()-.5)*.1;
            this.offset_y = (random()-.5)*.1;
        }
        this.x = lerp(this.x, this.origin_x + this.offset_x, .005);
        this.y = lerp(this.y, this.origin_y + this.offset_y, .005);

        let position = this.get_absolute_position();
        this.happiness = towards(this.happiness, this.target_happiness, .05);

        push();
        
        noStroke();
        translate(position.x, position.y);
        scale(get_scale(), get_scale());
        if(this.collides(mouseX, mouseY) || selected_person==this) scale(1.1, 1.1)
    
        // Shadow
        push();
        translate(10, 10)
        fill(0, 0, 0, 50);
        circle(0, 0, 100);
        pop();
    
        fill(lerpColor(color(COLORS.BLUE),color(COLORS.YELLOW), this.happiness));
        circle(0, 0, 100);
        fill(COLORS.BLACK);
        push();
        let delta_x = mouseX-this.x;
        let delta_y = mouseY-this.y;

        let mag = sqrt(pow(delta_x, 2) + pow(delta_y, 2));
        this.eye_x = lerp(this.eye_x, delta_x/mag, .25);
        this.eye_y = lerp(this.eye_y, delta_y/mag, .25);

        translate(this.eye_x, this.eye_y);
        ellipse(-15, -10, 10, 15);
        ellipse(15, -10, 10, 15);
        pop();
    
        stroke(COLORS.BLACK);
        strokeWeight(5);
        strokeCap(PROJECT);
        noFill();
        if(selected_person==this){
            circle(0, 20, 20);
        }else{
            let point_y = map(this.happiness, 0, 1, 5, 35);
            bezier(-20, 20, -10, point_y, 10, point_y, 20, 20);
        }

        // Interests
        noStroke();
        fill(COLORS.WHITE);
        translate(-(this.interests.length-1)*25/2, -75);
        this.interests.forEach((interest) => {
            draw_interest(interest);
            translate(25, 0);
        });
        // for(let i = 0; i < 2; i++){
        //     push();
        //     if(i==0){
        //         translate(3, 3);
        //         fill(0, 0, 0, 50);
        //     }
        //     this.interests.forEach((interest) => {
        //         switch(interest){
        //             case Interest.CIRCLE:
        //                 if(i==1) fill(COLORS.PURPLE);
        //                 circle(0, 0, 20);
        //                 break;
        //                 case Interest.SQUARE:
        //                 if(i==1) fill(COLORS.GREEN);
        //                 rect(-10, -10, 20, 20);
        //                 break;
        //                 case Interest.TRIANGLE:
        //                 if(i==1) fill(COLORS.YELLOW);
        //                 triangle(0, -10, 10, 10, -10, 10);
        //                 break;
        //         }
        //         translate(25, 0);
        //     });
        //     pop();
        // }
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

let like_image;
function preload(){
    like_image = loadImage("assets/like.png");
}

let au: p5.SoundFile;
let g;
function setup(){
    createCanvas(windowWidth, windowHeight);
    // createCanvas(windowWidth, windowHeight, WEBGL);
    // smooth()
    // g = createGraphics(windowWidth, windowHeight, p5.Renderer);
    {
        let person = new Person(0, 0);
        person.interests.push(Interest.CIRCLE);
        person.interests.push(Interest.SQUARE);
        persons.push(person);
    }
    {
        let person = new Person(1, 0);
        person.interests.push(Interest.CIRCLE);
        person.interests.push(Interest.SQUARE);
        persons.push(person);
    }
    {
        let person = new Person(0.5, .5);
        person.interests.push(Interest.CIRCLE);
        person.interests.push(Interest.SQUARE);
        persons.push(person);
    }
    {
        let person = new Person(0.5, -.5);
        person.interests.push(Interest.CIRCLE);
        person.interests.push(Interest.SQUARE);
        persons.push(person);
    }
    // {
    //     let person = new Person(width/2 + 75, height/2);
    //     person.interests.push(Interest.CIRCLE);
    //     person.interests.push(Interest.SQUARE);
    //     persons.push(person);
    // }
    // {
    //     let person = new Person(width/2, height/2 - 100);
    //     person.interests.push(Interest.TRIANGLE);
    //     persons.push(person);
    // }

    console.log(persons.length)
};

function draw_relations(){
    strokeWeight(20 * get_scale());
    for(let relation of relations){
        let apos = relation.a.get_absolute_position();
        let bpos = relation.b.get_absolute_position();
        stroke(lerpColor(lerpColor(color(COLORS.RED), color(COLORS.YELLOW), relation.quality), color(COLORS.GREEN), relation.quality));
        line(apos.x, apos.y, bpos.x, bpos.y);

        let delta = apos.add(bpos.sub(apos).div(2));

        push();
        // translate(delta.x, delta.y);
        // scale(get_scale(), get_scale());
        // translate(-20, -15);
        relation.conversation_stack = relation.conversation_stack.filter((conversation) => {
            // Hacky code warning
            let apos = conversation.conversation.relation.a.get_absolute_position();
            let bpos = conversation.conversation.relation.b.get_absolute_position();

            let scl = get_scale();

            push();
            delta = p5.Vector.sub(bpos, apos);
            let pos = p5.Vector.add(apos, delta.div(delta.mag()).mult(75 * scl));
            translate(pos.x, pos.y);
            if(conversation.conversation.a_liked){
                tint(COLORS.GREEN);
            }else{
                tint(COLORS.RED);
                scale(1, -1);
            }
            scale(scl*1.3, scl*1.3);
            translate(-15, -15);
            image(like_image, 0, 0, 30, 30);
            pop();

            push();
            delta = p5.Vector.sub(apos, bpos);
            // delta = apos.sub(bpos);
            pos = p5.Vector.add(bpos, delta.div(delta.mag()).mult(75 * scl));
            translate(pos.x, pos.y);
            if(conversation.conversation.b_liked){
                tint(COLORS.GREEN);
            }else{
                tint(COLORS.RED);
                scale(1, -1);
            }
            scale(scl*1.3, scl*1.3);
            translate(-15, -15);
            image(like_image, 0, 0, 30, 30);
            pop();

            // push();
            // delta = bpos.sub(bpos);
            // pos = apos.add(delta.div(delta.mag()).mult(50));
            // translate(pos.x, pos.y);
            // if(conversation.conversation.a_liked){
            //     tint(COLORS.GREEN);
            // }else{
            //     tint(COLORS.RED);
            //     scale(1, -1);
            //     translate(0, -30);
            // }
            // scale(4, 4)
            // image(like_image, -20, 0, 30, 30);
            // pop();
            
            // push();
            // if(conversation.conversation.b_liked){
            //     tint(COLORS.GREEN);
            // }else{
            //     tint(COLORS.RED);
            //     scale(1, -1);
            //     translate(0, -30);
            // }
            // image(like_image, 20, 0, 30, 30);
            // pop();
            return Date.now()-conversation.timestamp<500;
        });
        pop();
    }
}

let relation_index = 0;

function cycle(){
    persons.forEach((person)=>person.cycle());

    console.log(relation_index)
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
    }
    relations = relations.filter((relation)=>{
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
        // console.log(a_topic, b_topic)

        // let matches = 0;
        // let total_count = max(relation.a.interests.length, relation.b.interests.length);
        // for(let interests_a of relation.a.interests){
        //     relation.b.hear_topic(relation.a, relation, interests_a);
        //     if(relation.b.has_interest(interests_a)){
        //         matches++;
        //     }
        // }

        // for(let interests_b of relation.b.interests){
        //     relation.a.hear_topic(relation.b, relation, interests_b);
        // }

        // if((matches/total_count)<.5){
        //     relation.quality -= .1;
        // }

        // if(relation.quality<=0){
        //     return false;
        // }

        return true;
    });

    // persons.forEach((person)=>person.evaluate_happiness());
}

let cycle_time = 0;
function update(){
    // console.log(frameRate())

    cycle_time += deltaTime/1500;
    if(cycle_time>1){
        cycle_time = 0;
        cycle();
    }
}

function draw(){
    update();
    // console.log("asd")
    // clear();
    // rect(sin(Date.now())*100, 0, 100, 100);
    background(32);

    push();
    noStroke();
    fill(COLORS.WHITE);
    screen_size = min(windowWidth, windowHeight);
    translate(-screen_size/2, -screen_size/2)
    translate(windowWidth/2, windowHeight/2)
    rect(0, 0, screen_size, screen_size)
    pop();

    // noFill();
    // strokeWeight(1);
    // stroke(COLORS.BLACK);
    noStroke();
    fill(COLORS.BLACK);
    textSize(20);
    text("FPS: "+floor(frameRate()), 20, 20, 100, 100);

    draw_relations();

    conversations = conversations.filter((conversation)=>{
        let keep = conversation.render();
        if(!conversation.flushed && conversation.get_alpha()>.8){
            conversation.flushed = true;

            let delta = 0;
            if(conversation.a_liked && conversation.b_liked){
                delta++;
            }

            if(!conversation.a_liked && !conversation.b_liked){
                delta-=2;
            }else{
                if(!conversation.a_liked || !conversation.b_liked){
                    delta--;
                }
            }
            conversation.relation.quality += delta * .1;
            conversation.relation.quality = max(min(1, conversation.relation.quality), 0);

            // conversation.relation.a.evaluate_happiness();
            // conversation.relation.b.evaluate_happiness();
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
}

window.mousePressed = function(){
}

window.windowResized = function(){
    resizeCanvas(windowWidth, windowHeight);
}

window.mousePressed = function() {
    for(const person of persons) {
        if(person.collides(mouseX, mouseY)){
            selected_person = person;
            break;
        }
    }
}

window.mouseReleased = function() {
    if(selected_person){
        for(const person of persons) {
            console.log("Same", person==selected_person)
            if(person.collides(mouseX, mouseY) && person!=selected_person && !person.has_relation(selected_person)){
                create_relation(person, selected_person);
                // console.log(person, selected_person);
                break;
            }
        }
        selected_person = undefined;
    }
}

// window.touchStarted = function() {
    
//     console.log("tap")
// }