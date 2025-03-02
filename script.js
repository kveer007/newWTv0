// Helper function to format dates as dd/mm/yyyy
function formatDate(date) {
    const d = new Date(date);
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

let goal = 0;
let totalIntake = 0;
let reminderInterval = null;
let dailyHistory = JSON.parse(localStorage.getItem("dailyHistory")) || {};

function saveDailyHistory(amount) {
    let currentDate = formatDate(new Date());
    if (!dailyHistory[currentDate]) {
        dailyHistory[currentDate] = [];
    }
    dailyHistory[currentDate].push(amount);
    localStorage.setItem("dailyHistory", JSON.stringify(dailyHistory));
}

function toggleHistory() {
    let history = document.getElementById("history-popup");
    let settings = document.getElementById("settings-section");

    if (window.getComputedStyle(settings).display === "block") {
        settings.style.display = "none"; // Close settings if open
    }

    if (window.getComputedStyle(history).display === "none") {
        history.style.display = "block";
        // Default to daily history tab when opening
        showTab('daily');
    } else {
        history.style.display = "none";
    }
}

function showTab(tabName) {
    if (tabName === 'daily') {
        document.getElementById("daily-history-tab-btn").classList.add("active");
        document.getElementById("current-intake-tab-btn").classList.remove("active");
        document.getElementById("daily-history-tab").style.display = "block";
        document.getElementById("current-intake-tab").style.display = "none";
        showDailyHistory();
    } else {
        document.getElementById("current-intake-tab-btn").classList.add("active");
        document.getElementById("daily-history-tab-btn").classList.remove("active");
        document.getElementById("daily-history-tab").style.display = "none";
        document.getElementById("current-intake-tab").style.display = "block";
        showCurrentIntake();
    }
}

function showDailyHistory() {
    let historyData = "<h3>Weekly Data</h3>";
    
    // Get all dates and sort them in descending order (latest date first)
    let dates = Object.keys(dailyHistory)
        .sort((a, b) => {
            // Convert dd/mm/yyyy strings into Date objects for proper comparison
            const [dayA, monthA, yearA] = a.split('/').map(Number);
            const [dayB, monthB, yearB] = b.split('/').map(Number);
            return new Date(yearB, monthB - 1, dayB) - new Date(yearA, monthA - 1, dayA);
        })
        .slice(0, 7); // Show only the last 7 days

    // Build the history display; newest date will be at the top.
    for (let date of dates) {
        let dayTotal = dailyHistory[date].reduce((a, b) => a + b, 0);
        historyData += `<div class="day-entry">
            <p><b>${date}:</b> ${dayTotal} ml</p>
        </div>`;
    }
    document.getElementById("daily-history-tab").innerHTML = historyData;
}

function showCurrentIntake() {
    let currentDate = formatDate(new Date());
    let currentData = dailyHistory[currentDate] || [];
    let total = currentData.reduce((a, b) => a + b, 0);
    let content = "";
    content += `<h3>Total: ${total} ml</h3>`;
    if (currentData.length > 0) {
        content += `<h4>Details:</h4><ul>`;
        for (let entry of currentData) {
            content += `<li>${entry} ml</li>`;
        }
        content += `</ul>`;
    } else {
        content += `<p>No water intake logged yet today.</p>`;
    }
    document.getElementById("current-intake-tab").innerHTML = content;
}

function setGoal() {
    let inputGoal = parseInt(document.getElementById("goal").value);
    if (isNaN(inputGoal) || inputGoal <= 0) {
        alert("Please enter a valid goal (a positive number).");
        return;
    }
    goal = inputGoal;
    document.getElementById("remaining").innerText = Math.max(goal - totalIntake, 0);
    localStorage.setItem("waterGoal", goal);
    updateProgressBar();
}

function addWater(amount) {
    totalIntake += amount;
    saveDailyHistory(amount);
    updateDisplay();
    if (window.getComputedStyle(document.getElementById("history-popup")).display !== "none") {
        showDailyHistory();
        showCurrentIntake();
    }
}

function addManual() {
    let amount = parseInt(document.getElementById("manual").value);
    if (!isNaN(amount) && amount > 0) {
        totalIntake += amount;
        saveDailyHistory(amount);
        updateDisplay();
        if (window.getComputedStyle(document.getElementById("history-popup")).display !== "none") {
            showDailyHistory();
            showCurrentIntake();
        }
    } else {
        alert("Please enter a positive number for water intake.");
    }
}

function updateDisplay() {
    document.getElementById("total").innerText = totalIntake;
    document.getElementById("remaining").innerText = Math.max(goal - totalIntake, 0);
    localStorage.setItem("waterIntake", totalIntake);
    updateProgressBar();
}

function updateProgressBar() {
    let progress = 0;
    if (goal > 0) {
        progress = (totalIntake / goal) * 100;
    }
    document.getElementById("progress-bar").style.width = Math.min(progress, 100) + "%";
}

window.onload = function () {
    goal = parseInt(localStorage.getItem("waterGoal")) || 0;
    totalIntake = parseInt(localStorage.getItem("waterIntake")) || 0;
    let savedReminderTime = localStorage.getItem("reminderTime");

    // Set stored goal in the input field if available
    if (goal > 0) {
        document.getElementById("goal").value = goal;
    }

    if (savedReminderTime) {
        document.getElementById("reminder-time").value = savedReminderTime;
        setReminder();
    }

    updateDisplay();
};

function setReminder() {
    let time = parseInt(document.getElementById("reminder-time").value);
    if (!isNaN(time) && time > 0) {
        if (reminderInterval) clearInterval(reminderInterval);

        if (Notification.permission === "granted") {
            new Notification("Reminder set! You'll get notified every " + time + " minutes between 8 AM - 10 PM.");
        } else {
            console.log("Notification permission not granted.");
        }

        reminderInterval = setInterval(() => {
            let currentHour = new Date().getHours();
            // Notify only between 8 AM and 10 PM (currentHour < 22)
            if (currentHour >= 8 && currentHour < 22) {
                if (Notification.permission === "granted") {
                    new Notification("Time to drink water!");
                }
            }
        }, time * 60 * 1000);

        localStorage.setItem("reminderTime", time);
    }
}

function enableNotifications() {
    if ("Notification" in window) {
        Notification.requestPermission().then((permission) => {
            if (permission === "granted") {
                alert("Notifications enabled! Now set a reminder.");
            } else {
                alert("Notifications are blocked. Enable them in browser settings.");
            }
        });
    } else {
        alert("Your browser does not support notifications.");
    }
}

function resetData() {
    if (confirm("Are you sure you want to reset all data?")) {
        localStorage.removeItem("waterIntake");
        localStorage.removeItem("waterGoal");
        localStorage.removeItem("reminderTime");
        localStorage.removeItem("lastResetDate");
        localStorage.removeItem("dailyHistory");
        
        totalIntake = 0;
        goal = 0;
        dailyHistory = {};
        document.getElementById("total").innerText = 0;
        document.getElementById("remaining").innerText = 0;
        document.getElementById("goal").value = "";
        document.getElementById("reminder-time").value = "";
        document.getElementById("progress-bar").style.width = "0%";

        if (reminderInterval) clearInterval(reminderInterval);
        reminderInterval = null;
        
        alert("All data has been reset!");
    }
}

function checkAndResetDailyIntake() {
    let now = new Date();
    let currentDate = formatDate(now);
    let lastResetDate = localStorage.getItem("lastResetDate");
    
    if (lastResetDate !== currentDate) {
        resetDailyIntake();
        localStorage.setItem("lastResetDate", currentDate);
    }
}

function resetDailyIntake() {
    let currentDate = formatDate(new Date());
    if (dailyHistory[currentDate]) {
        dailyHistory[currentDate] = [];
        localStorage.setItem("dailyHistory", JSON.stringify(dailyHistory));
    }
    totalIntake = 0;
    updateDisplay();
    if (window.getComputedStyle(document.getElementById("history-popup")).display !== "none") {
        showDailyHistory();
        showCurrentIntake();
    }
}

setInterval(checkAndResetDailyIntake, 60000);

function toggleSettings() {
    let settings = document.getElementById("settings-section");
    let history = document.getElementById("history-popup");

    if (window.getComputedStyle(history).display === "block") {
        history.style.display = "none";
    }

    let currentDisplay = window.getComputedStyle(settings).display;
    settings.style.display = (currentDisplay === "none") ? "block" : "none";
}

document.addEventListener("click", function(event) {
    let settings = document.getElementById("settings-section");
    let history = document.getElementById("history-popup");

    if (!event.target.closest(".settings, .settings-btn")) {
        settings.style.display = "none";
    }

    if (!event.target.closest(".history-popup, .history-btn")) {
        history.style.display = "none";
    }
});
