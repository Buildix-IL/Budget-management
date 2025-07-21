// מחלקת ניהול נתונים
class DataManager {
    constructor() {
        this.suppliers = this.loadData('suppliers') || [];
        this.quotes = this.loadData('quotes') || [];
        this.invoices = this.loadData('invoices') || [];
        this.payments = this.loadData('payments') || [];
        this.statuses = this.loadData('statuses') || ['ממתין לתשלום', 'שולם', 'שולם חלקית', 'בוטל', 'באמצע ביצוע'];
        this.settings = this.loadData('settings') || { defaultVat: 18 };
    }

    loadData(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error(`Error loading ${key}:`, error);
            return null;
        }
    }

    saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Error saving ${key}:`, error);
            return false;
        }
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // ספקים
    addSupplier(supplierData) {
        const supplier = {
            id: this.generateId(),
            name: supplierData.name,
            profession: supplierData.profession,
            phone: supplierData.phone || '',
            email: supplierData.email || '',
            defaultVat: parseFloat(supplierData.defaultVat || this.settings.defaultVat),
            fields: supplierData.fields || {},
            createdAt: new Date().toISOString()
        };
        this.suppliers.push(supplier);
        this.saveData('suppliers', this.suppliers);
        return supplier;
    }

    updateSupplier(id, supplierData) {
        const index = this.suppliers.findIndex(s => s.id === id);
        if (index !== -1) {
            this.suppliers[index] = { ...this.suppliers[index], ...supplierData };
            this.saveData('suppliers', this.suppliers);
            return this.suppliers[index];
        }
        return null;
    }

    deleteSupplier(id) {
        this.suppliers = this.suppliers.filter(s => s.id !== id);
        this.saveData('suppliers', this.suppliers);
    }

    getSupplierById(id) {
        return this.suppliers.find(s => s.id === id);
    }

    validateSupplier(supplierData) {
        const errors = [];
        if (!supplierData.name?.trim()) errors.push('שם הספק חובה');
        if (!supplierData.profession?.trim()) errors.push('מקצוע חובה');
        if (!supplierData.phone?.trim() && !supplierData.email?.trim()) {
            errors.push('טלפון או אימייל חובה');
        }
        return errors;
    }

    // הצעות מחיר
    addQuote(quoteData) {
        const quote = {
            id: this.generateId(),
            supplierId: quoteData.supplierId,
            description: quoteData.description,
            amount: parseFloat(quoteData.amount),
            date: quoteData.date,
            notes: quoteData.notes || '',
            status: quoteData.status || 'pending',
            createdAt: new Date().toISOString()
        };
        this.quotes.push(quote);
        this.saveData('quotes', this.quotes);
        return quote;
    }

    updateQuote(id, quoteData) {
        const index = this.quotes.findIndex(q => q.id === id);
        if (index !== -1) {
            this.quotes[index] = { ...this.quotes[index], ...quoteData };
            this.saveData('quotes', this.quotes);
            return this.quotes[index];
        }
        return null;
    }

    deleteQuote(id) {
        this.quotes = this.quotes.filter(q => q.id !== id);
        this.saveData('quotes', this.quotes);
    }

    getQuoteById(id) {
        return this.quotes.find(q => q.id === id);
    }

    getQuotesBySupplier(supplierId) {
        return this.quotes.filter(q => q.supplierId === supplierId);
    }

    // חשבוניות
    addInvoice(invoiceData) {
        const supplier = this.getSupplierById(invoiceData.supplierId);
        const defaultVat = supplier?.defaultVat || this.settings.defaultVat;
        
        const invoice = {
            id: this.generateId(),
            supplierId: invoiceData.supplierId,
            quoteId: invoiceData.quoteId || null,
            description: invoiceData.description,
            baseAmount: parseFloat(invoiceData.baseAmount),
            vat: parseFloat(invoiceData.vat || defaultVat),
            discount: parseFloat(invoiceData.discount || 0),
            discountType: invoiceData.discountType || 'amount',
            status: invoiceData.status,
            hasInstallments: invoiceData.hasInstallments || false,
            installments: invoiceData.installments || [],
            createdAt: new Date().toISOString()
        };
        
        // חישוב סכום סופי
        invoice.finalAmount = this.calculateFinalAmount(invoice);
        
        this.invoices.push(invoice);
        this.saveData('invoices', this.invoices);
        return invoice;
    }

    updateInvoice(id, invoiceData) {
        const index = this.invoices.findIndex(i => i.id === id);
        if (index !== -1) {
            this.invoices[index] = { ...this.invoices[index], ...invoiceData };
            this.invoices[index].finalAmount = this.calculateFinalAmount(this.invoices[index]);
            this.saveData('invoices', this.invoices);
            return this.invoices[index];
        }
        return null;
    }

    deleteInvoice(id) {
        this.invoices = this.invoices.filter(i => i.id !== id);
        this.saveData('invoices', this.invoices);
    }

    getInvoiceById(id) {
        return this.invoices.find(i => i.id === id);
    }

    getUnpaidInvoices() {
        return this.invoices.filter(i => i.status !== 'שולם');
    }

    calculateFinalAmount(invoice) {
        let amount = invoice.baseAmount;
        
        // הנחה
        if (invoice.discount > 0) {
            if (invoice.discountType === 'percent') {
                amount = amount * (1 - invoice.discount / 100);
            } else {
                amount = amount - invoice.discount;
            }
        }
        
        // מעמ
        if (invoice.vat > 0) {
            amount = amount * (1 + invoice.vat / 100);
        }
        
        return Math.round(amount * 100) / 100;
    }

    // תשלומים
    addPayment(paymentData) {
        const payment = {
            id: this.generateId(),
            invoiceId: paymentData.invoiceId,
            amount: parseFloat(paymentData.amount),
            date: paymentData.date,
            method: paymentData.method || 'bank_transfer',
            reference: paymentData.reference || '',
            notes: paymentData.notes || '',
            createdAt: new Date().toISOString()
        };
        
        this.payments.push(payment);
        this.saveData('payments', this.payments);
        
        // עדכון סטטוס חשבונית
        this.updateInvoiceStatus(paymentData.invoiceId);
        
        return payment;
    }

    updateInvoiceStatus(invoiceId) {
        const invoice = this.getInvoiceById(invoiceId);
        if (!invoice) return;

        const invoicePayments = this.payments.filter(p => p.invoiceId === invoiceId);
        const totalPaid = invoicePayments.reduce((sum, p) => sum + p.amount, 0);
        
        if (totalPaid >= invoice.finalAmount) {
            invoice.status = 'שולם';
        } else if (totalPaid > 0) {
            invoice.status = 'שולם חלקית';
        }
        
        this.updateInvoice(invoiceId, invoice);
    }

    getPaymentsByInvoice(invoiceId) {
        return this.payments.filter(p => p.invoiceId === invoiceId);
    }

    deletePayment(id) {
        const payment = this.payments.find(p => p.id === id);
        if (payment) {
            this.payments = this.payments.filter(p => p.id !== id);
            this.saveData('payments', this.payments);
            this.updateInvoiceStatus(payment.invoiceId);
        }
    }

    // סטטוסים
    addStatus(status) {
        if (!this.statuses.includes(status)) {
            this.statuses.push(status);
            this.saveData('statuses', this.statuses);
        }
    }

    removeStatus(status) {
        this.statuses = this.statuses.filter(s => s !== status);
        this.saveData('statuses', this.statuses);
    }

    // הגדרות
    updateSettings(settings) {
        this.settings = { ...this.settings, ...settings };
        this.saveData('settings', this.settings);
    }

    // סטטיסטיקות
    getStats() {
        const totalDebt = this.invoices.reduce((sum, invoice) => sum + invoice.finalAmount, 0);
        const paidAmount = this.payments.reduce((sum, payment) => sum + payment.amount, 0);
        const activeQuotes = this.quotes.filter(q => q.status === 'pending').length;
        
        return {
            totalDebt,
            paidAmount,
            remainingDebt: totalDebt - paidAmount,
            activeQuotes
        };
    }

    // ייצוא/ייבוא
    exportData() {
        return {
            suppliers: this.suppliers,
            quotes: this.quotes,
            invoices: this.invoices,
            payments: this.payments,
            statuses: this.statuses,
            settings: this.settings,
            exportDate: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.suppliers) {
                this.suppliers = data.suppliers;
                this.saveData('suppliers', this.suppliers);
            }
            if (data.quotes) {
                this.quotes = data.quotes;
                this.saveData('quotes', this.quotes);
            }
            if (data.invoices) {
                this.invoices = data.invoices;
                this.saveData('invoices', this.invoices);
            }
            if (data.payments) {
                this.payments = data.payments;
                this.saveData('payments', this.payments);
            }
            if (data.statuses) {
                this.statuses = data.statuses;
                this.saveData('statuses', this.statuses);
            }
            if (data.settings) {
                this.settings = data.settings;
                this.saveData('settings', this.settings);
            }
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// יצירת מופע גלובלי
const dataManager = new DataManager();

// ניהול טאבים
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // הסרת active מכל הטאבים
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // הוספת active לטאב הנוכחי
            button.classList.add('active');
            const targetTab = document.getElementById(button.dataset.tab);
            if (targetTab) {
                targetTab.classList.add('active');
                
                // רענון תוכן הטאב
                refreshTabContent(button.dataset.tab);
            }
        });
    });
}

function refreshTabContent(tab) {
    switch (tab) {
        case 'dashboard':
            refreshDashboard();
            break;
        case 'suppliers':
            refreshSuppliersList();
            break;
        case 'quotes':
            refreshQuotesList();
            break;
        case 'invoices':
            refreshInvoicesList();
            refreshSupplierOptions();
            break;
        case 'payments':
            refreshPaymentsList();
            break;
        case 'settings':
            refreshSettings();
            break;
    }
}

// דשבורד
function refreshDashboard() {
    const stats = dataManager.getStats();
    
    document.getElementById('total-debt').textContent = `₪${stats.totalDebt.toLocaleString('he-IL')}`;
    document.getElementById('total-paid').textContent = `₪${stats.paidAmount.toLocaleString('he-IL')}`;
    document.getElementById('remaining-debt').textContent = `₪${stats.remainingDebt.toLocaleString('he-IL')}`;
    document.getElementById('active-quotes').textContent = stats.activeQuotes;
    
    // פעילות אחרונה
    const recentList = document.getElementById('recent-list');
    const recentInvoices = dataManager.invoices
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
    
    recentList.innerHTML = recentInvoices.map(invoice => {
        const supplier = dataManager.getSupplierById(invoice.supplierId);
        return `
            <div class="card" style="margin-bottom: 10px;">
                <div class="card-header">
                    <span class="card-title">${invoice.description}</span>
                    <span class="status ${getStatusClass(invoice.status)}">${invoice.status}</span>
                </div>
                <div class="card-content">
                    <div class="card-field">
                        <div class="card-field-label">ספק</div>
                        <div class="card-field-value">${supplier ? supplier.name : 'לא ידוע'}</div>
                    </div>
                    <div class="card-field">
                        <div class="card-field-label">סכום</div>
                        <div class="card-field-value">₪${invoice.finalAmount.toLocaleString('he-IL')}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function getStatusClass(status) {
    switch (status) {
        case 'שולם': return 'paid';
        case 'שולם חלקית': return 'partial';
        case 'בוטל': return 'cancelled';
        default: return 'pending';
    }
}

function getQuoteStatusClass(status) {
    switch (status) {
        case 'accepted': return 'quote-accepted';
        case 'rejected': return 'quote-rejected';
        default: return 'quote-pending';
    }
}

function getPaymentMethodText(method) {
    const methods = {
        'bank_transfer': 'העברה בנקאית',
        'cash': 'מזומן',
        'check': 'צק',
        'credit_card': 'כרטיס אשראי',
        'other': 'אחר'
    };
    return methods[method] || method;
}

// ספקים
function refreshSuppliersList() {
    const suppliersList = document.getElementById('suppliers-list');
    
    suppliersList.innerHTML = dataManager.suppliers.map(supplier => `
        <div class="card">
            <div class="card-header">
                <span class="card-title">${supplier.name}</span>
                <div class="card-actions">
                    <button class="btn btn-secondary" onclick="editSupplier('${supplier.id}')">ערוך</button>
                    <button class="btn btn-danger" onclick="deleteSupplierConfirm('${supplier.id}')">מחק</button>
                </div>
            </div>
            <div class="card-content">
                <div class="card-field">
                    <div class="card-field-label">מקצוע</div>
                    <div class="card-field-value">${supplier.profession}</div>
                </div>
                ${supplier.phone ? `
                    <div class="card-field">
                        <div class="card-field-label">טלפון</div>
                        <div class="card-field-value">${supplier.phone}</div>
                    </div>
                ` : ''}
                ${supplier.email ? `
                    <div class="card-field">
                        <div class="card-field-label">אימייל</div>
                        <div class="card-field-value">${supplier.email}</div>
                    </div>
                ` : ''}
                <div class="card-field">
                    <div class="card-field-label">מעמ ברירת מחדל</div>
                    <div class="card-field-value">${supplier.defaultVat}%</div>
                </div>
                ${Object.entries(supplier.fields || {}).map(([key, value]) => `
                    <div class="card-field">
                        <div class="card-field-label">${key}</div>
                        <div class="card-field-value">${value}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function showSupplierForm(supplierId = null) {
    const modal = document.getElementById('supplier-modal');
    const form = document.getElementById('supplier-form');
    const title = document.getElementById('supplier-modal-title');
    
    // איפוס הטופס
    form.reset();
    document.getElementById('supplier-fields').innerHTML = '';
    document.getElementById('supplier-default-vat').value = dataManager.settings.defaultVat;
    
    if (supplierId) {
        // עריכה
        const supplier = dataManager.getSupplierById(supplierId);
        if (supplier) {
            title.textContent = 'ערוך ספק';
            document.getElementById('supplier-id').value = supplier.id;
            document.getElementById('supplier-name').value = supplier.name;
            document.getElementById('supplier-profession').value = supplier.profession;
            document.getElementById('supplier-phone').value = supplier.phone || '';
            document.getElementById('supplier-email').value = supplier.email || '';
            document.getElementById('supplier-default-vat').value = supplier.defaultVat || dataManager.settings.defaultVat;
            
            // טעינת שדות דינמיים
            Object.entries(supplier.fields || {}).forEach(([key, value]) => {
                addSupplierField(key, value);
            });
        }
    } else {
        // הוספה חדשה
        title.textContent = 'הוסף ספק חדש';
        document.getElementById('supplier-id').value = '';
    }
    
    modal.style.display = 'block';
}

function hideSupplierForm() {
    document.getElementById('supplier-modal').style.display = 'none';
}

function addSupplierField(key = '', value = '') {
    const fieldsContainer = document.getElementById('supplier-fields');
    const fieldId = `field_${Date.now()}`;
    
    const fieldHtml = `
        <div class="dynamic-field" id="${fieldId}">
            <input type="text" placeholder="שם השדה" value="${key}" required>
            <input type="text" placeholder="ערך" value="${value}" required>
            <button type="button" class="remove-btn" onclick="removeField('${fieldId}')">הסר</button>
        </div>
    `;
    
    fieldsContainer.insertAdjacentHTML('beforeend', fieldHtml);
}

function removeField(fieldId) {
    document.getElementById(fieldId)?.remove();
}

function editSupplier(id) {
    showSupplierForm(id);
}

function deleteSupplierConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק את הספק?')) {
        dataManager.deleteSupplier(id);
        refreshSuppliersList();
    }
}

// הצעות מחיר
function refreshQuotesList() {
    const quotesList = document.getElementById('quotes-list');
    
    quotesList.innerHTML = dataManager.quotes.map(quote => {
        const supplier = dataManager.getSupplierById(quote.supplierId);
        return `
            <div class="card quote-card ${quote.status}">
                <div class="card-header">
                    <span class="card-title">${quote.description}</span>
                    <div class="card-actions">
                        <span class="status ${getQuoteStatusClass(quote.status)}">${getQuoteStatusText(quote.status)}</span>
                        <button class="btn btn-secondary" onclick="editQuote('${quote.id}')">ערוך</button>
                        ${quote.status === 'accepted' ? `<button class="btn btn-success" onclick="createInvoiceFromQuote('${quote.id}')">צור חשבונית</button>` : ''}
                        <button class="btn btn-danger" onclick="deleteQuoteConfirm('${quote.id}')">מחק</button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-field">
                        <div class="card-field-label">ספק</div>
                        <div class="card-field-value">${supplier ? supplier.name : 'לא ידוע'}</div>
                    </div>
                    <div class="card-field">
                        <div class="card-field-label">סכום</div>
                        <div class="card-field-value">₪${quote.amount.toLocaleString('he-IL')}</div>
                    </div>
                    ${quote.date ? `
                        <div class="card-field">
                            <div class="card-field-label">תאריך</div>
                            <div class="card-field-value">${new Date(quote.date).toLocaleDateString('he-IL')}</div>
                        </div>
                    ` : ''}
                    ${quote.notes ? `
                        <div class="card-field">
                            <div class="card-field-label">הערות</div>
                            <div class="card-field-value">${quote.notes}</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function getQuoteStatusText(status) {
    const statuses = {
        'pending': 'ממתין לאישור',
        'accepted': 'התקבל',
        'rejected': 'נדחה'
    };
    return statuses[status] || status;
}

function showQuoteForm(quoteId = null) {
    const modal = document.getElementById('quote-modal');
    const form = document.getElementById('quote-form');
    const title = document.getElementById('quote-modal-title');
    
    // טעינת ספקים
    const supplierSelect = document.getElementById('quote-supplier');
    supplierSelect.innerHTML = '<option value="">בחר ספק</option>' +
        dataManager.suppliers.map(supplier => 
            `<option value="${supplier.id}">${supplier.name}</option>`
        ).join('');
    
    // איפוס הטופס
    form.reset();
    document.getElementById('quote-date').value = new Date().toISOString().split('T')[0];
    
    if (quoteId) {
        // עריכה
        const quote = dataManager.getQuoteById(quoteId);
        if (quote) {
            title.textContent = 'ערוך הצעת מחיר';
            document.getElementById('quote-id').value = quote.id;
            document.getElementById('quote-supplier').value = quote.supplierId;
            document.getElementById('quote-description').value = quote.description;
            document.getElementById('quote-amount').value = quote.amount;
            document.getElementById('quote-date').value = quote.date;
            document.getElementById('quote-notes').value = quote.notes || '';
            document.getElementById('quote-status').value = quote.status;
        }
    } else {
        // הוספה חדשה
        title.textContent = 'הוסף הצעת מחיר חדשה';
        document.getElementById('quote-id').value = '';
    }
    
    modal.style.display = 'block';
}

function hideQuoteForm() {
    document.getElementById('quote-modal').style.display = 'none';
}

function editQuote(id) {
    showQuoteForm(id);
}

function deleteQuoteConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק את הצעת המחיר?')) {
        dataManager.deleteQuote(id);
        refreshQuotesList();
        refreshDashboard();
    }
}

function createInvoiceFromQuote(quoteId) {
    const quote = dataManager.getQuoteById(quoteId);
    if (quote) {
        // מעבר לטאב חשבוניות
        document.querySelector('[data-tab="invoices"]').click();
        
        // פתיחת טופס חשבונית עם נתונים מההצעה
        setTimeout(() => {
            showInvoiceForm();
            document.getElementById('invoice-supplier').value = quote.supplierId;
            document.getElementById('invoice-description').value = quote.description;
            document.getElementById('invoice-amount').value = quote.amount;
            document.getElementById('invoice-quote').value = quote.id;
            
            // עדכון מעמ לפי ברירת המחדל של הספק
            const supplier = dataManager.getSupplierById(quote.supplierId);
            if (supplier) {
                document.getElementById('invoice-vat').value = supplier.defaultVat;
            }
        }, 100);
    }
}

// חשבוניות
function refreshInvoicesList() {
    const invoicesList = document.getElementById('invoices-list');
    
    invoicesList.innerHTML = dataManager.invoices.map(invoice => {
        const supplier = dataManager.getSupplierById(invoice.supplierId);
        const quote = invoice.quoteId ? dataManager.getQuoteById(invoice.quoteId) : null;
        const payments = dataManager.getPaymentsByInvoice(invoice.id);
        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        
        return `
            <div class="card">
                <div class="card-header">
                    <span class="card-title ${quote ? 'has-quote' : ''}">${invoice.description}</span>
                    <div class="card-actions">
                        <span class="status ${getStatusClass(invoice.status)}">${invoice.status}</span>
                        <button class="btn btn-secondary" onclick="editInvoice('${invoice.id}')">ערוך</button>
                        <button class="btn btn-danger" onclick="deleteInvoiceConfirm('${invoice.id}')">מחק</button>
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-field">
                        <div class="card-field-label">ספק</div>
                        <div class="card-field-value">${supplier ? supplier.name : 'לא ידוע'}</div>
                    </div>
                    ${quote ? `
                        <div class="card-field">
                            <div class="card-field-label">הצעת מחיר</div>
                            <div class="card-field-value">${quote.description}</div>
                        </div>
                    ` : ''}
                    <div class="card-field">
                        <div class="card-field-label">סכום בסיס</div>
                        <div class="card-field-value">₪${invoice.baseAmount.toLocaleString('he-IL')}</div>
                    </div>
                    <div class="card-field">
                        <div class="card-field-label">מעמ</div>
                        <div class="card-field-value">${invoice.vat}%</div>
                    </div>
                    ${invoice.discount > 0 ? `
                        <div class="card-field">
                            <div class="card-field-label">הנחה</div>
                            <div class="card-field-value">${invoice.discount}${invoice.discountType === 'percent' ? '%' : '₪'}</div>
                        </div>
                    ` : ''}
                    <div class="card-field">
                        <div class="card-field-label">סכום סופי</div>
                        <div class="card-field-value">₪${invoice.finalAmount.toLocaleString('he-IL')}</div>
                    </div>
                    ${totalPaid > 0 ? `
                        <div class="card-field">
                            <div class="card-field-label">שולם</div>
                            <div class="card-field-value">₪${totalPaid.toLocaleString('he-IL')}</div>
                        </div>
                    ` : ''}
                    ${invoice.hasInstallments ? `
                        <div class="card-field">
                            <div class="card-field-label">תשלומים</div>
                            <div class="card-field-value">${invoice.installments.length} תשלומים</div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

function refreshSupplierOptions() {
    const supplierSelect = document.getElementById('invoice-supplier');
    const statusSelect = document.getElementById('invoice-status');
    const quoteSelect = document.getElementById('invoice-quote');
    
    // ספקים
    supplierSelect.innerHTML = '<option value="">בחר ספק</option>' +
        dataManager.suppliers.map(supplier => 
            `<option value="${supplier.id}">${supplier.name}</option>`
        ).join('');
    
    // סטטוסים
    statusSelect.innerHTML = dataManager.statuses.map(status =>
        `<option value="${status}">${status}</option>`
    ).join('');
    
    // הצעות מחיר
    quoteSelect.innerHTML = '<option value="">בחר הצעת מחיר (אופציונלי)</option>' +
        dataManager.quotes
            .filter(quote => quote.status === 'accepted')
            .map(quote => {
                const supplier = dataManager.getSupplierById(quote.supplierId);
                return `<option value="${quote.id}">${supplier ? supplier.name : 'לא ידוע'} - ${quote.description}</option>`;
            }).join('');
    
    // עדכון הצעות מחיר כשמשנים ספק
    supplierSelect.addEventListener('change', function() {
        const supplierId = this.value;
        const supplierQuotes = dataManager.quotes.filter(q => q.supplierId === supplierId && q.status === 'accepted');
        
        quoteSelect.innerHTML = '<option value="">בחר הצעת מחיר (אופציונלי)</option>' +
            supplierQuotes.map(quote => 
                `<option value="${quote.id}">${quote.description}</option>`
            ).join('');
        
        // עדכון מעמ ברירת מחדל
        if (supplierId) {
            const supplier = dataManager.getSupplierById(supplierId);
            if (supplier) {
                document.getElementById('invoice-vat').value = supplier.defaultVat;
            }
        }
    });
    
    // עדכון סכום כשבוחרים הצעת מחיר
    quoteSelect.addEventListener('change', function() {
        const quoteId = this.value;
        if (quoteId) {
            const quote = dataManager.getQuoteById(quoteId);
            if (quote) {
                document.getElementById('invoice-amount').value = quote.amount;
                document.getElementById('invoice-description').value = quote.description;
            }
        }
    });
}

function showInvoiceForm(invoiceId = null) {
    const modal = document.getElementById('invoice-modal');
    const form = document.getElementById('invoice-form');
    const title = document.getElementById('invoice-modal-title');
    
    refreshSupplierOptions();
    
    // איפוס הטופס
    form.reset();
    document.getElementById('installments-list').innerHTML = '';
    document.getElementById('installments-section').style.display = 'none';
    document.getElementById('invoice-has-installments').checked = false;
    document.getElementById('invoice-vat').value = dataManager.settings.defaultVat;
    
    if (invoiceId) {
        // עריכה
        const invoice = dataManager.getInvoiceById(invoiceId);
        if (invoice) {
            title.textContent = 'ערוך חשבונית';
            document.getElementById('invoice-id').value = invoice.id;
            document.getElementById('invoice-supplier').value = invoice.supplierId;
            document.getElementById('invoice-quote').value = invoice.quoteId || '';
            document.getElementById('invoice-description').value = invoice.description;
            document.getElementById('invoice-amount').value = invoice.baseAmount;
            document.getElementById('invoice-vat').value = invoice.vat;
            document.getElementById('invoice-discount').value = invoice.discount || '';
            document.getElementById('invoice-discount-type').value = invoice.discountType;
            document.getElementById('invoice-status').value = invoice.status;
            
            if (invoice.hasInstallments) {
                document.getElementById('invoice-has-installments').checked = true;
                document.getElementById('installments-section').style.display = 'block';
                
                invoice.installments.forEach(installment => {
                    addInstallment(installment);
                });
            }
        }
    } else {
        // הוספה חדשה
        title.textContent = 'הוסף חשבונית חדשה';
        document.getElementById('invoice-id').value = '';
    }
    
    modal.style.display = 'block';
}

function hideInvoiceForm() {
    document.getElementById('invoice-modal').style.display = 'none';
}

function addInstallment(installmentData = null) {
    const installmentsList = document.getElementById('installments-list');
    const installmentId = `installment_${Date.now()}`;
    const installmentNumber = installmentsList.children.length + 1;
    
    const installmentHtml = `
        <div class="installment" id="${installmentId}">
            <div class="installment-header">
                <span class="installment-number">תשלום ${installmentNumber}</span>
                <button type="button" class="remove-btn" onclick="removeInstallment('${installmentId}')">הסר</button>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>סוג</label>
                    <select class="installment-type">
                        <option value="amount" ${installmentData?.type === 'amount' ? 'selected' : ''}>סכום קבוע</option>
                        <option value="percent" ${installmentData?.type === 'percent' ? 'selected' : ''}>אחוז</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>ערך</label>
                    <input type="number" class="installment-value" step="0.01" value="${installmentData?.value || ''}" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>סוג מועד</label>
                    <select class="installment-trigger">
                        <option value="date" ${installmentData?.trigger === 'date' ? 'selected' : ''}>תאריך קבוע</option>
                        <option value="work" ${installmentData?.trigger === 'work' ? 'selected' : ''}>סיום עבודה</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>מועד/תיאור</label>
                    <input type="text" class="installment-date" value="${installmentData?.date || ''}" placeholder="תאריך או תיאור עבודה">
                </div>
            </div>
        </div>
    `;
    
    installmentsList.insertAdjacentHTML('beforeend', installmentHtml);
}

function removeInstallment(installmentId) {
    document.getElementById(installmentId)?.remove();
    
    // עדכון מספרי תשלומים
    const installments = document.querySelectorAll('.installment');
    installments.forEach((installment, index) => {
        const numberSpan = installment.querySelector('.installment-number');
        numberSpan.textContent = `תשלום ${index + 1}`;
    });
}

function editInvoice(id) {
    showInvoiceForm(id);
}

function deleteInvoiceConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק את החשבונית?')) {
        dataManager.deleteInvoice(id);
        refreshInvoicesList();
        refreshDashboard();
    }
}

// תשלומים
function refreshPaymentsList() {
    const paymentsList = document.getElementById('payments-list');
    
    // תשלומים רגילים
    const regularPayments = dataManager.payments.map(payment => {
        const invoice = dataManager.getInvoiceById(payment.invoiceId);
        const supplier = invoice ? dataManager.getSupplierById(invoice.supplierId) : null;
        
        return {
            id: payment.id,
            type: 'regular',
            invoiceId: payment.invoiceId,
            invoiceDescription: invoice ? invoice.description : 'חשבונית לא נמצאה',
            supplierName: supplier ? supplier.name : 'לא ידוע',
            amount: payment.amount,
            date: payment.date,
            method: payment.method,
            reference: payment.reference,
            notes: payment.notes,
            createdAt: payment.createdAt
        };
    });
    
    // תשלומי פריסה
    const installmentPayments = [];
    dataManager.invoices.forEach(invoice => {
        if (invoice.hasInstallments) {
            invoice.installments.forEach((installment, index) => {
                const supplier = dataManager.getSupplierById(invoice.supplierId);
                installmentPayments.push({
                    id: `${invoice.id}_${index}`,
                    type: 'installment',
                    invoiceId: invoice.id,
                    invoiceDescription: invoice.description,
                    supplierName: supplier ? supplier.name : 'לא ידוע',
                    installmentIndex: index,
                    ...installment,
                    isInstallment: true
                });
            });
        }
    });
    
    const allPayments = [...regularPayments, ...installmentPayments]
        .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
    
    paymentsList.innerHTML = allPayments.map(payment => {
        if (payment.type === 'installment') {
            return `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">${payment.invoiceDescription} - תשלום ${payment.installmentIndex + 1}</span>
                        <div class="card-actions">
                            ${!payment.paid ? `<button class="btn btn-success" onclick="markPaymentPaid('${payment.invoiceId}', ${payment.installmentIndex})">סמן כשולם</button>` : ''}
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="card-field">
                            <div class="card-field-label">ספק</div>
                            <div class="card-field-value">${payment.supplierName}</div>
                        </div>
                        <div class="card-field">
                            <div class="card-field-label">סכום</div>
                            <div class="card-field-value">${payment.value}${payment.type === 'percent' ? '%' : '₪'}</div>
                        </div>
                        <div class="card-field">
                            <div class="card-field-label">מועד</div>
                            <div class="card-field-value">${payment.date || 'לא צוין'}</div>
                        </div>
                        <div class="card-field">
                            <div class="card-field-label">סטטוס</div>
                            <div class="card-field-value">
                                <span class="status ${payment.paid ? 'paid' : 'pending'}">${payment.paid ? 'שולם' : 'ממתין'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="card">
                    <div class="card-header">
                        <span class="card-title">${payment.invoiceDescription}</span>
                        <div class="card-actions">
                            <span class="payment-method ${payment.method}">${getPaymentMethodText(payment.method)}</span>
                            <button class="btn btn-danger" onclick="deletePaymentConfirm('${payment.id}')">מחק</button>
                        </div>
                    </div>
                    <div class="card-content">
                        <div class="card-field">
                            <div class="card-field-label">ספק</div>
                            <div class="card-field-value">${payment.supplierName}</div>
                        </div>
                        <div class="card-field">
                            <div class="card-field-label">סכום</div>
                            <div class="card-field-value">₪${payment.amount.toLocaleString('he-IL')}</div>
                        </div>
                        <div class="card-field">
                            <div class="card-field-label">תאריך</div>
                            <div class="card-field-value">${new Date(payment.date).toLocaleDateString('he-IL')}</div>
                        </div>
                        ${payment.reference ? `
                            <div class="card-field">
                                <div class="card-field-label">אסמכתא</div>
                                <div class="card-field-value">${payment.reference}</div>
                            </div>
                        ` : ''}
                        ${payment.notes ? `
                            <div class="card-field">
                                <div class="card-field-label">הערות</div>
                                <div class="card-field-value">${payment.notes}</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }).join('');
}

function showPaymentForm() {
    const modal = document.getElementById('payment-modal');
    const form = document.getElementById('payment-form');
    
    // טעינת חשבוניות שלא שולמו במלואן
    const unpaidInvoices = dataManager.getUnpaidInvoices();
    const invoiceSelect = document.getElementById('payment-invoice');
    
    invoiceSelect.innerHTML = '<option value="">בחר חשבונית</option>' +
        unpaidInvoices.map(invoice => {
            const supplier = dataManager.getSupplierById(invoice.supplierId);
            const payments = dataManager.getPaymentsByInvoice(invoice.id);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = invoice.finalAmount - totalPaid;
            
            return `<option value="${invoice.id}">${supplier ? supplier.name : 'לא ידוע'} - ${invoice.description} (נותר: ₪${remaining.toLocaleString('he-IL')})</option>`;
        }).join('');
    
    // איפוס הטופס
    form.reset();
    document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
    
    // עדכון סכום מקסימלי כשבוחרים חשבונית
    invoiceSelect.addEventListener('change', function() {
        const invoiceId = this.value;
        if (invoiceId) {
            const invoice = dataManager.getInvoiceById(invoiceId);
            const payments = dataManager.getPaymentsByInvoice(invoiceId);
            const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
            const remaining = invoice.finalAmount - totalPaid;
            
            document.getElementById('payment-amount').value = remaining;
            document.getElementById('payment-amount').max = remaining;
        }
    });
    
    modal.style.display = 'block';
}

function hidePaymentForm() {
    document.getElementById('payment-modal').style.display = 'none';
}

function markPaymentPaid(invoiceId, installmentIndex) {
    const invoice = dataManager.getInvoiceById(invoiceId);
    if (invoice && invoice.installments[installmentIndex]) {
        invoice.installments[installmentIndex].paid = true;
        invoice.installments[installmentIndex].paidDate = new Date().toISOString();
        
        // בדיקה אם כל התשלומים שולמו
        const allPaid = invoice.installments.every(inst => inst.paid);
        if (allPaid && invoice.status !== 'שולם') {
            invoice.status = 'שולם';
        } else if (invoice.installments.some(inst => inst.paid) && invoice.status === 'ממתין לתשלום') {
            invoice.status = 'שולם חלקית';
        }
        
        dataManager.updateInvoice(invoiceId, invoice);
        refreshPaymentsList();
        refreshDashboard();
    }
}

function deletePaymentConfirm(id) {
    if (confirm('האם אתה בטוח שברצונך למחוק את התשלום?')) {
        dataManager.deletePayment(id);
        refreshPaymentsList();
        refreshDashboard();
    }
}

// הגדרות
function refreshSettings() {
    document.getElementById('default-vat').value = dataManager.settings.defaultVat;
    
    const statusesList = document.getElementById('statuses-list');
    statusesList.innerHTML = dataManager.statuses.map(status => `
        <div class="dynamic-field">
            <input type="text" value="${status}" readonly>
            <button type="button" class="remove-btn" onclick="removeStatusConfirm('${status}')">הסר</button>
        </div>
    `).join('');
}

function addStatus() {
    const input = document.getElementById('new-status');
    const status = input.value.trim();
    
    if (status) {
        dataManager.addStatus(status);
        input.value = '';
        refreshSettings();
    }
}

function removeStatusConfirm(status) {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הסטטוס "${status}"?`)) {
        dataManager.removeStatus(status);
        refreshSettings();
    }
}

function exportData() {
    const data = dataManager.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `budget_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (dataManager.importData(data)) {
                        alert('הנתונים יובאו בהצלחה!');
                        location.reload();
                    } else {
                        alert('שגיאה בייבוא הנתונים');
                    }
                } catch (error) {
                    alert('קובץ לא תקין');
                }
            };
            reader.readAsText(file);
        }
    };
    
    input.click();
}

// אירועי טפסים
document.addEventListener('DOMContentLoaded', function() {
    initTabs();
    refreshDashboard();
    
    // טופס ספקים
    document.getElementById('supplier-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const supplierId = document.getElementById('supplier-id').value;
        const name = document.getElementById('supplier-name').value;
        const profession = document.getElementById('supplier-profession').value;
        const phone = document.getElementById('supplier-phone').value;
        const email = document.getElementById('supplier-email').value;
        const defaultVat = document.getElementById('supplier-default-vat').value;
        
        // איסוף שדות דינמיים
        const fields = {};
        const dynamicFields = document.querySelectorAll('#supplier-fields .dynamic-field');
        dynamicFields.forEach(field => {
            const inputs = field.querySelectorAll('input');
            if (inputs.length === 2 && inputs[0].value && inputs[1].value) {
                fields[inputs[0].value] = inputs[1].value;
            }
        });
        
        const supplierData = { name, profession, phone, email, defaultVat, fields };
        
        // ולידציה
        const errors = dataManager.validateSupplier(supplierData);
        if (errors.length > 0) {
            alert('שגיאות:\n' + errors.join('\n'));
            return;
        }
        
        if (supplierId) {
            dataManager.updateSupplier(supplierId, supplierData);
        } else {
            dataManager.addSupplier(supplierData);
        }
        
        hideSupplierForm();
        refreshSuppliersList();
    });
    
    // טופס הצעות מחיר
    document.getElementById('quote-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const quoteId = document.getElementById('quote-id').value;
        const quoteData = {
            supplierId: document.getElementById('quote-supplier').value,
            description: document.getElementById('quote-description').value,
            amount: document.getElementById('quote-amount').value,
            date: document.getElementById('quote-date').value,
            notes: document.getElementById('quote-notes').value,
            status: document.getElementById('quote-status').value
        };
        
        if (quoteId) {
            dataManager.updateQuote(quoteId, quoteData);
        } else {
            dataManager.addQuote(quoteData);
        }
        
        hideQuoteForm();
        refreshQuotesList();
        refreshDashboard();
    });
    
    // טופס חשבוניות
    document.getElementById('invoice-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const invoiceId = document.getElementById('invoice-id').value;
        const hasInstallments = document.getElementById('invoice-has-installments').checked;
        
        // איסוף נתוני חשבונית
        const invoiceData = {
            supplierId: document.getElementById('invoice-supplier').value,
            quoteId: document.getElementById('invoice-quote').value || null,
            description: document.getElementById('invoice-description').value,
            baseAmount: document.getElementById('invoice-amount').value,
            vat: document.getElementById('invoice-vat').value,
            discount: document.getElementById('invoice-discount').value,
            discountType: document.getElementById('invoice-discount-type').value,
            status: document.getElementById('invoice-status').value,
            hasInstallments
        };
        
        // איסוף תשלומים
        if (hasInstallments) {
            const installments = [];
            const installmentElements = document.querySelectorAll('.installment');
            
            installmentElements.forEach(element => {
                const type = element.querySelector('.installment-type').value;
                const value = element.querySelector('.installment-value').value;
                const trigger = element.querySelector('.installment-trigger').value;
                const date = element.querySelector('.installment-date').value;
                
                if (value) {
                    installments.push({
                        type,
                        value: parseFloat(value),
                        trigger,
                        date,
                        paid: false
                    });
                }
            });
            
            invoiceData.installments = installments;
        }
        
        if (invoiceId) {
            dataManager.updateInvoice(invoiceId, invoiceData);
        } else {
            dataManager.addInvoice(invoiceData);
        }
        
        hideInvoiceForm();
        refreshInvoicesList();
        refreshDashboard();
    });
    
    // טופס תשלומים
    document.getElementById('payment-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const paymentData = {
            invoiceId: document.getElementById('payment-invoice').value,
            amount: document.getElementById('payment-amount').value,
            date: document.getElementById('payment-date').value,
            method: document.getElementById('payment-method').value,
            reference: document.getElementById('payment-reference').value,
            notes: document.getElementById('payment-notes').value
        };
        
        dataManager.addPayment(paymentData);
        hidePaymentForm();
        refreshPaymentsList();
        refreshDashboard();
    });
    
    // אירוע פריסת תשלומים
    document.getElementById('invoice-has-installments').addEventListener('change', function() {
        const installmentsSection = document.getElementById('installments-section');
        installmentsSection.style.display = this.checked ? 'block' : 'none';
        
        if (!this.checked) {
            document.getElementById('installments-list').innerHTML = '';
        }
    });
    
    // טופס הגדרות
    document.getElementById('settings-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const settings = {
            defaultVat: parseFloat(document.getElementById('default-vat').value)
        };
        
        dataManager.updateSettings(settings);
        alert('ההגדרות נשמרו בהצלחה!');
    });
    
    // סגירת מודלים בלחיצה על הרקע
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}); 