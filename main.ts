let kanal = 1
let leben = 3
let enemyLeben = 3
let ammo = 0
let enemyAmmo = 0
let ready = false
let enemyReady = false
let action = ""
let enemyAction = ""
let gameOver = false
let started = false

// --- LED-Anzeigen ---
function updateLeben() {
    if (leben == 3) basic.setLedColors(0x00ff00, 0x00ff00, 0x00ff00)
    else if (leben == 2) basic.setLedColors(0xffff00, 0xffff00, 0x000000)
    else if (leben == 1) basic.setLedColors(0xff0000, 0x000000, 0x000000)
    else basic.setLedColors(0x000000, 0x000000, 0x000000)
}

function countdown() {
    basic.showNumber(3)
    basic.pause(500)
    basic.showNumber(2)
    basic.pause(500)
    basic.showNumber(1)
    basic.pause(500)
    basic.clearScreen()
}

function showTurn() {
    if (!gameOver && started) {
        basic.clearScreen()
        led.plot(2, 2) // Punkt in der Mitte
    }
}

function startGame() {
    if (started || gameOver) return
    started = true
    ammo = 0
    // 3x grün blinken
    for (let i = 0; i < 3; i++) {
        basic.setLedColors(0x00ff00, 0x00ff00, 0x00ff00)
        basic.pause(300)
        basic.turnRgbLedOff()
        basic.pause(300)
    }
    countdown()
    updateLeben()
    showTurn()
}

// --- Runden-Logik ---
function tryResolve() {
    if (action != "" && enemyAction != "" && !gameOver) {
        resolveRound()
    }
}

function resolveRound() {
    // Beide haben gewählt → "+" anzeigen
    basic.clearScreen()
    basic.showLeds(`
        . . # . .
        . . # . .
        # # # # #
        . . # . .
        . . # . .
    `)
    basic.pause(500)
    basic.clearScreen()

    // ---- Auswertung ----
    if (action == "shoot" && enemyAction == "shoot") {
        leben -= 1
        enemyLeben -= 1
        ammo = 0
        basic.showString("OUCH")
    } else if (action == "shoot" && enemyAction == "block") {
        ammo = 0
        basic.showString("DEF")
    } else if (action == "shoot" && enemyAction == "reload") {
        enemyLeben -= 1
        ammo = 0
        basic.showString("HIT")
    } else if (action == "block" && enemyAction == "shoot") {
        enemyAmmo = 0
        basic.showString("DEF")
    } else if (action == "reload" && enemyAction == "shoot") {
        leben -= 1
        enemyAmmo = 0
        basic.showString("OUCH")
    } else {
        basic.showString("-") // beide blocken oder beide reload
    }

    updateLeben()

    // Sieg/Niederlage prüfen
    if (leben <= 0 && enemyLeben > 0) {
        basic.showString("LOSE")
        radio.sendString("enemyDead")
        gameOver = true
    } else if (enemyLeben <= 0 && leben > 0) {
        basic.showString("WIN")
        gameOver = true
    } else if (leben <= 0 && enemyLeben <= 0) {
        basic.showString("DRAW")
        gameOver = true
    }

    // Reset für nächste Runde
    action = ""
    enemyAction = ""
    if (!gameOver) showTurn()
}

// --- Eingaben über Forever ---
basic.forever(function () {
    if (!gameOver && started && action == "") {
        if (input.buttonIsPressed(Button.A) && !input.buttonIsPressed(Button.B)) {
            action = "block"
            radio.sendString("block")
            tryResolve()
            basic.pause(300)
        } else if (input.buttonIsPressed(Button.B) && !input.buttonIsPressed(Button.A)) {
            if (ammo > 0) {
                action = "shoot"
                radio.sendString("shoot")
                tryResolve()
                basic.pause(300)
            } else {
                basic.showString("NO") // keine Munition
                basic.pause(200)
                showTurn()
            }
        } else if (input.buttonIsPressed(Button.A) && input.buttonIsPressed(Button.B)) {
            action = "reload"
            radio.sendString("reload")
            ammo = 1
            tryResolve()
            basic.pause(300)
        }
    }
})

// --- Ready + Lobby / Restart ---
input.onButtonPressed(Button.AB, function () {
    if (!ready && !gameOver) {
        radio.setGroup(kanal)
        ready = true
        radio.sendString("ready")

        // Endlosschleife: Blauer Ladebalken bis "start"
        control.inBackground(function () {
            while (!started && !gameOver) {
                basic.setLedColors(0x0000ff, 0x000000, 0x000000)
                basic.pause(200)
                basic.setLedColors(0x0000ff, 0x0000ff, 0x000000)
                basic.pause(200)
                basic.setLedColors(0x0000ff, 0x0000ff, 0x0000ff)
                basic.pause(200)
                basic.turnRgbLedOff()
                basic.pause(200)
            }
        })
    } else if (gameOver) {
        // Neustart
        leben = 3
        enemyLeben = 3
        ammo = 0
        enemyAmmo = 0
        ready = false
        enemyReady = false
        started = false
        gameOver = false
        action = ""
        enemyAction = ""
        basic.showIcon(IconNames.Happy)
        basic.pause(1500)
        basic.clearScreen()
        basic.showNumber(kanal)
    }
})

// Kanalwahl
input.onButtonPressed(Button.B, function () {
    if (!ready && !gameOver) {
        kanal += 1
        if (kanal > 9) kanal = 1
        basic.showNumber(kanal)
    }
})
input.onButtonPressed(Button.A, function () {
    if (!ready && !gameOver) {
        kanal -= 1
        if (kanal < 1) kanal = 9
        basic.showNumber(kanal)
    }
})

// --- Funk-Empfang ---
radio.onReceivedString(function (msg: string) {
    if (msg == "ready") {
        enemyReady = true
        if (ready && enemyReady && !started) {
            radio.sendString("start")
            startGame()
        }
    }
    if (msg == "start") {
        startGame()
    }
    if (msg == "block") {
        enemyAction = "block"
        tryResolve()
    }
    if (msg == "shoot") {
        enemyAction = "shoot"
        tryResolve()
    }
    if (msg == "reload") {
        enemyAction = "reload"
        enemyAmmo = 1
        tryResolve()
    }
    if (msg == "enemyDead") {
        if (!gameOver) {
            basic.showString("WIN")
            gameOver = true
        }
    }
})

// --- Start ---
basic.showIcon(IconNames.Happy)
basic.pause(1500)
basic.clearScreen()
basic.showNumber(kanal)
