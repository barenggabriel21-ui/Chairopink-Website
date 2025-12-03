// Import Firestore DB instance and functions
import { db } from "./integration/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Wait for the DOM to fully load
document.addEventListener('DOMContentLoaded', function() {

    // Grab elements safely
    const calendar = document.getElementById("calendar");
    const selectedDateInput = document.getElementById("selected_date");
    const timeSlotsContainer = document.getElementById("time_slots");

    if (!calendar || !selectedDateInput || !timeSlotsContainer) return;

    // --- State ---
    let currentDate = new Date();
    let selectedDate = null;
    let bookedSlots = {};
    let dailyLimits = {};
    let defaultGroomingDuration = 90; // minutes
    let bufferMinutes = 15; // 15-minute buffer between slots

    // --- Helpers ---
    function formatTime(hour, minute) {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return `${displayHour}:${minute.toString().padStart(2,'0')} ${period}`;
    }

    function formatDate(year, month, day) {
        return `${year}-${(month+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
    }

    function isPastDate(year, month, day) {
        const today = new Date();
        today.setHours(0,0,0,0);
        return new Date(year, month, day) < today;
    }

    function generateTimeSlots(duration = defaultGroomingDuration) {
        const slots = [];
        
        // Total time per slot = grooming + buffer
        const totalSlotTime = duration + bufferMinutes;
        
        let currentHour = 9, currentMinute = 30;
        const closingHour = 20, closingMinute = 0;

        while (true) {
            let startHour = currentHour;
            let startMinute = currentMinute;
            
            let endHour = startHour + Math.floor((startMinute + duration) / 60);
            let endMinute = (startMinute + duration) % 60;
            
            // Check if the slot would go past closing time
            if (endHour > closingHour || (endHour === closingHour && endMinute > closingMinute)) {
                break;
            }
            
            // Add the time slot (shows grooming time only)
            slots.push(`${formatTime(startHour, startMinute)} - ${formatTime(endHour, endMinute)}`);
            
            // Move to next slot by adding total time (grooming + buffer)
            currentMinute += totalSlotTime;
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
        return slots;
    }

    function getDailyLimit(dateStr) {
        const day = new Date(dateStr).getDay();
        return (day === 0 || day === 6) ? 25 : 15;
    }

    function getGroomersCount(dateStr) {
        const day = new Date(dateStr).getDay();
        return (day === 0 || day === 6) ? 3 : 2;
    }

    // --- Load booked slots & daily limits ---
    async function loadBookedSlots(dateStr) {
        const dateDocRef = doc(db, "dailyLimits", dateStr);
        const dateDocSnap = await getDoc(dateDocRef);

        if (dateDocSnap.exists()) {
            const data = dateDocSnap.data();
            bookedSlots[dateStr] = data.bookedSlots || [];
            dailyLimits[dateStr] = (data.dailyLimit !== undefined) ? data.dailyLimit : getDailyLimit(dateStr);
        } else {
            bookedSlots[dateStr] = [];
            dailyLimits[dateStr] = getDailyLimit(dateStr);
        }
    }

    // --- Render calendar ---
    async function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();
        const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

        // Preload all bookedSlots for the month
        const monthPromises = [];
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = formatDate(year, month, d);
            monthPromises.push(loadBookedSlots(dateStr));
        }
        await Promise.all(monthPromises);

        let html = `<div class="calendar-header">
                        <button id="prevMonth">&lt;</button>
                        <span>${currentDate.toLocaleString("default",{month:"long"})} ${year}</span>
                        <button id="nextMonth">&gt;</button>
                    </div>
                    <div class="calendar-grid">`;

        dayNames.forEach(d => html += `<div class="calendar-day day-name">${d}</div>`);
        for (let i = 0; i < firstDay; i++) html += `<div class="calendar-day empty"></div>`;

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = formatDate(year, month, day);
            const isPast = isPastDate(year, month, day);
            const isSelected = selectedDate === dateStr;

            const bookedForDay = bookedSlots[dateStr] || [];
            const limitForDay = dailyLimits[dateStr] || getDailyLimit(dateStr);
            const fullyBooked = bookedForDay.length >= limitForDay;

            let dayClass = 'calendar-day clickable-day';
            if (isPast) dayClass += ' past-date';
            if (isSelected) dayClass += ' selected-date';
            if (fullyBooked) dayClass += ' fully-booked';

            html += `<div class="${dayClass}" data-date="${dateStr}" data-year="${year}" data-month="${month}" data-day="${day}">${day}</div>`;
        }

        html += `</div>`;
        calendar.innerHTML = html;

        // Attach day click (exclude past and fully-booked)
        document.querySelectorAll('.clickable-day:not(.past-date):not(.fully-booked)').forEach(dayEl => {
            dayEl.addEventListener('click', async function() {
                const dateStr = this.getAttribute('data-date');
                const year = this.getAttribute('data-year');
                const month = this.getAttribute('data-month');
                const day = this.getAttribute('data-day');
                await selectDate(dateStr, year, month, day);
            });
        });

        // Month navigation
        const prevBtn = document.getElementById("prevMonth");
        const nextBtn = document.getElementById("nextMonth");
        if (prevBtn) prevBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); };
        if (nextBtn) nextBtn.onclick = () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); };
    }

    // --- Handle date selection ---
    async function selectDate(dateStr, year, month, day) {
        selectedDate = dateStr;
        const dateObj = new Date(year, month, day);
        selectedDateInput.value = dateObj.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric'});
        await loadBookedSlots(dateStr);

        const limitForDay = dailyLimits[dateStr] || getDailyLimit(dateStr);
        const bookedForDay = bookedSlots[dateStr] || [];
        if (bookedForDay.length >= limitForDay) {
            timeSlotsContainer.innerHTML = `<p class="full-message">This date is fully booked. Please choose another date.</p>`;
            await renderCalendar();
            return;
        }

        await renderCalendar();
        displayTimeSlots(dateStr);
    }

    // --- Display time slots ---
    function displayTimeSlots(dateStr) {
        const limitForDay = dailyLimits[dateStr] || getDailyLimit(dateStr);
        const bookedForDay = bookedSlots[dateStr] || [];
        if (bookedForDay.length >= limitForDay) {
            timeSlotsContainer.innerHTML = `<p class="full-message">This date is fully booked. Please choose another date.</p>`;
            return;
        }

        const allSlots = generateTimeSlots();
        const maxGroomers = getGroomersCount(dateStr);
        const booked = bookedSlots[dateStr] || [];

        let html = `<h3>Available Time Slots</h3>
                    <div class="time-slots-grid">`;
        
        allSlots.forEach(slot => {
            const count = booked.filter(s => s === slot).length;
            const availableSpots = maxGroomers - count;
            
            if (count >= maxGroomers) {
                // Slot is full
                html += `<div class="time-slot ">
                            <span>${slot}</span>
                            <small class="status-badge full">FULL</small>
                         </div>`;
            } else if (availableSpots === 1) {
                // Only 1 spot left
                html += `<label class="time-slot ">
                            <input type="radio" name="time_slot" value="${slot}">
                            <span>${slot}</span>
                            <small class="status-badge limited">1 SPOT LEFT</small>
                         </label>`;
            } else {
                // Both spots available
                html += `<label class="time-slot ">
                            <input type="radio" name="time_slot" value="${slot}">
                            <span>${slot}</span>
                            <small class="status-badge "></small>
                         </label>`;
            }
        });
        
        html += '</div>';
        timeSlotsContainer.innerHTML = html;
        timeSlotsContainer.scrollIntoView({behavior:'smooth', block:'nearest'});
    }

    // --- Expose functions globally ---
    window.calendarFunctions = {
        getSelectedDate: () => selectedDate,
        bookedSlots: bookedSlots,
        refreshCalendar: renderCalendar,
        addBookedSlot: (date,timeSlot) => {
            if (!bookedSlots[date]) bookedSlots[date] = [];
            bookedSlots[date].push(timeSlot);
        }
    };

    // --- Initial render ---
    renderCalendar();

});