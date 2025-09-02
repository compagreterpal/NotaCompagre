// History page JavaScript for viewing receipts

document.addEventListener('DOMContentLoaded', () => {
    initializeHistory();
    setupEventListeners();
    loadReceipts();
});

let allReceipts = [];
let filteredReceipts = [];
let currentPage = 1;
const itemsPerPage = 20;

function initializeHistory() {
    // Initialize variables
    allReceipts = [];
    filteredReceipts = [];
    currentPage = 1;
}

function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Company filter
    const companyFilter = document.getElementById('companyFilter');
    if (companyFilter) {
        companyFilter.addEventListener('change', handleFilter);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', handleFilter);
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const exportModal = new bootstrap.Modal(document.getElementById('exportModal'));
            exportModal.show();
        });
    }
    
    // Confirm export button
    const confirmExportBtn = document.getElementById('confirmExportBtn');
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', handleExport);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function loadReceipts() {
    try {
        showLoading();
        
        const response = await fetch('/api/receipts');
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        allReceipts = data.receipts || [];
        filteredReceipts = [...allReceipts];
        
        updateReceiptsTable();
        updatePagination();
        updateTotalCount();
        
    } catch (error) {
        console.error('Error loading receipts:', error);
        showError('Error saat memuat data nota');
    } finally {
        hideLoading();
    }
}

function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const companyFilter = document.getElementById('companyFilter').value;
    const dateFilter = document.getElementById('dateFilter').value;
    
    filteredReceipts = allReceipts.filter(receipt => {
        const matchesSearch = !searchTerm || 
            receipt.receipt_number.toLowerCase().includes(searchTerm) ||
            receipt.recipient.toLowerCase().includes(searchTerm) ||
            receipt.company_name.toLowerCase().includes(searchTerm);
        
        const matchesCompany = !companyFilter || receipt.company_code === companyFilter;
        
        const matchesDate = !dateFilter || receipt.date === dateFilter;
        
        return matchesSearch && matchesCompany && matchesDate;
    });
    
    currentPage = 1;
    updateReceiptsTable();
    updatePagination();
    updateTotalCount();
}

function handleFilter() {
    handleSearch();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('companyFilter').value = '';
    document.getElementById('dateFilter').value = '';
    
    filteredReceipts = [...allReceipts];
    currentPage = 1;
    updateReceiptsTable();
    updatePagination();
    updateTotalCount();
}

function updateReceiptsTable() {
    const tbody = document.getElementById('receiptsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageReceipts = filteredReceipts.slice(startIndex, endIndex);
    
    if (pageReceipts.length === 0) {
        showNoDataMessage();
        return;
    }
    
    pageReceipts.forEach((receipt, index) => {
        const row = document.createElement('tr');
        row.className = 'receipt-row';
        row.setAttribute('data-receipt-id', receipt.id);
        
        row.innerHTML = `
            <td>${startIndex + index + 1}</td>
            <td>
                <span class="badge bg-primary">${receipt.receipt_number}</span>
            </td>
            <td>
                <span class="badge bg-secondary">${receipt.company_code}</span>
                <br>
                <small class="text-muted">${receipt.company_name}</small>
            </td>
            <td>${formatDate(receipt.date)}</td>
            <td>${receipt.recipient}</td>
            <td class="fw-bold">${formatCurrency(receipt.total_amount)}</td>
            <td>
                <span class="badge bg-success">Tersimpan</span>
            </td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-outline-primary" onclick="viewReceiptDetails(${receipt.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button type="button" class="btn btn-outline-success" onclick="printReceipt(${receipt.id})">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
    
    hideNoDataMessage();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredReceipts.length / itemsPerPage);
    const paginationNav = document.getElementById('paginationNav');
    const paginationList = document.getElementById('paginationList');
    
    if (totalPages <= 1) {
        paginationNav.style.display = 'none';
        return;
    }
    
    paginationNav.style.display = 'block';
    paginationList.innerHTML = '';
    
    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    paginationList.appendChild(prevLi);
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `
            <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
        `;
        paginationList.appendChild(pageLi);
    }
    
    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    paginationList.appendChild(nextLi);
}

function changePage(page) {
    if (page < 1 || page > Math.ceil(filteredReceipts.length / itemsPerPage)) {
        return;
    }
    
    currentPage = page;
    updateReceiptsTable();
    updatePagination();
    
    // Scroll to top of table
    const table = document.getElementById('receiptsTable');
    if (table) {
        table.scrollIntoView({ behavior: 'smooth' });
    }
}

function updateTotalCount() {
    const totalReceipts = document.getElementById('totalReceipts');
    if (totalReceipts) {
        totalReceipts.textContent = `${filteredReceipts.length} nota`;
    }
}

async function viewReceiptDetails(receiptId) {
    try {
        const response = await fetch(`/api/receipts/${receiptId}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        const receipt = data.receipt;
        showReceiptDetailsModal(receipt);
        
    } catch (error) {
        console.error('Error loading receipt details:', error);
        showError('Error saat memuat detail nota');
    }
}

function showReceiptDetailsModal(receipt) {
    const modalContent = document.getElementById('receiptDetailContent');
    if (!modalContent) return;
    
    modalContent.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6 class="text-primary">Informasi Nota</h6>
                <table class="table table-sm">
                    <tr>
                        <td><strong>Nomor Nota:</strong></td>
                        <td>${receipt.receipt_number}</td>
                    </tr>
                    <tr>
                        <td><strong>Perusahaan:</strong></td>
                        <td>${receipt.company_name}</td>
                    </tr>
                    <tr>
                        <td><strong>Tanggal:</strong></td>
                        <td>${formatDate(receipt.date)}</td>
                    </tr>
                    <tr>
                        <td><strong>Penerima:</strong></td>
                        <td>${receipt.recipient}</td>
                    </tr>
                    <tr>
                        <td><strong>Total:</strong></td>
                        <td class="fw-bold">${formatCurrency(receipt.total_amount)}</td>
                    </tr>
                </table>
            </div>
            <div class="col-md-6">
                <h6 class="text-primary">Daftar Item</h6>
                <div class="table-responsive">
                    <table class="table table-sm table-bordered">
                        <thead class="table-light">
                            <tr>
                                <th>Qty</th>
                                <th>Jenis</th>
                                <th>Ukuran</th>
                                <th>Warna</th>
                                <th>Harga Satuan</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${receipt.items.map(item => `
                                <tr>
                                    <td>${item.quantity}</td>
                                    <td>${item.item_type}</td>
                                    <td>${item.size}</td>
                                    <td>${item.color}</td>
                                    <td>${formatCurrency(item.unit_price)}</td>
                                    <td>${formatCurrency(item.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('receiptDetailModal'));
    modal.show();
}

function printReceipt(receiptId) {
    // For now, just show a message
    // In the future, this could generate and print a PDF
    showToast('Fitur print akan segera tersedia!', 'info');
}

async function handleExport() {
    try {
        const confirmBtn = document.getElementById('confirmExportBtn');
        window.NotaApp.showLoading(confirmBtn);
        
        const response = await fetch('/api/export', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Success
        showToast(data.message, 'success');
        
        // Hide modal
        const exportModal = bootstrap.Modal.getInstance(document.getElementById('exportModal'));
        if (exportModal) {
            exportModal.hide();
        }
        
        // Reload receipts
        setTimeout(() => {
            loadReceipts();
        }, 1000);
        
    } catch (error) {
        console.error('Error exporting data:', error);
        showError(`Error saat export: ${error.message}`);
    } finally {
        const confirmBtn = document.getElementById('confirmExportBtn');
        window.NotaApp.hideLoading(confirmBtn);
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const receiptsTable = document.getElementById('receiptsTable');
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (receiptsTable) receiptsTable.style.display = 'none';
}

function hideLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const receiptsTable = document.getElementById('receiptsTable');
    
    if (loadingSpinner) loadingSpinner.style.display = 'none';
    if (receiptsTable) receiptsTable.style.display = 'block';
}

function showNoDataMessage() {
    const noDataMessage = document.getElementById('noDataMessage');
    const receiptsTable = document.getElementById('receiptsTable');
    
    if (noDataMessage) noDataMessage.style.display = 'block';
    if (receiptsTable) receiptsTable.style.display = 'none';
}

function hideNoDataMessage() {
    const noDataMessage = document.getElementById('noDataMessage');
    const receiptsTable = document.getElementById('receiptsTable');
    
    if (noDataMessage) noDataMessage.style.display = 'none';
    if (receiptsTable) receiptsTable.style.display = 'block';
}

function showError(message) {
    if (window.NotaApp && window.NotaApp.showToast) {
        window.NotaApp.showToast(message, 'danger');
    } else {
        alert(message);
    }
}

function showToast(message, type = 'info') {
    if (window.NotaApp && window.NotaApp.showToast) {
        window.NotaApp.showToast(message, type);
    } else {
        alert(message);
    }
}
