const $ = (id) => document.getElementById(id);

const pets = {
    cat: {
        emoji: "🐱",
        name: "پشمالو",
        type: "گربه بازیگوش"
    },
    dog: {
        emoji: "🐶",
        name: "هاپو",
        type: "سگ وفادار"
    },
    rabbit: {
        emoji: "🐰",
        name: "برفی",
        type: "خرگوش کوچولو"
    }
};

const defaultState = {
    pet: "cat",
    coins: 100,
    hunger: 80,
    happiness: 80,
    energy: 80,
    clean: 80,
    xp: 0,
    level: 1,
    lastVisit: Date.now()
};

let state;

try {
    const saved = JSON.parse(localStorage.getItem("petland-save"));

    state = saved && pets[saved.pet] ? {
        ...defaultState,
        ...saved
    } : { ...defaultState };

    // جلوگیری از بارگذاری مقادیر نامعتبر
    ["coins", "hunger", "happiness", "energy", "clean", "xp", "level"]
        .forEach(key => {
            if (!Number.isFinite(state[key])) {
                state[key] = defaultState[key];
            }
        });

    state.coins = Math.max(0, Math.floor(state.coins));
    state.level = Math.max(1, Math.floor(state.level));

    ["hunger", "happiness", "energy", "clean"].forEach(key => {
        state[key] = Math.max(0, Math.min(100, state[key]));
    });

    state.xp = Math.max(0, state.xp);
} catch {
    state = { ...defaultState };
}

// نمایش پیام
let noticeTimer;

function notify(message) {
    const notice = $("notice");
    notice.textContent = message;
    notice.classList.add("show");

    clearTimeout(noticeTimer);

    noticeTimer = setTimeout(() => {
        notice.classList.remove("show");
    }, 2500);
}

// ذخیره بازی
function saveGame() {
    state.lastVisit = Date.now();

    try {
        localStorage.setItem("petland-save", JSON.stringify(state));
    } catch {
        notify("ذخیره بازی امکان‌پذیر نیست.");
    }
}

// محدود کردن مقادیر بین صفر تا صد
function clamp(value) {
    return Math.max(0, Math.min(100, value));
}

// افزایش تجربه و سطح
function addXP(amount) {
    state.xp += amount;

    while (state.xp >= 100) {
        state.xp -= 100;
        state.level++;
        state.coins += 20;

        notify(`🎉 تبریک! به سطح ${state.level} رسیدی و ۲۰ سکه گرفتی.`);
    }
}

// متن وضعیت حیوان
function getMood() {
    if (state.hunger < 25) return "خیلی گرسنه‌ام! 🍗";
    if (state.energy < 20) return "خیلی خسته‌ام! 💤";
    if (state.clean < 25) return "وقت حمام کردنه! 🛁";
    if (state.happiness < 25) return "بیا با هم بازی کنیم! 🥺";
    if (
        state.hunger > 70 &&
        state.happiness > 70 &&
        state.energy > 50 &&
        state.clean > 50
    ) {
        return "خیلی خوشحالم! دوستت دارم 💚";
    }

    return "بیا با هم وقت بگذرونیم! 🐾";
}

// به‌روزرسانی رابط کاربری
function render() {
    const pet = pets[state.pet];

    $("coins").textContent = state.coins.toLocaleString("fa-IR");
    $("petEmoji").textContent = pet.emoji;
    $("petName").textContent = pet.name;
    $("petType").textContent = pet.type;
    $("level").textContent = state.level.toLocaleString("fa-IR");

    $("petMood").textContent = getMood();

    const stats = [
        ["hunger", "hungerValue", "hungerBar"],
        ["happiness", "happinessValue", "happinessBar"],
        ["energy", "energyValue", "energyBar"],
        ["clean", "cleanValue", "cleanBar"]
    ];

    stats.forEach(([key, valueId, barId]) => {
        const value = Math.round(state[key]);

        $(valueId).textContent = `${value.toLocaleString("fa-IR")}٪`;
        $(barId).style.width = `${value}%`;
        $(barId).style.background =
            value < 25 ? "#ef6666" : "";
    });

    $("xpText").textContent =
        `${state.xp} از ۱۰۰ امتیاز تا سطح بعدی`;

    $("xpBar").style.width = `${state.xp}%`;

    document.querySelectorAll(".pet-choice").forEach(button => {
        button.classList.toggle(
            "selected",
            button.dataset.pet === state.pet
        );
    });
}

// اجرای یک فعالیت
function performAction(action) {
    switch (action) {
        case "feed":
            if (state.hunger >= 100) {
                notify("شکمش کاملاً سیره! 😋");
                return;
            }

            state.hunger = clamp(state.hunger + 25);
            state.happiness = clamp(state.happiness + 5);
            state.coins += 3;
            addXP(10);

            notify("🍖 غذای خوشمزه خورد! ۳ سکه جایزه گرفتی.");
            break;

        case "play":
            if (state.energy < 15) {
                notify("حیوانت خسته است؛ اول استراحت کند!");
                return;
            }

            state.happiness = clamp(state.happiness + 20);
            state.energy = clamp(state.energy - 12);
            state.hunger = clamp(state.hunger - 7);
            state.coins += 5;
            addXP(15);

            notify("🎾 چه بازی خوبی! ۵ سکه گرفتی.");
            break;

        case "bath":
            if (state.clean >= 100) {
                notify("حیوانت همین حالا هم تمیز است! 🫧");
                return;
            }

            state.clean = clamp(state.clean + 30);
            state.happiness = clamp(state.happiness + 3);
            state.coins += 2;
            addXP(8);

            notify("🛁 حالا حسابی تمیز شد! ۲ سکه جایزه.");
            break;

        case "sleep":
            if (state.energy >= 100) {
                notify("حیوانت کاملاً سرحال است! ⚡");
                return;
            }

            state.energy = clamp(state.energy + 35);
            state.hunger = clamp(state.hunger - 5);
            state.happiness = clamp(state.happiness + 3);
            addXP(5);

            notify("💤 استراحت کرد و انرژی گرفت!");
            break;
    }

    render();
    saveGame();
}

// دکمه‌های مراقبت
$("feedBtn").addEventListener("click", () => {
    performAction("feed");
});

$("playBtn").addEventListener("click", () => {
    performAction("play");
});

$("bathBtn").addEventListener("click", () => {
    performAction("bath");
});

$("sleepBtn").addEventListener("click", () => {
    performAction("sleep");
});

// انتخاب حیوان
document.querySelectorAll(".pet-choice").forEach(button => {
    button.addEventListener("click", () => {
        state.pet = button.dataset.pet;

        render();
        saveGame();

        notify(`دوست جدیدت ${pets[state.pet].name} است! 💚`);
    });
});

// خرید از فروشگاه
document.querySelectorAll(".buy-btn").forEach(button => {
    button.addEventListener("click", () => {
        const item = button.dataset.item;
        const price = Number(button.dataset.price);

        if (state.coins < price) {
            notify("سکه کافی نداری! اول بازی کن و سکه جمع کن.");
            return;
        }

        let message = "";

        if (item === "food") {
            if (state.hunger >= 100) {
                notify("حیوانت فعلاً سیر است!");
                return;
            }

            state.hunger = clamp(state.hunger + 40);
            state.happiness = clamp(state.happiness + 5);
            message = "🥩 غذای مخصوص خریدی!";
        }

        if (item === "toy") {
            if (state.happiness >= 100) {
                notify("حیوانت همین حالا خیلی خوشحال است!");
                return;
            }

            state.happiness = clamp(state.happiness + 35);
            message = "🧶 اسباب‌بازی جدید خریدی!";
        }

        if (item === "shampoo") {
            if (state.clean >= 100) {
                notify("حیوانت کاملاً تمیز است!");
                return;
            }

            state.clean = clamp(state.clean + 50);
            message = "🧴 حیوانت با شامپوی جدید تمیز شد!";
        }

        state.coins -= price;
        addXP(5);

        render();
        saveGame();

        notify(message);
    });
});

// کاهش تدریجی نیازها در طول زمان
function updateNeeds() {
    const now = Date.now();
    const last = Number(state.lastVisit) || now;

    // حداکثر ۸ ساعت کاهش نیاز در زمان غیبت
    const elapsed = Math.min(
        Math.max(0, now - last),
        8 * 60 * 60 * 1000
    );

    const hours = elapsed / (60 * 60 * 1000);

    state.hunger = clamp(state.hunger - hours * 5);
    state.happiness = clamp(state.happiness - hours * 3);
    state.energy = clamp(state.energy - hours * 2);
    state.clean = clamp(state.clean - hours * 2);

    state.lastVisit = now;
}

// ذخیره و به‌روزرسانی اولیه
updateNeeds();
render();
saveGame();

// به‌روزرسانی تدریجی نیازها در زمان بازی
setInterval(() => {
    state.hunger = clamp(state.hunger - 0.15);
    state.happiness = clamp(state.happiness - 0.08);
    state.energy = clamp(state.energy - 0.05);
    state.clean = clamp(state.clean - 0.04);

    render();
    saveGame();
}, 60000);
