
// CALENDAR GRID.JS
// CALENDAR GRID.JS
// CALENDAR GRID.JS

const calendar = document.getElementById("calendar");

let currentDate = new Date();

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month, total days, etc.
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    // Day labels
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Build HTML
    let html = `
        <div class="calendar-header">
            <button id="prevMonth">&lt;</button>
            <span>${currentDate.toLocaleString("default", { month: "long" })} ${year}</span>
            <button id="nextMonth">&gt;</button>
        </div>

        <div class="calendar-grid">
    `;

    // Day names row
    dayNames.forEach(d => {
        html += `<div class="calendar-day day-name">${d}</div>`;
    });

    // Empty slots before day 1
    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    // Days
    for (let day = 1; day <= totalDays; day++) {
        html += `<div class="calendar-day">${day}</div>`;
    }

    html += `</div>`; // grid end

    calendar.innerHTML = html;

    // Buttons
    document.getElementById("prevMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    document.getElementById("nextMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };
}

// Initialize calendar
renderCalendar();


// CALENDAR GRID.JS
// CALENDAR GRID.JS
// CALENDAR GRID.JS