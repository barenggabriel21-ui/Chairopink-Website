import { db } from "./firebase.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.0/firebase-firestore.js";

// Generate random 12-character reference number
function generateReferenceNumber() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let reference = '';
    for (let i = 0; i < 12; i++) {
        reference += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return reference;
}

// Get selected service
function getSelectedService() {
    const serviceRadio = document.querySelector('input[name="service"]:checked');
    if (!serviceRadio) return null;
    return {
        value: serviceRadio.value,
        label: serviceRadio.parentElement.textContent.trim()
    };
}

// Get pet size
function getPetSize() {
    const serviceRadio = document.querySelector('input[name="service"]:checked');
    if (!serviceRadio) return null;

    const sizeGroup = serviceRadio.getAttribute('data-size-group');
    let sizeSelect = null;

    if (sizeGroup === 'cat') {
        sizeSelect = document.querySelector('select[name="size_cat_groom_basic"]');
    } else {
        sizeSelect = document.querySelector(`.size-${sizeGroup}`) || document.getElementById(`size_${sizeGroup}`);
    }

    if (!sizeSelect) return null;
    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
    return { value: selectedOption.value, label: selectedOption.textContent.trim() };
}

// Get add-ons
function getAddOns() {
    const addOns = [];
    let totalAddOnCost = 0;
    let durationAdd = 0;

    const demattingCheckbox = document.querySelector('input[name="dematting"]');
    if (demattingCheckbox?.checked) {
        addOns.push({ name: 'Dematting', price: 100 });
        totalAddOnCost += 100;
        durationAdd += 20;
    }

    const degreasingCheckbox = document.querySelector('input[name="degreasing"]');
    if (degreasingCheckbox?.checked) {
        addOns.push({ name: 'Extra Degreasing', price: 100 });
        totalAddOnCost += 100;
        durationAdd += 10;
    }

    return { items: addOns, total: totalAddOnCost, durationAdd };
}

// Get date and time
function getDateTime() {
    const selectedDate = document.getElementById('selected_date').value;
    const selectedTimeSlot = document.querySelector('input[name="time_slot"]:checked');
    return { date: selectedDate || null, time: selectedTimeSlot?.value || null };
}

// Get pet info
function getPetInformation() {
    return {
        petName: document.querySelector('input[name="pet_name"]').value.trim(),
        breed: document.querySelector('input[name="breed"]').value.trim(),
        age: document.querySelector('input[name="age"]').value,
        gender: document.querySelector('select[name="gender"]').value,
        birthdate: document.querySelector('input[name="birthdate"]').value,
        allergies: document.querySelector('input[name="allergies"]').value.trim(),
        lastVaccinationDate: document.querySelector('input[name="last_vacc"]').value,
        healthHistory: document.querySelector('textarea[name="health_history"]').value.trim()
    };
}

// Get owner info
function getOwnerInformation() {
    return {
        ownerName: document.querySelector('input[name="owner_name"]').value.trim(),
        contactNumber: document.querySelector('input[name="contact_no"]').value.trim(),
        email: document.querySelector('input[name="email"]').value.trim(),
        address: document.querySelector('textarea[name="address"]').value.trim()
    };
}

// Calculate total price
function calculateTotalPrice(sizeInfo, addOns) {
    let basePrice = 0;
    if (sizeInfo?.label) {
        const priceMatch = sizeInfo.label.match(/P(\d+)/);
        if (priceMatch) basePrice = parseInt(priceMatch[1]);
    }
    return basePrice + addOns.total;
}

// Calculate duration
function calculateGroomingDuration(sizeInfo, addOns) {
    let duration = 90; // base 1.5 hours
    if (sizeInfo?.label) {
        if (/medium/i.test(sizeInfo.label)) duration += 20;
        if (/large/i.test(sizeInfo.label)) duration += 30;
    }
    if (addOns.durationAdd) duration += addOns.durationAdd;
    return duration;
}

// helpers for limits
function getDailyLimitByDateStr(dateStr) {
    const day = new Date(dateStr).getDay();
    // weekend (Sat/Sun) => 25, weekdays => 15
    return (day === 0 || day === 6) ? 25 : 15;
}

function getGroomersCountByDateStr(dateStr) {
    const day = new Date(dateStr).getDay();
    return (day === 0 || day === 6) ? 3 : 2;
}

// Collect booking data
function collectBookingData() {
    const referenceNumber = generateReferenceNumber();
    const service = getSelectedService();
    const size = getPetSize();
    const addOns = getAddOns();
    const dateTime = getDateTime();
    const petInfo = getPetInformation();
    const ownerInfo = getOwnerInformation();
    const totalPrice = calculateTotalPrice(size, addOns);
    const duration = calculateGroomingDuration(size, addOns);

    return {
        referenceNumber,
        bookingDate: new Date().toISOString(),
        service: { type: service?.label || null, size: size?.label || null, addOns: addOns.items, totalPrice, duration },
        appointment: dateTime,
        pet: petInfo,
        owner: ownerInfo
    };
}

// Validate booking
function validateBookingData(bookingData) {
    const errors = [];
    if (!bookingData.service.type) errors.push('Please select a service');
    if (!bookingData.appointment.date) errors.push('Please select a date');
    if (!bookingData.appointment.time) errors.push('Please select a time slot');
    if (!bookingData.pet.petName) errors.push('Please enter pet name');
    if (!bookingData.pet.breed) errors.push('Please enter pet breed');
    if (!bookingData.owner.ownerName) errors.push('Please enter owner name');
    if (!bookingData.owner.contactNumber) errors.push('Please enter contact number');
    if (!bookingData.owner.email) errors.push('Please enter email');
    return errors;
}

// Submit booking with groomer limit + daily limit check
async function submitBooking() {
    const submitBtn = document.querySelector('.submit-booking-btn');
    // disable to prevent double clicks
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.style.opacity = 0.6;
    }

    const bookingData = collectBookingData();
    const errors = validateBookingData(bookingData);
    if (errors.length > 0) {
        alert('Please complete the following:\n\n' + errors.join('\n'));
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = 1; }
        return;
    }

    // First: fetch latest dailyLimits doc
    const dateDocRef = doc(db, "dailyLimits", bookingData.appointment.date);
    const dateDocSnap = await getDoc(dateDocRef);
    const booked = dateDocSnap.exists() ? dateDocSnap.data().bookedSlots || [] : [];

    // DAILY limit check (stop if day full)
    const dailyLimit = getDailyLimitByDateStr(bookingData.appointment.date);
    if ((booked.length) >= dailyLimit) {
        alert("Sorry, this day has reached the maximum number of bookings. Please choose another date.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = 1; }
        return;
    }

    // PER-SLOT groomer count check
    const maxGroomers = getGroomersCountByDateStr(bookingData.appointment.date);
    const slotCount = booked.filter(s => s === bookingData.appointment.time).length;
    if (slotCount >= maxGroomers) {
        alert("This time slot is fully booked. Please select another slot.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = 1; }
        return;
    }

    // Attempt to save — re-check inside saveBookingToFirestore to avoid small race
    const saved = await saveBookingToFirestore(bookingData);
    if (saved) {
        // booking saved - show receipt and keep button disabled until user closes receipt
        displayReceipt(bookingData);
    } else {
        // saving failed (likely hit limit in the meantime)
        alert("Booking failed because the slot/day became full. Please choose another slot/date.");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.style.opacity = 1; }
    }
}

// Save booking (re-checks limits before writing)
// returns true on success, false on failure
async function saveBookingToFirestore(bookingData) {
    const dateDocRef = doc(db, "dailyLimits", bookingData.appointment.date);
    const dateDocSnap = await getDoc(dateDocRef);

    let bookedSlots = dateDocSnap.exists() ? dateDocSnap.data().bookedSlots || [] : [];
    const dailyLimit = getDailyLimitByDateStr(bookingData.appointment.date);

    // re-check daily limit
    if (bookedSlots.length >= dailyLimit) return false;

    // re-check per-slot groomers
    const maxGroomers = getGroomersCountByDateStr(bookingData.appointment.date);
    const slotCount = bookedSlots.filter(s => s === bookingData.appointment.time).length;
    if (slotCount >= maxGroomers) return false;

    // push and write
    bookedSlots.push(bookingData.appointment.time);
    await setDoc(doc(db, "bookings", bookingData.referenceNumber), bookingData);
    await setDoc(dateDocRef, { weekdayLimit: dailyLimit, bookedSlots }, { merge: true });
    console.log("Booking saved!");
    return true;
}

// Display receipt
function displayReceipt(bookingData) {
    const receiptDetails = document.getElementById('receipt_details');
    let addOnsHTML = '';
    if (bookingData.service.addOns.length > 0) {
        addOnsHTML = '<strong>Add-ons:</strong><br>';
        bookingData.service.addOns.forEach(addon => addOnsHTML += `${addon.name} - P${addon.price}<br>`);
    }

    // Note to screenshot and contact
    const note = `<p style="color:#b4006e;font-weight:600;">Please screenshot this receipt and present it during walk-ins. For questions contact ChairoPink Pet Salon on Facebook.</p>`;

    receiptDetails.innerHTML = `
        <p><strong>Reference Number:</strong> ${bookingData.referenceNumber}</p>
        <p><strong>Booking Date:</strong> ${new Date(bookingData.bookingDate).toLocaleString()}</p>
        <hr>
        <h3>Service Details</h3>
        <p><strong>Service:</strong> ${bookingData.service.type}</p>
        <p><strong>Size:</strong> ${bookingData.service.size}</p>
        ${addOnsHTML}
        <p><strong>Total Price:</strong> P${bookingData.service.totalPrice}</p>
        <hr>
        <h3>Appointment</h3>
        <p><strong>Date:</strong> ${bookingData.appointment.date}</p>
        <p><strong>Time:</strong> ${bookingData.appointment.time}</p>
        <hr>
        ${note}
    `;

    document.getElementById('receiptPopup').classList.remove('hidden');
}

// Close receipt
function closeReceipt() {
    document.getElementById('receiptPopup').classList.add('hidden');
    const submitBtn = document.querySelector('.submit-booking-btn');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = 1;
    }
}

// Attach submit button
document.addEventListener('DOMContentLoaded', () => {
    const bookingContainer = document.querySelector('.booking-container');
    if (!bookingContainer) return;

    let submitButton = document.querySelector('.submit-booking-btn');
    if (!submitButton) {
        submitButton = document.createElement('button');
        submitButton.textContent = 'Confirm Booking';
        submitButton.className = 'submit-booking-btn';
        submitButton.style.cssText = 'padding: 15px 30px; background-color: #b671b6ff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer; margin: 20px 0;';
        submitButton.onclick = submitBooking;
        bookingContainer.appendChild(submitButton);
    }
});