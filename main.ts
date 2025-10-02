// Schiffe versenken - Light Version mit Win/Lose und Boot-LED-Aus
// Calliope mini V3 (MakeCode JavaScript)

let kanal = 1
let boats: number[][] = []   // Spieler-Boote (jede Liste enthält Positionen)
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

// Trefferprüfung + Bootsteil löschen
function checkHit(pos: number): boolean {
    for (let i = 0; i < boats.length; i++) {
        let b = boats[i]
        if (b.indexOf(pos) >= 0) {
            // Position aus Boot löschen
            boats[i] = b.filter(e => e != pos)
            // LED ausmachen
            let x = pos % 5
            let y = Math.idiv(pos, 5)
            led.unplot(x, y)
            return true
        }
    }
    return false
}

// RGB-LEDs unten für Trefferanzeige
function showHit() {
    // alle 3 LEDs rot
    basic.setLedColors(0xff0000, 0xff0000, 0xff0000)
    basic.pause(500)
    basic.turnRgbLedOff()
}

function showMiss() {
    // alle 3 LEDs grün
    basic.setLedColors(0x00ff00, 0x00ff00, 0x00ff00)
    basic.pause(500)
    basic.turnRgbLedOff()
}

function gameOver(win: boolean) {
    if (win) {
        basic.showString("WIN")
        basic.setLedColors(0x0000ff, 0x0000ff, 0x0000ff) // blau
    } else {
        basic.showString("LOSE")
        basic.setLedColors(0xffffff, 0xffffff, 0xffffff) // weiß
    }
    state = 99
}

