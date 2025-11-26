function generateReferenceNumber() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let reference = '';
    for (let i = 0; i < 12; i++) {
        reference += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return reference;
}

function getSelectedService() {
    const serviceRadio = document.querySelector('input[name="service"]:checked');
    if (!serviceRadio) return null;
    
    const serviceValue = serviceRadio.value;
    const serviceLabel = serviceRadio.parentElement.textContent.trim();
    
    return {
        value: serviceValue,
        label: serviceLabel
    };
}

function getPetSize() {
    const service = getSelectedService();
    if (!service) return null;
    
    const serviceRadio = document.querySelector('input[name="service"]:checked');
    if (!serviceRadio) return null;
    
    const sizeGroup = serviceRadio.getAttribute('data-size-group');
    
    let sizeSelect = null;
    
    if (sizeGroup === 'cat') {
        sizeSelect = document.querySelector('select[name="size_cat_groom_basic"]');
    } else {
        sizeSelect = document.querySelector(`.size-${sizeGroup}`) || 
                     document.getElementById(`size_${sizeGroup}`);
    }
    
    if (!sizeSelect) {
        console.error('Size select not found for group:', sizeGroup);
        return null;
    }
    
    const selectedOption = sizeSelect.options[sizeSelect.selectedIndex];
    const sizeText = selectedOption.textContent.trim();
    
    return {
        value: selectedOption.value,
        label: sizeText
    };
}

function getAddOns() {
    const addOns = [];
    let totalAddOnCost = 0;
    
    const demattingCheckbox = document.querySelector('input[name="dematting"]');
    if (demattingCheckbox && demattingCheckbox.checked) {
        addOns.push({
            name: 'Dematting',
            price: 100
        });
        totalAddOnCost += 100;
    }
    
    const degreasingCheckbox = document.querySelector('input[name="degreasing"]');
    if (degreasingCheckbox && degreasingCheckbox.checked) {
        addOns.push({
            name: 'Extra Degreasing',
            price: 100
        });
        totalAddOnCost += 100;
    }
    
    return {
        items: addOns,
        total: totalAddOnCost
    };
}

function getDateTime() {
    const selectedDate = document.getElementById('selected_date').value;
    const selectedTimeSlot = document.querySelector('input[name="time_slot"]:checked');
    
    return {
        date: selectedDate || null,
        time: selectedTimeSlot ? selectedTimeSlot.value : null
    };
}

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

function getOwnerInformation() {
    return {
        ownerName: document.querySelector('input[name="owner_name"]').value.trim(),
        contactNumber: document.querySelector('input[name="contact_no"]').value.trim(),
        email: document.querySelector('input[name="email"]').value.trim(),
        address: document.querySelector('textarea[name="address"]').value.trim()
    };
}

function calculateTotalPrice(sizeInfo, addOns) {
    let basePrice = 0;
    
    if (sizeInfo && sizeInfo.label) {
        const priceMatch = sizeInfo.label.match(/P(\d+)/);
        if (priceMatch) {
            basePrice = parseInt(priceMatch[1]);
        }
    }
    
    return basePrice + addOns.total;
}

function collectBookingData() {
    const referenceNumber = generateReferenceNumber();
    const service = getSelectedService();
    const size = getPetSize();
    const addOns = getAddOns();
    const dateTime = getDateTime();
    const petInfo = getPetInformation();
    const ownerInfo = getOwnerInformation();
    const totalPrice = calculateTotalPrice(size, addOns);
    
    const bookingData = {
        referenceNumber: referenceNumber,
        bookingDate: new Date().toISOString(),
        
        service: {
            type: service ? service.label : null,
            size: size ? size.label : null,
            addOns: addOns.items,
            totalPrice: totalPrice
        },
        
        appointment: {
            date: dateTime.date,
            time: dateTime.time
        },
        
        pet: petInfo,
        
        owner: ownerInfo
    };
    
    return bookingData;
}

function validateBookingData(bookingData) {
    const errors = [];
    
    if (!bookingData.service.type) {
        errors.push('Please select a service');
    }
    
    if (!bookingData.appointment.date) {
        errors.push('Please select a date');
    }
    if (!bookingData.appointment.time) {
        errors.push('Please select a time slot');
    }
    
    if (!bookingData.pet.petName) {
        errors.push('Please enter pet name');
    }
    if (!bookingData.pet.breed) {
        errors.push('Please enter pet breed');
    }
    
    if (!bookingData.owner.ownerName) {
        errors.push('Please enter owner name');
    }
    if (!bookingData.owner.contactNumber) {
        errors.push('Please enter contact number');
    }
    if (!bookingData.owner.email) {
        errors.push('Please enter email');
    }
    
    return errors;
}

function submitBooking() {
    const bookingData = collectBookingData();
    const errors = validateBookingData(bookingData);
    
    if (errors.length > 0) {
        alert('Please complete the following:\n\n' + errors.join('\n'));
        return;
    }
    
    console.log('Booking Data:', bookingData);
    
    displayReceipt(bookingData);
    
    return bookingData;
}

function displayReceipt(bookingData) {
    const receiptDetails = document.getElementById('receipt_details');
    
    let addOnsHTML = '';
    if (bookingData.service.addOns.length > 0) {
        addOnsHTML = '<strong>Add-ons:</strong><br>';
        bookingData.service.addOns.forEach(addon => {
            addOnsHTML += `${addon.name} - P${addon.price}<br>`;
        });
    }
    
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
        <h3>Pet Information</h3>
        <p><strong>Name:</strong> ${bookingData.pet.petName}</p>
        <p><strong>Breed:</strong> ${bookingData.pet.breed}</p>
        <p><strong>Age:</strong> ${bookingData.pet.age}</p>
        <p><strong>Gender:</strong> ${bookingData.pet.gender}</p>
        ${bookingData.pet.birthdate ? `<p><strong>Birthdate:</strong> ${bookingData.pet.birthdate}</p>` : ''}
        ${bookingData.pet.allergies ? `<p><strong>Allergies:</strong> ${bookingData.pet.allergies}</p>` : ''}
        ${bookingData.pet.lastVaccinationDate ? `<p><strong>Last Vaccination:</strong> ${bookingData.pet.lastVaccinationDate}</p>` : ''}
        ${bookingData.pet.healthHistory ? `<p><strong>Health History:</strong> ${bookingData.pet.healthHistory}</p>` : ''}
        <hr>
        <h3>Owner Information</h3>
        <p><strong>Name:</strong> ${bookingData.owner.ownerName}</p>
        <p><strong>Contact:</strong> ${bookingData.owner.contactNumber}</p>
        <p><strong>Email:</strong> ${bookingData.owner.email}</p>
        <p><strong>Address:</strong> ${bookingData.owner.address}</p>
    `;
    
    document.getElementById('receiptPopup').classList.remove('hidden');
}

function closeReceipt() {
    document.getElementById('receiptPopup').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', function() {
    const bookingContainer = document.querySelector('.booking-container');
    
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