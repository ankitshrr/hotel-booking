document.addEventListener('DOMContentLoaded', () => {
    const dateHeaders = document.getElementById('dateHeaders');
    const roomRows = document.getElementById('roomRows');
    const modalOverlay = document.getElementById('bookingModal');
    const closeModalBtn = document.getElementById('closeModal');
    const guestNameInput = document.getElementById('guestName');
    const modalSubtitle = document.getElementById('modalSubtitle');

    const btnBooked = document.getElementById('btnBooked');
    const btnCheckIn = document.getElementById('btnCheckIn');
    const btnCheckOut = document.getElementById('btnCheckOut');
    const btnClosed = document.getElementById('btnClosed');
    const btnClear = document.getElementById('btnClear');

    const btnToday = document.getElementById('btnToday');
    const jumpMonthInput = document.getElementById('jumpMonth');
    const currentMonthTitle = document.getElementById('currentMonthTitle');

    // Default to the 1st of the current month, viewing the whole month
    const todayForInit = new Date();
    todayForInit.setHours(0, 0, 0, 0);
    const firstDayOfMonth = new Date(todayForInit.getFullYear(), todayForInit.getMonth(), 1);

    let startDateOffset = Math.round((firstDayOfMonth - todayForInit) / (1000 * 60 * 60 * 24));
    let daysToView = new Date(todayForInit.getFullYear(), todayForInit.getMonth() + 1, 0).getDate();

    const searchInput = document.getElementById('guestSearch');

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.textContent = message;
        toast.className = `toast toast-${type}`;
        document.body.appendChild(toast);
        
        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyCRnEgvdzDFO7Q5EZxgWcxCpwz_GKIrI_o",
        authDomain: "hotel-booking0007.firebaseapp.com",
        projectId: "hotel-booking0007",
        storageBucket: "hotel-booking0007.firebasestorage.app",
        messagingSenderId: "789897623083",
        appId: "1:789897623083:web:bb87ecfefe9eb7ea3e1c6e",
        measurementId: "G-C6W9B0Z850"
    };

    let auth = null;
    let db = null;
    let currentUserUid = null;
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        auth = firebase.auth();
        db = firebase.firestore();
    }

    const loginOverlay = document.getElementById('loginOverlay');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    const btnMainAuth = document.getElementById('btnMainAuth');
    const authToggleLink = document.getElementById('authToggleLink');
    const authTitle = document.getElementById('authTitle');
    const authSubtitle = document.getElementById('authSubtitle');
    let isLoginMode = true;
    const btnLoginGoogle = document.getElementById('btnLoginGoogle');
    const btnLogout = document.getElementById('btnLogout');
    const loginError = document.getElementById('loginError');

    let authInitialized = false;

    if (auth) {
        auth.onAuthStateChanged(user => {
            if (!authInitialized) {
                authInitialized = true;
                const loader = document.getElementById('globalLoader');
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.style.display = 'none', 400);
                }
            }

            if (user) {
                currentUserUid = user.uid;
                if (loginOverlay) loginOverlay.classList.remove('active');
                if (btnLogout) btnLogout.style.display = 'block';

                if (db) {
                    db.collection('userBookings').doc(currentUserUid).onSnapshot((doc) => {
                        if (doc.exists) {
                            let data = doc.data();
                            if (data.roomsConfig) {
                                bookings = data.bookings || {};
                                roomsConfig = data.roomsConfig;
                            } else {
                                bookings = data;
                                roomsConfig = JSON.parse(JSON.stringify(defaultRoomsConfig));
                            }
                        } else {
                            bookings = {};
                            roomsConfig = JSON.parse(JSON.stringify(defaultRoomsConfig));
                        }
                        renderTable();
                        updateDashboardStats();
                        renderAdminRooms();
                        scrollToToday();
                    }, (error) => {
                        console.error("Firestore error:", error);
                        renderTable();
                        updateDashboardStats();
                        renderAdminRooms();
                        scrollToToday();
                    });
                } else {
                    renderTable();
                    scrollToToday();
                }
            } else {
                currentUserUid = null;
                if (loginOverlay) loginOverlay.classList.add('active');
                if (btnLogout) btnLogout.style.display = 'none';
                if (roomRows) roomRows.innerHTML = '';
            }
        });

        if (authToggleLink) {
            authToggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                isLoginMode = !isLoginMode;
                loginError.style.display = "none";
                if (isLoginMode) {
                    authTitle.textContent = "Welcome Back";
                    authSubtitle.textContent = "Please log in to your account";
                    btnMainAuth.textContent = "Login";
                    authToggleLink.textContent = "Don't have an account? Sign up";
                } else {
                    authTitle.textContent = "Create Account";
                    authSubtitle.textContent = "Sign up to get started";
                    btnMainAuth.textContent = "Sign Up";
                    authToggleLink.textContent = "Already have an account? Log in";
                }
            });
        }

        if (btnMainAuth) {
            btnMainAuth.addEventListener('click', () => {
                const email = loginEmailInput.value;
                const password = loginPasswordInput.value;
                if (!email || !password) {
                    loginError.textContent = "Please enter email and password.";
                    loginError.style.display = "block";
                    return;
                }

                if (isLoginMode) {
                    auth.signInWithEmailAndPassword(email, password)
                        .then(() => {
                            showToast("Login Successful!", "success");
                        })
                        .catch(error => {
                            if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
                                loginError.textContent = "Account not found or incorrect password.";
                            } else {
                                loginError.textContent = error.message;
                            }
                            loginError.style.display = "block";
                        });
                } else {
                    auth.createUserWithEmailAndPassword(email, password)
                        .then(() => {
                            showToast("Account Created & Login Successful!", "success");
                        })
                        .catch(error => {
                            if (error.code === 'auth/email-already-in-use') {
                                // Account exists, so just log them in!
                                auth.signInWithEmailAndPassword(email, password)
                                    .then(() => {
                                        showToast("Login Successful!", "success");
                                    })
                                    .catch(loginErr => {
                                        loginError.textContent = "Account exists, but incorrect password.";
                                        loginError.style.display = "block";
                                    });
                            } else {
                                loginError.textContent = error.message;
                                loginError.style.display = "block";
                            }
                        });
                }
            });
        }

        if (btnLoginGoogle) {
            btnLoginGoogle.addEventListener('click', () => {
                btnLoginGoogle.innerHTML = 'Opening Google Login...';
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider).catch(error => {
                    loginError.textContent = error.message;
                    loginError.style.display = "block";
                    btnLoginGoogle.innerHTML = 'Continue with Google';
                });
            });
        }

        if (btnLogout) {
            btnLogout.addEventListener('click', () => {
                auth.signOut().then(() => {
                    showToast("Logout Successful!", "success");
                });
            });
        }
    }

// Rooms Configuration
    const defaultRoomsConfig = [

    {
        groupName: 'Room 204',
        groupDesc: 'Four Bed (Fan)',
        beds: [
            { id: '204_b1', name: '204 B1' },
            { id: '204_b2', name: '204 B2' },
            { id: '204_b3', name: '204 B3' },
            { id: '204_b4', name: '204 B4' }
        ]
    },

    {
        groupName: 'Room 304',
        groupDesc: 'Four Bed (AC)',
        beds: [
            { id: '304_b1', name: '304 B1' },
            { id: '304_b2', name: '304 B2' },
            { id: '304_b3', name: '304 B3' },
            { id: '304_b4', name: '304 B4' }
        ]
    },
    {
        groupName: 'Room 403',
        groupDesc: 'Six Bed (AC)',
        beds: [
            { id: '403_b1', name: '403 B1' },
            { id: '403_b2', name: '403 B2' },
            { id: '403_b3', name: '403 B3' },
            { id: '403_b4', name: '403 B4' },
            { id: '403_b5', name: '403 B5' },
            { id: '403_b6', name: '403 B6' }
        ]
    },
    {
        groupName: 'Room 302',
        groupDesc: 'Double Room with Shared Bathroom',
        beds: [
            { id: '302', name: '302' }
        ]
    },
    {
        groupName: 'Standard Double',
        groupDesc: 'Standard Double Room',
        beds: [
            { id: '102', name: '102' },
            { id: '103', name: '103' },
            { id: '203', name: '203' }
        ]
    },
    {
        groupName: 'Deluxe Double',
        groupDesc: 'Deluxe Double Room',
        beds: [
            { id: '201', name: '201' },
            { id: '301', name: '301' },
            { id: '401', name: '401' }
        ]
    },
    {
        groupName: 'Family Private',
        groupDesc: 'Family Room with Private Bathroom',
        beds: [
            { id: '101', name: '101' }
        ]
    },
    {
        groupName: 'Twin Shared',
        groupDesc: 'Twin Room with Shared Bathroom',
        beds: [
            { id: '202', name: '202' },
            { id: '303', name: '303' }
        ]
    },
    {
        groupName: 'Family Shared',
        groupDesc: 'Family Room with Shared Bathroom',
        beds: [
            { id: '402', name: '402' }
        ]
    }
];

let roomsConfig = JSON.parse(JSON.stringify(defaultRoomsConfig));
if (localStorage.getItem('pmsRoomsConfig')) {
    try {
        roomsConfig = JSON.parse(localStorage.getItem('pmsRoomsConfig'));
    } catch(e) {}
}

let dates = [];
function generateDates() {
    dates = [];
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + startDateOffset);
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    if (currentMonthTitle) {
        currentMonthTitle.textContent = `${monthNames[baseDate.getMonth()]} ${baseDate.getFullYear()}`;
    }

    const t = new Date(); const realTodayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    for (let i = 0; i < daysToView; i++) {
        let d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const iso = `${y}-${m}-${day}`;
        dates.push({ label: dateStr, iso: iso, isToday: iso === realTodayIso });
    }
}

// Bookings State: key = "roomId_isoDate", value = { guestName, status }
let bookings = {};


// Current selection
let activeRoomId = null;
let activeDateIso = null;

// Drag and Drop State
let draggedBlock = null;

function renderTable() {
    generateDates();

    // Filter rooms based on selection
    const roomFilter = document.getElementById('roomFilter');
    let filteredRoomsConfig = roomsConfig;
    if (roomFilter && roomFilter.value !== 'all') {
        const fv = roomFilter.value.toLowerCase();
        filteredRoomsConfig = roomsConfig.filter(g =>
            g.groupDesc.toLowerCase().includes(fv) ||
            g.groupName.toLowerCase().includes(fv)
        );
    }

    // Render Headers
    dateHeaders.innerHTML = '<th class="room-col-header">Rooms / Dates</th>';
    dates.forEach(d => {
        const th = document.createElement('th');
        th.textContent = d.label;
        if (d.isToday) th.classList.add('today-header');
        dateHeaders.appendChild(th);
    });

    // Render Rows
    roomRows.innerHTML = '';
    filteredRoomsConfig.forEach(group => {

        // 1. Group Header Row
        const trGroup = document.createElement('tr');
        trGroup.className = 'group-row';

        const tdGroup = document.createElement('td');
        tdGroup.colSpan = dates.length + 1; // Span across all dates + room column
        tdGroup.className = 'group-cell';

        tdGroup.innerHTML = `
                <div class="group-title-container sticky-left">
                    <div class="group-title">${group.groupDesc}</div>
                </div>
            `;
        trGroup.appendChild(tdGroup);
        roomRows.appendChild(trGroup);

        // 2. Bed Rows
        group.beds.forEach(bed => {
            const tr = document.createElement('tr');

            const tdRoom = document.createElement('td');
            tdRoom.className = 'room-cell sub-room';
            tdRoom.innerHTML = `<div class="sub-room-name">${bed.name}</div>`;
            tr.appendChild(tdRoom);

            dates.forEach(d => {
                const tdCell = document.createElement('td');
                tdCell.className = 'day-cell';
                if (d.isToday) tdCell.classList.add('today-cell');

                const cellKey = `${bed.id}_${d.iso}`;
                const booking = bookings[cellKey];

                if (booking) {
                    const extraBedIcon = booking.extraBed ? ' <span style="font-size: 0.85em; opacity: 0.8;" title="Extra Bed">🛏️</span>' : '';
                    tdCell.innerHTML = `<div class="booking-content status-${booking.status}" draggable="true">${booking.guestName}${extraBedIcon}</div>`;
                }

                tdCell.dataset.roomId = bed.id;
                tdCell.dataset.dateIso = d.iso;

                if (booking) {
                    const content = tdCell.querySelector('.booking-content');
                    content.addEventListener('dragstart', (e) => {
                        const blockDates = [];
                        let checkDate = new Date(d.iso);
                        while (true) {
                            checkDate.setDate(checkDate.getDate() - 1);
                            const iso = checkDate.toISOString().split('T')[0];
                            const key = `${bed.id}_${iso}`;
                            if (bookings[key] && bookings[key].guestName === booking.guestName) {
                                blockDates.unshift(iso);
                            } else {
                                break;
                            }
                        }
                        blockDates.push(d.iso);
                        checkDate = new Date(d.iso);
                        while (true) {
                            checkDate.setDate(checkDate.getDate() + 1);
                            const iso = checkDate.toISOString().split('T')[0];
                            const key = `${bed.id}_${iso}`;
                            if (bookings[key] && bookings[key].guestName === booking.guestName) {
                                blockDates.push(iso);
                            } else {
                                break;
                            }
                        }

                        draggedBlock = {
                            roomId: bed.id,
                            guestName: booking.guestName,
                            status: booking.status,
                            dates: blockDates,
                            dragAnchorIso: d.iso
                        };

                        setTimeout(() => content.classList.add('dragging'), 0);
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', booking.guestName);
                    });

                    content.addEventListener('dragend', () => {
                        content.classList.remove('dragging');
                        draggedBlock = null;
                        document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
                    });
                }

                tdCell.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!draggedBlock) return;
                    e.dataTransfer.dropEffect = 'move';
                    tdCell.classList.add('drag-over');
                });

                tdCell.addEventListener('dragleave', () => {
                    tdCell.classList.remove('drag-over');
                });

                tdCell.addEventListener('drop', (e) => {
                    e.preventDefault();
                    tdCell.classList.remove('drag-over');
                    if (!draggedBlock) return;

                    const dropRoomId = tdCell.dataset.roomId;
                    const dropDateIso = tdCell.dataset.dateIso;

                    if (dropRoomId === draggedBlock.roomId && dropDateIso === draggedBlock.dragAnchorIso) {
                        return;
                    }

                    const anchorDate = new Date(draggedBlock.dragAnchorIso);
                    const dropDate = new Date(dropDateIso);
                    const dayShift = Math.round((dropDate - anchorDate) / (1000 * 60 * 60 * 24));

                    const newDates = [];
                    let collision = false;
                    for (let iso of draggedBlock.dates) {
                        const oldDate = new Date(iso);
                        const newDateObj = new Date(oldDate.getTime() + (dayShift * 86400000));
                        const newIso = newDateObj.toISOString().split('T')[0];
                        newDates.push(newIso);

                        const targetKey = `${dropRoomId}_${newIso}`;
                        if (bookings[targetKey]) {
                            if (!(dropRoomId === draggedBlock.roomId && draggedBlock.dates.includes(newIso))) {
                                collision = true;
                            }
                        }
                    }

                    if (collision) {
                        alert('Cannot move here. The dates overlap with an existing booking!');
                        return;
                    }

                    draggedBlock.dates.forEach(iso => {
                        delete bookings[`${draggedBlock.roomId}_${iso}`];
                    });

                    newDates.forEach(iso => {
                        bookings[`${dropRoomId}_${iso}`] = {
                            guestName: draggedBlock.guestName,
                            status: draggedBlock.status
                        };
                    });

                    draggedBlock = null;
                    saveAndRender();
                });

                tdCell.addEventListener('click', () => openModal(bed, group, d, booking));

                // Context Menu
                tdCell.addEventListener('contextmenu', (e) => {
                    if (booking) {
                        showContextMenu(e, bed.id, d.iso);
                    }
                });

                tr.appendChild(tdCell);
            });

            roomRows.appendChild(tr);
        });
    });
    updateStats();
}

function updateStats() {
    const t = new Date(); const realTodayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    let totalBeds = 0;
    let bookedToday = 0;
    let checkinsToday = 0;

    roomsConfig.forEach(group => {
        totalBeds += group.beds.length;
        group.beds.forEach(bed => {
            const key = `${bed.id}_${realTodayIso}`;
            if (bookings[key]) {
                bookedToday++;
                if (bookings[key].status === 'checkin') checkinsToday++;
            }
        });
    });

    const occ = totalBeds === 0 ? 0 : Math.round((bookedToday / totalBeds) * 100);
    const available = totalBeds - bookedToday;
    const statsContainer = document.getElementById('statsDashboard');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-box"><span>Occupancy</span><strong>${occ}%</strong></div>
            <div class="stat-box"><span>Check-ins</span><strong>${checkinsToday}</strong></div>
            <div class="stat-box"><span>Available</span><strong>${available}</strong></div>
        `;
    }
    
    updateDashboardStats();
}

function updateDashboardStats() {
    const dashTotalRooms = document.getElementById('dashTotalRooms');
    const dashOccupied = document.getElementById('dashOccupied');
    const dashCheckins = document.getElementById('dashCheckins');
    const dashAvailable = document.getElementById('dashAvailable');
    
    if (!dashTotalRooms) return;

    const t = new Date(); const realTodayIso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    let totalBeds = 0;
    let bookedToday = 0;
    let checkinsToday = 0;

    roomsConfig.forEach(group => {
        totalBeds += group.beds.length;
        group.beds.forEach(bed => {
            const key = `${bed.id}_${realTodayIso}`;
            if (bookings[key]) {
                bookedToday++;
                if (bookings[key].status === 'checkin') checkinsToday++;
            }
        });
    });

    const available = totalBeds - bookedToday;

    dashTotalRooms.textContent = totalBeds;
    dashOccupied.textContent = bookedToday;
    dashCheckins.textContent = checkinsToday;
    dashAvailable.textContent = available;
}

function scrollToToday() {
    setTimeout(() => {
        const wrapper = document.querySelector('.table-wrapper');
        const todayHeader = document.querySelector('.today-header');
        if (wrapper && todayHeader) {
            // 220px accounts for the sticky room column
            wrapper.scrollTo({
                left: todayHeader.offsetLeft - 220,
                behavior: 'smooth'
            });
        }
    }, 100);
}

    function saveAndRender() {
        if (db && currentUserUid) {
            db.collection('userBookings').doc(currentUserUid).set({
                bookings: bookings,
                roomsConfig: roomsConfig
            }).catch(err => console.error("Error saving to Firestore: ", err));
        } else {
            localStorage.setItem('pmsBookings', JSON.stringify(bookings));
            localStorage.setItem('pmsRoomsConfig', JSON.stringify(roomsConfig));
        }
        if (!db) {
            renderTable();
            updateDashboardStats();
            renderAdminRooms();
        }
    }


function openModal(bed, group, dateObj, existingBooking) {
    activeRoomId = bed.id;
    activeDateIso = dateObj.iso;

    modalSubtitle.textContent = `${group.groupDesc} (${bed.name}) — ${dateObj.label}`;

    const guestNameInput = document.getElementById('guestName');
    const numNightsSelect = document.getElementById('numNights');

    const bookingSourceInput = document.getElementById('bookingSource');
    const bookingSourceOtherContainer = document.getElementById('bookingSourceOtherContainer');
    const bookingSourceOtherInput = document.getElementById('bookingSourceOther');
    const extraBedInput = document.getElementById('extraBed');
    const extraBedChargeInput = document.getElementById('extraBedCharge');
    const extraBedChargeContainer = document.getElementById('extraBedChargeContainer');
    const showGroupBooking = document.getElementById('showGroupBooking');
    const groupBookingContainer = document.getElementById('groupBookingContainer');
    const btnDelete = document.getElementById('btnDelete');

    if (showGroupBooking) showGroupBooking.checked = false;
    if (groupBookingContainer) groupBookingContainer.style.display = 'none';

    if (existingBooking) {
        guestNameInput.value = existingBooking.guestName;

        if (bookingSourceInput && bookingSourceOtherContainer && bookingSourceOtherInput) {
            const knownSources = ['Walk-in', 'Phone/Direct', 'Booking.com', 'Agoda', 'Expedia'];
            if (existingBooking.bookingSource && !knownSources.includes(existingBooking.bookingSource)) {
                bookingSourceInput.style.display = 'none';
                bookingSourceOtherContainer.style.display = 'block';
                bookingSourceOtherInput.value = existingBooking.bookingSource;
            } else {
                bookingSourceInput.style.display = 'block';
                bookingSourceOtherContainer.style.display = 'none';
                bookingSourceInput.value = existingBooking.bookingSource || 'Walk-in';
                bookingSourceOtherInput.value = '';
            }
        }

        if (extraBedInput) {
            extraBedInput.checked = !!existingBooking.extraBed;
            if (extraBedChargeContainer) extraBedChargeContainer.style.display = existingBooking.extraBed ? 'block' : 'none';
        }
        if (extraBedChargeInput) extraBedChargeInput.value = existingBooking.extraBedCharge || '';
        if (btnDelete) btnDelete.style.display = 'block';
    } else {
        guestNameInput.value = '';
        if (bookingSourceInput && bookingSourceOtherContainer && bookingSourceOtherInput) {
            bookingSourceInput.style.display = 'block';
            bookingSourceOtherContainer.style.display = 'none';
            bookingSourceInput.value = 'Walk-in';
            bookingSourceOtherInput.value = '';
        }
        if (extraBedInput) {
            extraBedInput.checked = false;
            if (extraBedChargeContainer) extraBedChargeContainer.style.display = 'none';
        }
        if (extraBedChargeInput) extraBedChargeInput.value = '';
        if (btnDelete) btnDelete.style.display = 'none';
    }

    const additionalRoomsContainer = document.getElementById('additionalRoomsContainer');
    if (additionalRoomsContainer) {
        additionalRoomsContainer.innerHTML = '';
        roomsConfig.forEach(g => {
            let hasRooms = false;
            const groupHeader = document.createElement('div');
            groupHeader.className = 'multi-select-group-title';
            groupHeader.textContent = g.groupDesc || g.groupName;

            const pillsContainer = document.createElement('div');
            pillsContainer.className = 'multi-select-pills';

            g.beds.forEach(b => {
                if (b.id === bed.id) return;
                hasRooms = true;
                const lbl = document.createElement('label');
                lbl.className = 'multi-select-pill';
                lbl.innerHTML = `<input type="checkbox" value="${b.id}" style="display:none;"> <span>${b.name}</span>`;
                pillsContainer.appendChild(lbl);
            });

            if (hasRooms) {
                additionalRoomsContainer.appendChild(groupHeader);
                additionalRoomsContainer.appendChild(pillsContainer);
            }
        });
    }

    const nightsSelect = document.getElementById('numNights');
    if (nightsSelect) nightsSelect.value = "1";

    modalOverlay.classList.add('active');
    setTimeout(() => guestNameInput.focus(), 100);
}

function closeModal() {
    modalOverlay.classList.remove('active');
    activeRoomId = null;
    activeDateIso = null;
}

closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
        closeModal();
    }
});

// Context Menu Logic
const contextMenu = document.getElementById('contextMenu');
const ctxCheckIn = document.getElementById('ctxCheckIn');
const ctxCheckOut = document.getElementById('ctxCheckOut');
const ctxClosed = document.getElementById('ctxClosed');
const ctxClear = document.getElementById('ctxClear');
let ctxRoomId = null;
let ctxDateIso = null;

document.addEventListener('click', () => {
    if (contextMenu && contextMenu.classList.contains('active')) {
        contextMenu.classList.remove('active');
    }
});

function showContextMenu(e, bedId, dateIso) {
    e.preventDefault();
    ctxRoomId = bedId;
    ctxDateIso = dateIso;

    contextMenu.style.top = `${e.clientY}px`;
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.classList.add('active');
}

if (ctxCheckIn) ctxCheckIn.addEventListener('click', () => updateCtxBooking('checkin'));
if (ctxCheckOut) ctxCheckOut.addEventListener('click', () => updateCtxBooking('checkout'));
if (ctxClosed) ctxClosed.addEventListener('click', () => updateCtxBooking('closed'));
if (ctxClear) ctxClear.addEventListener('click', () => {
    const key = `${ctxRoomId}_${ctxDateIso}`;
    delete bookings[key];
    saveAndRender();
});

function updateCtxBooking(status) {
    const key = `${ctxRoomId}_${ctxDateIso}`;
    if (bookings[key]) {
        bookings[key].status = status;
        saveAndRender();
    }
}

// Handle Actions
function setBooking(status) {
    if (!activeRoomId || !activeDateIso) return;
    const name = guestNameInput.value.trim() || 'No Name';

    const nightsSelect = document.getElementById('numNights');
    const nights = nightsSelect ? parseInt(nightsSelect.value) || 1 : 1;

    const bookingSourceInput = document.getElementById('bookingSource');
    const bookingSourceOtherContainer = document.getElementById('bookingSourceOtherContainer');
    const bookingSourceOtherInput = document.getElementById('bookingSourceOther');
    const extraBedInput = document.getElementById('extraBed');
    const extraBedChargeInput = document.getElementById('extraBedCharge');

    let bookingSource = 'Walk-in';
    if (bookingSourceOtherContainer && bookingSourceOtherContainer.style.display === 'block') {
        bookingSource = bookingSourceOtherInput ? bookingSourceOtherInput.value.trim() || 'Other' : 'Other';
    } else {
        bookingSource = bookingSourceInput ? bookingSourceInput.value : 'Walk-in';
    }

    const extraBed = extraBedInput ? extraBedInput.checked : false;
    const extraBedCharge = (extraBed && extraBedChargeInput) ? extraBedChargeInput.value : '';

    const additionalRoomsContainer = document.getElementById('additionalRoomsContainer');
    const selectedAdditionalRooms = [];
    if (additionalRoomsContainer) {
        const checkboxes = additionalRoomsContainer.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach(cb => selectedAdditionalRooms.push(cb.value));
    }

    const roomsToBook = [activeRoomId, ...selectedAdditionalRooms];

    const baseDateObj = new Date(activeDateIso);

    // Validation: Prevent Overbooking
    for (const roomId of roomsToBook) {
        for (let i = 0; i < nights; i++) {
            const d = new Date(baseDateObj);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const iso = `${y}-${m}-${day}`;
            const key = `${roomId}_${iso}`;

            if ((i > 0 || roomId !== activeRoomId) && bookings[key]) {
                alert(`Cannot book! Room ${roomId} is already booked on ${iso} by ${bookings[key].guestName}.`);
                return;
            }
        }
    }

    for (const roomId of roomsToBook) {
        for (let i = 0; i < nights; i++) {
            const d = new Date(baseDateObj);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const iso = `${y}-${m}-${day}`;
            const key = `${roomId}_${iso}`;
            bookings[key] = {
                guestName: name,
                status: status,
                bookingSource: bookingSource,
                extraBed: extraBed,
                extraBedCharge: extraBedCharge
            };
        }
    }

    saveAndRender();
    closeModal();
}

const extraBedInput = document.getElementById('extraBed');
const extraBedChargeContainer = document.getElementById('extraBedChargeContainer');
const extraBedChargeInput = document.getElementById('extraBedCharge');
if (extraBedInput && extraBedChargeContainer) {
    extraBedInput.addEventListener('change', (e) => {
        if (e.target.checked) {
            extraBedChargeContainer.style.display = 'block';
        } else {
            extraBedChargeContainer.style.display = 'none';
            if (extraBedChargeInput) extraBedChargeInput.value = '';
        }
    });
}

const showGroupBooking = document.getElementById('showGroupBooking');
const groupBookingContainer = document.getElementById('groupBookingContainer');
if (showGroupBooking && groupBookingContainer) {
    showGroupBooking.addEventListener('change', (e) => {
        groupBookingContainer.style.display = e.target.checked ? 'block' : 'none';
    });
}

const bookingSourceInputGlobal = document.getElementById('bookingSource');
const bookingSourceOtherContainerGlobal = document.getElementById('bookingSourceOtherContainer');
const bookingSourceOtherInputGlobal = document.getElementById('bookingSourceOther');
const resetSourceBtn = document.getElementById('resetSourceBtn');

if (bookingSourceInputGlobal && bookingSourceOtherContainerGlobal && bookingSourceOtherInputGlobal) {
    bookingSourceInputGlobal.addEventListener('change', (e) => {
        if (e.target.value === 'Other') {
            bookingSourceInputGlobal.style.display = 'none';
            bookingSourceOtherContainerGlobal.style.display = 'block';
            bookingSourceOtherInputGlobal.focus();
        }
    });
}

if (resetSourceBtn) {
    resetSourceBtn.addEventListener('click', () => {
        if (bookingSourceOtherContainerGlobal && bookingSourceInputGlobal && bookingSourceOtherInputGlobal) {
            bookingSourceOtherContainerGlobal.style.display = 'none';
            bookingSourceOtherInputGlobal.value = '';
            bookingSourceInputGlobal.style.display = 'block';
            bookingSourceInputGlobal.value = 'Walk-in';
        }
    });
}

const btnDeleteGlobal = document.getElementById('btnDelete');
if (btnDeleteGlobal) {
    btnDeleteGlobal.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this booking?')) {
            const key = `${activeRoomId}_${activeDateIso}`;
            delete bookings[key];
            saveAndRender();
            closeModal();
        }
    });
}

btnBooked.addEventListener('click', () => setBooking('booked'));
btnCheckIn.addEventListener('click', () => setBooking('checkin'));
btnCheckOut.addEventListener('click', () => setBooking('checkout'));
btnClosed.addEventListener('click', () => setBooking('closed'));

btnClear.addEventListener('click', () => {
    if (!activeRoomId || !activeDateIso) return;
    const key = `${activeRoomId}_${activeDateIso}`;
    delete bookings[key];
    saveAndRender();
    closeModal();
});

// Date Navigation
btnToday.addEventListener('click', () => {
    const todayNow = new Date();
    todayNow.setHours(0, 0, 0, 0);
    const firstDay = new Date(todayNow.getFullYear(), todayNow.getMonth(), 1);
    startDateOffset = Math.round((firstDay - todayNow) / (1000 * 60 * 60 * 24));
    daysToView = new Date(todayNow.getFullYear(), todayNow.getMonth() + 1, 0).getDate();

    if (jumpMonthInput) jumpMonthInput.value = '';
    renderTable();
    scrollToToday();
});

if (jumpMonthInput) {
    jumpMonthInput.addEventListener('change', (e) => {
        if (!e.target.value) return;
        const [year, month] = e.target.value.split('-');

        // Go to 1st of that month
        const selectedDate = new Date(year, month - 1, 1);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const diffTime = selectedDate - today;
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        startDateOffset = diffDays;

        // Set daysToView to exactly how many days are in that month
        const daysInMonth = new Date(year, month, 0).getDate();
        daysToView = daysInMonth;

        renderTable();
    });
}

// Search functionality
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const cells = document.querySelectorAll('.day-cell');

    cells.forEach(cell => {
        if (query === '') {
            cell.style.opacity = '1';
            cell.style.boxShadow = 'none';
            return;
        }

        const bookingEl = cell.querySelector('.booking-content');
        if (bookingEl && bookingEl.textContent.toLowerCase().includes(query)) {
            cell.style.opacity = '1';
            cell.style.boxShadow = 'inset 0 0 10px var(--accent)';
        } else {
            cell.style.opacity = '0.1';
            cell.style.boxShadow = 'none';
        }
    });
});



// --- POS Calculator Logic ---
const btnCalc = document.getElementById('btnCalc');
const calcModal = document.getElementById('calcModal');
const btnCloseCalc = document.getElementById('btnCloseCalc');

// Tabs
const tabUsd = document.getElementById('tabUsd');
const tabInr = document.getElementById('tabInr');
const viewUsd = document.getElementById('viewUsd');
const viewInr = document.getElementById('viewInr');

// USD Elements
const calcUsdAmount = document.getElementById('calcUsdAmount');
const calcUsdRate = document.getElementById('calcUsdRate');
const calcNprDirectAmount = document.getElementById('calcNprDirectAmount');
const calcUsdSubtotal = document.getElementById('calcUsdSubtotal');
const calcUsdSurcharge = document.getElementById('calcUsdSurcharge');
const calcUsdTotal = document.getElementById('calcUsdTotal');

// INR Elements
const calcInrNprAmount = document.getElementById('calcInrNprAmount');
const calcInrTotal = document.getElementById('calcInrTotal');

async function fetchLiveUsdRate() {
    try {
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await response.json();
        if (data && data.rates && data.rates.NPR) {
            calcUsdRate.value = data.rates.NPR.toFixed(2);
            calcUsdRate.style.borderColor = "#4ade80";
            setTimeout(() => calcUsdRate.style.borderColor = "", 1500);
            updateUsdMath();
        }
    } catch (error) {
        console.error('Failed to fetch live USD rate:', error);
    }
}

function switchTab(mode) {
    if (mode === 'usd') {
        tabUsd.style.background = '#222';
        tabUsd.style.color = '#fff';
        tabUsd.style.fontWeight = '700';
        tabInr.style.background = 'transparent';
        tabInr.style.color = 'var(--text-muted)';
        tabInr.style.fontWeight = '400';
        viewUsd.style.display = 'block';
        viewInr.style.display = 'none';
    } else {
        tabInr.style.background = '#222';
        tabInr.style.color = '#fff';
        tabInr.style.fontWeight = '700';
        tabUsd.style.background = 'transparent';
        tabUsd.style.color = 'var(--text-muted)';
        tabUsd.style.fontWeight = '400';
        viewInr.style.display = 'block';
        viewUsd.style.display = 'none';
    }
}

function updateUsdMath(e) {
    if (e && e.target === calcNprDirectAmount) {
        calcUsdAmount.value = ''; // clear USD if NPR typed
    } else if (e && (e.target === calcUsdAmount || e.target === calcUsdRate)) {
        calcNprDirectAmount.value = ''; // clear NPR if USD typed
    }

    let subtotal = 0;
    if (calcNprDirectAmount && calcNprDirectAmount.value) {
        subtotal = parseFloat(calcNprDirectAmount.value) || 0;
    } else {
        const usd = parseFloat(calcUsdAmount.value) || 0;
        const rate = parseFloat(calcUsdRate.value) || 0;
        subtotal = usd * rate;
    }

    const surcharge = subtotal * 0.04; // 4% POS
    const total = subtotal + surcharge;

    calcUsdSubtotal.textContent = `Rs. ${subtotal.toFixed(2)}`;
    calcUsdSurcharge.textContent = `Rs. ${surcharge.toFixed(2)}`;
    calcUsdTotal.textContent = `Rs. ${total.toFixed(2)}`;
}

function updateInrMath() {
    const npr = parseFloat(calcInrNprAmount.value) || 0;
    // 1.5 Rate
    const inr = npr / 1.5;
    calcInrTotal.textContent = `₹ ${inr.toFixed(2)}`;
}

if (btnCalc && calcModal && btnCloseCalc) {
    btnCalc.addEventListener('click', () => {
        calcModal.classList.add('active');
        switchTab('usd'); // Default to USD on open
        fetchLiveUsdRate();
    });

    btnCloseCalc.addEventListener('click', () => calcModal.classList.remove('active'));

    tabUsd.addEventListener('click', () => switchTab('usd'));
    tabInr.addEventListener('click', () => switchTab('inr'));

    calcUsdAmount.addEventListener('input', updateUsdMath);
    calcUsdRate.addEventListener('input', updateUsdMath);
    if (calcNprDirectAmount) calcNprDirectAmount.addEventListener('input', updateUsdMath);

    calcInrNprAmount.addEventListener('input', updateInrMath);
}

// Init
const roomFilterInit = document.getElementById('roomFilter');
if (roomFilterInit) roomFilterInit.addEventListener('change', renderTable);

// Dashboard & Room Management Logic
const btnToggleView = document.getElementById('btnToggleView');
const calendarView = document.getElementById('calendarView');
const dashboardView = document.getElementById('dashboardView');
let isDashboardView = false;

if (btnToggleView) {
    btnToggleView.addEventListener('click', () => {
        isDashboardView = !isDashboardView;
        if (isDashboardView) {
            calendarView.style.display = 'none';
            dashboardView.style.display = 'block';
            btnToggleView.innerHTML = '📅 Calendar';
            renderAdminRooms(true);
            updateDashboardStats();
        } else {
            dashboardView.style.display = 'none';
            calendarView.style.display = 'block';
            btnToggleView.innerHTML = '📊 Dashboard';
            renderTable();
        }
    });
}

const dashRoomsContainer = document.getElementById('dashRoomsContainer');
const btnAddRoomGroup = document.getElementById('btnAddRoomGroup');

function renderAdminRooms(force = false) {
    if (!dashRoomsContainer) return;
    // Don't wipe DOM structure if user is actively typing inside room management, unless forced
    if (!force && document.activeElement && dashRoomsContainer.contains(document.activeElement)) {
        return;
    }
    dashRoomsContainer.innerHTML = '';
    
    roomsConfig.forEach((group, gIndex) => {
        const groupDiv = document.createElement('div');
        groupDiv.className = 'admin-group';
        
        // Header row with Icon, Title, Bed count badge & Delete Button
        const topDiv = document.createElement('div');
        topDiv.className = 'admin-group-top';
        
        const titleWrapper = document.createElement('div');
        titleWrapper.className = 'admin-group-title-wrapper';
        
        const roomIcon = document.createElement('span');
        roomIcon.className = 'admin-room-icon';
        roomIcon.textContent = '🏨';
        
        const roomTitle = document.createElement('h3');
        roomTitle.className = 'admin-room-title';
        roomTitle.textContent = group.groupName || 'Untitled Room';
        
        const bedCountBadge = document.createElement('span');
        bedCountBadge.className = 'admin-bed-count-badge';
        const bedLen = group.beds ? group.beds.length : 0;
        bedCountBadge.textContent = `${bedLen} ${bedLen === 1 ? 'Bed' : 'Beds'}`;
        
        titleWrapper.appendChild(roomIcon);
        titleWrapper.appendChild(roomTitle);
        titleWrapper.appendChild(bedCountBadge);
        
        const btnDelGroup = document.createElement('button');
        btnDelGroup.className = 'btn-delete-group';
        btnDelGroup.innerHTML = '<span>🗑️</span> Delete Room';
        btnDelGroup.onclick = () => {
            if (confirm(`Are you sure you want to delete "${group.groupName || 'this room category'}" and all its beds?`)) {
                roomsConfig.splice(gIndex, 1);
                saveAndRender();
                renderAdminRooms(true);
            }
        };
        
        topDiv.appendChild(titleWrapper);
        topDiv.appendChild(btnDelGroup);
        
        // Inputs grid for Room Name & Description
        const gridDiv = document.createElement('div');
        gridDiv.className = 'admin-group-inputs-grid';
        
        // Field 1: Name
        const fieldName = document.createElement('div');
        fieldName.className = 'admin-input-field';
        const labelName = document.createElement('label');
        labelName.className = 'admin-input-label';
        labelName.textContent = 'Room / Category Name';
        
        const inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.className = 'admin-input';
        inputName.value = group.groupName || '';
        inputName.placeholder = 'e.g. Deluxe Room 101';
        inputName.oninput = (e) => {
            roomsConfig[gIndex].groupName = e.target.value;
            roomTitle.textContent = e.target.value || 'Untitled Room';
        };
        inputName.onchange = () => { 
            saveAndRender(); 
        };
        
        fieldName.appendChild(labelName);
        fieldName.appendChild(inputName);
        
        // Field 2: Description
        const fieldDesc = document.createElement('div');
        fieldDesc.className = 'admin-input-field';
        const labelDesc = document.createElement('label');
        labelDesc.className = 'admin-input-label';
        labelDesc.textContent = 'Description & Details';
        
        const inputDesc = document.createElement('input');
        inputDesc.type = 'text';
        inputDesc.className = 'admin-input';
        inputDesc.value = group.groupDesc || '';
        inputDesc.placeholder = 'e.g. 4 Bed AC with Balcony';
        inputDesc.oninput = (e) => {
            roomsConfig[gIndex].groupDesc = e.target.value;
        };
        inputDesc.onchange = () => { 
            saveAndRender(); 
        };
        
        fieldDesc.appendChild(labelDesc);
        fieldDesc.appendChild(inputDesc);
        
        gridDiv.appendChild(fieldName);
        gridDiv.appendChild(fieldDesc);
        
        // Beds Section
        const bedsSection = document.createElement('div');
        bedsSection.className = 'admin-beds-section';
        
        const bedsHeader = document.createElement('div');
        bedsHeader.className = 'admin-beds-header';
        bedsHeader.innerHTML = '<span>🛏️ Beds / Units in this Room</span>';
        bedsSection.appendChild(bedsHeader);
        
        const bedListDiv = document.createElement('div');
        bedListDiv.className = 'admin-bed-list';
        
        group.beds.forEach((bed, bIndex) => {
            const bedItem = document.createElement('div');
            bedItem.className = 'admin-bed-item';
            
            // ID input
            const inputGroup1 = document.createElement('div');
            inputGroup1.className = 'admin-bed-input-group';
            const tag1 = document.createElement('span');
            tag1.className = 'bed-input-tag';
            tag1.textContent = 'ID:';
            
            const inputBedId = document.createElement('input');
            inputBedId.type = 'text';
            inputBedId.className = 'admin-bed-input id-input';
            inputBedId.value = bed.id || '';
            inputBedId.placeholder = '101';
            inputBedId.oninput = (e) => {
                roomsConfig[gIndex].beds[bIndex].id = e.target.value;
            };
            inputBedId.onchange = () => { 
                saveAndRender(); 
            };
            
            inputGroup1.appendChild(tag1);
            inputGroup1.appendChild(inputBedId);
            
            // Name input
            const inputGroup2 = document.createElement('div');
            inputGroup2.className = 'admin-bed-input-group';
            const tag2 = document.createElement('span');
            tag2.className = 'bed-input-tag';
            tag2.textContent = 'Name:';
            
            const inputBedName = document.createElement('input');
            inputBedName.type = 'text';
            inputBedName.className = 'admin-bed-input name-input';
            inputBedName.value = bed.name || '';
            inputBedName.placeholder = 'Bed 1';
            inputBedName.oninput = (e) => {
                roomsConfig[gIndex].beds[bIndex].name = e.target.value;
            };
            inputBedName.onchange = () => { 
                saveAndRender(); 
            };
            
            inputGroup2.appendChild(tag2);
            inputGroup2.appendChild(inputBedName);
            
            // Delete bed button
            const btnDelBed = document.createElement('button');
            btnDelBed.className = 'btn-delete-bed';
            btnDelBed.innerHTML = '&times;';
            btnDelBed.title = 'Delete Bed';
            btnDelBed.onclick = () => {
                if (confirm(`Delete bed "${bed.name || bed.id}"?`)) {
                    roomsConfig[gIndex].beds.splice(bIndex, 1);
                    saveAndRender();
                    renderAdminRooms(true);
                }
            };
            
            bedItem.appendChild(inputGroup1);
            bedItem.appendChild(inputGroup2);
            bedItem.appendChild(btnDelBed);
            bedListDiv.appendChild(bedItem);
        });
        
        bedsSection.appendChild(bedListDiv);
        
        const btnAddBed = document.createElement('button');
        btnAddBed.className = 'btn-add-bed';
        btnAddBed.innerHTML = '<span>+</span> Add Bed';
        btnAddBed.onclick = () => {
            const bedNum = group.beds ? group.beds.length + 1 : 1;
            roomsConfig[gIndex].beds.push({ id: `bed_${Date.now().toString().slice(-4)}`, name: `Bed ${bedNum}` });
            saveAndRender();
            renderAdminRooms(true);
        };
        bedsSection.appendChild(btnAddBed);
        
        groupDiv.appendChild(topDiv);
        groupDiv.appendChild(gridDiv);
        groupDiv.appendChild(bedsSection);
        dashRoomsContainer.appendChild(groupDiv);
    });
}

if (btnAddRoomGroup) {
    btnAddRoomGroup.addEventListener('click', () => {
        const nextNum = roomsConfig.length + 1;
        roomsConfig.push({
            groupName: `Room Category ${nextNum}`,
            groupDesc: 'Standard Amenities',
            beds: [{ id: `bed_${Date.now().toString().slice(-4)}`, name: 'Bed 1' }]
        });
        saveAndRender();
        renderAdminRooms(true);
    });
}

const btnSaveRooms = document.getElementById('btnSaveRooms');
if (btnSaveRooms) {
    btnSaveRooms.addEventListener('click', () => {
        saveAndRender();
        showToast('Room layout saved successfully!', 'success');
    });
}

if (!auth) {
    renderTable();
    scrollToToday();
}
});
