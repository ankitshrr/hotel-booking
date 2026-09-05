import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCRnEgvdzDFO7Q5EZxgWcxCpwz_GKIrI_o",
  authDomain: "hotel-booking0007.firebaseapp.com",
  projectId: "hotel-booking0007",
  storageBucket: "hotel-booking0007.firebasestorage.app",
  messagingSenderId: "789897623083",
  appId: "1:789897623083:web:bb87ecfefe9eb7ea3e1c6e"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let unsubscribeSnapshot = null;

document.addEventListener('DOMContentLoaded', () => {

    const loginOverlay = document.getElementById('loginOverlay');
    const loginForm = document.getElementById('loginForm');
    const loginEmail = document.getElementById('loginEmail');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    const btnLogout = document.getElementById('btnLogout');

    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            loginOverlay.classList.remove('active');
            btnLogout.style.display = 'block';
            loadDataFromFirebase();
        } else {
            currentUser = null;
            loginOverlay.classList.add('active');
            btnLogout.style.display = 'none';
            if (unsubscribeSnapshot) unsubscribeSnapshot();
            bookings = {};
            renderTable();
        }
    });

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        loginError.style.display = 'none';

        signInWithEmailAndPassword(auth, email, password)
            .catch((error) => {
                loginError.textContent = "Invalid email or password.";
                loginError.style.display = 'block';
            });
    });

    if (btnLogout) {
        btnLogout.addEventListener('click', () => {
            signOut(auth);
        });
    }

    function loadDataFromFirebase() {
        if (!currentUser) return;
        const docRef = doc(db, "users", currentUser.uid);

        unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                bookings = docSnap.data().bookings || {};
            } else {
                bookings = {};
            }
            renderTable();
        });
    }


    const dateHeaders = document.getElementById('dateHeaders');
    const roomRows = document.getElementById('roomRows');
    const modalOverlay = document.getElementById('bookingModal');
    const closeModalBtn = document.getElementById('closeModal');
    const guestNameInput = document.getElementById('guestName');
    const modalSubtitle = document.getElementById('modalSubtitle');

    const btnBooked = document.getElementById('btnBooked');
    const btnCheckIn = document.getElementById('btnCheckIn');
    const btnCheckOut = document.getElementById('btnCheckOut');
    const btnClear = document.getElementById('btnClear');

    const btnToday = document.getElementById('btnToday');
    const jumpMonthInput = document.getElementById('jumpMonth');
    const currentMonthTitle = document.getElementById('currentMonthTitle');

    // Default to the 1st of the current month, viewing the whole month
    const todayForInit = new Date();
    todayForInit.setHours(0,0,0,0);
    const firstDayOfMonth = new Date(todayForInit.getFullYear(), todayForInit.getMonth(), 1);

    let startDateOffset = Math.round((firstDayOfMonth - todayForInit) / (1000 * 60 * 60 * 24));
    let daysToView = new Date(todayForInit.getFullYear(), todayForInit.getMonth() + 1, 0).getDate();

    const searchInput = document.getElementById('guestSearch');

    // Firebase and Login removed for local-only, Excel-based storage

    // Rooms Configuration
    const roomsConfig = [

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
        for(let i=0; i<daysToView; i++) {
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
            if(d.isToday) th.classList.add('today-header');
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
                    if(d.isToday) tdCell.classList.add('today-cell');

                    const cellKey = `${bed.id}_${d.iso}`;
                    const booking = bookings[cellKey];

                    if (booking) {
                        tdCell.innerHTML = `<div class="booking-content status-${booking.status}">${booking.guestName}</div>`;
                    }

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
                if(bookings[key]) {
                    bookedToday++;
                    if(bookings[key].status === 'checkin') checkinsToday++;
                }
            });
        });

        const occ = totalBeds === 0 ? 0 : Math.round((bookedToday / totalBeds) * 100);
        const available = totalBeds - bookedToday;

        const statsContainer = document.getElementById('statsDashboard');
        if(statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-box"><span>Occupancy</span><strong>${occ}%</strong></div>
                <div class="stat-box"><span>Check-ins</span><strong>${checkinsToday}</strong></div>
                <div class="stat-box"><span>Available</span><strong>${available}</strong></div>
            `;
        }
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
        if (currentUser) {
            const docRef = doc(db, "users", currentUser.uid);
            setDoc(docRef, { bookings: bookings }, { merge: true }).catch(err => console.error("Error saving to Firebase:", err));
        }
        renderTable();
    }







    function openModal(bed, group, dateObj, existingBooking) {
        activeRoomId = bed.id;
        activeDateIso = dateObj.iso;

        modalSubtitle.textContent = `${group.groupDesc} (${bed.name}) — ${dateObj.label}`;

        if (existingBooking) {
            guestNameInput.value = existingBooking.guestName;
        } else {
            guestNameInput.value = '';
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
        if(e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if(e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });


    // Context Menu Logic
    const contextMenu = document.getElementById('contextMenu');
    const ctxCheckIn = document.getElementById('ctxCheckIn');
    const ctxCheckOut = document.getElementById('ctxCheckOut');
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
    if (ctxClear) ctxClear.addEventListener('click', () => {
        const key = `${ctxRoomId}_${ctxDateIso}`;
        delete bookings[key];
        saveAndRender();
    });

    function updateCtxBooking(status) {
        const key = `${ctxRoomId}_${ctxDateIso}`;
        if(bookings[key]) {
            bookings[key].status = status;
            saveAndRender();
        }
    }

    // Handle Actions
    function setBooking(status) {
        if(!activeRoomId || !activeDateIso) return;
        const name = guestNameInput.value.trim() || 'No Name';

        const nightsSelect = document.getElementById('numNights');
        const nights = nightsSelect ? parseInt(nightsSelect.value) || 1 : 1;

        const baseDateObj = new Date(activeDateIso);

        // Validation: Prevent Overbooking
        for(let i=0; i<nights; i++) {
            const d = new Date(baseDateObj);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const iso = `${y}-${m}-${day}`;
            const key = `${activeRoomId}_${iso}`;

            // Check if checking future dates and it is already booked
            if (i > 0 && bookings[key]) {
                alert(`Cannot book ${nights} nights! Room is already booked on ${iso} by ${bookings[key].guestName}.`);
                return;
            }
        }

        for(let i=0; i<nights; i++) {
            const d = new Date(baseDateObj);
            d.setDate(d.getDate() + i);
            const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const day = String(d.getDate()).padStart(2, '0'); const iso = `${y}-${m}-${day}`;
            const key = `${activeRoomId}_${iso}`;
            bookings[key] = { guestName: name, status: status };
        }

        saveAndRender();
        closeModal();
    }

    btnBooked.addEventListener('click', () => setBooking('booked'));
    btnCheckIn.addEventListener('click', () => setBooking('checkin'));
    btnCheckOut.addEventListener('click', () => setBooking('checkout'));

    btnClear.addEventListener('click', () => {
        if(!activeRoomId || !activeDateIso) return;
        const key = `${activeRoomId}_${activeDateIso}`;
        delete bookings[key];
        saveAndRender();
        closeModal();
    });

    // Date Navigation
    btnToday.addEventListener('click', () => {
        const todayNow = new Date();
        todayNow.setHours(0,0,0,0);
        const firstDay = new Date(todayNow.getFullYear(), todayNow.getMonth(), 1);
        startDateOffset = Math.round((firstDay - todayNow) / (1000 * 60 * 60 * 24));
        daysToView = new Date(todayNow.getFullYear(), todayNow.getMonth() + 1, 0).getDate();

        if(jumpMonthInput) jumpMonthInput.value = '';
        renderTable();
        scrollToToday();
    });

    if (jumpMonthInput) {
        jumpMonthInput.addEventListener('change', (e) => {
            if(!e.target.value) return;
            const [year, month] = e.target.value.split('-');

            // Go to 1st of that month
            const selectedDate = new Date(year, month - 1, 1);
            const today = new Date();
            today.setHours(0,0,0,0);

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

    // Backup Export to Excel (XLSB format)

    }

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

    renderTable();
    scrollToToday();
});
