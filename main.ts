// Schiffe versenken - Light Version mit Win/Lose
// Calliope mini (MakeCode JavaScript)

let kanal = 1
let boats: number[][] = []   // Spieler-Boote
let hits: number[] = []      // Treffer auf eigene Boote
let turn = false             // Wer ist dran
let state = 0                // Spielzustand
let cursor = 0               // Zielcursor (0–24)
let myHits = 0               // Wie viele Bootsteile ich treffe
let enemyHits = 0            // Wie viele Bootsteile Gegner mich trifft
let totalBoatParts = 4       // 2 Boote à 2 Felder

input.onButtonPressed(Button.AB, function () {
    if (state == 0) {
        basic.showString("Schiffe Versenken")
        basic.showNumber(kanal)
        state = 1
    } else if (state == 1) {
        // Kanal bestätigen
        radio.setGroup(kanal)
        basic.showString("Place boats")
        state = 2
        placeBoats()
    } else if (state == 4 && turn) {
        // Schuss abgeben
        fire()
    } else if (state == 99) {
        control.reset()
    }
})

input.onButtonPressed(Button.A, function () {
    if (state == 1) {
        kanal -= 1
        if (kanal < 1) kanal = 10
        basic.showNumber(kanal)
    } else if (state == 4 && turn) {
        cursor -= 1
        if (cursor < 0) cursor = 24
        showCursor()
    }
})

input.onButtonPressed(Button.B, function () {
    if (state == 1) {
        kanal += 1
        if (kanal > 10) kanal = 1
        basic.showNumber(kanal)
    } else if (state == 4 && turn) {
        cursor += 1
        if (cursor > 24) cursor = 0
        showCursor()
    }
})

radio.onReceivedValue(function (name, value) {
    if (name == "hit") {
        if (checkHit(value)) {
            radio.sendValue("result", 1)
            showHit()
            enemyHits += 1
            if (enemyHits >= totalBoatParts) {
                // Gegner hat mich komplett versenkt
                gameOver(false)
                return
            }
        } else {
            radio.sendValue("result", 0)
            showMiss()
        }
        turn = true
        state = 4
        cursor = 0
        showCursor()
    }
    if (name == "result") {
        if (value == 1) {
            showHit()
            myHits += 1
            if (myHits >= totalBoatParts) {
                // Ich habe Gegner komplett versenkt
                gameOver(true)
                return
            }
        } else {
            showMiss()
        }
        turn = false
    }
})

/*
    Hilfsfunktionen
*/

function placeBoats() {
    boats = []
    basic.clearScreen()
    while (boats.length < 2) {
        let b = randomBoat()
        if (!overlaps(b)) {
            boats.push(b)
            for (let p of b) {
                let x = p % 5
                let y = Math.idiv(p, 5)
                led.plot(x, y)
            }
        }
    }
    basic.showString("WAIT")
    if (Math.randomRange(0, 1) == 0) {
        turn = true
        basic.showString("YOU START")
    } else {
        turn = false
        basic.showString("ENEMY START")
    }
    state = 4
    cursor = 0
    showCursor()
}

function randomBoat(): number[] {
    let vertical = Math.randomRange(0, 1) == 0
    let x = Math.randomRange(0, 4)
    let y = Math.randomRange(0, 4)
    if (vertical) {
        if (y == 4) y = 3
        return [y * 5 + x, (y + 1) * 5 + x]
    } else {
        if (x == 4) x = 3
        return [y * 5 + x, y * 5 + (x + 1)]
    }
}

function overlaps(b: number[]): boolean {
    for (let bb of boats) {
        for (let p of b) {
            if (bb.indexOf(p) >= 0) {
                return true
            }
        }
    }
    return false
}

function showCursor() {
    basic.clearScreen()
    // eigene Boote anzeigen
    for (let b of boats) {
        for (let p of b) {
            let x = p % 5
            let y = Math.idiv(p, 5)
            led.plot(x, y)
        }
    }
    // Cursor blinken
    let cx = cursor % 5
    let cy = Math.idiv(cursor, 5)
    led.toggle(cx, cy)
}

function fire() {
    if (turn) {
        radio.sendValue("hit", cursor)
        basic.showString("SHOT")
    }
}

function checkHit(pos: number): boolean {
    for (let b of boats) {
        if (b.indexOf(pos) >= 0) {
            return true
        }
    }
    return false
}

function showHit() {
    light.setAll(light.rgb(255, 0, 0))
    pause(500)
    light.clear()
}

function showMiss() {
    light.setAll(light.rgb(0, 255, 0))
    pause(500)
    light.clear()
}

function gameOver(win: boolean) {
    if (win) {
        basic.showString("WIN")
    } else {
        basic.showString("LOSE")
    }
    state = 99
}

