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

function randomEnum<T>(anEnum: T): T[keyof T] {
    const enumValues = (Object.values(anEnum) as unknown) as T[keyof T][];
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return enumValues[randomIndex];
  }

class Relation {
    a: Person;
    b: Person;
    quality: number = 1;

    constructor(a: Person, b: Person){
        this.a = a;
        this.b = b;
    }
};

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

    eye_x: number = 0;
    eye_y: number = 0;

    constructor(x: number, y: number){
        this.x = x;
        this.y = y;
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
                        let interest = floor(random(0, Object.keys(Interest).length/2));
                        console.log(0, Object.keys(Interest).length,interest, this.has_interest(interest))
                        
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
    
    constructor(relation: Relation){
        this.relation = relation;
    }
};

function draw_interest(interest: Interest){
    for(let i = 0; i < 2; i++){
        push();
        if(i==0){
            translate(3, 3);
            fill(0, 0, 0, 50);
        }
        switch(interest){
            case Interest.CIRCLE:
                if(i==1) fill(COLORS.PURPLE);
                circle(0, 0, 20);
                break;
                case Interest.SQUARE:
                if(i==1) fill(COLORS.GREEN);
                rect(-10, -10, 20, 20);
                break;
                case Interest.TRIANGLE:
                if(i==1) fill(COLORS.YELLOW);
                triangle(0, -10, 10, 10, -10, 10);
                break;
        }
        pop();
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

let au: p5.SoundFile;
function setup(){
    createCanvas(windowWidth, windowHeight);
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
    }
}

function cycle(){
    persons.forEach((person)=>person.cycle());

    relations = relations.filter((relation)=>{
        let conversation = new Conversation(relation);
        let matches = 0;
        let total_count = max(relation.a.interests.length, relation.b.interests.length);
        for(let interests_a of relation.a.interests){
            relation.b.hear_topic(relation.a, relation, interests_a);
            if(relation.b.has_interest(interests_a)){
                matches++;
            }
        }

        for(let interests_b of relation.b.interests){
            relation.a.hear_topic(relation.b, relation, interests_b);
        }

        if((matches/total_count)<.5){
            relation.quality -= .1;
        }

        if(relation.quality<=0){
            return false;
        }

        return true;
    });

    persons.forEach((person)=>person.evaluate_happiness());
}

let cycle_time = 0;
function update(){
    cycle_time += deltaTime/1000;
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

    draw_relations();

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