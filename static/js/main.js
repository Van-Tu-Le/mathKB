// static/js/main.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const itemsList = document.getElementById('items-list');
    const itemView = document.getElementById('item-view');
    const itemForm = document.getElementById('item-form');
    const formTitle = document.getElementById('form-title');
    const contentInput = document.getElementById('content-input');
    const tagsInput = document.getElementById('tags-input');
    const tagsSuggestions = document.getElementById('tags-suggestions');
    const contentPreview = document.getElementById('content-preview');
    const saveItemBtn = document.getElementById('save-item-btn');
    const cancelItemBtn = document.getElementById('cancel-item-btn');
    const newItemBtn = document.getElementById('new-item-btn');
    const tagList = document.getElementById('tag-list');
    const tagSearch = document.getElementById('tag-search');
    const activeFilters = document.getElementById('active-filters');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    const contentSearch = document.getElementById('content-search');
    const exportJsonBtn = document.getElementById('export-json-btn');
    const exportTxtBtn = document.getElementById('export-txt-btn');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
    // Create the DOM elements for bulk operations and dialogs
    createBulkOperationsUI();
    
    // Create new UI elements for advanced features
    createAdvancedFeatureUI();
    
    // New DOM elements for pagination and bulk operations
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    itemsList.parentNode.appendChild(paginationContainer);
    
    // DOM elements for tag management
    const tagManagementSection = document.createElement('div');
    tagManagementSection.className = 'sidebar-section';
    tagManagementSection.innerHTML = `
        <h2>Tag Management</h2>
        <button id="show-manage-tags-btn">Manage Tags</button>
    `;

    // Append the new section to the sidebar, after the filter by tags section
    document.querySelector('.sidebar').insertBefore(
        tagManagementSection, 
        document.querySelector('.sidebar-section:nth-child(3)')
    );

    // Create the tag management dialog
    const tagManagementDialog = document.createElement('div');
    tagManagementDialog.className = 'bulk-tag-dialog tag-management-dialog hidden';
    tagManagementDialog.innerHTML = `
        <div class="dialog-content">
            <h3>Tag Management</h3>
            <div class="tag-management-list"></div>
            <div class="add-tag-section">
                <h4>Add New Tag</h4>
                <div class="tag-add-form">
                    <input type="text" id="new-tag-input" placeholder="Enter new tag name">
                    <button id="add-tag-btn" class="bulk-btn">Add Tag</button>
                </div>
            </div>
            <div class="dialog-buttons">
                <button id="close-tag-management-btn" class="bulk-btn">Close</button>
            </div>
        </div>
    `;
    document.body.appendChild(tagManagementDialog);
    
    // State variables
    let currentItemId = null;
    let allItems = [];
    let allTags = [];
    let selectedTags = [];
    let searchQuery = '';
    let tagCounts = {}; // New: store tag counts
    
    // Advanced filter state
    let advancedTagFilter = {
        include_all: [],
        include_any: [],
        exclude: []
    };
    
    // Advanced search state
    let advancedSearchParams = {
        keywords: '',
        exact_match: false,
        start_date: '',
        end_date: '',
        sort_by: 'created_at',
        sort_order: 'desc'
    };
    
    // New state variables for pagination and bulk operations
    let currentPage = 1;
    let itemsPerPage = 10;
    let bulkModeActive = false;
    let selectedItems = [];
    
    // Initialize the application
    init();

    // Function to create advanced features UI
    function createAdvancedFeatureUI() {
        // 1. Add Advanced Tag Filter button to the Tag Filter section
        const tagFilterSection = document.querySelector('.sidebar-section:nth-child(2)');
        const advTagFilterBtn = document.createElement('button');
        advTagFilterBtn.id = 'adv-tag-filter-btn';
        advTagFilterBtn.className = 'adv-feature-btn';
        advTagFilterBtn.textContent = 'Advanced Tag Filtering';
        advTagFilterBtn.addEventListener('click', showAdvancedTagFilterDialog);
        
        // Insert after clear filters button
        tagFilterSection.appendChild(advTagFilterBtn);
        
        // 2. Add Advanced Search button to the Search section
        const searchSection = document.querySelector('.sidebar-section:nth-child(3)');
        const advSearchBtn = document.createElement('button');
        advSearchBtn.id = 'adv-search-btn';
        advSearchBtn.className = 'adv-feature-btn';
        advSearchBtn.textContent = 'Advanced Search';
        advSearchBtn.addEventListener('click', showAdvancedSearchDialog);
        
        // Insert after search input
        searchSection.appendChild(advSearchBtn);
        
        // 3. Add Sort Controls to the interface
        const sortingControls = document.createElement('div');
        sortingControls.className = 'sorting-controls';
        sortingControls.innerHTML = `
            <h3>Sort Items</h3>
            <div class="sort-options">
                <select id="sort-field" class="sort-select">
                    <option value="created_at">Creation Date</option>
                    <option value="updated_at">Update Date</option>
                </select>
                <select id="sort-order" class="sort-select">
                    <option value="desc">Newest First</option>
                    <option value="asc">Oldest First</option>
                </select>
                <button id="apply-sort-btn" class="sort-btn">Apply Sort</button>
            </div>
        `;
        
        // Insert after search input and advanced search button
        searchSection.appendChild(sortingControls);
        
        // 3. Add Import button to the Actions section
        const actionsSection = document.querySelector('.sidebar-section:nth-child(1)');
        const importBtn = document.createElement('div');
        importBtn.className = 'export-section';
        importBtn.innerHTML = `
            <h3>Import</h3>
            <button id="import-btn">Import Knowledge</button>
        `;
        
        // Insert after export section
        actionsSection.appendChild(importBtn);
        
        // 4. Create Advanced Tag Filter Dialog
        const advTagFilterDialog = document.createElement('div');
        advTagFilterDialog.className = 'adv-tag-filter-dialog advanced-dialog hidden';
        advTagFilterDialog.innerHTML = `
            <div class="dialog-content">
                <h3>Advanced Tag Filtering</h3>
                <div class="adv-filter-section">
                    <h4>Items must have ALL these tags (AND)</h4>
                    <div class="tag-input-container">
                        <input type="text" id="include-all-tags" placeholder="Tags (comma separated)">
                        <div id="include-all-suggestions" class="tags-suggestions"></div>
                        <div id="include-all-selected" class="selected-tags"></div>
                    </div>
                </div>
                <div class="adv-filter-section">
                    <h4>Items must have ANY of these tags (OR)</h4>
                    <div class="tag-input-container">
                        <input type="text" id="include-any-tags" placeholder="Tags (comma separated)">
                        <div id="include-any-suggestions" class="tags-suggestions"></div>
                        <div id="include-any-selected" class="selected-tags"></div>
                    </div>
                </div>
                <div class="adv-filter-section">
                    <h4>Items must NOT have these tags (WITHOUT)</h4>
                    <div class="tag-input-container">
                        <input type="text" id="exclude-tags" placeholder="Tags (comma separated)">
                        <div id="exclude-suggestions" class="tags-suggestions"></div>
                        <div id="exclude-selected" class="selected-tags"></div>
                    </div>
                </div>
                <div class="dialog-buttons">
                    <button id="apply-adv-tag-filter" class="bulk-btn">Apply Filter</button>
                    <button id="clear-adv-tag-filter" class="bulk-btn">Clear</button>
                    <button id="cancel-adv-tag-filter" class="bulk-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(advTagFilterDialog);
        
        // 5. Create Advanced Search Dialog
        const advSearchDialog = document.createElement('div');
        advSearchDialog.className = 'adv-search-dialog advanced-dialog hidden';
        advSearchDialog.innerHTML = `
            <div class="dialog-content">
                <h3>Advanced Search</h3>
                <div class="adv-search-section">
                    <h4>Keywords</h4>
                    <input type="text" id="adv-search-keywords" placeholder="Enter keywords">
                    <p class="search-tip">Tip: Use quotation marks for exact phrase matches. Example: "matrix theory" algebra</p>
                    <div class="checkbox-option">
                        <input type="checkbox" id="exact-match">
                        <label for="exact-match">Exact match for all keywords</label>
                    </div>
                </div>
                <div class="adv-search-section">
                    <h4>Time Period</h4>
                    <div class="date-range">
                        <div class="date-input">
                            <label for="start-date">From:</label>
                            <input type="date" id="start-date">
                        </div>
                        <div class="date-input">
                            <label for="end-date">To:</label>
                            <input type="date" id="end-date">
                        </div>
                    </div>
                </div>
                <div class="adv-search-section">
                    <h4>Sorting</h4>
                    <div class="sort-options">
                        <div class="sort-option">
                            <label for="sort-field">Sort by:</label>
                            <select id="sort-field">
                                <option value="created_at">Creation Date</option>
                                <option value="updated_at">Update Date</option>
                            </select>
                        </div>
                        <div class="sort-option">
                            <label for="sort-order">Order:</label>
                            <select id="sort-order">
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="dialog-buttons">
                    <button id="apply-adv-search" class="bulk-btn">Search</button>
                    <button id="clear-adv-search" class="bulk-btn">Clear</button>
                    <button id="cancel-adv-search" class="bulk-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(advSearchDialog);
        
        // 6. Create Import Dialog
        const importDialog = document.createElement('div');
        importDialog.className = 'import-dialog advanced-dialog hidden';
        importDialog.innerHTML = `
            <div class="dialog-content">
                <h3>Import Knowledge</h3>
                <div class="import-upload-section">
                    <div class="file-upload">
                        <input type="file" id="import-file" accept=".json,.txt,.csv">
                        <div class="upload-instructions">
                            <p>Select a JSON, TXT, or CSV file to import.</p>
                            <p>Download templates:</p>
                            <div class="template-buttons">
                                <button id="json-template" class="bulk-btn">JSON Template</button>
                                <button id="txt-template" class="bulk-btn">TXT Template</button>
                                <button id="csv-template" class="bulk-btn">CSV Template</button>
                            </div>
                        </div>
                    </div>
                    <button id="upload-import-file" class="bulk-btn">Upload</button>
                </div>
                <div class="import-preview-section hidden">
                    <h4>Preview Import Data</h4>
                    <div class="import-preview-container">
                        <div id="import-preview-list"></div>
                    </div>
                    <div class="import-stats">
                        <span id="import-item-count">0 items to import</span>
                    </div>
                    <div class="dialog-buttons">
                        <button id="confirm-import" class="bulk-btn">Import</button>
                        <button id="cancel-import" class="bulk-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(importDialog);
        
        // Set up event listeners for advanced features
        setupAdvancedFeatureListeners();
    }

    // Function to set up event listeners for advanced features
    function setupAdvancedFeatureListeners() {
        // Import feature listeners
        document.getElementById('import-btn').addEventListener('click', showImportDialog);
        document.getElementById('upload-import-file').addEventListener('click', uploadImportFile);
        document.getElementById('confirm-import').addEventListener('click', confirmImport);
        document.getElementById('cancel-import').addEventListener('click', hideImportDialog);
        document.getElementById('json-template').addEventListener('click', () => downloadTemplate('json'));
        document.getElementById('txt-template').addEventListener('click', () => downloadTemplate('txt'));
        document.getElementById('csv-template').addEventListener('click', () => downloadTemplate('csv'));
        
        // Advanced tag filter listeners
        document.getElementById('apply-adv-tag-filter').addEventListener('click', applyAdvancedTagFilter);
        document.getElementById('clear-adv-tag-filter').addEventListener('click', clearAdvancedTagFilter);
        document.getElementById('cancel-adv-tag-filter').addEventListener('click', hideAdvancedTagFilterDialog);
        
        // Advanced tag filter input suggestions
        document.getElementById('include-all-tags').addEventListener('input', function() {
            showAdvTagSuggestions(this, 'include-all-suggestions', 'include_all');
        });
        document.getElementById('include-any-tags').addEventListener('input', function() {
            showAdvTagSuggestions(this, 'include-any-suggestions', 'include_any');
        });
        document.getElementById('exclude-tags').addEventListener('input', function() {
            showAdvTagSuggestions(this, 'exclude-suggestions', 'exclude');
        });
        
        // Advanced search listeners
        document.getElementById('apply-adv-search').addEventListener('click', applyAdvancedSearch);
        document.getElementById('clear-adv-search').addEventListener('click', clearAdvancedSearch);
        document.getElementById('cancel-adv-search').addEventListener('click', hideAdvancedSearchDialog);
        
        // Close dialogs when clicking outside
        document.querySelector('.adv-tag-filter-dialog').addEventListener('click', function(event) {
            if (event.target === this) {
                hideAdvancedTagFilterDialog();
            }
        });
        
        document.querySelector('.adv-search-dialog').addEventListener('click', function(event) {
            if (event.target === this) {
                hideAdvancedSearchDialog();
            }
        });
        
        document.querySelector('.import-dialog').addEventListener('click', function(event) {
            if (event.target === this) {
                hideImportDialog();
            }
        });
    }

    // Function to create bulk operations UI elements
    function createBulkOperationsUI() {
        // Create bulk operations container
        const bulkOperationsContainer = document.createElement('div');
        bulkOperationsContainer.className = 'bulk-operations';
        bulkOperationsContainer.innerHTML = `
            <div class="bulk-options hidden">
                <button id="bulk-select-all" class="bulk-btn">Select All</button>
                <button id="bulk-deselect-all" class="bulk-btn">Deselect All</button>
                <button id="bulk-delete" class="bulk-btn danger">Delete Selected</button>
                <button id="bulk-edit-tags" class="bulk-btn">Edit Tags</button>
                <button id="bulk-export" class="bulk-btn">Export Selected</button>
                <span id="bulk-count">0 items selected</span>
            </div>
            <button id="toggle-bulk-mode" class="toggle-bulk-btn">Bulk Edit</button>
        `;
        itemsList.parentNode.insertBefore(bulkOperationsContainer, itemsList);
        
        // Create bulk tag editing dialog
        const bulkTagEditDialog = document.createElement('div');
        bulkTagEditDialog.className = 'bulk-tag-dialog hidden';
        bulkTagEditDialog.innerHTML = `
            <div class="dialog-content">
                <h3>Edit Tags for Selected Items</h3>
                <div class="tag-operations">
                    <div class="tag-op">
                        <h4>Add Tags</h4>
                        <input type="text" id="bulk-add-tags" placeholder="Tags to add (comma separated)">
                        <div id="bulk-add-suggestions" class="tags-suggestions"></div>
                    </div>
                    <div class="tag-op">
                        <h4>Remove Tags</h4>
                        <input type="text" id="bulk-remove-tags" placeholder="Tags to remove (comma separated)">
                        <div id="bulk-remove-suggestions" class="tags-suggestions"></div>
                    </div>
                    <div class="tag-op">
                        <h4>Replace All Tags</h4>
                        <input type="text" id="bulk-replace-tags" placeholder="New tags (comma separated)">
                        <div id="bulk-replace-suggestions" class="tags-suggestions"></div>
                    </div>
                </div>
                <div class="dialog-buttons">
                    <button id="bulk-tags-apply" class="bulk-btn">Apply Changes</button>
                    <button id="bulk-tags-cancel" class="bulk-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(bulkTagEditDialog);
        
        // Create export dialog for bulk operations
        const bulkExportDialog = document.createElement('div');
        bulkExportDialog.className = 'bulk-export-dialog hidden';
        bulkExportDialog.innerHTML = `
            <div class="dialog-content">
                <h3>Export Selected Items</h3>
                <div class="export-options">
                    <button id="bulk-export-json" class="bulk-btn">JSON</button>
                    <button id="bulk-export-txt" class="bulk-btn">TXT</button>
                    <button id="bulk-export-csv" class="bulk-btn">CSV</button>
                </div>
                <div class="dialog-buttons">
                    <button id="bulk-export-cancel" class="bulk-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(bulkExportDialog);
    }

    // Application initialization
    function init() {
        // Hide dialogs first to ensure they don't show up on page load
        hideBulkTagEditDialog();
        hideBulkExportDialog();
        hideAdvancedTagFilterDialog();
        hideAdvancedSearchDialog();
        hideImportDialog();
        
        fetchAllTags();
        fetchTagCounts(); // New: fetch tag counts
        fetchAllItems();
        setupEventListeners();
    }

    // Set up event listeners
    function setupEventListeners() {
        // New item button
        newItemBtn.addEventListener('click', () => showItemForm());
        
        // Cancel button
        cancelItemBtn.addEventListener('click', () => {
            hideItemForm();
            showItemsList();
        });
        
        // Save button
        saveItemBtn.addEventListener('click', saveItem);
        
        // Content input for preview
        contentInput.addEventListener('input', updatePreview);
        
        // Tags input for suggestions
        tagsInput.addEventListener('input', showTagSuggestions);
        
        // Tag search
        tagSearch.addEventListener('input', filterTagList);
        
        // Clear filters
        clearFiltersBtn.addEventListener('click', clearFilters);
        
        // Content search
        contentSearch.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            currentPage = 1; // Reset to first page on search
            renderItems();
        });
        
        // Sorting controls
        document.getElementById('apply-sort-btn').addEventListener('click', applySorting);
        
        // Export buttons
        exportJsonBtn.addEventListener('click', () => exportItems('json'));
        exportTxtBtn.addEventListener('click', () => exportItems('txt'));
        exportCsvBtn.addEventListener('click', () => exportItems('csv'));
        
        // Bulk operation buttons
        document.getElementById('toggle-bulk-mode').addEventListener('click', toggleBulkMode);
        document.getElementById('bulk-select-all').addEventListener('click', selectAllItems);
        document.getElementById('bulk-deselect-all').addEventListener('click', deselectAllItems);
        document.getElementById('bulk-delete').addEventListener('click', bulkDeleteItems);
        document.getElementById('bulk-edit-tags').addEventListener('click', showBulkTagEditDialog);
        document.getElementById('bulk-export').addEventListener('click', showBulkExportDialog);
        
        // Bulk tag edit dialog buttons
        document.getElementById('bulk-tags-apply').addEventListener('click', applyBulkTagChanges);
        document.getElementById('bulk-tags-cancel').addEventListener('click', hideBulkTagEditDialog);
        
        // Bulk export dialog buttons
        document.getElementById('bulk-export-json').addEventListener('click', () => bulkExportItems('json'));
        document.getElementById('bulk-export-txt').addEventListener('click', () => bulkExportItems('txt'));
        document.getElementById('bulk-export-csv').addEventListener('click', () => bulkExportItems('csv'));
        document.getElementById('bulk-export-cancel').addEventListener('click', hideBulkExportDialog);
        
        // Close dialogs when clicking outside the dialog content
        document.querySelector('.bulk-tag-dialog').addEventListener('click', function(event) {
            if (event.target === this) {
                hideBulkTagEditDialog();
            }
        });
        
        document.querySelector('.bulk-export-dialog').addEventListener('click', function(event) {
            if (event.target === this) {
                hideBulkExportDialog();
            }
        });
        
        // Bulk tag input suggestions
        document.getElementById('bulk-add-tags').addEventListener('input', function() {
            showBulkTagSuggestions(this, 'bulk-add-suggestions');
        });
        document.getElementById('bulk-remove-tags').addEventListener('input', function() {
            showBulkTagSuggestions(this, 'bulk-remove-suggestions');
        });
        document.getElementById('bulk-replace-tags').addEventListener('input', function() {
            showBulkTagSuggestions(this, 'bulk-replace-suggestions');
        });
        
        // Show tag management dialog
        document.getElementById('show-manage-tags-btn').addEventListener('click', showTagManagementDialog);

        // Close tag management dialog
        document.getElementById('close-tag-management-btn').addEventListener('click', hideTagManagementDialog);

        // Add new tag
        document.getElementById('add-tag-btn').addEventListener('click', addNewTag);

        // Click outside to close tag management dialog
        tagManagementDialog.addEventListener('click', function(event) {
            if (event.target === this) {
                hideTagManagementDialog();
            }
        });
    }

    // Fetch all knowledge items
    function fetchAllItems(sortParams = null) {
        let url = '/api/knowledge';
        
        // Add sort parameters if provided
        if (sortParams) {
            url += `?sort_by=${sortParams.sort_by}&sort_order=${sortParams.sort_order}`;
        }
        
        fetch(url)
            .then(response => response.json())
            .then(data => {
                allItems = data;
                currentPage = 1; // Reset to first page when loading items
                renderItems();
            })
            .catch(error => console.error('Error fetching items:', error));
    }

    // Fetch all tags
    function fetchAllTags() {
        fetch('/api/tags')
            .then(response => response.json())
            .then(data => {
                allTags = data;
                renderTagList();
            })
            .catch(error => console.error('Error fetching tags:', error));
    }

    // Fetch tag counts
    function fetchTagCounts() {
        fetch('/api/tags/counts')
            .then(response => response.json())
            .then(data => {
                tagCounts = data;
                renderTagList(); // Re-render the tag list with counts
            })
            .catch(error => console.error('Error fetching tag counts:', error));
    }

    // Render knowledge items with pagination
    function renderItems() {
        // If we have filters or search, get filtered items
        let filteredItems = allItems;
        
        // Apply tag filters
        if (selectedTags.length > 0) {
            filteredItems = filteredItems.filter(item => {
                return selectedTags.every(tag => item.tags.includes(tag));
            });
        }
        
        // Apply content search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filteredItems = filteredItems.filter(item => {
                return item.content.toLowerCase().includes(query);
            });
        }
        
        // Clear items list
        itemsList.innerHTML = '';
        
        // Handle pagination
        const totalItems = filteredItems.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        
        // Make sure current page is valid
        if (currentPage > totalPages && totalPages > 0) {
            currentPage = totalPages;
        }
        
        // Get items for current page
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageItems = filteredItems.slice(startIndex, endIndex);
        
        // Add filtered items for current page
        if (pageItems.length === 0) {
            itemsList.innerHTML = '<div class="no-items">No items found</div>';
        } else {
            pageItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'knowledge-item';
                if (bulkModeActive) {
                    itemElement.classList.add('bulk-mode');
                    const isSelected = selectedItems.includes(item.id);
                    if (isSelected) {
                        itemElement.classList.add('selected');
                    }
                }
                itemElement.dataset.id = item.id;
                
                const contentSnippet = item.content.length > 150 ? 
                    item.content.substring(0, 150) + '...' : item.content;
                
                let itemHTML = '';
                
                // Add checkbox for bulk mode
                if (bulkModeActive) {
                    const checkedAttr = selectedItems.includes(item.id) ? 'checked' : '';
                    itemHTML += `<div class="item-checkbox"><input type="checkbox" ${checkedAttr}></div>`;
                }
                
                itemHTML += `
                    <div class="item-content">${contentSnippet}</div>
                    <div class="item-tags">
                        ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                    </div>
                `;
                
                itemElement.innerHTML = itemHTML;
                
                if (bulkModeActive) {
                    // In bulk mode, clicking the div toggles selection
                    itemElement.addEventListener('click', (e) => {
                        if (e.target.type === 'checkbox') {
                            // Checkbox was directly clicked, let the handler below handle it
                            return;
                        }
                        // Otherwise, toggle the checkbox
                        const checkbox = itemElement.querySelector('input[type="checkbox"]');
                        checkbox.checked = !checkbox.checked;
                        toggleItemSelection(item.id);
                    });
                    
                    // Add event listener for checkbox specifically
                    const checkbox = itemElement.querySelector('input[type="checkbox"]');
                    checkbox.addEventListener('change', () => {
                        toggleItemSelection(item.id);
                    });
                } else {
                    // In normal mode, clicking views the item
                    itemElement.addEventListener('click', () => viewItem(item.id));
                }
                
                itemsList.appendChild(itemElement);
            });
        }
        
        // Render pagination controls
        renderPaginationControls(totalItems, totalPages);
        
        // Update bulk selection counter
        updateBulkCount();
    }
    
    // Render pagination controls
    function renderPaginationControls(totalItems, totalPages) {
        paginationContainer.innerHTML = '';
        
        if (totalPages <= 1) {
            return;
        }
        
        // Items per page selector
        const pageSizeSelector = document.createElement('div');
        pageSizeSelector.className = 'page-size-selector';
        pageSizeSelector.innerHTML = `
            <label>Items per page: 
                <select id="items-per-page">
                    <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                    <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="15" ${itemsPerPage === 15 ? 'selected' : ''}>15</option>
                </select>
            </label>
        `;
        
        // Page navigation
        const pageNavigation = document.createElement('div');
        pageNavigation.className = 'page-navigation';
        
        // Previous button
        const prevButton = document.createElement('button');
        prevButton.className = 'page-btn';
        prevButton.textContent = '← Previous';
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderItems();
            }
        });
        
        // Page info
        const pageInfo = document.createElement('span');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${totalItems} items)`;
        
        // Next button
        const nextButton = document.createElement('button');
        nextButton.className = 'page-btn';
        nextButton.textContent = 'Next →';
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderItems();
            }
        });
        
        // Add page number buttons
        const pageNumbers = document.createElement('div');
        pageNumbers.className = 'page-numbers';
        
        // Determine range of page numbers to display
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        // Ensure we always display 5 pages if possible
        if (endPage - startPage < 4 && totalPages > 4) {
            if (currentPage < totalPages / 2) {
                endPage = Math.min(startPage + 4, totalPages);
            } else {
                startPage = Math.max(endPage - 4, 1);
            }
        }
        
        // First page
        if (startPage > 1) {
            const firstPage = document.createElement('button');
            firstPage.className = 'page-num-btn';
            firstPage.textContent = '1';
            firstPage.addEventListener('click', () => {
                currentPage = 1;
                renderItems();
            });
            pageNumbers.appendChild(firstPage);
            
            if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            }
        }
        
        // Page numbers
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = 'page-num-btn';
            if (i === currentPage) {
                pageButton.classList.add('active');
            }
            pageButton.textContent = i;
            pageButton.addEventListener('click', () => {
                currentPage = i;
                renderItems();
            });
            pageNumbers.appendChild(pageButton);
        }
        
        // Last page
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pageNumbers.appendChild(ellipsis);
            }
            
            const lastPage = document.createElement('button');
            lastPage.className = 'page-num-btn';
            lastPage.textContent = totalPages;
            lastPage.addEventListener('click', () => {
                currentPage = totalPages;
                renderItems();
            });
            pageNumbers.appendChild(lastPage);
        }
        
        // Assemble all pagination components
        pageNavigation.appendChild(prevButton);
        pageNavigation.appendChild(pageNumbers);
        pageNavigation.appendChild(nextButton);
        
        paginationContainer.appendChild(pageSizeSelector);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(pageNavigation);
        
        // Add event listener for items per page selector
        document.getElementById('items-per-page').addEventListener('change', function() {
            itemsPerPage = parseInt(this.value);
            currentPage = 1; // Reset to first page when changing items per page
            renderItems();
        });
    }
    
    // Toggle bulk edit mode
    function toggleBulkMode() {
        bulkModeActive = !bulkModeActive;
        
        const bulkOptions = document.querySelector('.bulk-options');
        const toggleButton = document.getElementById('toggle-bulk-mode');
        
        if (bulkModeActive) {
            bulkOptions.classList.remove('hidden');
            toggleButton.textContent = 'Exit Bulk Edit';
            toggleButton.classList.add('active');
        } else {
            bulkOptions.classList.add('hidden');
            toggleButton.textContent = 'Bulk Edit';
            toggleButton.classList.remove('active');
            selectedItems = []; // Clear selections when exiting bulk mode
        }
        
        renderItems();
    }
    
    // Toggle selection of an item in bulk mode
    function toggleItemSelection(itemId) {
        const index = selectedItems.indexOf(itemId);
        if (index === -1) {
            selectedItems.push(itemId);
        } else {
            selectedItems.splice(index, 1);
        }
        
        // Update visual selection
        const itemElement = document.querySelector(`.knowledge-item[data-id="${itemId}"]`);
        if (itemElement) {
            itemElement.classList.toggle('selected', selectedItems.includes(itemId));
        }
        
        updateBulkCount();
    }
    
    // Select all visible items
    function selectAllItems() {
        // Get all visible items on the current page
        const itemElements = document.querySelectorAll('.knowledge-item');
        itemElements.forEach(item => {
            const itemId = parseInt(item.dataset.id);
            if (!selectedItems.includes(itemId)) {
                selectedItems.push(itemId);
            }
            item.classList.add('selected');
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = true;
            }
        });
        
        updateBulkCount();
    }
    
    // Deselect all items
    function deselectAllItems() {
        selectedItems = [];
        
        // Update UI for visible items
        const itemElements = document.querySelectorAll('.knowledge-item');
        itemElements.forEach(item => {
            item.classList.remove('selected');
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox) {
                checkbox.checked = false;
            }
        });
        
        updateBulkCount();
    }
    
    // Update the count of selected items
    function updateBulkCount() {
        const countElement = document.getElementById('bulk-count');
        countElement.textContent = `${selectedItems.length} items selected`;
    }
    
    // Bulk delete selected items
    function bulkDeleteItems() {
        if (selectedItems.length === 0) {
            alert('No items selected');
            return;
        }
        
        if (confirm(`Are you sure you want to delete ${selectedItems.length} selected items?`)) {
            // Create a promise for each delete operation
            const deletePromises = selectedItems.map(itemId => {
                return fetch(`/api/knowledge/${itemId}`, {
                    method: 'DELETE'
                });
            });
            
            // When all deletes are done, refresh the data
            Promise.all(deletePromises)
                .then(() => {
                    selectedItems = [];
                    fetchAllItems();
                    fetchAllTags();
                    fetchTagCounts();
                })
                .catch(error => console.error('Error deleting items:', error));
        }
    }
    
    // Show the bulk tag edit dialog
    function showBulkTagEditDialog() {
        if (selectedItems.length === 0) {
            alert('No items selected');
            return;
        }
        
        // Clear the inputs
        document.getElementById('bulk-add-tags').value = '';
        document.getElementById('bulk-remove-tags').value = '';
        document.getElementById('bulk-replace-tags').value = '';
        
        // Clear suggestions
        document.getElementById('bulk-add-suggestions').innerHTML = '';
        document.getElementById('bulk-remove-suggestions').innerHTML = '';
        document.getElementById('bulk-replace-suggestions').innerHTML = '';
        
        // Show the dialog
        document.querySelector('.bulk-tag-dialog').classList.remove('hidden');
    }
    
    // Hide the bulk tag edit dialog
    function hideBulkTagEditDialog() {
        document.querySelector('.bulk-tag-dialog').classList.add('hidden');
    }
    
    // Show bulk export dialog
    function showBulkExportDialog() {
        if (selectedItems.length === 0) {
            alert('No items selected');
            return;
        }
        
        document.querySelector('.bulk-export-dialog').classList.remove('hidden');
    }
    
    // Hide bulk export dialog
    function hideBulkExportDialog() {
        document.querySelector('.bulk-export-dialog').classList.add('hidden');
    }
    
    // Show tag suggestions for bulk operations
    function showBulkTagSuggestions(inputElement, suggestionContainerId) {
        const input = inputElement.value;
        const lastTag = input.split(',').pop().trim();
        const suggestionsContainer = document.getElementById(suggestionContainerId);
        
        if (lastTag.length > 0) {
            const suggestions = allTags.filter(tag => 
                tag.toLowerCase().startsWith(lastTag.toLowerCase()) && 
                !input.toLowerCase().includes(tag.toLowerCase() + ',')
            );
            
            suggestionsContainer.innerHTML = '';
            
            suggestions.forEach(tag => {
                const suggestion = document.createElement('div');
                suggestion.className = 'tag-suggestion';
                suggestion.textContent = tag;
                suggestion.addEventListener('click', () => {
                    const tags = inputElement.value.split(',');
                    tags.pop();
                    tags.push(tag);
                    inputElement.value = tags.join(', ') + (tags.length > 0 ? ', ' : '');
                    suggestionsContainer.innerHTML = '';
                    inputElement.focus();
                });
                suggestionsContainer.appendChild(suggestion);
            });
        } else {
            suggestionsContainer.innerHTML = '';
        }
    }
    
    // Apply bulk tag changes
    function applyBulkTagChanges() {
        if (selectedItems.length === 0) {
            alert('No items selected');
            return;
        }
        
        // Get tag operations
        const tagsToAdd = document.getElementById('bulk-add-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
            
        const tagsToRemove = document.getElementById('bulk-remove-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
            
        const tagsToReplace = document.getElementById('bulk-replace-tags').value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
        
        // Check if any operation was specified
        if (tagsToAdd.length === 0 && tagsToRemove.length === 0 && tagsToReplace.length === 0) {
            alert('No tag operations specified');
            return;
        }
        
        // Create a promise for each update operation
        const updatePromises = selectedItems.map(itemId => {
            // First, fetch the current item
            return fetch(`/api/knowledge/${itemId}`)
                .then(response => response.json())
                .then(item => {
                    let updatedTags;
                    
                    if (tagsToReplace.length > 0) {
                        // Replace all tags
                        updatedTags = [...tagsToReplace];
                    } else {
                        // Start with current tags
                        updatedTags = [...item.tags];
                        
                        // Add new tags
                        tagsToAdd.forEach(tag => {
                            if (!updatedTags.includes(tag)) {
                                updatedTags.push(tag);
                            }
                        });
                        
                        // Remove specified tags
                        updatedTags = updatedTags.filter(tag => !tagsToRemove.includes(tag));
                    }
                    
                    // Update the item
                    return fetch(`/api/knowledge/${itemId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            tags: updatedTags
                        })
                    });
                });
        });
        
        // When all updates are done, refresh the data
        Promise.all(updatePromises)
            .then(() => {
                hideBulkTagEditDialog();
                fetchAllItems();
                fetchAllTags();
                fetchTagCounts();
            })
            .catch(error => console.error('Error updating items:', error));
    }
    
    // Export selected items
    function bulkExportItems(format) {
        if (selectedItems.length === 0) {
            alert('No items selected');
            return;
        }
        
        // For JSON and CSV, we'll pass the selected IDs to the server
        // For TXT, we'll handle the formatting directly in the client for the new format
        if (format === 'txt') {
            // Get the selected items' content
            const selectedItemsData = allItems.filter(item => selectedItems.includes(item.id));
            
            // Format as {content1};{content2} without tags
            const formattedContent = selectedItemsData.map(item => `{${item.content}}`).join(';');
            
            // Create and trigger download
            const blob = new Blob([formattedContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'mathkb_selected_export.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } else {
            // For JSON and CSV, fetch from the server with the selected IDs
            // Since the server API doesn't directly support selection by IDs,
            // we'll create a temporary endpoint on the client side
            
            // First get the complete data of selected items
            const selectedItemsData = allItems.filter(item => selectedItems.includes(item.id));
            
            // Then trigger the appropriate export based on format
            if (format === 'json') {
                const blob = new Blob([JSON.stringify(selectedItemsData)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mathkb_selected_export.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            } else if (format === 'csv') {
                let csvContent = 'Content,Tags,Created,Updated\n';
                
                selectedItemsData.forEach(item => {
                    const tagsStr = item.tags.join(',');
                    // Escape quotes and commas in content
                    const escapedContent = item.content.replace(/"/g, '""');
                    csvContent += `"${escapedContent}","${tagsStr}","${item.created_at}","${item.updated_at}"\n`;
                });
                
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'mathkb_selected_export.csv';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        }
        
        hideBulkExportDialog();
    }

    // Function to show tag management dialog
    function showTagManagementDialog() {
        renderTagManagementList();
        tagManagementDialog.classList.remove('hidden');
    }

    // Function to hide tag management dialog
    function hideTagManagementDialog() {
        tagManagementDialog.classList.add('hidden');
    }

    // Function to render the tag management list
    function renderTagManagementList() {
        const tagList = document.querySelector('.tag-management-list');
        tagList.innerHTML = '';
        
        if (allTags.length === 0) {
            tagList.innerHTML = '<p>No tags available</p>';
            return;
        }
        
        // Sort tags alphabetically
        const sortedTags = [...allTags].sort((a, b) => a.localeCompare(b));
        
        sortedTags.forEach(tag => {
            const tagItem = document.createElement('div');
            tagItem.className = 'tag-management-item';
            
            const count = tagCounts[tag] || 0;
            tagItem.innerHTML = `
                <span class="tag-name">${tag} <span class="tag-count">(x${count})</span></span>
                <div class="tag-actions">
                    <button class="tag-edit-btn">Edit</button>
                    <button class="tag-delete-btn">Delete</button>
                </div>
                <div class="tag-edit-form hidden">
                    <input type="text" class="tag-edit-input" value="${tag}">
                    <button class="tag-save-btn">Save</button>
                    <button class="tag-cancel-btn">Cancel</button>
                </div>
            `;
            
            // Edit button
            tagItem.querySelector('.tag-edit-btn').addEventListener('click', function() {
                tagItem.querySelector('.tag-name').classList.add('hidden');
                tagItem.querySelector('.tag-actions').classList.add('hidden');
                tagItem.querySelector('.tag-edit-form').classList.remove('hidden');
            });
            
            // Cancel edit
            tagItem.querySelector('.tag-cancel-btn').addEventListener('click', function() {
                tagItem.querySelector('.tag-name').classList.remove('hidden');
                tagItem.querySelector('.tag-actions').classList.remove('hidden');
                tagItem.querySelector('.tag-edit-form').classList.add('hidden');
                tagItem.querySelector('.tag-edit-input').value = tag;
            });
            
            // Save tag
            tagItem.querySelector('.tag-save-btn').addEventListener('click', function() {
                const newName = tagItem.querySelector('.tag-edit-input').value.trim();
                if (newName && newName !== tag) {
                    updateTag(tag, newName);
                } else {
                    tagItem.querySelector('.tag-cancel-btn').click();
                }
            });
            
            // Delete tag
            tagItem.querySelector('.tag-delete-btn').addEventListener('click', function() {
                if (confirm(`Are you sure you want to delete the tag "${tag}"? It will be removed from all items.`)) {
                    deleteTag(tag);
                }
            });
            
            tagList.appendChild(tagItem);
        });
    }

    // Function to update a tag
    function updateTag(oldName, newName) {
        fetch(`/api/tags/${oldName}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ new_name: newName })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to update tag');
                });
            }
            return response.json();
        })
        .then(() => {
            fetchAllTags();
            fetchAllItems();
            fetchTagCounts();
            setTimeout(renderTagManagementList, 300); // Re-render after data is fetched
        })
        .catch(error => {
            alert(error.message);
            console.error('Error updating tag:', error);
        });
    }

    // Function to delete a tag
    function deleteTag(tagName) {
        fetch(`/api/tags/${tagName}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Failed to delete tag');
                });
            }
            fetchAllTags();
            fetchAllItems();
            fetchTagCounts();
            setTimeout(renderTagManagementList, 300); // Re-render after data is fetched
        })
        .catch(error => {
            alert(error.message);
            console.error('Error deleting tag:', error);
        });
    }

    // Function to add a new tag
    function addNewTag() {
        const tagInput = document.getElementById('new-tag-input');
        const newTag = tagInput.value.trim();
        
        if (!newTag) {
            alert('Tag name cannot be empty');
            return;
        }
        
        if (allTags.includes(newTag)) {
            alert('Tag already exists');
            return;
        }
        
        // Since there's no direct API to add a tag without an item,
        // we'll create a temporary item with the tag and then delete it
        fetch('/api/knowledge', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                content: '___TEMP_TAG_CREATOR___',
                tags: [newTag]
            })
        })
        .then(response => response.json())
        .then(item => {
            // Delete the temporary item
            return fetch(`/api/knowledge/${item.id}`, {
                method: 'DELETE'
            });
        })
        .then(() => {
            tagInput.value = '';
            fetchAllTags();
            fetchTagCounts();
            setTimeout(renderTagManagementList, 300); // Re-render after data is fetched
        })
        .catch(error => {
            console.error('Error adding new tag:', error);
            alert('Failed to add new tag');
        });
    }
    
    // Function to apply sorting
    function applySorting() {
        const sortField = document.getElementById('sort-field').value;
        const sortOrder = document.getElementById('sort-order').value;
        
        // Fetch items with sorting parameters
        fetchAllItems({
            sort_by: sortField,
            sort_order: sortOrder
        });
        
        // Update UI to show sorting is active
        const sortBtn = document.getElementById('apply-sort-btn');
        sortBtn.textContent = 'Sorting Applied';
        setTimeout(() => {
            sortBtn.textContent = 'Apply Sort';
        }, 2000);
    }

    // Render tag list for filtering
    function renderTagList() {
        tagList.innerHTML = '';
        
        // Filter tags based on search
        const filteredTags = tagSearch.value ? 
            allTags.filter(tag => tag.toLowerCase().includes(tagSearch.value.toLowerCase())) : 
            allTags;
        
        // Sort tags alphabetically
        const sortedTags = [...filteredTags].sort((a, b) => a.localeCompare(b));
        
        sortedTags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.className = 'tag-item';
            if (selectedTags.includes(tag)) {
                tagElement.classList.add('selected');
            }
            
            // Get count for this tag
            const count = tagCounts[tag] || 0;
            tagElement.innerHTML = `${tag} <span class="tag-count">(x${count})</span>`;
            
            tagElement.addEventListener('click', () => toggleTagFilter(tag));
            tagList.appendChild(tagElement);
        });
    }

    // Render active filters
    function renderActiveFilters() {
        activeFilters.innerHTML = '';
        
        selectedTags.forEach(tag => {
            const filterTag = document.createElement('div');
            filterTag.className = 'filter-tag';
            filterTag.innerHTML = `${tag} <span class="remove">×</span>`;
            filterTag.querySelector('.remove').addEventListener('click', () => {
                removeTagFilter(tag);
            });
            activeFilters.appendChild(filterTag);
        });
    }

    // Toggle tag filter
    function toggleTagFilter(tag) {
        const index = selectedTags.indexOf(tag);
        if (index === -1) {
            selectedTags.push(tag);
        } else {
            selectedTags.splice(index, 1);
        }
        currentPage = 1; // Reset to first page when filtering
        renderTagList();
        renderActiveFilters();
        renderItems();
    }

    // Remove tag filter
    function removeTagFilter(tag) {
        const index = selectedTags.indexOf(tag);
        if (index !== -1) {
            selectedTags.splice(index, 1);
            currentPage = 1; // Reset to first page when filtering
            renderTagList();
            renderActiveFilters();
            renderItems();
        }
    }

    // Clear all filters
    function clearFilters() {
        selectedTags = [];
        tagSearch.value = '';
        contentSearch.value = '';
        searchQuery = '';
        advancedTagFilter = {include_all: [], include_any: [], exclude: []};
        advancedSearchParams = {keywords: '', exact_match: false, start_date: '', end_date: ''};
        currentPage = 1; // Reset to first page when clearing filters
        renderTagList();
        renderActiveFilters();
        renderItems();
    }

    // Filter tag list based on search
    function filterTagList() {
        renderTagList();
    }

    // Show item details view
    function viewItem(id) {
        fetch(`/api/knowledge/${id}`)
            .then(response => response.json())
            .then(item => {
                hideItemForm();
                hideItemsList();
                
                // Clear the view first
                itemView.innerHTML = '';
                
                // Create the tags section
                const tagsDiv = document.createElement('div');
                tagsDiv.className = 'view-tags';
                tagsDiv.innerHTML = item.tags.map(tag => `<span class="view-tag">${tag}</span>`).join('');
                itemView.appendChild(tagsDiv);
                
                // Create the metadata section
                const metaDiv = document.createElement('div');
                metaDiv.className = 'view-meta';
                metaDiv.innerHTML = `
                    Created: ${new Date(item.created_at).toLocaleString()}
                    <br>
                    Updated: ${new Date(item.updated_at).toLocaleString()}
                `;
                itemView.appendChild(metaDiv);
                
                // Create the content section with proper paragraph formatting
                const contentDiv = document.createElement('div');
                contentDiv.className = 'view-content';
                contentDiv.appendChild(formatContentWithParagraphs(item.content));
                itemView.appendChild(contentDiv);
                
                // Create the actions section
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'view-actions';
                actionsDiv.innerHTML = `
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                    <button class="back-btn">Back to List</button>
                `;
                itemView.appendChild(actionsDiv);
                
                // Event listeners for view actions
                itemView.querySelector('.edit-btn').addEventListener('click', () => {
                    editItem(item);
                });
                
                itemView.querySelector('.delete-btn').addEventListener('click', () => {
                    if (confirm('Are you sure you want to delete this item?')) {
                        deleteItem(item.id);
                    }
                });
                
                itemView.querySelector('.back-btn').addEventListener('click', () => {
                    hideItemView();
                    showItemsList();
                });
                
                itemView.classList.remove('hidden');
                
                // Render LaTeX
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, itemView]);
            })
            .catch(error => console.error('Error fetching item:', error));
    }

    // Function to format content with proper paragraphs
    function formatContentWithParagraphs(content) {
        // Split the content by double newlines
        const paragraphs = content.split(/\n\s*\n/);
        
        // Create an HTML fragment
        const fragment = document.createDocumentFragment();
        
        // Process each paragraph
        paragraphs.forEach(paragraph => {
            if (paragraph.trim() === '') return;
            
            // Create a paragraph element
            const p = document.createElement('p');
            
            // Handle single line breaks within paragraphs
            const lines = paragraph.split(/\n/);
            for (let i = 0; i < lines.length; i++) {
                // Add the line
                p.appendChild(document.createTextNode(lines[i]));
                
                // Add a line break if it's not the last line
                if (i < lines.length - 1) {
                    p.appendChild(document.createElement('br'));
                }
            }
            
            // Add the paragraph to the fragment
            fragment.appendChild(p);
        });
        
        return fragment;
    }

    // Show form for editing an item
    function editItem(item) {
        currentItemId = item.id;
        formTitle.textContent = 'Edit Knowledge Item';
        contentInput.value = item.content;
        tagsInput.value = item.tags.join(', ');
        updatePreview();
        
        hideItemView();
        showItemForm();
    }

    // Delete an item
    function deleteItem(id) {
        fetch(`/api/knowledge/${id}`, {
            method: 'DELETE'
        })
        .then(() => {
            fetchAllItems();
            fetchAllTags();
            fetchTagCounts();
            hideItemView();
            showItemsList();
        })
        .catch(error => console.error('Error deleting item:', error));
    }

    // Show form for creating a new item
    function showItemForm() {
        if (!currentItemId) {
            formTitle.textContent = 'Add New Knowledge Item';
            contentInput.value = '';
            tagsInput.value = '';
            updatePreview();
        }
        
        hideItemsList();
        hideItemView();
        itemForm.classList.remove('hidden');
    }

    // Hide the item form
    function hideItemForm() {
        itemForm.classList.add('hidden');
        currentItemId = null;
    }

    // Show the items list
    function showItemsList() {
        itemsList.classList.remove('hidden');
    }

    // Hide the items list
    function hideItemsList() {
        itemsList.classList.add('hidden');
    }

    // Show the item view
    function showItemView() {
        itemView.classList.remove('hidden');
    }

    // Hide the item view
    function hideItemView() {
        itemView.classList.add('hidden');
    }

    // Update content preview with LaTeX rendering
    function updatePreview() {
        // First clear the preview area
        contentPreview.innerHTML = '';
        
        // Get the content
        const content = contentInput.value;
        
        // Split the content by newlines to identify paragraphs
        const paragraphs = content.split(/\n\s*\n/);
        
        // Process each paragraph
        paragraphs.forEach(paragraph => {
            if (paragraph.trim() === '') return;
            
            // Create a paragraph element
            const p = document.createElement('p');
            
            // Handle single line breaks within paragraphs
            const lines = paragraph.split(/\n/);
            for (let i = 0; i < lines.length; i++) {
                // Add the line
                p.appendChild(document.createTextNode(lines[i]));
                
                // Add a line break if it's not the last line
                if (i < lines.length - 1) {
                    p.appendChild(document.createElement('br'));
                }
            }
            
            // Add the paragraph to the preview
            contentPreview.appendChild(p);
        });
        
        // If there's no content, add a placeholder
        if (contentPreview.innerHTML === '') {
            contentPreview.innerHTML = '<p class="preview-placeholder">Preview will appear here...</p>';
        }
        
        // Render LaTeX
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, contentPreview]);
    }

    // Show tag suggestions based on input
    function showTagSuggestions() {
        const input = tagsInput.value;
        const lastTag = input.split(',').pop().trim();
        
        if (lastTag.length > 0) {
            const suggestions = allTags.filter(tag => 
                tag.toLowerCase().startsWith(lastTag.toLowerCase()) && 
                !input.toLowerCase().includes(tag.toLowerCase() + ',')
            );
            
            tagsSuggestions.innerHTML = '';
            
            suggestions.forEach(tag => {
                const suggestion = document.createElement('div');
                suggestion.className = 'tag-suggestion';
                suggestion.textContent = tag;
                suggestion.addEventListener('click', () => {
                    const tags = tagsInput.value.split(',');
                    tags.pop();
                    tags.push(tag);
                    tagsInput.value = tags.join(', ') + (tags.length > 0 ? ', ' : '');
                    tagsSuggestions.innerHTML = '';
                    tagsInput.focus();
                });
                tagsSuggestions.appendChild(suggestion);
            });
        } else {
            tagsSuggestions.innerHTML = '';
        }
    }

    // Save the current item (create or update)
    function saveItem() {
        const content = contentInput.value.trim();
        if (!content) {
            alert('Content cannot be empty');
            return;
        }
        
        const tags = tagsInput.value
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag !== '');
        
        const itemData = {
            content: content,
            tags: tags
        };
        
        if (currentItemId) {
            // Update existing item
            fetch(`/api/knowledge/${currentItemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            })
            .then(response => response.json())
            .then(() => {
                fetchAllItems();
                fetchAllTags();
                fetchTagCounts();
                hideItemForm();
                showItemsList();
            })
            .catch(error => console.error('Error updating item:', error));
        } else {
            // Create new item
            fetch('/api/knowledge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(itemData)
            })
            .then(response => response.json())
            .then(() => {
                fetchAllItems();
                fetchAllTags();
                fetchTagCounts();
                hideItemForm();
                showItemsList();
            })
            .catch(error => console.error('Error creating item:', error));
        }
    }

    // Export items based on current filters
    function exportItems(format) {
        // Construct URL with format and tag filters
        let url = `/api/export?format=${format}`;
        if (selectedTags.length > 0) {
            url += `&tags=${encodeURIComponent(selectedTags.join(','))}`;
        }
        
        // Trigger download
        window.location.href = url;
    }
    
    // ADVANCED TAG FILTERING FUNCTIONS
    
    // Show advanced tag filter dialog
    function showAdvancedTagFilterDialog() {
        // Clear inputs
        document.getElementById('include-all-tags').value = '';
        document.getElementById('include-any-tags').value = '';
        document.getElementById('exclude-tags').value = '';
        
        // Clear suggestions
        document.getElementById('include-all-suggestions').innerHTML = '';
        document.getElementById('include-any-suggestions').innerHTML = '';
        document.getElementById('exclude-suggestions').innerHTML = '';
        
        // Update selected tags display
        updateSelectedTagsDisplay('include-all-selected', advancedTagFilter.include_all);
        updateSelectedTagsDisplay('include-any-selected', advancedTagFilter.include_any);
        updateSelectedTagsDisplay('exclude-selected', advancedTagFilter.exclude);
        
        // Show dialog
        document.querySelector('.adv-tag-filter-dialog').classList.remove('hidden');
    }
    
    // Hide advanced tag filter dialog
    function hideAdvancedTagFilterDialog() {
        document.querySelector('.adv-tag-filter-dialog').classList.add('hidden');
    }
    
    // Show tag suggestions for advanced tag filter
    function showAdvTagSuggestions(inputElement, suggestionContainerId, filterType) {
        const input = inputElement.value;
        const lastTag = input.split(',').pop().trim();
        const suggestionsContainer = document.getElementById(suggestionContainerId);
        
        if (lastTag.length > 0) {
            // Don't suggest tags that are already selected
            const alreadySelected = advancedTagFilter[filterType];
            
            const suggestions = allTags.filter(tag => 
                tag.toLowerCase().startsWith(lastTag.toLowerCase()) && 
                !alreadySelected.includes(tag)
            );
            
            suggestionsContainer.innerHTML = '';
            
            suggestions.forEach(tag => {
                const suggestion = document.createElement('div');
                suggestion.className = 'tag-suggestion';
                suggestion.textContent = tag;
                suggestion.addEventListener('click', () => {
                    // Add tag to filter
                    advancedTagFilter[filterType].push(tag);
                    
                    // Clear input
                    inputElement.value = '';
                    
                    // Update display
                    updateSelectedTagsDisplay(`${filterType}-selected`, advancedTagFilter[filterType]);
                    
                    // Clear suggestions
                    suggestionsContainer.innerHTML = '';
                    
                    inputElement.focus();
                });
                suggestionsContainer.appendChild(suggestion);
            });
        } else {
            suggestionsContainer.innerHTML = '';
        }
    }
    
    // Update selected tags display
    function updateSelectedTagsDisplay(containerId, tags) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        
        tags.forEach(tag => {
            const tagElement = document.createElement('span');
            tagElement.className = 'selected-tag';
            tagElement.innerHTML = `${tag} <span class="remove">×</span>`;
            
            tagElement.querySelector('.remove').addEventListener('click', () => {
                // Determine filter type from container ID
                const filterType = containerId.split('-')[0];
                
                // Remove tag from filter
                const index = advancedTagFilter[filterType].indexOf(tag);
                if (index !== -1) {
                    advancedTagFilter[filterType].splice(index, 1);
                    
                    // Update display
                    updateSelectedTagsDisplay(containerId, advancedTagFilter[filterType]);
                }
            });
            
            container.appendChild(tagElement);
        });
    }
    
    // Apply advanced tag filter
    function applyAdvancedTagFilter() {
        // Check if any filter is set
        const hasFilters = 
            advancedTagFilter.include_all.length > 0 || 
            advancedTagFilter.include_any.length > 0 || 
            advancedTagFilter.exclude.length > 0;
        
        if (!hasFilters) {
            alert('No filter criteria specified');
            return;
        }
        
        // Send request to server
        fetch('/api/knowledge/advanced-tag-filter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(advancedTagFilter)
        })
        .then(response => response.json())
        .then(data => {
            // Update allItems with filtered results
            allItems = data;
            currentPage = 1;
            renderItems();
            
            // Hide dialog
            hideAdvancedTagFilterDialog();
            
            // Update UI to show filter is active
            const advFilterBtn = document.getElementById('adv-tag-filter-btn');
            advFilterBtn.classList.add('active');
            advFilterBtn.textContent = 'Advanced Filter Active';
        })
        .catch(error => {
            console.error('Error applying advanced tag filter:', error);
            alert('Error applying filter');
        });
    }
    
    // Clear advanced tag filter
    function clearAdvancedTagFilter() {
        advancedTagFilter = {
            include_all: [],
            include_any: [],
            exclude: []
        };
        
        // Clear selected tags display
        updateSelectedTagsDisplay('include-all-selected', []);
        updateSelectedTagsDisplay('include-any-selected', []);
        updateSelectedTagsDisplay('exclude-selected', []);
        
        // Reset button text
        const advFilterBtn = document.getElementById('adv-tag-filter-btn');
        advFilterBtn.classList.remove('active');
        advFilterBtn.textContent = 'Advanced Tag Filtering';
        
        // Reload all items
        fetchAllItems();
    }
    
    // ADVANCED SEARCH FUNCTIONS
    
    // Show advanced search dialog
    function showAdvancedSearchDialog() {
        // Set values from current search parameters
        document.getElementById('adv-search-keywords').value = advancedSearchParams.keywords;
        document.getElementById('exact-match').checked = advancedSearchParams.exact_match;
        document.getElementById('start-date').value = advancedSearchParams.start_date;
        document.getElementById('end-date').value = advancedSearchParams.end_date;
        
        // Set sort options
        if (document.getElementById('sort-field')) {
            document.getElementById('sort-field').value = advancedSearchParams.sort_by;
            document.getElementById('sort-order').value = advancedSearchParams.sort_order;
        }
        
        // Show dialog
        document.querySelector('.adv-search-dialog').classList.remove('hidden');
    }
    
    // Hide advanced search dialog
    function hideAdvancedSearchDialog() {
        document.querySelector('.adv-search-dialog').classList.add('hidden');
    }
    
    // Apply advanced search
    function applyAdvancedSearch() {
        // Get search parameters
        advancedSearchParams = {
            keywords: document.getElementById('adv-search-keywords').value.trim(),
            exact_match: document.getElementById('exact-match').checked,
            start_date: document.getElementById('start-date').value,
            end_date: document.getElementById('end-date').value,
            sort_by: document.getElementById('sort-field').value,
            sort_order: document.getElementById('sort-order').value
        };
        
        // Check if any search parameter is set
        const hasParameters = 
            advancedSearchParams.keywords !== '' || 
            advancedSearchParams.start_date !== '' || 
            advancedSearchParams.end_date !== '';
        
        if (!hasParameters) {
            alert('No search criteria specified');
            return;
        }
        
        // Send request to server
        fetch('/api/knowledge/advanced-search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(advancedSearchParams)
        })
        .then(response => response.json())
        .then(data => {
            // Update allItems with search results
            allItems = data;
            currentPage = 1;
            renderItems();
            
            // Hide dialog
            hideAdvancedSearchDialog();
            
            // Update UI to show search is active
            const advSearchBtn = document.getElementById('adv-search-btn');
            advSearchBtn.classList.add('active');
            advSearchBtn.textContent = 'Advanced Search Active';
            
            // Clear simple search
            contentSearch.value = '';
            searchQuery = '';
        })
        .catch(error => {
            console.error('Error performing advanced search:', error);
            alert('Error performing search');
        });
    }
    
    // Clear advanced search
    function clearAdvancedSearch() {
        advancedSearchParams = {
            keywords: '',
            exact_match: false,
            start_date: '',
            end_date: '',
            sort_by: 'created_at',
            sort_order: 'desc'
        };
        
        // Clear inputs
        document.getElementById('adv-search-keywords').value = '';
        document.getElementById('exact-match').checked = false;
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        
        // Reset sort fields if they exist
        if (document.getElementById('sort-field')) {
            document.getElementById('sort-field').value = 'created_at';
            document.getElementById('sort-order').value = 'desc';
        }
        
        // Reset button text
        const advSearchBtn = document.getElementById('adv-search-btn');
        advSearchBtn.classList.remove('active');
        advSearchBtn.textContent = 'Advanced Search';
        
        // Reload all items
        fetchAllItems();
    }
    
    // IMPORT FUNCTIONS
    
    // Show import dialog
    function showImportDialog() {
        // Reset file input
        document.getElementById('import-file').value = '';
        
        // Hide preview section
        document.querySelector('.import-preview-section').classList.add('hidden');
        
        // Show dialog
        document.querySelector('.import-dialog').classList.remove('hidden');
    }
    
    // Hide import dialog
    function hideImportDialog() {
        document.querySelector('.import-dialog').classList.add('hidden');
    }
    
    // Download template file
    function downloadTemplate(format) {
        window.location.href = `/api/import/templates/${format}`;
    }
    
    // Upload import file
    function uploadImportFile() {
        const fileInput = document.getElementById('import-file');
        
        if (!fileInput.files || fileInput.files.length === 0) {
            alert('Please select a file to import');
            return;
        }
        
        const file = fileInput.files[0];
        
        // Check file type
        const validTypes = ['.json', '.txt', '.csv'];
        const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        
        if (!validTypes.includes(fileExtension)) {
            alert('Please select a JSON, TXT, or CSV file');
            return;
        }
        
        // Create FormData
        const formData = new FormData();
        formData.append('file', file);
        
        // Send request to server
        fetch('/api/import/preview', {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Error previewing import');
                });
            }
            return response.json();
        })
        .then(data => {
            // Show preview
            showImportPreview(data.items);
        })
        .catch(error => {
            console.error('Error previewing import:', error);
            alert(error.message || 'Error previewing import');
        });
    }
    
    // Show import preview
    function showImportPreview(items) {
        const previewList = document.getElementById('import-preview-list');
        previewList.innerHTML = '';
        
        if (items.length === 0) {
            previewList.innerHTML = '<div class="no-items">No valid items found in file</div>';
            document.getElementById('import-item-count').textContent = '0 items to import';
            document.getElementById('confirm-import').disabled = true;
            return;
        }
        
        // Create preview items
        items.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'import-preview-item';
            
            // Create editable content
            const contentElement = document.createElement('div');
            contentElement.className = 'import-item-content';
            contentElement.innerHTML = `
                <h4>Content</h4>
                <textarea class="import-content-input" data-index="${index}">${item.content}</textarea>
            `;
            
            // Create editable tags
            const tagsElement = document.createElement('div');
            tagsElement.className = 'import-item-tags';
            tagsElement.innerHTML = `
                <h4>Tags</h4>
                <input type="text" class="import-tags-input" data-index="${index}" value="${item.tags.join(', ')}">
            `;
            
            // Create item actions
            const actionsElement = document.createElement('div');
            actionsElement.className = 'import-item-actions';
            actionsElement.innerHTML = `
                <button class="remove-import-item" data-index="${index}">Remove</button>
            `;
            
            // Add event listener for remove button
            actionsElement.querySelector('.remove-import-item').addEventListener('click', () => {
                // Remove item from preview list
                items.splice(index, 1);
                
                // Re-render preview
                showImportPreview(items);
            });
            
            // Add event listeners for content and tags inputs
            contentElement.querySelector('.import-content-input').addEventListener('input', (e) => {
                items[index].content = e.target.value;
            });
            
            tagsElement.querySelector('.import-tags-input').addEventListener('input', (e) => {
                items[index].tags = e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
            });
            
            // Append elements to item
            itemElement.appendChild(contentElement);
            itemElement.appendChild(tagsElement);
            itemElement.appendChild(actionsElement);
            
            // Add separator
            if (index < items.length - 1) {
                const separator = document.createElement('hr');
                separator.className = 'import-item-separator';
                itemElement.appendChild(separator);
            }
            
            // Append item to preview list
            previewList.appendChild(itemElement);
        });
        
        // Update item count
        document.getElementById('import-item-count').textContent = `${items.length} items to import`;
        
        // Enable import button
        document.getElementById('confirm-import').disabled = false;
        
        // Show preview section
        document.querySelector('.import-preview-section').classList.remove('hidden');
        
        // Store items in DOM for later access
        document.querySelector('.import-dialog').dataset.items = JSON.stringify(items);
    }
    
    // Confirm import
    function confirmImport() {
        // Get items from DOM
        const items = JSON.parse(document.querySelector('.import-dialog').dataset.items || '[]');
        
        if (items.length === 0) {
            alert('No items to import');
            return;
        }
        
        // Send request to server
        fetch('/api/import/confirm', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items })
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => {
                    throw new Error(data.error || 'Error importing items');
                });
            }
            return response.json();
        })
        .then(data => {
            alert(`Successfully imported ${data.count} items`);
            
            // Refresh data
            fetchAllItems();
            fetchAllTags();
            fetchTagCounts();
            
            // Hide dialog
            hideImportDialog();
        })
        .catch(error => {
            console.error('Error importing items:', error);
            alert(error.message || 'Error importing items');
        });
    }
});
