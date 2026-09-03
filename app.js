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
    let bookings = JSON.parse(localStorage.getItem('pmsBookings') || '{}');
    let currentFileHandle = null;

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
        // Save Locally
        localStorage.setItem('pmsBookings', JSON.stringify(bookings));
        renderTable();
        if (currentFileHandle) autoSaveToExcel();
    }

    function generateMatrixExcelData() {
        const data = [];
        
        // Add two blank rows at the top to match original file perfectly
        data.push([]);
        data.push([]);
        
        const dateSet = new Set();
        for (const key of Object.keys(bookings)) {
            const lastUnderscore = key.lastIndexOf('_');
            const date = key.substring(lastUnderscore + 1);
            if(date) dateSet.add(date);
        }
        let sortedDates = Array.from(dateSet).sort();
        if (sortedDates.length === 0) {
            sortedDates = dates.map(d => d.iso);
            if (sortedDates.length === 0) {
                const t = new Date();
                sortedDates = [`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`];
            }
        }

        const headerRow = ["Rooms / Dates"];
        const monthNamesShort = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
        const formattedDates = sortedDates.map(isoDate => {
            const [y, m, d] = isoDate.split('-');
            const dateObj = new Date(y, parseInt(m)-1, d);
            const day = dateObj.getDate();
            let suffix = 'th';
            if (day % 10 === 1 && day !== 11) suffix = 'st';
            else if (day % 10 === 2 && day !== 12) suffix = 'nd';
            else if (day % 10 === 3 && day !== 13) suffix = 'rd';
            return `${day}${suffix} ${monthNamesShort[dateObj.getMonth()]}`;
        });
        headerRow.push(...formattedDates);
        data.push(headerRow);
        
        roomsConfig.forEach(room => {
            // Group Header Row (e.g. "Four Bed (Fan)")
            const groupLabel = room.groupDesc || room.groupName || '';
            const groupRow = [groupLabel];
            // fill the rest of the row with empty strings for proper spacing
            for(let i = 0; i < sortedDates.length; i++) groupRow.push('');
            data.push(groupRow);
            
            room.beds.forEach(bed => {
                const row = [bed.name]; // Matches original "204 B1" format
                sortedDates.forEach(isoDate => {
                    const cellKey = `${bed.id}_${isoDate}`;
                    const booking = bookings[cellKey];
                    if (booking && booking.guestName && booking.guestName !== 'booked' && !booking.guestName.match(/^\d{4}-\d{2}-\d{2}$/)) {
                        row.push(booking.guestName);
                    } else if (booking) {
                        row.push(booking.status);
                    } else {
                        row.push("");
                    }
                });
                data.push(row);
            });
        });
        
        return data;
    }

    async function autoSaveToExcel() {
        if (!currentFileHandle) return;
        try {
            let allDates = [new Date().toISOString().split('T')[0]];
            for (const key of Object.keys(bookings)) {
                allDates.push(key.split('_').pop());
            }
            allDates.sort();
            const minDate = new Date(allDates[0]);
            const maxDate = new Date(allDates[allDates.length - 1]);
            if ((maxDate - minDate) < 30 * 86400000) maxDate.setDate(minDate.getDate() + 30);
            
            const dateColumns = [];
            let curr = new Date(minDate);
            while (curr <= maxDate) {
                dateColumns.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }
            
            const data = [];
            data.push(["Rooms / Dates", ...dateColumns]);
            
            roomsConfig.forEach(group => {
                group.beds.forEach(bed => {
                    const row = [bed.id];
                    dateColumns.forEach(date => {
                        const key = `${bed.id}_${date}`;
                        row.push(bookings[key] ? bookings[key].guestName : "");
                    });
                    data.push(row);
                });
            });
            
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bookings");
            
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            
            const writable = await currentFileHandle.createWritable();
            await writable.write(excelBuffer);
            await writable.close();
            console.log("Auto-saved to matrix format in", currentFileHandle.name);
        } catch (err) {
            console.error("Auto-save failed:", err);
        }
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
    // File Menu Modal handling
    const btnFileMenu = document.getElementById('btnFileMenu');
    const fileModal = document.getElementById('fileModal');
    const closeFileModal = document.getElementById('closeFileModal');
    if (btnFileMenu) {
        btnFileMenu.addEventListener('click', () => {
            fileModal.classList.add('active');
        });
    }
    if (closeFileModal) {
        closeFileModal.addEventListener('click', () => {
            fileModal.classList.remove('active');
        });
    }
    // Close when clicking outside the modal content
    if (fileModal) {
        fileModal.addEventListener('click', (e) => {
            if (e.target === fileModal) {
                fileModal.classList.remove('active');
            }
        });
    }

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
    const btnExport = document.getElementById('btnExport');
    if (btnExport) {
        btnExport.addEventListener('click', () => {
            if (typeof XLSX === 'undefined') {
                alert('Export library is still loading. Please try again in a moment.');
                return;
            }

            // Create Data Array in Matrix Format
            let allDates = [new Date().toISOString().split('T')[0]];
            for (const key of Object.keys(bookings)) {
                allDates.push(key.split('_').pop());
            }
            allDates.sort();
            const minDate = new Date(allDates[0]);
            const maxDate = new Date(allDates[allDates.length - 1]);
            if ((maxDate - minDate) < 30 * 86400000) maxDate.setDate(minDate.getDate() + 30);
            
            const dateColumns = [];
            let curr = new Date(minDate);
            while (curr <= maxDate) {
                dateColumns.push(curr.toISOString().split('T')[0]);
                curr.setDate(curr.getDate() + 1);
            }
            
            const data = [];
            data.push(["Rooms / Dates", ...dateColumns]);
            
            roomsConfig.forEach(group => {
                group.beds.forEach(bed => {
                    const row = [bed.id];
                    dateColumns.forEach(date => {
                        const key = `${bed.id}_${date}`;
                        row.push(bookings[key] ? bookings[key].guestName : "");
                    });
                    data.push(row);
                });
            });

            // Create workbook and worksheet
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Bookings");

            // Trigger file download as .xlsx
            const fileName = "hotel_bookings_" + new Date().toISOString().split('T')[0] + ".xlsx";
            XLSX.writeFile(wb, fileName);
        });
    }

    // --- Import (Restore) Logic ---
    const btnImport = document.getElementById('btnImport');
    console.log('Import button element:', btnImport);
    const fileImport = document.getElementById('fileImport');
    const btnNewFile = document.getElementById('btnNewFile');
    
    if (btnNewFile) {
        btnNewFile.addEventListener('click', async () => {
            if (window.showSaveFilePicker) {
                try {
                    const fileHandle = await window.showSaveFilePicker({
                        suggestedName: 'New_Hotel_Bookings.xlsx',
                        types: [{
                            description: 'Excel Files',
                            accept: {'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']}
                        }]
                    });
                    currentFileHandle = fileHandle;
                    
                    // Clear current bookings
                    bookings = {};
                    localStorage.setItem('pmsBookings', JSON.stringify(bookings));
                    
                    if(btnImport) btnImport.textContent = `Syncing: ${fileHandle.name}`;
                    
                    // Save empty file
                    await autoSaveToExcel();
                    
                    renderTable();
                    alert(`New file created: ${fileHandle.name}. Auto-save is now ACTIVE!`);
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error(err);
                        alert("Failed to create file.");
                    }
                }
            } else {
                alert("Your browser does not support creating files directly. Please use Chrome or Edge.");
            }
        });
    }
    
    function parseDateCell(val) {
        if (val === null || val === undefined || val === '') return null;
        if (typeof val === 'number') {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const parsedDate = new Date(excelEpoch.getTime() + val * 86400000);
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0];
            }
        }
        const str = String(val).trim();
        if (!str) return null;
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
            return str.substring(0, 10);
        }
        if (/^\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{4}/.test(str)) {
            const parts = str.split(/[\/\.-]/);
            if (parts[0].length === 4) {
                return `${parts[0]}-${parts[1].padStart(2,'0')}-${parts[2].padStart(2,'0')}`;
            } else {
                return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
            }
        }
        const cleanStr = str.toLowerCase().replace(/(st|nd|rd|th)/g, '');
        const currentYear = new Date().getFullYear();
        const d = new Date(`${cleanStr} ${currentYear}`);
        if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }
        return null;
    }

    function normalizeRoomId(rawId) {
        if (!rawId) return '';
        let str = String(rawId).trim().toLowerCase();
        str = str.replace(/^room\s+/i, '');
        str = str.replace(/[\s\-]+/g, '_');
        return str;
    }

    function parseImportedExcelData(json) {
        let importedCount = 0;
        let isMatrixFormat = false;
        let matrixDates = [];
        let matrixHeaderRowIndex = -1;
        const monthCounts = {};
        let targetDate = null;
        
        for (let i = 0; i < Math.min(json.length, 20); i++) {
            const firstCell = json[i] && json[i][0] ? String(json[i][0]).toLowerCase() : '';
            if (firstCell.includes('rooms') || firstCell.includes('room / date') || firstCell.includes('rooms / dates')) {
                isMatrixFormat = true;
                matrixHeaderRowIndex = i;
                for (let col = 1; col < json[i].length; col++) {
                    let dateVal = json[i][col];
                    if (dateVal) {
                        if (typeof dateVal === 'number') {
                            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                            const parsedDate = new Date(excelEpoch.getTime() + dateVal * 86400000);
                            matrixDates[col] = parsedDate.toISOString().split('T')[0];
                            continue;
                        }
                        
                        let str = String(dateVal).toLowerCase().trim().replace(/(st|nd|rd|th)/, '');
                        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
                            matrixDates[col] = str;
                            continue;
                        }
                        
                        let currentYear = new Date().getFullYear();
                        let d = new Date(`${str} ${currentYear}`);
                        if (!isNaN(d.getTime())) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            matrixDates[col] = `${y}-${m}-${day}`;
                        }
                    }
                }
                break;
            }
        }

        if (isMatrixFormat) {
            for (let i = matrixHeaderRowIndex + 1; i < json.length; i++) {
                const row = json[i];
                if (!row || !row[0]) continue;
                const roomId = normalizeRoomId(row[0]);
                for (let col = 1; col < row.length; col++) {
                    const guestName = row[col];
                    const dateStr = matrixDates[col];
                    if (guestName && dateStr && String(guestName).trim() !== '') {
                        const key = `${roomId}_${dateStr}`;
                        bookings[key] = { guestName: String(guestName).trim(), status: 'booked' };
                        importedCount++;
                        const ym = dateStr.substring(0, 7);
                        monthCounts[ym] = (monthCounts[ym] || 0) + 1;
                    }
                }
            }
        } else {
            let startRow = 0;
            if (json.length > 0 && json[0] && json[0][0]) {
                const col0 = String(json[0][0]).toLowerCase();
                const col1 = String(json[0][1] || '').toLowerCase();
                if (col0.includes('room') || col1.includes('date')) {
                    startRow = 1;
                }
            }
            
            for (let i = startRow; i < json.length; i++) {
                const row = json[i];
                if (!row || row.length < 2) continue;
                
                const roomId = normalizeRoomId(row[0]);
                let dateStr = parseDateCell(row[1]);
                let guestName = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : 'booked';
                let status = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : 'booked';
                
                if (roomId && dateStr) {
                    const key = `${roomId}_${dateStr}`;
                    bookings[key] = { guestName, status };
                    importedCount++;
                    const ym = dateStr.substring(0, 7);
                    monthCounts[ym] = (monthCounts[ym] || 0) + 1;
                }
            }
        }
        
        let maxCount = 0;
        let bestMonth = null;
        for (const [ym, count] of Object.entries(monthCounts)) {
            if (count > maxCount) {
                maxCount = count;
                bestMonth = ym;
            }
        }
        if (bestMonth) {
            targetDate = `${bestMonth}-01`;
        }

        return { count: importedCount, targetDate };
    }

    if (btnImport) {
        btnImport.addEventListener('click', async (e) => {
            e.stopPropagation();
            console.log('Import button clicked');
            if (window.showOpenFilePicker) {
                try {
                    const [fileHandle] = await window.showOpenFilePicker({
                        types: [{
                            description: 'Excel Files',
                            accept: {
                                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                                'application/vnd.ms-excel.sheet.binary.macroenabled.12': ['.xlsb'],
                                'application/vnd.ms-excel': ['.xls', '.xlsb']
                            }
                        }],
                        multiple: false
                    });
                    currentFileHandle = fileHandle;
                    btnImport.innerHTML = `✅ Syncing`;
                    btnImport.title = `Syncing: ${fileHandle.name}`;
                    
                    const file = await fileHandle.getFile();
                    const data = new Uint8Array(await file.arrayBuffer());
                    const workbook = XLSX.read(data, {type: 'array'});
                    
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    
                    const json = XLSX.utils.sheet_to_json(worksheet, {header: 1}); // use raw dates
                    
                    const result = parseImportedExcelData(json);
                    if (result.targetDate) {
                        const d = new Date(result.targetDate + 'T00:00:00');
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const firstDayOfTargetMonth = new Date(d.getFullYear(), d.getMonth(), 1);
                        startDateOffset = Math.round((firstDayOfTargetMonth - today) / (1000 * 60 * 60 * 24));
                        daysToView = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                        if (jumpMonthInput) {
                            jumpMonthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                        }
                    }
                    
                    saveAndRender();
                    
                    if (result.count === 0) {
                        alert(`Import finished, but NO bookings were found in ${fileHandle.name}. Ensure you selected the correct file.`);
                    } else {
                        alert(`Successfully imported ${result.count} bookings. Auto-save to ${fileHandle.name} is now ACTIVE!`);
                    }
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        console.error("File API error:", err);
                        alert("Error importing file.");
                    }
                }
            } else if (fileImport) {
                console.log('Fallback fileImport click');
                fileImport.click();
            }
        });

        if (fileImport) {
            fileImport.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, {type: 'array'});
                        
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        
                        const json = XLSX.utils.sheet_to_json(worksheet, {header: 1}); // use raw dates
                        
                        const result = parseImportedExcelData(json);
                        if (result.targetDate) {
                            const d = new Date(result.targetDate + 'T00:00:00');
                            const today = new Date();
                            today.setHours(0,0,0,0);
                            const firstDayOfTargetMonth = new Date(d.getFullYear(), d.getMonth(), 1);
                            startDateOffset = Math.round((firstDayOfTargetMonth - today) / (1000 * 60 * 60 * 24));
                            daysToView = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
                            if (jumpMonthInput) {
                                jumpMonthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                            }
                        }
                        
                        saveAndRender();
                        
                        btnImport.innerHTML = `✅ Imported`;
                        btnImport.title = file.name;
                        if (result.count === 0) {
                            alert(`Import finished, but NO bookings were found in ${file.name}. Ensure you selected the correct file.`);
                        } else {
                            alert(`Successfully imported ${result.count} bookings. Note: Auto-save requires Chrome/Edge.`);
                        }
                        fileImport.value = ''; 
                    } catch (err) {
                        console.error(err);
                        alert("Error importing file.");
                    }
                };
                reader.readAsArrayBuffer(file);
            });
        }
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
