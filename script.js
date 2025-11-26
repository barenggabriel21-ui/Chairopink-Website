// CALENDAR GRID.JS WITH TIME SLOTS
// CALENDAR GRID.JS WITH TIME SLOTS
// CALENDAR GRID.JS WITH TIME SLOTS

const calendar = document.getElementById("calendar");
const selectedDateInput = document.getElementById("selected_date");
const timeSlotsContainer = document.getElementById("time_slots");

let currentDate = new Date();
let selectedDate = null;

let bookedSlots = {};

function generateTimeSlots() {
    const slots = [];
    let startHour = 9;
    let startMinute = 30;
    
    while (startHour < 20) {
        let endHour = startHour + 1;
        let endMinute = startMinute + 30;
        
        if (endMinute >= 60) {
            endMinute -= 60;
            endHour += 1;
        }
        
        if (endHour > 20 || (endHour === 20 && endMinute > 0)) {
            break;
        }
        
        const startTime = formatTime(startHour, startMinute);
        const endTime = formatTime(endHour, endMinute);
        const slotLabel = `${startTime} - ${endTime}`;
        
        slots.push(slotLabel);
        
        startMinute += 90;
        if (startMinute >= 60) {
            startHour += Math.floor(startMinute / 60);
            startMinute = startMinute % 60;
        }
    }
    
    return slots;
}

function formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
}

function formatDate(year, month, day) {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
}

function isPastDate(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    let html = `
        <div class="calendar-header">
            <button id="prevMonth">&lt;</button>
            <span>${currentDate.toLocaleString("default", { month: "long" })} ${year}</span>
            <button id="nextMonth">&gt;</button>
        </div>

        <div class="calendar-grid">
    `;

    dayNames.forEach(d => {
        html += `<div class="calendar-day day-name">${d}</div>`;
    });

    for (let i = 0; i < firstDay; i++) {
        html += `<div class="calendar-day empty"></div>`;
    }

    for (let day = 1; day <= totalDays; day++) {
        const dateStr = formatDate(year, month, day);
        const isPast = isPastDate(year, month, day);
        const isSelected = selectedDate === dateStr;
        
        let dayClass = 'calendar-day clickable-day';
        if (isPast) dayClass += ' past-date';
        if (isSelected) dayClass += ' selected-date';
        
        html += `<div class="${dayClass}" data-date="${dateStr}" data-year="${year}" data-month="${month}" data-day="${day}">${day}</div>`;
    }

    html += `</div>`;

    calendar.innerHTML = html;

    document.querySelectorAll('.clickable-day:not(.past-date)').forEach(dayEl => {
        dayEl.addEventListener('click', function() {
            const dateStr = this.getAttribute('data-date');
            const year = this.getAttribute('data-year');
            const month = this.getAttribute('data-month');
            const day = this.getAttribute('data-day');
            
            selectDate(dateStr, year, month, day);
        });
    });

    document.getElementById("prevMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    document.getElementById("nextMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };
}

function selectDate(dateStr, year, month, day) {
    selectedDate = dateStr;
    
    const dateObj = new Date(year, month, day);
    const formattedDisplay = dateObj.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    selectedDateInput.value = formattedDisplay;
    
    // Re-render calendar to highlight selected date
    renderCalendar();
    
    // Show time slots
    displayTimeSlots(dateStr);
}

function displayTimeSlots(dateStr) {
    const allSlots = generateTimeSlots();
    const booked = bookedSlots[dateStr] || [];
    
    let html = '<h3>Available Time Slots</h3>';
    html += '<div class="time-slots-grid">';
    
    allSlots.forEach(slot => {
        const isBooked = booked.includes(slot);
        const slotClass = isBooked ? 'time-slot booked' : 'time-slot';
        const disabled = isBooked ? 'disabled' : '';
        
        html += `
            <label class="${slotClass}">
                <input type="radio" name="time_slot" value="${slot}" ${disabled}>
                <span>${slot}</span>
                ${isBooked ? '<span class="booked-label">(Booked)</span>' : ''}
            </label>
        `;
    });
    
    html += '</div>';
    
    timeSlotsContainer.innerHTML = html;
    
    timeSlotsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Initialize calendar
renderCalendar();

// Export functions for use in main.js
window.calendarFunctions = {
    getSelectedDate: () => selectedDate,
    bookedSlots: bookedSlots,
    refreshCalendar: renderCalendar,
    addBookedSlot: (date, timeSlot) => {
        if (!bookedSlots[date]) {
            bookedSlots[date] = [];
        }
        bookedSlots[date].push(timeSlot);
    }
};

// CALENDAR GRID.JS WITH TIME SLOTS
// CALENDAR GRID.JS WITH TIME SLOTS
// CALENDAR GRID.JS WITH TIME SLOTS