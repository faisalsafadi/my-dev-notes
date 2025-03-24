document.addEventListener('DOMContentLoaded', () => {

    let noteInputEditor = null;
    let editNoteInputEditor = null;

    // Initialisation de l'éditeur Hugerte
    function initializeHuerteEditor(selector, callback) {
        hugerte.init({
            selector: selector,
            plugins: 'accordion advlist anchor autolink autosave charmap code codesample directionality emoticons fullscreen help image insertdatetime link lists media nonbreaking pagebreak preview quickbars save searchreplace table template visualblocks visualchars wordcount',
            init_instance_callback: callback
        });
    }

    // Initialisation de l'éditeur principal
    initializeHuerteEditor('#noteInput', (editor) => {
        noteInputEditor = editor;
        document.getElementById('spinner').remove();
        document.getElementById('spinner2').remove();
    });

    // Récupération des éléments du DOM
    const saveNote = document.getElementById('saveNote');
    const notesList = document.getElementById('notesList');
    const typeSelect = document.getElementById('typeSelect');
    const categorySelect = document.getElementById('categorySelect');

    const categoryInput = document.getElementById('categoryInput');
    const categoryColor = document.getElementById('categoryColor');
    const addCategory = document.getElementById('addCategory');
    const categoryList = document.getElementById('categoryList');

    const searchKeyword = document.getElementById('searchKeyword');
    const searchCategory = document.getElementById('searchCategory');
    const searchButton = document.getElementById('searchButton');
    const searchResults = document.getElementById('searchResults');

    const editCategoryForm = document.getElementById('editCategoryForm');
    const editCategoryInput = document.getElementById('editCategoryInput');
    const editCategoryColor = document.getElementById('editCategoryColor');
    const saveEditCategory = document.getElementById('saveEditCategory');
    const cancelEditCategory = document.getElementById('cancelEditCategory');

    const editNoteForm = document.getElementById('editNoteForm');
    const editTypeSelect = document.getElementById('editTypeSelect');
    const editCategorySelect = document.getElementById('editCategorySelect');
    const saveEditNote = document.getElementById('saveEditNote');
    const cancelEditNote = document.getElementById('cancelEditNote');
    const noteTitleInput = document.getElementById('noteTitleInput');
    const editNoteTitleInput = document.getElementById('editNoteTitleInput');


    // Variables globales
    let categories = [];
    let notes = [];
    let noteToEdit = null;
    let categoryToEdit = null;

    // --- IndexedDB ---
    let db;
    const dbName = 'MyNotesDB';
    const dbVersion = 2; // Incrémentez la version de la base de données
    const notesStoreName = 'notes';
    const categoriesStoreName = 'categories'; // Nom du store pour les catégories


    // Initialisation de la base de données IndexedDB
    function initIndexedDB() {
        const request = indexedDB.open(dbName, dbVersion);

        request.onerror = (event) => {
            console.error('IndexedDB error:', event.target.errorCode);
        };

        request.onupgradeneeded = (event) => {
            db = event.target.result;

            // Création du store pour les notes
            if (!db.objectStoreNames.contains(notesStoreName)) {
                db.createObjectStore(notesStoreName, { keyPath: 'id' });
            }

            // Création du store pour les categories
            if (!db.objectStoreNames.contains(categoriesStoreName)) {
                db.createObjectStore(categoriesStoreName, { keyPath: 'id' });
            }

            console.log('IndexedDB upgraded');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('IndexedDB opened');
            loadNotesFromIndexedDB();
            loadCategoriesFromIndexedDB(); // Charge les catégories au démarrage
        };
    }

    // Sauvegarde une note dans IndexedDB
    function saveNoteToIndexedDB(note, callback) {
        const transaction = db.transaction([notesStoreName], 'readwrite');
        const objectStore = transaction.objectStore(notesStoreName);
        const request = objectStore.put(note);

        request.onsuccess = () => {
            console.log('Note added to IndexedDB');
            callback && callback();
        };

        transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', event.target.errorCode);
        };
    }

    // Supprime une note de IndexedDB
    function deleteNoteFromIndexedDB(noteId, callback) {
        const transaction = db.transaction([notesStoreName], 'readwrite');
        const objectStore = transaction.objectStore(notesStoreName);
        const request = objectStore.delete(noteId);

        request.onsuccess = () => {
            console.log('Note deleted from IndexedDB');
            callback && callback();
        };

        transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', event.target.errorCode);
        };
    }

    // Charge toutes les notes depuis IndexedDB
    function loadNotesFromIndexedDB(callback) {
        const transaction = db.transaction([notesStoreName], 'readonly');
        const objectStore = transaction.objectStore(notesStoreName);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            notes = event.target.result;
            notes.sort((a, b) => (a.pinned === b.pinned) ? 0 : a.pinned ? -1 : 1);
            displayNotes(notes.filter(note => note.pinned), notesList);
            document.getElementById('totalNotes').textContent = `Total Notes: ${notes.length}`;
            callback && callback();
        };

        transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', event.target.errorCode);
        };
    }


     // Sauvegarde une categorie dans IndexedDB
     function saveCategoryToIndexedDB(category, callback) {
        const transaction = db.transaction([categoriesStoreName], 'readwrite');
        const objectStore = transaction.objectStore(categoriesStoreName);
        const request = objectStore.put(category);

        request.onsuccess = () => {
            console.log('Category added to IndexedDB');
            callback && callback();
        };

        transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', event.target.errorCode);
        };
    }

    // Charge toutes les categories depuis IndexedDB
    function loadCategoriesFromIndexedDB(callback) {
        const transaction = db.transaction([categoriesStoreName], 'readonly');
        const objectStore = transaction.objectStore(categoriesStoreName);
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            categories = event.target.result;
            if (categories.length === 0) {
                 // Ajouter la catégorie par défaut si la base de données est vide
                 const defaultCategory = { name: 'Default', color: '#b5afaf', id: uuidv4() };
                 saveCategoryToIndexedDB(defaultCategory, () => {
                    categories = [defaultCategory];
                    displayCategories();
                    updateCategorySelects();
                    callback && callback();
                });

            }
            else{
                 displayCategories();
                 updateCategorySelects();
                 callback && callback();
            }

        };

        transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', event.target.errorCode);
        };
    }

     // Supprime une catégorie de IndexedDB
     function deleteCategoryFromIndexedDB(categoryId, callback) {
        const transaction = db.transaction([categoriesStoreName], 'readwrite');
        const objectStore = transaction.objectStore(categoriesStoreName);
        const request = objectStore.delete(categoryId);

        request.onsuccess = () => {
            console.log('Category deleted from IndexedDB');
            callback && callback();
        };

        transaction.onerror = (event) => {
            console.error('IndexedDB transaction error:', event.target.errorCode);
        };
    }

    // --- Chrome Storage ---
    // Récupère les catégories depuis Chrome Storage
  /*  function getCategoriesFromStorage(callback) {
        chrome.storage.sync.get({ categories: [{ name: 'Default', color: '#b5afaf', id: uuidv4() }] }, (data) => callback(data.categories));
    }

    // Sauvegarde les catégories dans Chrome Storage
    function saveCategoriesToStorage(categories, callback) {
        chrome.storage.sync.set({ categories }, () => callback && callback());
    }*/

    // --- UI functions ---
    // Met à jour les listes déroulantes de catégories
    function updateCategorySelects() {
        const categoryOptions = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        categorySelect.innerHTML = categoryOptions;
        searchCategory.innerHTML = '<option value="all">All Categories</option>' + categoryOptions;
        editCategorySelect.innerHTML = categoryOptions;
    }

    // Affiche les catégories dans la liste
    function displayCategories() {
        categoryList.innerHTML = categories.map(cat => `
            <li style="background-color: ${cat.color};">
                ${cat.name} <img src="delete.png" class="delete-category" data-id="${cat.id}">
            </li>
        `).join('');

        updateCategorySelects();
    }

    // Affiche les notes dans la liste
    function displayNotes(filteredNotes = notes, targetElement) {
        if (!targetElement) return;

        targetElement.innerHTML = filteredNotes.map(item => {
            const category = categories.find(cat => cat.id === item.category) || { color: '#CCC', name: 'Unknown' };
            let content = item.note;
            const contentType = item.type;

            if (contentType === 'code') {
                content = `<pre><code >${content}</code></pre>`;
            } else if (contentType === 'link') {
                content = `<a href="${content}" target="_blank">${content}</a>`;
            } else if (contentType === 'image') {
                content = `<img src="${content}" alt="Image">`;
            } else {
                content = `<p>${content}</p>`;
            }

            return `
                <div class="ongletEdit" style="background-color: ${category.color}; ">
                    ${item.title ? `<h3>${item.title}</h3>` : ''}
                    ${category.name === 'Unknown' ? '<span style="color: red;padding: 2px;text-align: lett;display: block;">Category not found</span><br>' : category.name}
                    ${content}
                    <div class="note-actions">
                        <button class="copy-note" data-id="${item.id}">Copy</button>
                        <button class="edit-note" data-id="${item.id}">Edit</button>
                        <button class="pin-note" data-id="${item.id}">${item.pinned ? 'Unpin' : 'Pin'}</button>
                        <button class="delete-note" data-id="${item.id}">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- Events ---
    categoryColor.addEventListener('change', () => {
        console.log('categoryColor change event triggered');
        if (isTooLight(categoryColor.value)) {
            categoryColor.value = '#b5afaf';
        }
    });
    
    editCategoryColor.addEventListener('change', () => {
        console.log('editCategoryColor change event triggered');
        if (isTooLight(editCategoryColor.value)) {
            editCategoryColor.value = '#b5afaf';
        }
    });

    // Ajoute une nouvelle catégorie
    addCategory.addEventListener('click', () => {
        const categoryName = categoryInput.value.trim();
        const categoryColorValue = categoryColor.value;

        if (!categoryName) {
            alert('Please enter a name for the category.');
            return;
        }

        const id = uuidv4();
        const newCategory = { id, name: categoryName, color: categoryColorValue };
        categories.push(newCategory);
        saveCategoryToIndexedDB(newCategory, () => {
            loadCategoriesFromIndexedDB(() => {
                displayCategories();
                categoryInput.value = '';
            });
           
        });
    });

    // Sauvegarde une nouvelle note
    saveNote.addEventListener('click', () => {
        if (!noteInputEditor) {
            console.error("The 'noteInput' editor is not yet initialized.");
            return;
        }
        const noteValue = noteInputEditor.getContent();
        const type = typeSelect.value;
        const category = categorySelect.value;
        const noteTitle = noteTitleInput.value.trim();
        const language = (type === 'code') ? 'javascript' : null;
        const pinned = document.getElementById('pinNoteCheckbox').checked;

        if (!category || !categories.find(cat => cat.id === category)) {
            alert('Please select a valid category for the note.');
            return;
        }

        const id = uuidv4();
        const newNote = { id, title: noteTitle, note: noteValue, type, category, language, pinned };
        saveNoteToIndexedDB(newNote, () => {
            loadNotesFromIndexedDB(() => {
                noteTitleInput.value = '';
                noteInputEditor.setContent("");
                document.getElementById('pinNoteCheckbox').checked = false;
                displayNotes(notes.filter(note => note.pinned), notesList);
            });
        });
    });

    // Lance la recherche de notes
    searchButton.addEventListener('click', () => {
        const keyword = searchKeyword.value.toLowerCase();
        const selectedCategory = searchCategory.value;
        const selectedType = searchType.value;
        const selectedPinned = searchPinned.value;
    
        const filteredNotes = notes.filter(note => {
            const categoryMatch = selectedCategory === 'all' || note.category === selectedCategory;
            const keywordMatch = note.note.toLowerCase().includes(keyword);
            const typeMatch = selectedType === 'all' || note.type === selectedType;
            const pinnedMatch =
                selectedPinned === 'all' ||
                (selectedPinned === 'pinned' && note.pinned) ||
                (selectedPinned === 'unpinned' && !note.pinned);
    
            return categoryMatch && keywordMatch && typeMatch && pinnedMatch;
        });
        document.getElementById('searchResultsCount').textContent = `Total Notes: ${filteredNotes.length}`;
        searchResults.innerHTML = `Results Notes Found: ${filteredNotes.length}<br><br>`;
        displayNotes(filteredNotes.slice(-10), searchResults);
    });

    // Gestion des clics sur les catégories (suppression et édition)
    categoryList.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-category')) {
            const categoryIdToDelete = event.target.dataset.id;
    
            if (confirm("Are you sure you want to delete this category?")) {
                categories = categories.filter(cat => cat.id !== categoryIdToDelete);
                notes = notes.map(note => (note.category === categoryIdToDelete ? { ...note, category: undefined } : note));
    
                deleteCategoryFromIndexedDB(categoryIdToDelete, () => {
                    loadCategoriesFromIndexedDB(() => {
                        displayNotes(notes.filter(note => note.pinned), notesList);
                        displayCategories();
                    });
                });
            }
        } else {
            const categoryId = event.target.closest('li').querySelector('.delete-category').dataset.id;
    
                if (categoryId) {
                    categoryToEdit = categories.find(cat => cat.id === categoryId);
    
                    if (categoryToEdit) {
                        editCategoryInput.value = categoryToEdit.name;
                        editCategoryColor.value = categoryToEdit.color;
                        editCategoryForm.style.display = 'block';
                    }
                }
        }
    });

    // Sauvegarde les modifications d'une catégorie
    saveEditCategory.addEventListener('click', () => {
        if (categoryToEdit) {
            const newCategoryName = editCategoryInput.value.trim();
            if (!newCategoryName) {
                alert('Please enter a name for the category.');
                return;
            }

            categoryToEdit.name = editCategoryInput.value;
            categoryToEdit.color = editCategoryColor.value;

            const index = categories.findIndex(cat => cat.id === categoryToEdit.id);
            if (index !== -1) {
                categories[index] = { ...categoryToEdit };
            }

            saveCategoryToIndexedDB(categoryToEdit, () => {
                loadCategoriesFromIndexedDB(() => {
                    displayCategories();
                    updateCategorySelects();
                    editCategoryForm.style.display = 'none';
                    loadNotesFromIndexedDB(() => {
                        displayNotes(notes.filter(note => note.pinned), notesList);
                    })
                })
            });
           
        }
    });

    // Annule les modifications d'une catégorie
    cancelEditCategory.addEventListener('click', () => {
        editCategoryForm.style.display = 'none';
    });

    // Gestion des actions sur les notes (delegation d'evenement)
    document.addEventListener('click', (event) => {
        const noteId = event.target.dataset.id;
        const resultElement = event.target.closest('.ongletEdit') || event.target.closest('.searchResults');

        const target = event.target;
        const isNotesTab = target.closest('#notesList') !== null;

        if (event.target.classList.contains('delete-note')) {
            deleteNote(noteId,isNotesTab);
        } else if (event.target.classList.contains('edit-note')) {  //ici
            
       
            editNote(noteId, resultElement);
        } else if (event.target.classList.contains('pin-note')) {
            togglePinNote(noteId);
        } else if (event.target.classList.contains('copy-note')) {
            copyNote(noteId);
        } else if (event.target.classList.contains('save-edit-note')) {
            saveEditNoteInline(noteId, resultElement);
        } else if (event.target.classList.contains('cancel-edit-note')) {
           // cancelEditNoteInline(noteId, resultElement);
            cancelEditNoteInline(isNotesTab);
            // ici
        }
         else if (event.target.id === 'cancelEditNote' || event.target.classList.contains('cancel-edit-note')) {
                // Gestion du bouton Cancel du formulaire principal
                editNoteForm.style.display = 'none';
            }
    });

    // Delete note
    function deleteNote(noteId,isNotesTab) {
        if (confirm("Are you sure you want to delete this note ?")) {
            deleteNoteFromIndexedDB(noteId, () => {
                loadNotesFromIndexedDB(() => {

                    if (isNotesTab) {
                        // Tab "Notes" 
                        displayNotes(notes.filter(note => note.pinned), notesList);
                    } else {
                        // Tab "Search" e
                        searchButton.click();
                    }

                
                });
            });
        }
    }
    function editNote(noteId, resultElement) {
        
        noteToEdit = notes.find(note => note.id === noteId);

        if (noteToEdit) {
            // Préparer le formulaire d'édition
            const categoryOptions = categories.map(cat => `<option value="${cat.id}" ${noteToEdit.category === cat.id ? 'selected' : ''}>${cat.name}</option>`).join('');

            // Remplacer l'élément de résultat par le formulaire d'édition
            resultElement.innerHTML = `
                <label for="editNoteTitleInputInline">Edit Title:</label>
                <input type="text" id="editNoteTitleInputInline" value="${noteToEdit.title}">
                <label for="editNoteInputInline">Edit Note:</label>
                <textarea id="editNoteInputInline">${noteToEdit.note}</textarea>

                <select id="editTypeSelectInline">
                    <option value="code" ${noteToEdit.type === 'code' ? 'selected' : ''}>Code</option>
                    <option value="text" ${noteToEdit.type === 'text' ? 'selected' : ''}>Text</option>
                    <option value="link" ${noteToEdit.type === 'link' ? 'selected' : ''}>Link</option>
                    <option value="image" ${noteToEdit.type === 'image' ? 'selected' : ''}>Image</option>
                </select>

                <select id="editCategorySelectInline">
                    ${categoryOptions}
                </select>

                <label for="pinNoteCheckboxInline" class="labelinline">Pin Note:</label>
                <input type="checkbox" id="pinNoteCheckboxInline" ${noteToEdit.pinned ? 'checked' : ''}>

                <div class="category-buttons">
                    <button class="save-edit-note" data-id="${noteToEdit.id}">Save Edit</button>
                    <button class="cancel-edit-note" data-id="${noteToEdit.id}">Cancel</button>
                </div>
            `;

             // Initialiser l'éditeur Hugerte
             const editNoteInputInline = resultElement.querySelector('#editNoteInputInline');
             if (editNoteInputInline) {
                 // Détruire l'instance précédente avant d'initialiser une nouvelle
                 if (editNoteInputEditor) {
                     editNoteInputEditor.destroy();
                     editNoteInputEditor = null;
                 }

                 initializeHuerteEditor('#editNoteInputInline', (editor) => {
                     editNoteInputEditor = editor;
                     editNoteInputEditor.setContent(noteToEdit.note); // Initialiser le contenu
                 });
             }
        }
    }

    // Bascule l'état "épinglé" d'une note
    function togglePinNote(noteId) {
        const noteToUpdate = notes.find(note => note.id === noteId);

        if (noteToUpdate) {
            noteToUpdate.pinned = !noteToUpdate.pinned;

            saveNoteToIndexedDB(noteToUpdate, () => {
                loadNotesFromIndexedDB(() => {
                    displayNotes(notes.filter(note => note.pinned), notesList);
                    searchButton.click();
                });
            });
        }
    }

    // Copie le contenu d'une note
    function copyNote(noteId) {
        const noteToCopy = notes.find(note => note.id === noteId);
        if (noteToCopy) {
            navigator.clipboard.writeText(noteToCopy.note)
                .then(() => {
                    alert('Note copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy note: ', err);
                    alert('Failed to copy note!');
                });
        }
    }

    function saveEditNoteInline(noteId, resultElement) {
        noteToEdit = notes.find(note => note.id === noteId);

        if (noteToEdit) {
            const category = resultElement.querySelector('#editCategorySelectInline').value;
            const type = resultElement.querySelector('#editTypeSelectInline').value;
            const noteTitle = resultElement.querySelector('#editNoteTitleInputInline').value;

            // const editNoteInput = resultElement.querySelector('#editNoteInput');
            const noteValue = editNoteInputEditor.getContent();

            const pinned = resultElement.querySelector('#pinNoteCheckboxInline').checked;

            if (!category || !categories.find(cat => cat.id === category)) {
                alert('Please select a valid category for the note.');
                return;
            }

            noteToEdit.title = noteTitle;
            noteToEdit.note = noteValue;
            noteToEdit.type = type;
            noteToEdit.category = category;
            noteToEdit.pinned = pinned;

            saveNoteToIndexedDB(noteToEdit, () => {
                loadNotesFromIndexedDB(() => {
                    displayNotes(notes.filter(note => note.pinned), notesList);
                    searchButton.click(); // Réexécuter la recherche pour mettre à jour les résultats
                });
            });
        }
    }

    function cancelEditNoteInline(isNotesTab) {
        if (isNotesTab) {
            // Onglet "Notes": Afficher les notes épinglées
            displayNotes(notes.filter(note => note.pinned), notesList);
        } else {
            // Onglet "Search": Recharger les résultats de la recherche
            searchButton.click();
        }
    }

    // Sauvegarde les modifications d'une note
    saveEditNote.addEventListener('click', () => {
        if (noteToEdit) {
            const category = editCategorySelect.value;
            const type = editTypeSelect.value;
            const noteTitle = editNoteTitleInput.value;
            const noteValue = editNoteInputEditor.getContent(); // Utiliser getContent() de Hugerte
            const pinned = document.getElementById('pinNoteCheckbox').checked;

            if (!category || !categories.find(cat => cat.id === category)) {
                alert('Please select a valid category for the note.');
                return;
            }

            noteToEdit.title = noteTitle;
            noteToEdit.note = noteValue;
            noteToEdit.type = type;
            noteToEdit.category = category;
            noteToEdit.pinned = pinned;

            saveNoteToIndexedDB(noteToEdit, () => {
                loadNotesFromIndexedDB(() => {
                    displayNotes(notes.filter(note => note.pinned), notesList);
                    editNoteForm.style.display = 'none';
                });
            })
        }
    });

    // Annule les modifications d'une note
    cancelEditNote.addEventListener('click', () => {
        editNoteForm.style.display = 'none';
    });

    // --- Tabs ---
    // Gestion de l'affichage des onglets
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    function showTab(tabName) {
        tabContents.forEach(content => content.classList.remove('active'));
        tabButtons.forEach(button => button.classList.remove('active'));

        document.getElementById(tabName).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            showTab(event.target.dataset.tab);
        });
    });

    // --- Util ---
    // Vérifie si une couleur est trop claire
    function isTooLight(color) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.9;
    }

    // --- Init ---
    // Initialisation de l'application
    initIndexedDB();
    //getCategoriesFromStorage(loadedCategories => {
       // categories = loadedCategories;
       // displayCategories();
       // showTab('notes');
    //});
    showTab('notes');






});