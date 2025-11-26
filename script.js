// CALENDAR GRID.JS WITH TIME SLOTS
// CALENDAR GRID.JS WITH TIME SLOTS
// CALENDAR GRID.JS WITH TIME SLOTS

const calendar = document.getElementById("calendar");
const selectedDateInput = document.getElementById("selected_date");
const timeSlotsContainer = document.getElementById("time_slots");

let currentDate = new Date();
let selectedDate = null;

// Store booked appointments (in real app, this would come from a database)
// Format: { "2025-11-26": ["9:30 AM - 11:00 AM", "11:00 AM - 12:30 PM"], ... }
let bookedSlots = {};

// Generate time slots for a day (9:30 AM to 8:00 PM, 1.5 hour slots)
function generateTimeSlots() {
    const slots = [];
    let startHour = 9;
    let startMinute = 30;
    
    // Generate slots until 8:00 PM (last slot starts at 6:30 PM)
    while (startHour < 20) {
        // Calculate end time (1.5 hours later)
        let endHour = startHour + 1;
        let endMinute = startMinute + 30;
        
        if (endMinute >= 60) {
            endMinute -= 60;
            endHour += 1;
        }
        
        // Stop if end time exceeds 8:00 PM
        if (endHour > 20 || (endHour === 20 && endMinute > 0)) {
            break;
        }
        
        // Format times
        const startTime = formatTime(startHour, startMinute);
        const endTime = formatTime(endHour, endMinute);
        const slotLabel = `${startTime} - ${endTime}`;
        
        slots.push(slotLabel);
        
        // Move to next slot
        startMinute += 90; // 1.5 hours = 90 minutes
        if (startMinute >= 60) {
            startHour += Math.floor(startMinute / 60);
            startMinute = startMinute % 60;
        }
    }
    
    return slots;
}

// Format time to 12-hour format with AM/PM
function formatTime(hour, minute) {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
    const displayMinute = minute.toString().padStart(2, '0');
    return `${displayHour}:${displayMinute} ${period}`;
}

// Format date as YYYY-MM-DD
function formatDate(year, month, day) {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
}

// Check if a date is in the past
function isPastDate(year, month, day) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(year, month, day);
    return checkDate < today;
}

// Render calendar
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

    // Add click listeners to calendar days
    document.querySelectorAll('.clickable-day:not(.past-date)').forEach(dayEl => {
        dayEl.addEventListener('click', function() {
            const dateStr = this.getAttribute('data-date');
            const year = this.getAttribute('data-year');
            const month = this.getAttribute('data-month');
            const day = this.getAttribute('data-day');
            
            selectDate(dateStr, year, month, day);
        });
    });

    // Month navigation buttons
    document.getElementById("prevMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    };

    document.getElementById("nextMonth").onclick = () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    };
}

// Select a date and show time slots
function selectDate(dateStr, year, month, day) {
    selectedDate = dateStr;
    
    // Update selected date input
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

// Display available time slots for selected date
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
    
    // Scroll to time slots
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